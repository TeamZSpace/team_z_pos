import React, { useState } from 'react';
import { Plus, Search, Package, Trash2, RefreshCw, Calendar, User, DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import { Badge } from './ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from './ui/Dialog';
import { Label } from './ui/Label';
import { Select } from './ui/Select';
import { Product, Supplier, Purchase } from '../types';
import { formatCurrency, cn } from '../lib/utils';

interface PurchaseManagerProps {
  purchases: Purchase[];
  products: Product[];
  suppliers: Supplier[];
  onAddPurchase: (purchase: Omit<Purchase, 'id'>) => Promise<void>;
  onDeletePurchase: (id: string) => Promise<void>;
}

export const PurchaseManager = ({
  purchases,
  products,
  suppliers,
  onAddPurchase,
  onDeletePurchase,
}: PurchaseManagerProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    quantity: '',
    costPrice: '',
    shippingPrice: '0',
    date: new Date().toISOString().split('T')[0],
    supplierId: '',
  });

  const filteredPurchases = purchases.filter((p) =>
    p.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.supplierId && suppliers.find(s => s.id === p.supplierId)?.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const product = products.find(p => p.id === formData.productId);
    if (!product) return;

    setIsSubmitting(true);
    try {
      const quantity = Number(formData.quantity);
      const costPrice = Number(formData.costPrice);
      const shippingPrice = Number(formData.shippingPrice || 0);
      const totalAmount = (costPrice + shippingPrice) * quantity;

      await onAddPurchase({
        productId: product.id,
        productName: product.name,
        quantity,
        costPrice,
        shippingPrice,
        totalAmount,
        date: formData.date,
        supplierId: formData.supplierId,
      });

      setIsDialogOpen(false);
      setFormData({
        productId: '',
        quantity: '',
        costPrice: '',
        shippingPrice: '0',
        date: new Date().toISOString().split('T')[0],
        supplierId: '',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProductChange = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (product) {
      setFormData({
        ...formData,
        productId,
        costPrice: product.costPrice.toString(),
        shippingPrice: (product.shippingPrice || 0).toString(),
        supplierId: product.supplierId || '',
      });
    } else {
      setFormData({ ...formData, productId });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search purchases..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" /> New Purchase (Restock)
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Total Purchase Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(purchases.reduce((acc, p) => acc + p.totalAmount, 0))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Total Items Bought</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">
              {purchases.reduce((acc, p) => acc + p.quantity, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-900">{purchases.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-blue-500" />
            Purchase History (Restocks)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Cost</TableHead>
                  <TableHead>Shipping</TableHead>
                  <TableHead>Total Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchases.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-zinc-500">
                      No purchase records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPurchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3 w-3 text-zinc-400" />
                          {new Date(purchase.date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Package className="h-3 w-3 text-zinc-400" />
                          {purchase.productName}
                        </div>
                      </TableCell>
                      <TableCell>
                        {purchase.supplierId ? (
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3 text-zinc-400" />
                            {suppliers.find(s => s.id === purchase.supplierId)?.name || 'Unknown'}
                          </div>
                        ) : (
                          <span className="text-zinc-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{purchase.quantity} units</Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(purchase.costPrice)}</TableCell>
                      <TableCell>{formatCurrency(purchase.shippingPrice)}</TableCell>
                      <TableCell className="font-bold text-blue-600">
                        {formatCurrency(purchase.totalAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => onDeletePurchase(purchase.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-blue-500" />
              Record New Purchase
            </DialogTitle>
            <DialogClose onClick={() => setIsDialogOpen(false)} />
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="productId">Select Product</Label>
              <Select
                id="productId"
                required
                value={formData.productId}
                onChange={(e) => handleProductChange(e.target.value)}
              >
                <option value="">Choose a product...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  required
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Purchase Date</Label>
                <Input
                  id="date"
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="costPrice">Unit Cost (MMK)</Label>
                <Input
                  id="costPrice"
                  type="number"
                  required
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shippingPrice">Shipping Fee (MMK)</Label>
                <Input
                  id="shippingPrice"
                  type="number"
                  required
                  value={formData.shippingPrice}
                  onChange={(e) => setFormData({ ...formData, shippingPrice: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="supplierId">Supplier (Optional)</Label>
              <Select
                id="supplierId"
                value={formData.supplierId}
                onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
              >
                <option value="">Select Supplier</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-blue-600">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-sm font-medium">Total Amount:</span>
                </div>
                <span className="text-xl font-bold text-blue-700">
                  {formatCurrency((Number(formData.costPrice || 0) + Number(formData.shippingPrice || 0)) * Number(formData.quantity || 0))}
                </span>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white">
                {isSubmitting ? 'Processing...' : 'Confirm Purchase'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
