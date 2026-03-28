import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  ArrowUpRight, 
  ArrowDownRight, 
  Users, 
  PieChart, 
  Plus, 
  Trash2, 
  Search,
  Filter,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { JournalEntry, Account, Customer, Supplier, TransactionType } from '../types';
import { cn } from '../lib/utils';

interface AccountingModuleProps {
  journalEntries: JournalEntry[];
  accounts: Account[];
  customers: Customer[];
  suppliers: Supplier[];
  onAddEntry: (entry: JournalEntry) => void;
  onDeleteEntry: (id: string) => void;
}

type AccountingTab = 'overview' | 'ledger' | 'income_expense' | 'payables_receivables' | 'p_l';

export function AccountingModule({ 
  journalEntries, 
  accounts, 
  customers, 
  suppliers, 
  onAddEntry, 
  onDeleteEntry 
}: AccountingModuleProps) {
  const [activeTab, setActiveTab] = useState<AccountingTab>('overview');
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');

  const [newEntry, setNewEntry] = useState<Partial<JournalEntry>>({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    reference_type: 'Income',
    description: '',
  });

  const totals = useMemo(() => {
    const accountBalances: Record<string, number> = {};
    accounts.forEach(acc => accountBalances[acc.id] = 0);

    journalEntries.forEach(entry => {
      accountBalances[entry.debit_account_id] += entry.amount;
      accountBalances[entry.credit_account_id] -= entry.amount;
    });

    const getBalance = (type: string) => {
      return accounts
        .filter(acc => acc.type === type)
        .reduce((sum, acc) => {
          const bal = accountBalances[acc.id];
          // For assets and expenses, debit is positive
          if (type === 'asset' || type === 'expense') return sum + bal;
          // For liabilities, equity, and revenue, credit is positive (so we flip the sign)
          return sum - bal;
        }, 0);
    };

    return {
      assets: getBalance('asset'),
      liabilities: getBalance('liability'),
      equity: getBalance('equity'),
      revenue: getBalance('revenue'),
      expenses: getBalance('expense'),
      receivables: journalEntries
        .filter(e => e.reference_type === 'Receivable')
        .reduce((sum, e) => sum + e.amount, 0),
      payables: journalEntries
        .filter(e => e.reference_type === 'Payable')
        .reduce((sum, e) => sum + e.amount, 0),
    };
  }, [journalEntries, accounts]);

  const filteredEntries = useMemo(() => {
    return journalEntries.filter(entry => {
      const matchesSearch = entry.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || entry.reference_type === filterType;
      return matchesSearch && matchesType;
    });
  }, [journalEntries, searchTerm, filterType]);

  const handleAddEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEntry.debit_account_id || !newEntry.credit_account_id || !newEntry.amount) return;

    onAddEntry({
      ...newEntry as JournalEntry,
      id: crypto.randomUUID(),
    });
    setIsAddingEntry(false);
    setNewEntry({
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      reference_type: 'Income',
      description: '',
    });
  };

  const getAccountName = (id: string) => accounts.find(a => a.id === id)?.name || 'Unknown';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex bg-zinc-100 p-1 rounded-lg w-fit">
          {[
            { id: 'overview', label: 'Overview', icon: BookOpen },
            { id: 'ledger', label: 'Ledger', icon: BookOpen },
            { id: 'income_expense', label: 'Income/Expense', icon: ArrowUpRight },
            { id: 'payables_receivables', label: 'Payables/Receivables', icon: Users },
            { id: 'p_l', label: 'P&L Statement', icon: PieChart },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AccountingTab)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all",
                activeTab === tab.id 
                  ? "bg-white text-zinc-900 shadow-sm" 
                  : "text-zinc-500 hover:text-zinc-900"
              )}
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden md:inline">{tab.label}</span>
            </button>
          ))}
        </div>
        <Button onClick={() => setIsAddingEntry(true)} className="bg-zinc-900 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Add Journal Entry
        </Button>
      </div>

      {activeTab === 'overview' && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-emerald-50 border-emerald-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-600">Total Assets</p>
                  <h3 className="text-2xl font-bold text-emerald-900">{totals.assets.toLocaleString()} MMK</h3>
                </div>
                <div className="p-3 bg-white rounded-full shadow-sm">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-600">Total Liabilities</p>
                  <h3 className="text-2xl font-bold text-red-900">{totals.liabilities.toLocaleString()} MMK</h3>
                </div>
                <div className="p-3 bg-white rounded-full shadow-sm">
                  <TrendingDown className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-blue-50 border-blue-100">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Equity</p>
                  <h3 className="text-2xl font-bold text-blue-900">{totals.equity.toLocaleString()} MMK</h3>
                </div>
                <div className="p-3 bg-white rounded-full shadow-sm">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-zinc-900 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-400">Net Profit (YTD)</p>
                  <h3 className="text-2xl font-bold">{(totals.revenue - totals.expenses).toLocaleString()} MMK</h3>
                </div>
                <div className="p-3 bg-zinc-800 rounded-full">
                  <DollarSign className="h-5 w-5 text-zinc-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'ledger' && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>General Ledger</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search entries..."
                  className="pl-9 pr-4 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-950"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <select
                className="px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-950"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
              >
                <option value="all">All Types</option>
                <option value="Income">Income</option>
                <option value="Expense">Expense</option>
                <option value="Payable">Payable</option>
                <option value="Receivable">Receivable</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-zinc-500 font-medium">
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-left py-3 px-4">Description</th>
                    <th className="text-left py-3 px-4">Type</th>
                    <th className="text-left py-3 px-4">Debit Account</th>
                    <th className="text-left py-3 px-4">Credit Account</th>
                    <th className="text-right py-3 px-4">Amount</th>
                    <th className="text-right py-3 px-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">{entry.date}</td>
                      <td className="py-3 px-4">{entry.description}</td>
                      <td className="py-3 px-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          entry.reference_type === 'Income' ? "bg-emerald-100 text-emerald-700" :
                          entry.reference_type === 'Expense' ? "bg-red-100 text-red-700" :
                          entry.reference_type === 'Payable' ? "bg-orange-100 text-orange-700" :
                          "bg-blue-100 text-blue-700"
                        )}>
                          {entry.reference_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-zinc-600">{getAccountName(entry.debit_account_id)}</td>
                      <td className="py-3 px-4 text-zinc-600">{getAccountName(entry.credit_account_id)}</td>
                      <td className="py-3 px-4 text-right font-medium">{entry.amount.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-zinc-400 hover:text-red-600"
                          onClick={() => onDeleteEntry(entry.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredEntries.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-zinc-500">No journal entries found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'income_expense' && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-emerald-600 flex items-center gap-2">
                <ArrowUpRight className="h-5 w-5" />
                Income Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {journalEntries.filter(e => e.reference_type === 'Income').map(entry => (
                  <div key={entry.id} className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                    <div>
                      <p className="font-medium text-emerald-900">{entry.description}</p>
                      <p className="text-xs text-emerald-600">{entry.date}</p>
                    </div>
                    <p className="font-bold text-emerald-700">+{entry.amount.toLocaleString()} MMK</p>
                  </div>
                ))}
                {journalEntries.filter(e => e.reference_type === 'Income').length === 0 && (
                  <p className="text-center py-4 text-zinc-500 text-sm">No income records yet.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center gap-2">
                <ArrowDownRight className="h-5 w-5" />
                Expense Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {journalEntries.filter(e => e.reference_type === 'Expense').map(entry => (
                  <div key={entry.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                    <div>
                      <p className="font-medium text-red-900">{entry.description}</p>
                      <p className="text-xs text-red-600">{entry.date}</p>
                    </div>
                    <p className="font-bold text-red-700">-{entry.amount.toLocaleString()} MMK</p>
                  </div>
                ))}
                {journalEntries.filter(e => e.reference_type === 'Expense').length === 0 && (
                  <p className="text-center py-4 text-zinc-500 text-sm">No expense records yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'payables_receivables' && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-blue-600 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Accounts Receivable (Customers)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {journalEntries.filter(e => e.reference_type === 'Receivable').map(entry => {
                  const customer = customers.find(c => c.id === entry.contact_id);
                  return (
                    <div key={entry.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                      <div>
                        <p className="font-medium text-blue-900">{customer?.orderName || 'Unknown Customer'}</p>
                        <p className="text-xs text-blue-600">{entry.description} • {entry.date}</p>
                      </div>
                      <p className="font-bold text-blue-700">{entry.amount.toLocaleString()} MMK</p>
                    </div>
                  );
                })}
                {journalEntries.filter(e => e.reference_type === 'Receivable').length === 0 && (
                  <p className="text-center py-4 text-zinc-500 text-sm">No pending receivables.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-orange-600 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Accounts Payable (Suppliers)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {journalEntries.filter(e => e.reference_type === 'Payable').map(entry => {
                  const supplier = suppliers.find(s => s.id === entry.contact_id);
                  return (
                    <div key={entry.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-100">
                      <div>
                        <p className="font-medium text-orange-900">{supplier?.name || 'Unknown Supplier'}</p>
                        <p className="text-xs text-orange-600">{entry.description} • {entry.date}</p>
                      </div>
                      <p className="font-bold text-orange-700">{entry.amount.toLocaleString()} MMK</p>
                    </div>
                  );
                })}
                {journalEntries.filter(e => e.reference_type === 'Payable').length === 0 && (
                  <p className="text-center py-4 text-zinc-500 text-sm">No pending payables.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'p_l' && (
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Profit & Loss Statement</CardTitle>
            <p className="text-center text-sm text-zinc-500">For the period ending {new Date().toLocaleDateString()}</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <h3 className="font-bold text-lg border-b pb-2">Revenue</h3>
              <div className="flex justify-between items-center py-1">
                <span>Sales Revenue</span>
                <span className="font-medium">{totals.revenue.toLocaleString()} MMK</span>
              </div>
              <div className="flex justify-between items-center py-2 border-t font-bold">
                <span>Total Revenue</span>
                <span>{totals.revenue.toLocaleString()} MMK</span>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="font-bold text-lg border-b pb-2">Expenses</h3>
              <div className="flex justify-between items-center py-1">
                <span>Operating Expenses</span>
                <span className="font-medium">({totals.expenses.toLocaleString()}) MMK</span>
              </div>
              <div className="flex justify-between items-center py-2 border-t font-bold">
                <span>Total Expenses</span>
                <span>({totals.expenses.toLocaleString()}) MMK</span>
              </div>
            </div>

            <div className={cn(
              "flex justify-between items-center p-4 rounded-lg font-bold text-xl",
              (totals.revenue - totals.expenses) >= 0 ? "bg-emerald-100 text-emerald-900" : "bg-red-100 text-red-900"
            )}>
              <span>Net Profit</span>
              <span>{(totals.revenue - totals.expenses).toLocaleString()} MMK</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Entry Modal */}
      {isAddingEntry && (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Add Journal Entry</CardTitle>
            </CardHeader>
            <form onSubmit={handleAddEntry}>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date</label>
                    <input
                      type="date"
                      required
                      className="w-full px-3 py-2 border rounded-md"
                      value={newEntry.date}
                      onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Type</label>
                    <select
                      className="w-full px-3 py-2 border rounded-md"
                      value={newEntry.reference_type}
                      onChange={(e) => {
                        const type = e.target.value as TransactionType;
                        let debit = '';
                        let credit = '';
                        
                        if (type === 'Income') {
                          debit = 'acc_cash';
                          credit = 'acc_revenue';
                        } else if (type === 'Expense') {
                          debit = 'acc_expense';
                          credit = 'acc_cash';
                        } else if (type === 'Payable') {
                          debit = 'acc_expense';
                          credit = 'acc_ap';
                        } else if (type === 'Receivable') {
                          debit = 'acc_ar';
                          credit = 'acc_revenue';
                        }

                        setNewEntry({ 
                          ...newEntry, 
                          reference_type: type,
                          debit_account_id: debit,
                          credit_account_id: credit
                        });
                      }}
                    >
                      <option value="Income">Income</option>
                      <option value="Expense">Expense</option>
                      <option value="Payable">Payable</option>
                      <option value="Receivable">Receivable</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Sales from Facebook Order #001"
                    className="w-full px-3 py-2 border rounded-md"
                    value={newEntry.description}
                    onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Debit Account</label>
                    <select
                      required
                      className="w-full px-3 py-2 border rounded-md"
                      value={newEntry.debit_account_id}
                      onChange={(e) => setNewEntry({ ...newEntry, debit_account_id: e.target.value })}
                    >
                      <option value="">Select Account</option>
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name} ({acc.code})</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Credit Account</label>
                    <select
                      required
                      className="w-full px-3 py-2 border rounded-md"
                      value={newEntry.credit_account_id}
                      onChange={(e) => setNewEntry({ ...newEntry, credit_account_id: e.target.value })}
                    >
                      <option value="">Select Account</option>
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name} ({acc.code})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Amount (MMK)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      className="w-full px-3 py-2 border rounded-md"
                      value={newEntry.amount || ''}
                      onChange={(e) => setNewEntry({ ...newEntry, amount: Number(e.target.value) })}
                    />
                  </div>
                  {(newEntry.reference_type === 'Receivable' || newEntry.reference_type === 'Payable') && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        {newEntry.reference_type === 'Receivable' ? 'Customer' : 'Supplier'}
                      </label>
                      <select
                        required
                        className="w-full px-3 py-2 border rounded-md"
                        value={newEntry.contact_id}
                        onChange={(e) => setNewEntry({ ...newEntry, contact_id: e.target.value })}
                      >
                        <option value="">Select Contact</option>
                        {newEntry.reference_type === 'Receivable' 
                          ? customers.map(c => <option key={c.id} value={c.id}>{c.orderName}</option>)
                          : suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)
                        }
                      </select>
                    </div>
                  )}
                </div>
              </CardContent>
              <div className="p-6 border-t flex justify-end gap-3">
                <Button variant="outline" type="button" onClick={() => setIsAddingEntry(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-zinc-900 text-white">
                  Record Entry
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
