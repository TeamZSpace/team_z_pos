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
      <Card className="lg:col-span-1 shadow-sm border-zinc-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-zinc-900 flex items-center gap-2">
            <UserCheck className="h-4 w-4 text-zinc-400" />
            {editingId ? 'Edit Supplier' : 'New Supplier'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="supplierName" className="text-[10px] font-bold uppercase text-zinc-400">Name</Label>
              <Input
                id="supplierName"
                className="h-9 text-xs"
                placeholder="e.g. ABC Wholesale"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="supplierPhone" className="text-[10px] font-bold uppercase text-zinc-400">Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-300" />
                <Input
                  id="supplierPhone"
                  className="pl-9 h-9 text-xs"
                  placeholder="09..."
                  value={phone}
                  onChange={(e) => setPhone(convertMyanmarToEnglish(e.target.value))}
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1 h-9 text-xs font-bold uppercase tracking-wider">
                {editingId ? 'Update' : 'Add'}
              </Button>
              {editingId && (
                <Button type="button" variant="outline" className="h-9 text-xs" onClick={() => {
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

      <Card className="lg:col-span-2 shadow-sm border-zinc-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-zinc-900">Supplier List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-zinc-100">
                <TableHead className="text-[10px] font-bold uppercase text-zinc-400">Name</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-zinc-400">Phone</TableHead>
                <TableHead className="text-[10px] font-bold uppercase text-zinc-400 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-12 text-zinc-400 text-xs">
                    No suppliers found
                  </TableCell>
                </TableRow>
              ) : (
                suppliers.map((supplier) => (
                  <TableRow key={supplier.id} className="border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                    <TableCell className="text-xs font-bold text-zinc-900">{supplier.name}</TableCell>
                    <TableCell className="text-xs font-medium text-zinc-500">{supplier.phone || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-zinc-400 hover:text-zinc-900"
                          onClick={() => handleEdit(supplier)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7 text-zinc-400 hover:text-red-500"
                          onClick={() => onDeleteSupplier(supplier.id)}
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
  );
};
