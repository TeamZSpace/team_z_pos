import React, { useState } from 'react';
import { Plus, Search, Package, Trash2, Edit2, Info, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import { Badge } from './ui/Badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogFooter } from './ui/Dialog';
import { Label } from './ui/Label';
import { Select } from './ui/Select';
import { Product, Category, Supplier, Purchase } from '../types';
import { formatCurrency, cn } from '../lib/utils';

interface InventoryManagerProps {
  products: Product[];
  categories: Category[];
  suppliers: Supplier[];
  onAddProduct: (product: Omit<Product, 'id'>) => Promise<void>;
  onUpdateProduct: (id: string, product: Partial<Product>) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onRestock: (purchase: Omit<Purchase, 'id'>) => Promise<void>;
}

export const InventoryManager = ({
  products,
  categories,
  suppliers,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onRestock,
}: InventoryManagerProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRestockDialogOpen, setIsRestockDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    subCategory: '',
    costPrice: '',
    shippingPrice: '',
    sellingPrice: '',
    stock: '',
    madeIn: '',
    supplierId: '',
  });

  const [restockData, setRestockData] = useState({
    quantity: '',
    costPrice: '',
    shippingPrice: '',
    date: new Date().toISOString().split('T')[0],
  });

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.subCategory && p.subCategory.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: formData.name,
      category: formData.category || 'Other',
      subCategory: formData.subCategory,
      costPrice: Number(formData.costPrice),
      shippingPrice: Number(formData.shippingPrice || 0),
      sellingPrice: Number(formData.sellingPrice),
      stock: Number(formData.stock),
      madeIn: formData.madeIn,
      supplierId: formData.supplierId,
      createdAt: editingProduct?.createdAt || new Date().toISOString(),
    };

    if (editingProduct) {
      await onUpdateProduct(editingProduct.id, data);
    } else {
      await onAddProduct(data);
    }

    handleClose();
  };

  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockProduct || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const quantity = Number(restockData.quantity);
      const costPrice = Number(restockData.costPrice);
      const shippingPrice = Number(restockData.shippingPrice || 0);
      const totalAmount = (costPrice + shippingPrice) * quantity;

      await onRestock({
        productId: restockProduct.id,
        productName: restockProduct.name,
        quantity,
        costPrice,
        shippingPrice,
        totalAmount,
        date: restockData.date,
        supplierId: restockProduct.supplierId,
      });

      setIsRestockDialogOpen(false);
      setRestockProduct(null);
      setRestockData({
        quantity: '',
        costPrice: '',
        shippingPrice: '',
        date: new Date().toISOString().split('T')[0],
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      subCategory: product.subCategory || '',
      costPrice: product.costPrice.toString(),
      shippingPrice: (product.shippingPrice || 0).toString(),
      sellingPrice: product.sellingPrice.toString(),
      stock: product.stock.toString(),
      madeIn: product.madeIn || '',
      supplierId: product.supplierId || '',
    });
    setIsDialogOpen(true);
  };

  const handleClose = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
    setFormData({ 
      name: '', 
      category: '', 
      subCategory: '',
      costPrice: '', 
      shippingPrice: '', 
      sellingPrice: '', 
      stock: '',
      madeIn: '',
      supplierId: '',
    });
  };

  const calculateLandedCost = (cost: number, shipping: number) => cost + shipping;
  const calculateMargin = (selling: number, landed: number) => {
    if (selling === 0) return 0;
    return ((selling - landed) / selling) * 100;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <Input
            placeholder="Search products or categories..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" /> Add Product
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Inventory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Sub Category</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Made In</TableHead>
                  <TableHead>Landed Cost</TableHead>
                  <TableHead>Selling Price</TableHead>
                  <TableHead>Margin %</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-zinc-500">
                      No products found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product) => {
                    const landedCost = calculateLandedCost(product.costPrice, product.shippingPrice || 0);
                    const margin = calculateMargin(product.sellingPrice, landedCost);
                    
                    return (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{product.category}</Badge>
                        </TableCell>
                        <TableCell>
                          {product.subCategory ? (
                            <Badge variant="secondary" className="bg-zinc-100 text-zinc-600 border-zinc-200">
                              {product.subCategory}
                            </Badge>
                          ) : (
                            <span className="text-zinc-400 text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {product.supplierId ? (
                            <span className="text-xs font-medium">
                              {suppliers.find(s => s.id === product.supplierId)?.name || 'Unknown'}
                            </span>
                          ) : (
                            <span className="text-zinc-400 text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {product.madeIn ? (
                            <span className="text-xs">{product.madeIn}</span>
                          ) : (
                            <span className="text-zinc-400 text-xs">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col items-center">
                            <span>{formatCurrency(landedCost)}</span>
                            <span className="text-[10px] text-zinc-400">
                              Base: {formatCurrency(product.costPrice)} + Ship: {formatCurrency(product.shippingPrice || 0)}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{formatCurrency(product.sellingPrice)}</TableCell>
                        <TableCell>
                          <span className={cn(
                            "font-semibold",
                            margin > 30 ? "text-emerald-600" : margin > 15 ? "text-amber-600" : "text-red-600"
                          )}>
                            {margin.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell>{product.stock}</TableCell>
                        <TableCell>
                          {product.stock <= 5 ? (
                            <Badge variant="destructive">Low Stock</Badge>
                          ) : (
                            <Badge variant="success">In Stock</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              title="Restock / Purchase"
                              onClick={() => {
                                setRestockProduct(product);
                                setRestockData({
                                  quantity: '',
                                  costPrice: product.costPrice.toString(),
                                  shippingPrice: (product.shippingPrice || 0).toString(),
                                  date: new Date().toISOString().split('T')[0],
                                });
                                setIsRestockDialogOpen(true);
                              }}
                            >
                              <RefreshCw className="h-4 w-4 text-blue-500" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEdit(product)}>
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => onDeleteProduct(product.id)}>
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            <DialogClose onClick={handleClose} />
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Main Category</Label>
                <Select
                  id="category"
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value, subCategory: '' })}
                >
                  <option value="">Select Category</option>
                  {categories.filter(c => !c.parentId).map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subCategory">Sub Category</Label>
                <Select
                  id="subCategory"
                  value={formData.subCategory}
                  onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                  disabled={!formData.category}
                >
                  <option value="">None</option>
                  {formData.category && categories
                    .filter(c => {
                      const parent = categories.find(p => p.name === formData.category && !p.parentId);
                      return c.parentId === parent?.id;
                    })
                    .map(c => (
                      <option key={c.id} value={c.name}>{c.name}</option>
                    ))
                  }
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="madeIn">Made In</Label>
                <Input
                  id="madeIn"
                  placeholder="e.g. Thailand, China"
                  value={formData.madeIn}
                  onChange={(e) => setFormData({ ...formData, madeIn: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplierId">Supplier</Label>
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="costPrice">Cost Price (MMK)</Label>
                <Input
                  id="costPrice"
                  type="number"
                  required
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="shippingPrice">Shipping Fees (MMK)</Label>
                <Input
                  id="shippingPrice"
                  type="number"
                  required
                  value={formData.shippingPrice}
                  onChange={(e) => setFormData({ ...formData, shippingPrice: e.target.value })}
                />
              </div>
            </div>

            <div className="bg-zinc-50 p-3 rounded-lg flex items-center justify-between border border-zinc-200">
              <div className="flex items-center gap-2 text-zinc-600">
                <Info className="h-4 w-4" />
                <span className="text-sm font-medium">Landed Cost:</span>
              </div>
              <span className="font-bold text-zinc-900">
                {formatCurrency(Number(formData.costPrice || 0) + Number(formData.shippingPrice || 0))}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sellingPrice">Selling Price (MMK)</Label>
                <Input
                  id="sellingPrice"
                  type="number"
                  required
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Initial Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  required
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit">
                {editingProduct ? 'Update Product' : 'Add Product'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Restock Dialog */}
      <Dialog open={isRestockDialogOpen} onOpenChange={setIsRestockDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-blue-500" />
              Restock Product: {restockProduct?.name}
            </DialogTitle>
            <DialogClose onClick={() => setIsRestockDialogOpen(false)} />
          </DialogHeader>
          <form onSubmit={handleRestockSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="restock-quantity">Purchase Quantity</Label>
              <Input
                id="restock-quantity"
                type="number"
                required
                min="1"
                placeholder="How many units did you buy?"
                value={restockData.quantity}
                onChange={(e) => setRestockData({ ...restockData, quantity: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="restock-cost">Cost Price (MMK)</Label>
                <Input
                  id="restock-cost"
                  type="number"
                  required
                  value={restockData.costPrice}
                  onChange={(e) => setRestockData({ ...restockData, costPrice: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="restock-shipping">Shipping Fees (MMK)</Label>
                <Input
                  id="restock-shipping"
                  type="number"
                  required
                  value={restockData.shippingPrice}
                  onChange={(e) => setRestockData({ ...restockData, shippingPrice: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="restock-date">Purchase Date</Label>
              <Input
                id="restock-date"
                type="date"
                required
                value={restockData.date}
                onChange={(e) => setRestockData({ ...restockData, date: e.target.value })}
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-blue-600">Total Purchase Amount:</span>
                <span className="text-lg font-bold text-blue-700">
                  {formatCurrency((Number(restockData.costPrice || 0) + Number(restockData.shippingPrice || 0)) * Number(restockData.quantity || 0))}
                </span>
              </div>
              <p className="text-[10px] text-blue-500 italic">
                * This amount will be recorded as a cash outflow from your sales revenue.
              </p>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsRestockDialogOpen(false)}>
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
