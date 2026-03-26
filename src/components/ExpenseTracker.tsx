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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-zinc-900 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <TrendingDown className="h-4 w-4" />
              Monthly Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(monthlyTotal)}</div>
            <p className="text-xs text-zinc-500 mt-1">For {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
          </CardContent>
        </Card>

        {EXPENSE_TYPES.filter(type => expenseByType[type] > 0).slice(0, 3).map(type => (
          <div key={type}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-zinc-500 uppercase tracking-wider flex items-center gap-2">
                  <PieChart className="h-4 w-4 text-zinc-400" />
                  {type}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold">{formatCurrency(expenseByType[type])}</div>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              {editingId ? 'Edit Expense' : 'Add Expense'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Expense Type</Label>
                <Select
                  id="type"
                  required
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
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (MMK)</Label>
                <Input
                  id="amount"
                  type="number"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  required
                  placeholder="e.g. Facebook Ads, Delivery to Yangon"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="voucher">Voucher / Receipt (Optional)</Label>
                <div className="flex flex-col gap-2">
                  <Input
                    id="voucher"
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                  {formData.voucherUrl && (
                    <div className="relative w-20 h-20 border rounded overflow-hidden">
                      <img src={formData.voucherUrl} alt="Voucher Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setFormData({ ...formData, voucherUrl: '' })}
                        className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <Button type="submit" className="w-full">
                {editingId ? (
                  <><Pencil className="h-4 w-4 mr-2" /> Update Expense</>
                ) : (
                  <><Plus className="h-4 w-4 mr-2" /> Record Expense</>
                )}
              </Button>
              {editingId && (
                <Button type="button" variant="ghost" className="w-full mt-2" onClick={cancelEdit}>
                  <X className="h-4 w-4 mr-2" /> Cancel Edit
                </Button>
              )}
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Expense History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-center">Amount</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-zinc-500">
                      No expenses recorded yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell className="text-xs text-zinc-500">
                        {new Date(expense.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{expense.type}</Badge>
                      </TableCell>
                      <TableCell className="font-medium">{expense.description}</TableCell>
                      <TableCell className="font-bold text-red-600">
                        {formatCurrency(expense.amount)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(expense)}>
                            <Pencil className="h-4 w-4 text-zinc-500" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => onDeleteExpense(expense.id)}>
                            <Trash2 className="h-4 w-4 text-red-500" />
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
