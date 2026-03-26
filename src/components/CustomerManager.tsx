import React, { useState } from 'react';
import { Search, Pencil, Trash2, User } from 'lucide-react';
import { Customer } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/Table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/Dialog';
import { Label } from './ui/Label';
import { convertMyanmarToEnglish } from '../lib/utils';

interface CustomerManagerProps {
  customers: Customer[];
  onUpdateCustomer: (id: string, customerData: Partial<Customer>) => void;
  onDeleteCustomer: (id: string) => void;
}

export function CustomerManager({ 
  customers, 
  onUpdateCustomer, 
  onDeleteCustomer 
}: CustomerManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Customer Records</CardTitle>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Search customers..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Facebook Name</TableHead>
                <TableHead>Order Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.facebookName}</TableCell>
                  <TableCell>{customer.orderName}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{customer.address}</TableCell>
                  <TableCell>
                    <div className="flex justify-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setEditingCustomer(customer)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-red-500 hover:text-red-600"
                        onClick={() => onDeleteCustomer(customer.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredCustomers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-zinc-500">
                    No customers found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Customer Dialog */}
      <Dialog open={!!editingCustomer} onOpenChange={() => setEditingCustomer(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Customer Information</DialogTitle>
          </DialogHeader>
          {editingCustomer && (
            <form onSubmit={handleUpdate} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="facebookName">Facebook Name</Label>
                <Input
                  id="facebookName"
                  value={editingCustomer.facebookName}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, facebookName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="orderName">Order Name</Label>
                <Input
                  id="orderName"
                  value={editingCustomer.orderName}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, orderName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={editingCustomer.phone}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: convertMyanmarToEnglish(e.target.value) })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={editingCustomer.address}
                  onChange={(e) => setEditingCustomer({ ...editingCustomer, address: e.target.value })}
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="outline" onClick={() => setEditingCustomer(null)}>
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
