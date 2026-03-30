import React, { useState } from 'react';
import { CreditCard, Plus, Trash2, Pencil, X, Image as ImageIcon, FileText, PieChart, TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Label } from './ui/Label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import { Badge } from './ui/Badge';
import { Expense } from '../types';
import { EXPENSE_TYPES } from '../constants';
import { formatCurrency } from '../lib/utils';

interface ExpenseTrackerProps {
  expenses: Expense[];
  onAddExpense: (expense: Omit<Expense, 'id'>) => Promise<void>;
  onUpdateExpense: (id: string, expense: Partial<Expense>) => Promise<void>;
  onDeleteExpense: (id: string) => Promise<void>;
}

export const ExpenseTracker = ({ expenses, onAddExpense, onUpdateExpense, onDeleteExpense }: ExpenseTrackerProps) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    type: 'Other' as Expense['type'],
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    voucherUrl: '',
  });

  // Calculate analysis
  const expenseByType = EXPENSE_TYPES.reduce((acc, type) => {
    acc[type] = expenses
      .filter(e => e.type === type)
      .reduce((sum, e) => sum + e.amount, 0);
    return acc;
  }, {} as Record<string, number>);

  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const monthlyTotal = expenses
    .filter(e => e.date.startsWith(currentMonth))
    .reduce((sum, e) => sum + e.amount, 0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, voucherUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      type: formData.type,
      amount: Number(formData.amount),
      description: formData.description,
      date: new Date(formData.date).toISOString(),
      voucherUrl: formData.voucherUrl,
    };

    if (editingId) {
      await onUpdateExpense(editingId, data);
      setEditingId(null);
    } else {
      await onAddExpense(data);
    }

    setFormData({ 
      type: 'Other', 
      amount: '', 
      description: '', 
      date: new Date().toISOString().split('T')[0],
      voucherUrl: '',
    });
  };

  const handleEdit = (expense: Expense) => {
    setEditingId(expense.id);
    setFormData({
      type: expense.type,
      amount: expense.amount.toString(),
      description: expense.description,
      date: new Date(expense.date).toISOString().split('T')[0],
      voucherUrl: expense.voucherUrl || '',
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({ 
      type: 'Other', 
      amount: '', 
      description: '', 
      date: new Date().toISOString().split('T')[0],
      voucherUrl: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Expense Analysis Dashboard */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-zinc-900 text-white border-none">
          <CardHeader className="pb-1">
            <CardTitle className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <TrendingDown className="h-3 w-3 text-red-400" />
              Monthly Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{formatCurrency(monthlyTotal)}</div>
            <p className="text-[9px] text-zinc-600 mt-0.5 uppercase tracking-tighter">Current Period</p>
          </CardContent>
        </Card>
        {EXPENSE_TYPES.filter(type => expenseByType[type] > 0).map(type => (
          <div key={type}>
            <Card className="shadow-sm border-zinc-200">
              <CardHeader className="pb-1">
                <CardTitle className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <PieChart className="h-3 w-3 text-zinc-300" />
                  {type}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-bold text-zinc-900">{formatCurrency(expenseByType[type])}</div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-4">
        <div className="xl:col-span-1">
        <Card className="shadow-sm border-zinc-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-zinc-400" />
              {editingId ? 'Edit Entry' : 'New Expense'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="date" className="text-[10px] font-bold uppercase text-zinc-400">Date</Label>
                <Input
                  id="date"
                  type="date"
                  required
                  className="h-9 text-xs"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="type" className="text-[10px] font-bold uppercase text-zinc-400">Type</Label>
                <Select
                  id="type"
                  required
                  className="h-9 text-xs"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as Expense['type'] })}
                >
                  {EXPENSE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="amount" className="text-[10px] font-bold uppercase text-zinc-400">Amount (MMK)</Label>
                <Input
                  id="amount"
                  type="number"
                  required
                  className="h-9 text-xs"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="description" className="text-[10px] font-bold uppercase text-zinc-400">Description</Label>
                <Input
                  id="description"
                  required
                  className="h-9 text-xs"
                  placeholder="e.g. Facebook Ads"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="voucher" className="text-[10px] font-bold uppercase text-zinc-400">Voucher (Optional)</Label>
                <div className="flex flex-col gap-2">
                  <Input
                    id="voucher"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="h-9 text-[10px] cursor-pointer"
                  />
                  {formData.voucherUrl && (
                    <div className="relative w-16 h-16 border border-zinc-100 rounded overflow-hidden">
                      <img src={formData.voucherUrl} alt="Voucher Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setFormData({ ...formData, voucherUrl: '' })}
                        className="absolute top-0 right-0 bg-zinc-900/80 text-white p-0.5 rounded-bl"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <Button type="submit" className="w-full h-9 text-xs font-bold uppercase tracking-wider mt-2">
                {editingId ? 'Update Entry' : 'Record Expense'}
              </Button>
              {editingId && (
                <Button type="button" variant="ghost" className="w-full h-9 text-xs text-zinc-400" onClick={cancelEdit}>
                  Cancel
                </Button>
              )}
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="xl:col-span-3">
        <Card className="shadow-sm border-zinc-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-zinc-900">Expense History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-zinc-100">
                  <TableHead className="text-[10px] font-bold uppercase text-zinc-400">Date</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-zinc-400">Type</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-zinc-400">Description</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-zinc-400 text-right">Amount</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-zinc-400 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-zinc-400 text-xs">
                      No expenses recorded
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses.map((expense) => (
                    <TableRow key={expense.id} className="border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                      <TableCell className="text-[10px] font-medium text-zinc-400">
                        {new Date(expense.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">{expense.type}</span>
                      </TableCell>
                      <TableCell className="text-xs font-semibold text-zinc-900">{expense.description}</TableCell>
                      <TableCell className="text-xs font-bold text-red-600 text-right">
                        {formatCurrency(expense.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-zinc-400 hover:text-zinc-900"
                            onClick={() => handleEdit(expense)}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-zinc-400 hover:text-red-500"
                            onClick={() => onDeleteExpense(expense.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
};
