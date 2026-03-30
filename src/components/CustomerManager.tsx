import React, { useState } from 'react';
import { Search, Pencil, Trash2, User } from 'lucide-react';
import { Customer, Sale } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/Table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/Dialog';
import { Label } from './ui/Label';
import { convertMyanmarToEnglish } from '../lib/utils';

interface CustomerManagerProps {
  customers: Customer[];
  sales: Sale[];
  onUpdateCustomer: (id: string, customerData: Partial<Customer>) => void;
  onDeleteCustomer: (id: string) => void;
}

export function CustomerManager({ 
  customers, 
  sales,
  onUpdateCustomer, 
  onDeleteCustomer 
}: CustomerManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const getSalesCount = (facebookName: string, orderName: string) => {
    return sales.filter(s => 
      s.customer.facebookName === facebookName && 
      s.customer.orderName === orderName
    ).length;
  };

  const filteredCustomers = customers.filter(c => 
    c.facebookName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.orderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.phone.includes(searchTerm)
  );

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCustomer) return;
    onUpdateCustomer(editingCustomer.id, editingCustomer);
    setEditingCustomer(null);
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border-zinc-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-bold text-zinc-900">Customer Records</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
            <Input
              placeholder="Search customers..."
              className="pl-9 h-9 text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-zinc-100">
                <TableHead className="text-[10px] font-bold uppercase text-zinc-400">Facebook Name</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-zinc-400">Order Name</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-zinc-400">Phone</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-zinc-400">Address</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-zinc-400 text-center">Sales</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-zinc-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id} className="border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                  <TableCell className="text-xs font-bold text-zinc-900">{customer.facebookName}</TableCell>
                  <TableCell className="text-xs text-zinc-500">{customer.orderName}</TableCell>
                  <TableCell className="text-xs text-zinc-500">{customer.phone}</TableCell>
                  <TableCell className="text-xs text-zinc-500 max-w-[200px] truncate">{customer.address}</TableCell>
                  <TableCell className="text-center">
                    <span className="text-xs font-bold text-zinc-900 bg-zinc-100 px-2 py-0.5 rounded-full">
                      {getSalesCount(customer.facebookName, customer.orderName)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-zinc-400 hover:text-zinc-900"
                        onClick={() => setEditingCustomer(customer)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-zinc-400 hover:text-red-500"
                        onClick={() => onDeleteCustomer(customer.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredCustomers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-zinc-400 text-xs">
                    No customers found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Customer Dialog */}
      <Dialog open={!!editingCustomer} onOpenChange={() => setEditingCustomer(null)}>
        <DialogContent className="sm:max-w-[425px] border-zinc-200">
          <DialogHeader>
            <DialogTitle className="text-sm font-bold text-zinc-900 uppercase tracking-wider">Edit Customer</DialogTitle>
          </DialogHeader>
          {editingCustomer && (
            <form onSubmit={handleUpdate} className="space-y-3 py-4">
              <div className="space-y-1.5">
                <Label htmlFor="facebookName" className="text-[10px] font-bold uppercase text-zinc-400">Facebook Name</Label>
                <Input
                  id="facebookName"
                  className="h-9 text-xs"
                  value={editingCustomer.facebookName}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, facebookName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="orderName" className="text-[10px] font-bold uppercase text-zinc-400">Order Name</Label>
                <Input
                  id="orderName"
                  className="h-9 text-xs"
                  value={editingCustomer.orderName}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, orderName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone" className="text-[10px] font-bold uppercase text-zinc-400">Phone</Label>
                <Input
                  id="phone"
                  className="h-9 text-xs"
                  value={editingCustomer.phone}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: convertMyanmarToEnglish(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address" className="text-[10px] font-bold uppercase text-zinc-400">Address</Label>
                <Input
                  id="address"
                  className="h-9 text-xs"
                  value={editingCustomer.address}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, address: e.target.value })}
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" className="h-9 text-xs" onClick={() => setEditingCustomer(null)}>
                  Cancel
                </Button>
                <Button type="submit" className="h-9 text-xs font-bold uppercase tracking-wider">Save Changes</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
