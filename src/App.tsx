/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  CreditCard, 
  Menu, 
  X,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Tags,
  Users,
  UserCheck,
  Settings,
  Trash2,
  RefreshCw,
  LogOut,
  Cloud,
  CloudOff,
  Database
} from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { ProfitLossDashboard } from './components/ProfitLossDashboard';
import { InventoryManager } from './components/InventoryManager';
import { SalesEntry } from './components/SalesEntry';
import { ExpenseTracker } from './components/ExpenseTracker';
import { CategoryManager } from './components/CategoryManager';
import { CustomerManager } from './components/CustomerManager';
import { SupplierManager } from './components/SupplierManager';
import { PurchaseManager } from './components/PurchaseManager';
import { Button } from './components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from './components/ui/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from './components/ui/Dialog';
import { Login } from './components/Login';
import { ErrorBoundary } from './components/ErrorBoundary';
import { POSView } from './components/POSView';
import { Product, Sale, Expense, DashboardStats, Category, Customer, Supplier, MonthlyReport, JournalEntry, Account, Purchase } from './types';
import { cn, generateOrderNumber, generateUUID } from './lib/utils';
import { DEFAULT_CATEGORIES, DEFAULT_ACCOUNTS } from './constants';
import { AccountingModule } from './components/AccountingModule';
import { AISummary } from './components/AISummary';
import { 
  auth, 
  db, 
  logout, 
  onAuthStateChanged, 
  User 
} from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy,
  Timestamp
} from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

const AUTHORIZED_EMAILS = [
  "diginestt2026@gmail.com",
  "myatbinance@gmail.com"
];

const SHARED_BUSINESS_ID = 'shared_business_001';

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  
  // Don't throw for LIST operations to prevent background sync from crashing the app
  if (operationType !== OperationType.LIST) {
    throw new Error(JSON.stringify(errInfo));
  }
}

type Tab = 'dashboard' | 'inventory' | 'purchases' | 'sales' | 'expenses' | 'categories' | 'customers' | 'suppliers' | 'accounting' | 'settings';

export default function App() {
  return (
    <ErrorBoundary>
      <Toaster position="top-right" richColors />
      <MainApp />
    </ErrorBoundary>
  );
}

function MainApp() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm();
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      },
    });
  };

  // State with Firebase Sync
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [accounts] = useState<Account[]>(DEFAULT_ACCOUNTS);
  const [businessProfile, setBusinessProfile] = useState({ name: 'My Shop', address: '', phone: '', googleSheetUrl: '' });
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const [isSyncing, setIsSyncing] = useState(false);

  const syncToGoogleSheets = async () => {
    if (!businessProfile.googleSheetUrl) {
      toast.error('Please set your Google Sheet Web App URL in Settings first.');
      return;
    }

    setIsSyncing(true);
    try {
      console.log('Starting sync to:', businessProfile.googleSheetUrl);
      
      // Use a standard fetch with text/plain to avoid CORS preflight issues with Apps Script
      const response = await fetch(businessProfile.googleSheetUrl, {
        method: 'POST',
        mode: 'no-cors', // Apps Script requires this for cross-origin POST
        headers: {
          'Content-Type': 'text/plain',
        },
        body: JSON.stringify({
          action: 'syncAll',
          data: {
            Products: products,
            Sales: sales,
            Expenses: expenses,
            Categories: categories,
            Customers: customers,
            Suppliers: suppliers,
            Purchases: purchases,
            JournalEntries: journalEntries,
            Profile: [businessProfile]
          }
        })
      });

      // Since mode is 'no-cors', we can't read the response body, 
      // but if it doesn't throw an error, it's usually sent successfully.
      toast.success('Data sync request sent! ကျေးဇူးပြု၍ သင်၏ Google Sheet ကို စစ်ဆေးကြည့်ပါ။');
    } catch (error) {
      console.error('Sync error details:', error);
      toast.error('Sync လုပ်ဆောင်ချက် မအောင်မြင်ပါ။ အင်တာနက် ချိတ်ဆက်မှု သို့မဟုတ် URL မှန်ကန်မှုကို ပြန်စစ်ပေးပါ။');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCloudBackup = async (isAuto = false) => {
    if (!user) return;
    if (!isAuto) setIsSyncing(true);
    try {
      const backupId = `backup_${new Date().getTime()}`;
      const backupData = {
        id: backupId,
        timestamp: new Date().toISOString(),
        createdBy: user.email,
        data: {
          products,
          sales,
          expenses,
          categories,
          customers,
          suppliers,
          purchases,
          journalEntries,
          businessProfile
        }
      };
      
      await setDoc(doc(db, 'users', SHARED_BUSINESS_ID, 'backups', backupId), backupData);
      if (!isAuto) {
        toast.success('Cloud Backup successfully created in Firebase!');
      } else {
        console.log('Auto backup created successfully');
        localStorage.setItem('last_auto_backup', new Date().getTime().toString());
      }
    } catch (error) {
      console.error('Cloud backup error:', error);
      if (!isAuto) toast.error('Failed to create cloud backup.');
    } finally {
      if (!isAuto) setIsSyncing(false);
    }
  };

  const handleSaveBusinessProfile = async () => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', SHARED_BUSINESS_ID, 'profile', 'data'), businessProfile);
      toast.success('Business profile saved successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${SHARED_BUSINESS_ID}/profile/data`);
    }
  };

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Firebase Real-time Sync
  useEffect(() => {
    if (!user) return;

    setIsCloudSyncing(true);
    const syncCollection = (collectionName: string, setter: Function, orderField: string = 'date', useOrderBy: boolean = true) => {
      const collectionRef = collection(db, 'users', SHARED_BUSINESS_ID, collectionName);
      const q = useOrderBy ? query(collectionRef, orderBy(orderField, 'desc')) : collectionRef;
      
      return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setter(data);
      }, (error) => {
        console.error(`Sync error for ${collectionName}:`, error);
        handleFirestoreError(error, OperationType.LIST, `users/${SHARED_BUSINESS_ID}/${collectionName}`);
      });
    };

    const unsubProducts = syncCollection('products', setProducts, 'createdAt');
    const unsubSales = syncCollection('sales', setSales, 'orderNumber');
    const unsubExpenses = syncCollection('expenses', setExpenses);
    const unsubCategories = syncCollection('categories', (data: any[]) => {
      const customCategories = data as Category[];
      
      // Always include default categories unless they are overridden by custom ones with the same name
      const defaultCategories = DEFAULT_CATEGORIES
        .filter(name => !customCategories.some(c => c.name.toLowerCase() === name.toLowerCase() && !c.parentId))
        .map((name, index) => ({ 
          id: `default_${index}`, 
          name 
        }));
      
      setCategories([...defaultCategories, ...customCategories]);
    }, 'name');
    const unsubCustomers = syncCollection('customers', setCustomers, 'orderName');
    const unsubSuppliers = syncCollection('suppliers', setSuppliers, 'name');
    const unsubJournal = syncCollection('journalEntries', setJournalEntries);
    const unsubPurchases = syncCollection('purchases', setPurchases);
    
    const unsubProfile = onSnapshot(doc(db, 'users', SHARED_BUSINESS_ID, 'profile', 'data'), (docSnap) => {
      if (docSnap.exists()) {
        setBusinessProfile(docSnap.data() as any);
      }
      setIsCloudSyncing(false);
    }, (error) => {
      console.error("Sync error for profile:", error);
      handleFirestoreError(error, OperationType.GET, `users/${SHARED_BUSINESS_ID}/profile/data`);
    });

    return () => {
      unsubProducts();
      unsubSales();
      unsubExpenses();
      unsubCategories();
      unsubCustomers();
      unsubSuppliers();
      unsubJournal();
      unsubPurchases();
      unsubProfile();
    };
  }, [user]);

  // Auto Backup Logic
  useEffect(() => {
    if (!user || !isAuthReady || products.length === 0) return;

    const lastBackup = localStorage.getItem('last_auto_backup');
    const now = new Date().getTime();
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (!lastBackup || (now - parseInt(lastBackup)) > twentyFourHours) {
      // Small delay to ensure all data is loaded
      const timer = setTimeout(() => {
        handleCloudBackup(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [user, isAuthReady, products.length]);

  const handleLogout = () => {
    logout();
  };

  const isAuthorized = useMemo(() => {
    return user && user.email && AUTHORIZED_EMAILS.includes(user.email);
  }, [user]);

  // Calculate Stats
  const stats = useMemo<DashboardStats>(() => {
    const filteredSales = selectedMonth === 'all' 
      ? sales 
      : sales.filter(s => s.date.startsWith(selectedMonth));
    
    const filteredExpenses = selectedMonth === 'all'
      ? expenses
      : expenses.filter(e => e.date.startsWith(selectedMonth));

    const filteredPurchases = selectedMonth === 'all'
      ? purchases
      : purchases.filter(p => p.date.startsWith(selectedMonth));

    const totalRevenue = filteredSales.reduce((acc, s) => acc + s.totalRevenue, 0);
    const totalCOGS = filteredSales.reduce((acc, s) => acc + s.totalCost, 0);
    const totalExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
    
    // Total Purchase is now solely based on the purchases records to avoid double counting
    const totalPurchase = filteredPurchases.reduce((acc, p) => acc + p.totalAmount, 0);

    const netProfit = totalRevenue - (totalCOGS + totalExpenses);
    const netCash = totalRevenue - (totalPurchase + totalExpenses);

    return {
      totalRevenue,
      totalCOGS,
      totalExpenses,
      totalPurchase,
      netProfit,
      netCash,
    };
  }, [sales, expenses, purchases, products, selectedMonth]);

  const monthlyReports = useMemo<MonthlyReport[]>(() => {
    const reports: Record<string, MonthlyReport> = {};
    
    sales.forEach(s => {
      const month = s.date.substring(0, 7); // YYYY-MM
      if (!reports[month]) {
        reports[month] = { month, totalRevenue: 0, totalExpenses: 0, totalCOGS: 0, totalPurchase: 0, netProfit: 0, netCash: 0 };
      }
      reports[month].totalRevenue += s.totalRevenue;
      reports[month].totalCOGS += s.totalCost;
    });
    
    expenses.forEach(e => {
      const month = e.date.substring(0, 7); // YYYY-MM
      if (!reports[month]) {
        reports[month] = { month, totalRevenue: 0, totalExpenses: 0, totalCOGS: 0, totalPurchase: 0, netProfit: 0, netCash: 0 };
      }
      reports[month].totalExpenses += e.amount;
    });

    purchases.forEach(p => {
      const month = p.date.substring(0, 7); // YYYY-MM
      if (!reports[month]) {
        reports[month] = { month, totalRevenue: 0, totalExpenses: 0, totalCOGS: 0, totalPurchase: 0, netProfit: 0, netCash: 0 };
      }
      reports[month].totalPurchase += p.totalAmount;
    });
    
    return Object.values(reports)
      .map(r => ({ 
        ...r, 
        netProfit: r.totalRevenue - (r.totalCOGS + r.totalExpenses),
        netCash: r.totalRevenue - (r.totalPurchase + r.totalExpenses)
      }))
      .sort((a, b) => b.month.localeCompare(a.month));
  }, [sales, expenses, purchases, products]);

  // Handlers
  const handleAddProduct = async (productData: Omit<Product, 'id'>) => {
    if (!user) return;
    const productId = generateUUID();
    try {
      // Add product
      await setDoc(doc(db, 'users', SHARED_BUSINESS_ID, 'products', productId), {
        ...productData,
        id: productId,
      });

      // If there's initial stock, record it as a purchase
      if (productData.stock > 0) {
        const purchaseId = generateUUID();
        const entryId = generateUUID();
        const totalAmount = (productData.costPrice + (productData.shippingPrice || 0)) * productData.stock;
        const date = productData.createdAt || new Date().toISOString().split('T')[0];

        await setDoc(doc(db, 'users', SHARED_BUSINESS_ID, 'purchases', purchaseId), {
          id: purchaseId,
          productId: productId,
          productName: productData.name,
          quantity: productData.stock,
          costPrice: productData.costPrice,
          shippingPrice: productData.shippingPrice || 0,
          totalAmount,
          date,
          supplierId: productData.supplierId,
        });

        // Add journal entry for initial stock
        await setDoc(doc(db, 'users', SHARED_BUSINESS_ID, 'journalEntries', entryId), {
          id: entryId,
          date,
          debit_account_id: 'acc_inventory',
          credit_account_id: 'acc_cash',
          amount: totalAmount,
          reference_type: 'Expense',
          description: `Initial Stock: ${productData.name}`,
          reference_id: purchaseId,
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${SHARED_BUSINESS_ID}/products/${productId}`);
    }
  };

  const handleUpdateProduct = async (id: string, productData: Partial<Product>) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', SHARED_BUSINESS_ID, 'products', id), productData, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${SHARED_BUSINESS_ID}/products/${id}`);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!user) return;
    showConfirm(
      'Delete Product',
      'Are you sure you want to delete this product?',
      async () => {
        try {
          await deleteDoc(doc(db, 'users', SHARED_BUSINESS_ID, 'products', id));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `users/${SHARED_BUSINESS_ID}/products/${id}`);
        }
      }
    );
  };

  const handleRestock = async (purchaseData: Omit<Purchase, 'id'>) => {
    if (!user) return;
    const purchaseId = generateUUID();
    const entryId = generateUUID();
    
    try {
      // Add purchase
      await setDoc(doc(db, 'users', SHARED_BUSINESS_ID, 'purchases', purchaseId), {
        ...purchaseData,
        id: purchaseId,
      });
      
      // Update product stock
      const product = products.find(p => p.id === purchaseData.productId);
      if (product) {
        await setDoc(doc(db, 'users', SHARED_BUSINESS_ID, 'products', product.id), {
          stock: product.stock + purchaseData.quantity
        }, { merge: true });
      }

      // Add journal entry
      await setDoc(doc(db, 'users', SHARED_BUSINESS_ID, 'journalEntries', entryId), {
        id: entryId,
        date: purchaseData.date,
        debit_account_id: 'acc_inventory',
        credit_account_id: 'acc_cash',
        amount: purchaseData.totalAmount,
        reference_type: 'Expense',
        description: `Restock: ${purchaseData.productName} (${purchaseData.quantity} units)`,
        reference_id: purchaseId,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${SHARED_BUSINESS_ID}/purchases/${purchaseId}`);
    }
  };

  const handleDeletePurchase = async (id: string) => {
    if (!user) return;
    const purchaseToDelete = purchases.find(p => p.id === id);
    if (!purchaseToDelete) return;

    showConfirm(
      'Delete Purchase Record',
      'Are you sure you want to delete this purchase record? This will automatically revert inventory stock.',
      async () => {
        try {
          // Revert stock
          const product = products.find(p => p.id === purchaseToDelete.productId);
          if (product) {
            await setDoc(doc(db, 'users', SHARED_BUSINESS_ID, 'products', product.id), {
              stock: Math.max(0, product.stock - purchaseToDelete.quantity)
            }, { merge: true });
          }

          // Delete journal entry
          const entry = journalEntries.find(e => e.reference_id === id);
          if (entry) {
            await deleteDoc(doc(db, 'users', SHARED_BUSINESS_ID, 'journalEntries', entry.id));
          }
          
          // Delete purchase
          await deleteDoc(doc(db, 'users', SHARED_BUSINESS_ID, 'purchases', id));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `users/${SHARED_BUSINESS_ID}/purchases/${id}`);
        }
      }
    );
  };

  const handleAddSale = async (saleData: Omit<Sale, 'id' | 'orderNumber'>) => {
    if (!user) return;
    
    // Use the selected sale date for order number generation
    const saleDateObj = saleData.saleDate ? new Date(saleData.saleDate) : new Date(saleData.date);
    
    // Find the highest sequence number for this month to ensure stable order numbers
    const monthPrefix = `${String(saleDateObj.getMonth() + 1).padStart(2, '0')}${String(saleDateObj.getFullYear()).slice(-2)}`;
    const sameMonthOrders = sales.filter(s => s.orderNumber?.startsWith(monthPrefix));
    
    let nextSequence = 0;
    if (sameMonthOrders.length > 0) {
      const sequences = sameMonthOrders.map(s => {
        const seqStr = s.orderNumber.slice(4); // month(2) + year(2) = 4 chars
        return parseInt(seqStr) || 0;
      });
      nextSequence = Math.max(...sequences);
    }
    
    const saleId = generateUUID();
    const newSale: Sale = {
      ...saleData,
      id: saleId,
      orderNumber: generateOrderNumber(saleDateObj, nextSequence),
    };
    
    try {
      // Add sale
      await setDoc(doc(db, 'users', SHARED_BUSINESS_ID, 'sales', saleId), newSale);

      // Update stock for each item
      for (const item of newSale.items) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          await setDoc(doc(db, 'users', SHARED_BUSINESS_ID, 'products', product.id), {
            stock: product.stock - item.quantity
          }, { merge: true });
        }
      }

      // Also update or add customer to customer list
      const existingCustomer = customers.find(c => c.phone === saleData.customer.phone);
      if (!existingCustomer) {
        const customerId = generateUUID();
        const newCustomer: Customer = {
          id: customerId,
          facebookName: saleData.customer.facebookName,
          orderName: saleData.customer.orderName,
          phone: saleData.customer.phone,
          address: saleData.customer.address,
        };
        await setDoc(doc(db, 'users', SHARED_BUSINESS_ID, 'customers', customerId), newCustomer);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${SHARED_BUSINESS_ID}/sales/${saleId}`);
    }
  };

  const handleUpdateSale = async (id: string, saleData: Omit<Sale, 'id' | 'orderNumber'>) => {
    if (!user) return;
    const oldSale = sales.find(s => s.id === id);
    if (!oldSale) return;

    try {
      // Revert old stock
      for (const item of oldSale.items) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          await setDoc(doc(db, 'users', SHARED_BUSINESS_ID, 'products', product.id), {
            stock: product.stock + item.quantity
          }, { merge: true });
        }
      }

      // Apply new stock
      for (const item of saleData.items) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          await setDoc(doc(db, 'users', SHARED_BUSINESS_ID, 'products', product.id), {
            stock: product.stock - item.quantity
          }, { merge: true });
        }
      }

      // Update sale
      await setDoc(doc(db, 'users', SHARED_BUSINESS_ID, 'sales', id), {
        ...saleData,
        id,
        orderNumber: oldSale.orderNumber
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${SHARED_BUSINESS_ID}/sales/${id}`);
    }
  };

  const handleDeleteSale = async (id: string) => {
    if (!user) return;
    const saleToDelete = sales.find(s => s.id === id);
    if (!saleToDelete) return;

    showConfirm(
      'Delete Order',
      'Are you sure you want to delete this order? This will automatically revert inventory stock.',
      async () => {
        try {
          // Revert stock
          for (const item of saleToDelete.items) {
            const product = products.find(p => p.id === item.productId);
            if (product) {
              await setDoc(doc(db, 'users', SHARED_BUSINESS_ID, 'products', product.id), {
                stock: product.stock + item.quantity
              }, { merge: true });
            }
          }

          // Delete sale
          await deleteDoc(doc(db, 'users', SHARED_BUSINESS_ID, 'sales', id));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `users/${SHARED_BUSINESS_ID}/sales/${id}`);
        }
      }
    );
  };

  const handleAddExpense = async (expenseData: Omit<Expense, 'id'>) => {
    if (!user) return;
    const id = generateUUID();
    try {
      await setDoc(doc(db, 'users', SHARED_BUSINESS_ID, 'expenses', id), { ...expenseData, id });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${SHARED_BUSINESS_ID}/expenses/${id}`);
    }
  };

  const handleUpdateExpense = async (id: string, expenseData: Partial<Expense>) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', SHARED_BUSINESS_ID, 'expenses', id), expenseData, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${SHARED_BUSINESS_ID}/expenses/${id}`);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!user) return;
    showConfirm(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      async () => {
        try {
          await deleteDoc(doc(db, 'users', SHARED_BUSINESS_ID, 'expenses', id));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `users/${SHARED_BUSINESS_ID}/expenses/${id}`);
        }
      }
    );
  };

  const handleAddCategory = async (name: string, parentId?: string) => {
    if (!user) return;
    const id = generateUUID();
    try {
      console.log('Adding category:', { id, name, parentId });
      await setDoc(doc(db, 'users', SHARED_BUSINESS_ID, 'categories', id), { id, name, parentId });
      toast.success('Category added successfully!');
    } catch (error) {
      console.error('Error adding category:', error);
      handleFirestoreError(error, OperationType.WRITE, `users/${SHARED_BUSINESS_ID}/categories/${id}`);
      toast.error('Error adding category. Please try again.');
    }
  };

  const handleUpdateCategory = async (id: string, name: string) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', SHARED_BUSINESS_ID, 'categories', id), { name }, { merge: true });
      toast.success('Category updated successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${SHARED_BUSINESS_ID}/categories/${id}`);
      toast.error('Error updating category.');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!user) return;
    showConfirm(
      'Delete Category',
      'Are you sure you want to delete this category? All its subcategories will also be removed.',
      async () => {
        try {
          // Note: In a real app, you'd also delete subcategories in Firestore
          await deleteDoc(doc(db, 'users', SHARED_BUSINESS_ID, 'categories', id));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `users/${SHARED_BUSINESS_ID}/categories/${id}`);
        }
      }
    );
  };

  const handleUpdateCustomer = async (id: string, customerData: Partial<Customer>) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', SHARED_BUSINESS_ID, 'customers', id), customerData, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${SHARED_BUSINESS_ID}/customers/${id}`);
    }
  };

  const handleDeleteCustomer = async (id: string) => {
    if (!user) return;
    showConfirm(
      'Delete Customer',
      'Are you sure you want to delete this customer?',
      async () => {
        try {
          await deleteDoc(doc(db, 'users', SHARED_BUSINESS_ID, 'customers', id));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `users/${SHARED_BUSINESS_ID}/customers/${id}`);
        }
      }
    );
  };

  const handleAddSupplier = async (name: string, phone: string) => {
    if (!user) return;
    const id = generateUUID();
    try {
      await setDoc(doc(db, 'users', SHARED_BUSINESS_ID, 'suppliers', id), { id, name, phone });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${SHARED_BUSINESS_ID}/suppliers/${id}`);
    }
  };

  const handleUpdateSupplier = async (id: string, name: string, phone: string) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', SHARED_BUSINESS_ID, 'suppliers', id), { name, phone }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${SHARED_BUSINESS_ID}/suppliers/${id}`);
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!user) return;
    showConfirm(
      'Delete Supplier',
      'Are you sure you want to delete this supplier?',
      async () => {
        try {
          await deleteDoc(doc(db, 'users', SHARED_BUSINESS_ID, 'suppliers', id));
        } catch (error) {
          handleFirestoreError(error, OperationType.DELETE, `users/${SHARED_BUSINESS_ID}/suppliers/${id}`);
        }
      }
    );
  };

  const handleExportData = () => {
    const data = {
      products,
      sales,
      expenses,
      categories,
      customers,
      suppliers,
      businessProfile,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `inventory_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        // Write all data to Firestore
        if (data.products) {
          for (const item of data.products) {
            await setDoc(doc(db, 'users', SHARED_BUSINESS_ID, 'products', item.id), item);
          }
        }
        if (data.sales) {
          for (const item of data.sales) {
            await setDoc(doc(db, 'users', SHARED_BUSINESS_ID, 'sales', item.id), item);
          }
        }
        if (data.expenses) {
          for (const item of data.expenses) {
            await setDoc(doc(db, 'users', SHARED_BUSINESS_ID, 'expenses', item.id), item);
          }
        }
        if (data.categories) {
          for (const item of data.categories) {
            await setDoc(doc(db, 'users', SHARED_BUSINESS_ID, 'categories', item.id), item);
          }
        }
        if (data.customers) {
          for (const item of data.customers) {
            await setDoc(doc(db, 'users', SHARED_BUSINESS_ID, 'customers', item.id), item);
          }
        }
        if (data.suppliers) {
          for (const item of data.suppliers) {
            await setDoc(doc(db, 'users', SHARED_BUSINESS_ID, 'suppliers', item.id), item);
          }
        }
        if (data.businessProfile) {
          await setDoc(doc(db, 'users', SHARED_BUSINESS_ID, 'profile', 'data'), data.businessProfile);
        }
        
        toast.success('Data imported successfully!');
      } catch (error) {
        console.error('Import error:', error);
        toast.error('Failed to import data. Please check the file format.');
      }
    };
    reader.readAsText(file);
    // Reset input
    event.target.value = '';
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'purchases', label: 'Purchases', icon: RefreshCw },
    { id: 'sales', label: 'Sales', icon: ShoppingCart },
    { id: 'expenses', label: 'Expenses', icon: CreditCard },
    { id: 'categories', label: 'Categories', icon: Tags },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'suppliers', label: 'Suppliers', icon: UserCheck },
    { id: 'accounting', label: 'Accounting', icon: CreditCard },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-zinc-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-zinc-500 font-medium">Loading POS System...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8 border-none shadow-sm">
          <div className="flex justify-center mb-6">
            <div className="bg-red-50 p-4 rounded-full">
              <X className="w-12 h-12 text-red-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-zinc-900 mb-2">Access Denied</h1>
          <p className="text-zinc-500 mb-6">
            သင်၏ Email (<strong>{user.email}</strong>) သည် ဤ App ကို အသုံးပြုရန် ခွင့်ပြုချက်မရရှိထားပါ။ 
            ကျေးဇူးပြု၍ Admin ကို ဆက်သွယ်ပါ။
          </p>
          <Button onClick={handleLogout} variant="outline" className="w-full">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* Sidebar for Desktop */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-zinc-200 transition-all duration-300 lg:translate-x-0 lg:static lg:inset-0 flex flex-col py-6",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="px-6 mb-10 shrink-0">
          <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center">
            <DollarSign className="text-white h-5 w-5" />
          </div>
        </div>

        <nav className="flex-1 w-full px-3 space-y-1 overflow-y-auto scrollbar-hide">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as Tab);
                setIsSidebarOpen(false);
              }}
              className={cn(
                "w-full flex flex-row items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                activeTab === item.id 
                  ? "bg-zinc-900 text-white" 
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
              )}
            >
              <item.icon className={cn("h-5 w-5", activeTab === item.id ? "text-white" : "text-zinc-400 group-hover:text-zinc-900")} />
              <span className="text-sm font-semibold tracking-tight">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="w-full px-3 mt-auto pt-6 border-t border-zinc-100">
          <Button 
            variant="ghost" 
            className="w-full justify-start gap-3 px-4 h-11 rounded-xl text-red-500 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            <span className="text-sm font-semibold">Sign Out</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {activeTab !== 'sales' && (
          <header className="h-14 bg-white border-b border-zinc-200 flex items-center justify-between px-4 lg:px-8 z-40">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden rounded-lg"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h2 className="text-base font-semibold capitalize tracking-tight">{activeTab}</h2>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-zinc-100 rounded-full">
                <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider">Currency</span>
                <span className="text-xs font-bold text-zinc-900">MMK</span>
              </div>
            </div>
          </header>
        )}

        <div className={cn("flex-1 overflow-auto", activeTab !== 'sales' && "p-4 lg:p-8")}>
          <div className={cn(activeTab !== 'sales' && "max-w-6xl mx-auto")}>
            {activeTab === 'dashboard' && (
              <div className="space-y-6">
                <AISummary sales={sales} />
                <ProfitLossDashboard 
                  stats={stats} 
                  selectedMonth={selectedMonth}
                  onMonthChange={setSelectedMonth}
                  monthlyReports={monthlyReports}
                />
              </div>
            )}
            {activeTab === 'inventory' && (
              <InventoryManager 
                products={products} 
                categories={categories}
                suppliers={suppliers}
                onAddProduct={handleAddProduct}
                onUpdateProduct={handleUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
                onRestock={handleRestock}
              />
            )}
            {activeTab === 'sales' && (
              <SalesEntry 
                products={products}
                onAddSale={handleAddSale}
                onUpdateSale={handleUpdateSale}
                onDeleteSale={handleDeleteSale}
                sales={sales}
              />
            )}
            {activeTab === 'expenses' && (
              <ExpenseTracker 
                expenses={expenses} 
                onAddExpense={handleAddExpense}
                onUpdateExpense={handleUpdateExpense}
                onDeleteExpense={handleDeleteExpense}
              />
            )}
            {activeTab === 'categories' && (
              <CategoryManager 
                categories={categories}
                onAddCategory={handleAddCategory}
                onUpdateCategory={handleUpdateCategory}
                onDeleteCategory={handleDeleteCategory}
              />
            )}
            {activeTab === 'customers' && (
              <CustomerManager 
                customers={customers}
                sales={sales}
                onUpdateCustomer={handleUpdateCustomer}
                onDeleteCustomer={handleDeleteCustomer}
              />
            )}
            {activeTab === 'suppliers' && (
              <SupplierManager 
                suppliers={suppliers}
                onAddSupplier={handleAddSupplier}
                onUpdateSupplier={handleUpdateSupplier}
                onDeleteSupplier={handleDeleteSupplier}
              />
            )}
            {activeTab === 'purchases' && (
              <PurchaseManager 
                purchases={purchases}
                products={products}
                suppliers={suppliers}
                onAddPurchase={handleRestock}
                onDeletePurchase={handleDeletePurchase}
              />
            )}
            {activeTab === 'accounting' && (
              <AccountingModule 
                journalEntries={journalEntries}
                accounts={accounts}
                customers={customers}
                suppliers={suppliers}
                onAddEntry={(entry) => setJournalEntries([entry, ...journalEntries])}
                onDeleteEntry={(id) => setJournalEntries(journalEntries.filter(e => e.id !== id))}
              />
            )}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5 text-zinc-600" />
                      Business Profile
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Shop Name</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
                          value={businessProfile.name}
                          onChange={(e) => setBusinessProfile({ ...businessProfile, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Phone Number</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
                          value={businessProfile.phone}
                          onChange={(e) => setBusinessProfile({ ...businessProfile, phone: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-zinc-500">Address</label>
                        <textarea
                          className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 transition-all"
                          rows={3}
                          value={businessProfile.address}
                          onChange={(e) => setBusinessProfile({ ...businessProfile, address: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-emerald-600">Google Sheets Web App URL</label>
                        <input
                          type="text"
                          placeholder="https://script.google.com/macros/s/.../exec"
                          className="w-full px-3 py-2 bg-emerald-50/50 border border-emerald-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                          value={businessProfile.googleSheetUrl || ''}
                          onChange={(e) => setBusinessProfile({ ...businessProfile, googleSheetUrl: e.target.value })}
                        />
                        <p className="text-[10px] text-zinc-400 font-medium">Paste your deployed Google Apps Script URL here to enable cloud backup.</p>
                      </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                      <Button 
                        onClick={handleSaveBusinessProfile}
                        className="bg-zinc-900 text-white"
                      >
                        Save Business Profile
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-zinc-600" />
                      Data Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-4">
                        <h3 className="font-medium flex items-center gap-2">
                          <Cloud className="h-4 w-4 text-emerald-600" />
                          Cloud Sync (Google Sheets)
                        </h3>
                        <p className="text-sm text-zinc-500">Backup all your records to your connected Google Sheet.</p>
                        <Button 
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                          onClick={syncToGoogleSheets}
                          disabled={isSyncing}
                        >
                          {isSyncing ? 'Syncing...' : 'Sync to Google Sheets'}
                        </Button>
                      </div>
                      <div className="space-y-4">
                        <h3 className="font-medium flex items-center gap-2">
                          <Database className="h-4 w-4 text-blue-600" />
                          Cloud Backup (Firebase)
                        </h3>
                        <p className="text-sm text-zinc-500">Create a secure snapshot of your data in the cloud database.</p>
                        <p className="text-[10px] text-emerald-600 font-medium italic">Auto-backup is active (every 24 hours).</p>
                        <Button 
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={() => handleCloudBackup()}
                          disabled={isSyncing}
                        >
                          {isSyncing ? 'Backing up...' : 'Manual Cloud Backup'}
                        </Button>
                      </div>
                      <div className="space-y-4">
                        <h3 className="font-medium">Export Data</h3>
                        <p className="text-sm text-zinc-500">Download all your records as a JSON file for backup or analysis.</p>
                        <Button variant="outline" onClick={handleExportData} className="w-full">
                          Download Backup
                        </Button>
                      </div>
                      <div className="space-y-4">
                        <h3 className="font-medium">Import Data</h3>
                        <p className="text-sm text-zinc-500">Restore your records from a previously downloaded JSON backup file.</p>
                        <div className="relative">
                          <input
                            type="file"
                            accept=".json"
                            onChange={handleImportData}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            id="import-backup"
                          />
                          <Button variant="outline" className="w-full">
                            Upload Backup File
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Dialog open={confirmDialog.isOpen} onOpenChange={(open) => !open && setConfirmDialog(prev => ({ ...prev, isOpen: false }))}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{confirmDialog.title}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-zinc-600">{confirmDialog.message}</p>
          </div>
          <DialogFooter className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDialog.onConfirm}>
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
