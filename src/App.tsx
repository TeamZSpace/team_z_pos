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
  Trash2
} from 'lucide-react';
import { ProfitLossDashboard } from './components/ProfitLossDashboard';
import { InventoryManager } from './components/InventoryManager';
import { SalesEntry } from './components/SalesEntry';
import { ExpenseTracker } from './components/ExpenseTracker';
import { CategoryManager } from './components/CategoryManager';
import { CustomerManager } from './components/CustomerManager';
import { SupplierManager } from './components/SupplierManager';
import { Button } from './components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from './components/ui/Card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from './components/ui/Dialog';
import { Login } from './components/Login';
import { Product, Sale, Expense, DashboardStats, Category, Customer, Supplier, MonthlyReport, JournalEntry, Account } from './types';
import { cn, generateOrderNumber } from '@/src/lib/utils';
import { DEFAULT_CATEGORIES, DEFAULT_ACCOUNTS } from './constants';
import { AccountingModule } from './components/AccountingModule';
import { AISummary } from './components/AISummary';
import { supabase, isSupabaseConfigured } from '@/src/lib/supabase';

type Tab = 'dashboard' | 'inventory' | 'sales' | 'expenses' | 'categories' | 'customers' | 'suppliers' | 'accounting' | 'settings';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('mmk_auth') === 'true';
  });
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
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

  // State with LocalStorage Persistence
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('mmk_products');
    return saved ? JSON.parse(saved) : [];
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem('mmk_sales');
    return saved ? JSON.parse(saved) : [];
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const saved = localStorage.getItem('mmk_expenses');
    return saved ? JSON.parse(saved) : [];
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('mmk_categories');
    if (saved) return JSON.parse(saved);
    return DEFAULT_CATEGORIES.map(name => ({ id: crypto.randomUUID(), name }));
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('mmk_customers');
    return saved ? JSON.parse(saved) : [];
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('mmk_suppliers');
    return saved ? JSON.parse(saved) : [];
  });

  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>(() => {
    const saved = localStorage.getItem('mmk_journal_entries');
    return saved ? JSON.parse(saved) : [];
  });

  const [accounts] = useState<Account[]>(() => {
    return DEFAULT_ACCOUNTS;
  });

  const [businessProfile, setBusinessProfile] = useState(() => {
    const saved = localStorage.getItem('mmk_business_profile');
    return saved ? JSON.parse(saved) : { name: 'My Shop', address: '', phone: '', googleSheetUrl: '' };
  });

  const [isSyncing, setIsSyncing] = useState(false);
  const [isSupabaseSyncing, setIsSupabaseSyncing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

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

  const syncToSupabase = async () => {
    if (!supabase) {
      alert('Please set your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the environment first.');
      return;
    }

    setIsSupabaseSyncing(true);
    try {
      // For simplicity, we'll upsert all data to a 'pos_data' table or separate tables
      // Here we'll try to upsert to separate tables if they exist
      const tables = [
        { name: 'products', data: products },
        { name: 'sales', data: sales },
        { name: 'expenses', data: expenses },
        { name: 'categories', data: categories },
        { name: 'customers', data: customers },
        { name: 'suppliers', data: suppliers },
        { name: 'journal_entries', data: journalEntries },
        { name: 'business_profile', data: [businessProfile] }
      ];

      for (const table of tables) {
        if (table.data.length === 0) continue;
        
        const { error } = await supabase
          .from(table.name)
          .upsert(table.data, { onConflict: 'id' });
        
        if (error) throw error;
      }

      alert('Data successfully synced to Supabase! Supabase ထဲကို ဒေတာများ အောင်မြင်စွာ ထည့်သွင်းပြီးပါပြီ။');
    } catch (error) {
      console.error('Supabase sync error:', error);
      alert('Supabase sync failed. Please check your table permissions and internet connection. Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsSupabaseSyncing(false);
    }
  };

  const handleLogin = (username: string, password: string) => {
    if (username === 'admin' && password === 'admin2323') {
      setIsAuthenticated(true);
      sessionStorage.setItem('mmk_auth', 'true');
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('mmk_auth');
  };

  // Sync with LocalStorage
  useEffect(() => {
    localStorage.setItem('mmk_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('mmk_sales', JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem('mmk_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('mmk_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('mmk_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('mmk_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('mmk_journal_entries', JSON.stringify(journalEntries));
  }, [journalEntries]);

  useEffect(() => {
    localStorage.setItem('mmk_business_profile', JSON.stringify(businessProfile));
  }, [businessProfile]);

  // Calculate Stats
  const stats = useMemo<DashboardStats>(() => {
    const filteredSales = selectedMonth === 'all' 
      ? sales 
      : sales.filter(s => s.date.startsWith(selectedMonth));
    
    const filteredExpenses = selectedMonth === 'all'
      ? expenses
      : expenses.filter(e => e.date.startsWith(selectedMonth));

    const totalRevenue = filteredSales.reduce((acc, s) => acc + s.totalRevenue, 0);
    const totalCOGS = filteredSales.reduce((acc, s) => acc + s.totalCost, 0);
    const totalExpenses = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);
    
    const filteredProducts = selectedMonth === 'all'
      ? products
      : products.filter(p => p.createdAt.startsWith(selectedMonth));
    const totalPurchase = filteredProducts.reduce((acc, p) => acc + ((p.costPrice + (p.shippingPrice || 0)) * p.stock), 0);

    const netProfit = totalRevenue - (totalCOGS + totalExpenses);

    return {
      totalRevenue,
      totalCOGS,
      totalExpenses,
      totalPurchase,
      netProfit,
    };
  }, [sales, expenses, products, selectedMonth]);

  const monthlyReports = useMemo<MonthlyReport[]>(() => {
    const reports: Record<string, MonthlyReport> = {};
    
    sales.forEach(s => {
      const month = s.date.substring(0, 7); // YYYY-MM
      if (!reports[month]) {
        reports[month] = { month, totalRevenue: 0, totalExpenses: 0, totalCOGS: 0, totalPurchase: 0, netProfit: 0 };
      }
      reports[month].totalRevenue += s.totalRevenue;
      reports[month].totalCOGS += s.totalCost;
    });
    
    expenses.forEach(e => {
      const month = e.date.substring(0, 7); // YYYY-MM
      if (!reports[month]) {
        reports[month] = { month, totalRevenue: 0, totalExpenses: 0, totalCOGS: 0, totalPurchase: 0, netProfit: 0 };
      }
      reports[month].totalExpenses += e.amount;
    });

    products.forEach(p => {
      const month = p.createdAt.substring(0, 7); // YYYY-MM
      if (!reports[month]) {
        reports[month] = { month, totalRevenue: 0, totalExpenses: 0, totalCOGS: 0, totalPurchase: 0, netProfit: 0 };
      }
      reports[month].totalPurchase += ((p.costPrice + (p.shippingPrice || 0)) * p.stock);
    });
    
    return Object.values(reports)
      .map(r => ({ ...r, netProfit: r.totalRevenue - (r.totalCOGS + r.totalExpenses) }))
      .sort((a, b) => b.month.localeCompare(a.month));
  }, [sales, expenses, products]);

  // Handlers
  const handleAddProduct = async (productData: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...productData,
      id: crypto.randomUUID(),
    };
    setProducts([...products, newProduct]);
  };

  const handleUpdateProduct = async (id: string, productData: Partial<Product>) => {
    setProducts(products.map(p => p.id === id ? { ...p, ...productData } : p));
  };

  const handleDeleteProduct = async (id: string) => {
    showConfirm(
      'Delete Product',
      'Are you sure you want to delete this product?',
      () => setProducts(products.filter(p => p.id !== id))
    );
  };

  const handleAddSale = async (saleData: Omit<Sale, 'id' | 'orderNumber'>) => {
    // Get today's order count for order number generation
    const today = new Date().toLocaleDateString();
    const todayOrders = sales.filter(s => new Date(s.date).toLocaleDateString() === today);
    
    const newSale: Sale = {
      ...saleData,
      id: crypto.randomUUID(),
      orderNumber: generateOrderNumber(todayOrders.length),
    };
    
    // Update stock for each item
    setProducts(prevProducts => {
      let updatedProducts = [...prevProducts];
      newSale.items.forEach(item => {
        updatedProducts = updatedProducts.map(p => 
          p.id === item.productId 
            ? { ...p, stock: p.stock - item.quantity } 
            : p
        );
      });
      return updatedProducts;
    });
    
    setSales([newSale, ...sales]);

    // Also update or add customer to customer list
    const existingCustomer = customers.find(c => c.phone === saleData.customer.phone);
    if (!existingCustomer) {
      const newCustomer: Customer = {
        id: crypto.randomUUID(),
        facebookName: saleData.customer.facebookName,
        orderName: saleData.customer.orderName,
        phone: saleData.customer.phone,
        address: saleData.customer.address,
      };
      setCustomers([...customers, newCustomer]);
    }
  };

  const handleUpdateSale = async (id: string, saleData: Omit<Sale, 'id' | 'orderNumber'>) => {
    const oldSale = sales.find(s => s.id === id);
    if (!oldSale) return;

    // Update stock for each item
    setProducts(prevProducts => {
      let updatedProducts = [...prevProducts];
      
      // Revert old stock
      oldSale.items.forEach(item => {
        updatedProducts = updatedProducts.map(p => 
          p.id === item.productId 
            ? { ...p, stock: p.stock + item.quantity } 
            : p
        );
      });

      // Apply new stock
      saleData.items.forEach(item => {
        updatedProducts = updatedProducts.map(p => 
          p.id === item.productId 
            ? { ...p, stock: p.stock - item.quantity } 
            : p
        );
      });

      return updatedProducts;
    });

    setSales(sales.map(s => s.id === id ? { ...s, ...saleData, orderNumber: s.orderNumber } : s));
  };

  const handleDeleteSale = async (id: string) => {
    const saleToDelete = sales.find(s => s.id === id);
    if (!saleToDelete) return;

    showConfirm(
      'Delete Order',
      'Are you sure you want to delete this order? This will automatically revert inventory stock.',
      () => {
        // Revert stock
        setProducts(prevProducts => {
          let updatedProducts = [...prevProducts];
          saleToDelete.items.forEach(item => {
            updatedProducts = updatedProducts.map(p => 
              p.id === item.productId 
                ? { ...p, stock: p.stock + item.quantity } 
                : p
            );
          });
          return updatedProducts;
        });

        setSales(sales.filter(s => s.id !== id));
      }
    );
  };

  const handleAddExpense = async (expenseData: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: crypto.randomUUID(),
    };
    setExpenses([newExpense, ...expenses]);
  };

  const handleUpdateExpense = async (id: string, expenseData: Partial<Expense>) => {
    setExpenses(expenses.map(e => e.id === id ? { ...e, ...expenseData } : e));
  };

  const handleDeleteExpense = async (id: string) => {
    showConfirm(
      'Delete Expense',
      'Are you sure you want to delete this expense?',
      () => setExpenses(expenses.filter(e => e.id !== id))
    );
  };

  const handleAddCategory = (name: string, parentId?: string) => {
    setCategories([...categories, { id: crypto.randomUUID(), name, parentId }]);
  };

  const handleUpdateCategory = (id: string, name: string) => {
    setCategories(categories.map(c => c.id === id ? { ...c, name } : c));
  };

  const handleDeleteCategory = (id: string) => {
    showConfirm(
      'Delete Category',
      'Are you sure you want to delete this category? All its subcategories will also be removed.',
      () => setCategories(categories.filter(c => c.id !== id && c.parentId !== id))
    );
  };

  const handleUpdateCustomer = (id: string, customerData: Partial<Customer>) => {
    setCustomers(customers.map(c => c.id === id ? { ...c, ...customerData } : c));
  };

  const handleDeleteCustomer = (id: string) => {
    showConfirm(
      'Delete Customer',
      'Are you sure you want to delete this customer?',
      () => setCustomers(customers.filter(c => c.id !== id))
    );
  };

  const handleAddSupplier = (name: string, phone: string) => {
    setSuppliers([...suppliers, { id: crypto.randomUUID(), name, phone }]);
  };

  const handleUpdateSupplier = (id: string, name: string, phone: string) => {
    setSuppliers(suppliers.map(s => s.id === id ? { ...s, name, phone } : s));
  };

  const handleDeleteSupplier = (id: string) => {
    showConfirm(
      'Delete Supplier',
      'Are you sure you want to delete this supplier?',
      () => setSuppliers(suppliers.filter(s => s.id !== id))
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

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        
        if (data.products) setProducts(data.products);
        if (data.sales) setSales(data.sales);
        if (data.expenses) setExpenses(data.expenses);
        if (data.categories) setCategories(data.categories);
        if (data.customers) setCustomers(data.customers);
        if (data.suppliers) setSuppliers(data.suppliers);
        if (data.businessProfile) setBusinessProfile(data.businessProfile);
        
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
    { id: 'sales', label: 'Sales', icon: ShoppingCart },
    { id: 'expenses', label: 'Expenses', icon: CreditCard },
    { id: 'categories', label: 'Categories', icon: Tags },
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'suppliers', label: 'Suppliers', icon: UserCheck },
    { id: 'accounting', label: 'Accounting', icon: CreditCard },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
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
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium text-zinc-700">Local Storage Active</span>
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
                        <h3 className="font-medium">Supabase Cloud Sync</h3>
                        <p className="text-sm text-zinc-500">Backup all your records to your connected Supabase database.</p>
                        <Button 
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={syncToSupabase}
                          disabled={isSupabaseSyncing}
                        >
                          {isSupabaseSyncing ? 'Syncing...' : 'Sync to Supabase'}
                        </Button>
                        <Button 
                          variant="outline"
                          className="w-full mt-2"
                          onClick={async () => {
                            if (!supabase) {
                              alert('Supabase is not configured.');
                              return;
                            }
                            try {
                              const { data, error } = await supabase.from('products').select('*').limit(1);
                              if (error) throw error;
                              alert('Connection successful! Supabase နှင့် ချိတ်ဆက်မှု အောင်မြင်ပါသည်။');
                            } catch (error) {
                              console.error('Supabase connection error:', error);
                              alert('Connection failed. Please check your keys and table permissions. Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
                            }
                          }}
                        >
                          Test Supabase Connection
                        </Button>
                        {!isSupabaseConfigured() && (
                          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-xs text-red-600 font-medium">Supabase is not configured.</p>
                            <p className="text-[10px] text-red-500 mt-1">
                              Settings menu ထဲမှာ VITE_SUPABASE_URL နဲ့ VITE_SUPABASE_ANON_KEY ကို ထည့်သွင်းပေးပါ။
                            </p>
                          </div>
                        )}
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
