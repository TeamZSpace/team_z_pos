import React, { useState } from 'react';
import { Plus, Pencil, Trash2, UserCheck, Phone } from 'lucide-react';
import { Supplier } from '../types';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Label } from './ui/Label';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/Table';
import { convertMyanmarToEnglish } from '../lib/utils';

interface SupplierManagerProps {
  suppliers: Supplier[];
  onAddSupplier: (name: string, phone: string) => void;
  onUpdateSupplier: (id: string, name: string, phone: string) => void;
  onDeleteSupplier: (id: string) => void;
}

export const SupplierManager = ({ 
  suppliers, 
  onAddSupplier, 
  onUpdateSupplier, 
  onDeleteSupplier 
}: SupplierManagerProps) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingId) {
      onUpdateSupplier(editingId, name, phone);
      setEditingId(null);
    } else {
      onAddSupplier(name, phone);
    }
    setName('');
    setPhone('');
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingId(supplier.id);
    setName(supplier.name);
    setPhone(supplier.phone);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            {editingId ? 'Edit Supplier' : 'Add New Supplier'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="supplierName">Supplier Name</Label>
              <Input
                id="supplierName"
                placeholder="e.g. ABC Wholesale"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="supplierPhone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                  id="supplierPhone"
                  className="pl-9"
                  placeholder="09..."
                  value={phone}
                  onChange={(e) => setPhone(convertMyanmarToEnglish(e.target.value))}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                {editingId ? 'Update Supplier' : 'Add Supplier'}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" onClick={() => {
                  setEditingId(null);
                  setName('');
                  setPhone('');
                }}>
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Supplier List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-zinc-500">
                    No suppliers added yet.
                  </TableCell>
                </TableRow>
              ) : (
                suppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>{supplier.phone || '-'}</TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(supplier)}>
                          <Pencil className="h-4 w-4 text-zinc-500" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => onDeleteSupplier(supplier.id)}>
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
  );
};
