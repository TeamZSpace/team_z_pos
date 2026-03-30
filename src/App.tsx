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
  CloudOff
} from 'lucide-react';
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
  throw new Error(JSON.stringify(errInfo));
}

type Tab = 'dashboard' | 'inventory' | 'purchases' | 'sales' | 'expenses' | 'categories' | 'customers' | 'suppliers' | 'accounting' | 'settings';

export default function App() {
  return (
    <ErrorBoundary>
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
      alert('Please set your Google Sheet Web App URL in Settings first.');
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
      alert('Data sync request sent! ကျေးဇူးပြု၍ သင်၏ Google Sheet ကို စစ်ဆေးကြည့်ပါ။ ဒေတာများ ရောက်ရှိရန် စက္ကန့်အနည်းငယ် ကြာနိုင်ပါသည်။');
    } catch (error) {
      console.error('Sync error details:', error);
      alert('Sync လုပ်ဆောင်ချက် မအောင်မြင်ပါ။ အင်တာနက် ချိတ်ဆက်မှု သို့မဟုတ် URL မှန်ကန်မှုကို ပြန်စစ်ပေးပါ။ Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveBusinessProfile = async () => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', SHARED_BUSINESS_ID, 'profile', 'data'), businessProfile);
      alert('Business profile saved successfully! လုပ်ငန်းအချက်အလက်များကို အောင်မြင်စွာ သိမ်းဆည်းပြီးပါပြီ။');
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
    const syncCollection = (collectionName: string, setter: Function, orderField: string = 'date') => {
      const q = query(collection(db, 'users', SHARED_BUSINESS_ID, collectionName), orderBy(orderField, 'desc'));
      return onSnapshot(q, (snapshot) => {
        const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
        setter(data);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${SHARED_BUSINESS_ID}/${collectionName}`);
      });
    };

    const unsubProducts = onSnapshot(collection(db, 'users', SHARED_BUSINESS_ID, 'products'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setProducts(data as Product[]);
    });

    const unsubSales = syncCollection('sales', setSales);
    const unsubExpenses = syncCollection('expenses', setExpenses);
    const unsubCategories = onSnapshot(collection(db, 'users', SHARED_BUSINESS_ID, 'categories'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setCategories(data.length > 0 ? data as Category[] : DEFAULT_CATEGORIES.map(name => ({ id: generateUUID(), name })));
    });
    const unsubCustomers = onSnapshot(collection(db, 'users', SHARED_BUSINESS_ID, 'customers'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setCustomers(data as Customer[]);
    });
    const unsubSuppliers = onSnapshot(collection(db, 'users', SHARED_BUSINESS_ID, 'suppliers'), (snapshot) => {
      const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
      setSuppliers(data as Supplier[]);
    });
    const unsubJournal = syncCollection('journalEntries', setJournalEntries);
    const unsubPurchases = syncCollection('purchases', setPurchases);
    
    const unsubProfile = onSnapshot(doc(db, 'users', SHARED_BUSINESS_ID, 'profile', 'data'), (docSnap) => {
      if (docSnap.exists()) {
        setBusinessProfile(docSnap.data() as any);
      }
      setIsCloudSyncing(false);
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
    
    // Count existing orders for this specific month
    const sameMonthOrders = sales.filter(s => {
      const sDate = s.saleDate ? new Date(s.saleDate) : new Date(s.date);
      return sDate.getFullYear() === saleDateObj.getFullYear() &&
             sDate.getMonth() === saleDateObj.getMonth();
    });
    
    const saleId = generateUUID();
    const newSale: Sale = {
      ...saleData,
      id: saleId,
      orderNumber: generateOrderNumber(saleDateObj, sameMonthOrders.length),
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
      await setDoc(doc(db, 'users', SHARED_BUSINESS_ID, 'categories', id), { id, name, parentId });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${SHARED_BUSINESS_ID}/categories/${id}`);
    }
  };

  const handleUpdateCategory = async (id: string, name: string) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'users', SHARED_BUSINESS_ID, 'categories', id), { name }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${SHARED_BUSINESS_ID}/categories/${id}`);
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
        
        alert('Data imported successfully! ဒေတာများ အောင်မြင်စွာ ထည့်သွင်းပြီးပါပြီ။');
      } catch (error) {
        console.error('Import error:', error);
        alert('Failed to import data. Please check the file format. ဒေတာ ထည့်သွင်းမှု မအောင်မြင်ပါ။ ဖိုင်ပုံစံ မှန်မမှန် ပြန်စစ်ပေးပါ။');
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

  if (!user) {
    return <Login />;
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <div className="flex justify-center mb-6">
            <div className="bg-red-100 p-4 rounded-full">
              <X className="w-12 h-12 text-red-600" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
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
        "fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-zinc-200 transition-transform duration-300 lg:translate-x-0 lg:static lg:inset-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center gap-3">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
              <DollarSign className="text-white h-5 w-5" />
            </div>
            <h1 className="font-bold text-xl tracking-tight truncate">{businessProfile.name}</h1>
          </div>

          <nav className="flex-1 px-4 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as Tab);
                  setIsSidebarOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                  activeTab === item.id 
                    ? "bg-zinc-900 text-white" 
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-zinc-200 space-y-2">
            <div className="bg-zinc-50 rounded-lg p-3">
              <p className="text-xs text-zinc-500 uppercase font-semibold tracking-wider mb-1">Status</p>
              <div className="flex items-center gap-2">
                <div className={cn(
                  "w-2 h-2 rounded-full animate-pulse",
                  isCloudSyncing ? "bg-amber-500" : "bg-emerald-500"
                )} />
                <span className="text-sm font-medium text-zinc-700">
                  {isCloudSyncing ? 'Syncing...' : 'Cloud Sync Active'}
                </span>
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={handleLogout}
            >
              <X className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-4 lg:px-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h2 className="text-lg font-semibold capitalize">{activeTab}</h2>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-zinc-100 rounded-full">
              <span className="text-xs font-medium text-zinc-500">Currency:</span>
              <span className="text-xs font-bold text-zinc-900">MMK</span>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 lg:p-8">
          <div className="max-w-6xl mx-auto">
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
                        <label className="text-sm font-medium">Shop Name</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-950"
                          value={businessProfile.name}
                          onChange={(e) => setBusinessProfile({ ...businessProfile, name: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Phone Number</label>
                        <input
                          type="text"
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-950"
                          value={businessProfile.phone}
                          onChange={(e) => setBusinessProfile({ ...businessProfile, phone: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <label className="text-sm font-medium">Address</label>
                        <textarea
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-950"
                          rows={3}
                          value={businessProfile.address}
                          onChange={(e) => setBusinessProfile({ ...businessProfile, address: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <label className="text-sm font-medium text-emerald-600">Google Sheets Web App URL</label>
                        <input
                          type="text"
                          placeholder="https://script.google.com/macros/s/.../exec"
                          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          value={businessProfile.googleSheetUrl || ''}
                          onChange={(e) => setBusinessProfile({ ...businessProfile, googleSheetUrl: e.target.value })}
                        />
                        <p className="text-xs text-zinc-500">Paste your deployed Google Apps Script URL here to enable cloud backup.</p>
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
                        <h3 className="font-medium">Cloud Sync</h3>
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
