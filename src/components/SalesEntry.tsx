import React, { useState } from 'react';
import { ShoppingCart, Plus, Trash2, User, Phone, MapPin, Facebook, CreditCard, Package, Pencil, ImageIcon, FileText, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Label } from './ui/Label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/Table';
import { Product, Sale, SaleItem } from '../types';
import { formatCurrency, cn, convertMyanmarToEnglish } from '../lib/utils';
import { PAYMENT_METHODS } from '../constants';

interface SalesEntryProps {
  products: Product[];
  onAddSale: (sale: Omit<Sale, 'id' | 'orderNumber'>) => Promise<void>;
  onUpdateSale: (id: string, sale: Omit<Sale, 'id' | 'orderNumber'>) => Promise<void>;
  onDeleteSale: (id: string) => Promise<void>;
  sales: Sale[];
}

export const SalesEntry = ({ products, onAddSale, onUpdateSale, onDeleteSale, sales }: SalesEntryProps) => {
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [currentItems, setCurrentItems] = useState<SaleItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [customerInfo, setCustomerInfo] = useState({
    facebookName: '',
    orderName: '',
    phone: '',
    address: '',
    paymentMethod: 'KPay',
    saleDate: new Date().toISOString().split('T')[0],
    deliveryDate: '',
  });

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const handleAddItem = () => {
    if (!selectedProduct) return;
    const qty = Number(quantity);
    
    if (qty <= 0) return;
    
    const existingItemIndex = currentItems.findIndex(item => item.productId === selectedProductId);
    
    if (existingItemIndex > -1) {
      const updatedItems = [...currentItems];
      updatedItems[existingItemIndex].quantity += qty;
      updatedItems[existingItemIndex].totalRevenue = updatedItems[existingItemIndex].quantity * updatedItems[existingItemIndex].unitPrice;
      updatedItems[existingItemIndex].totalCost = updatedItems[existingItemIndex].quantity * updatedItems[existingItemIndex].unitCost;
      setCurrentItems(updatedItems);
    } else {
      const landedCost = selectedProduct.costPrice + (selectedProduct.shippingPrice || 0);
      const newItem: SaleItem = {
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        quantity: qty,
        unitPrice: selectedProduct.sellingPrice,
        unitCost: landedCost,
        totalRevenue: qty * selectedProduct.sellingPrice,
        totalCost: qty * landedCost,
      };
      setCurrentItems([...currentItems, newItem]);
    }

    setSelectedProductId('');
    setQuantity('1');
  };

  const handleRemoveItem = (index: number) => {
    setCurrentItems(currentItems.filter((_, i) => i !== index));
  };

  const totalRevenue = currentItems.reduce((acc, item) => acc + item.totalRevenue, 0);
  const totalCost = currentItems.reduce((acc, item) => acc + item.totalCost, 0);

  const handleSubmitSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentItems.length === 0) return;

    const saleData = {
      items: currentItems,
      customer: customerInfo,
      totalRevenue,
      totalCost,
      date: new Date().toISOString(),
      saleDate: customerInfo.saleDate,
      deliveryDate: customerInfo.deliveryDate,
    };

    if (editingSaleId) {
      await onUpdateSale(editingSaleId, saleData);
      setEditingSaleId(null);
    } else {
      await onAddSale(saleData);
    }

    // Reset form
    setCurrentItems([]);
    setCustomerInfo({
      facebookName: '',
      orderName: '',
      phone: '',
      address: '',
      paymentMethod: 'KPay',
      saleDate: new Date().toISOString().split('T')[0],
      deliveryDate: '',
    });
  };

  const handleEditSale = (sale: Sale) => {
    setEditingSaleId(sale.id);
    setCustomerInfo({
      facebookName: sale.customer.facebookName,
      orderName: sale.customer.orderName,
      phone: sale.customer.phone,
      address: sale.customer.address,
      paymentMethod: sale.customer.paymentMethod || 'KPay',
      saleDate: sale.saleDate || new Date(sale.date).toISOString().split('T')[0],
      deliveryDate: sale.deliveryDate || '',
    });
    setCurrentItems(sale.items || []);
    // Scroll to top to see the form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredSales = sales.filter(sale => {
    const searchLower = searchQuery.toLowerCase();
    return (
      sale.orderNumber?.toLowerCase().includes(searchLower) ||
      sale.customer?.orderName?.toLowerCase().includes(searchLower) ||
      sale.customer?.facebookName?.toLowerCase().includes(searchLower) ||
      sale.customer?.phone?.includes(searchLower) ||
      sale.items?.some(item => item.productName.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Customer Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Customer Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="facebookName">Facebook Name</Label>
                <div className="relative">
                  <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input
                    id="facebookName"
                    className="pl-9"
                    placeholder="FB Name"
                    value={customerInfo.facebookName}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, facebookName: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="orderName">Order Name</Label>
                <Input
                  id="orderName"
                  placeholder="Real Name"
                  value={customerInfo.orderName}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, orderName: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Input
                    id="phone"
                    className="pl-9"
                    placeholder="09..."
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, phone: convertMyanmarToEnglish(e.target.value) })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <Select
                    id="paymentMethod"
                    className="pl-9"
                    value={customerInfo.paymentMethod}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, paymentMethod: e.target.value })}
                  >
                    {PAYMENT_METHODS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </Select>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="saleDate">Sale Date</Label>
                <Input
                  id="saleDate"
                  type="date"
                  value={customerInfo.saleDate}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, saleDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryDate">Delivery Date</Label>
                <Input
                  id="deliveryDate"
                  type="date"
                  value={customerInfo.deliveryDate}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, deliveryDate: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-zinc-400" />
                <textarea
                  id="address"
                  className="w-full min-h-[80px] pl-9 pr-3 py-2 rounded-md border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900 focus:border-transparent text-sm"
                  placeholder="Delivery Address"
                  value={customerInfo.address}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Items */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Add Items to Order
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="product">Select Product</Label>
              <Select
                id="product"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
              >
                <option value="">Select a product...</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id} disabled={p.stock <= 0}>
                    {p.name} ({p.stock} in stock) - {formatCurrency(p.sellingPrice)}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex gap-4 items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>
              <Button type="button" onClick={handleAddItem} disabled={!selectedProductId}>
                <Plus className="h-4 w-4 mr-2" /> Add Item
              </Button>
            </div>

            <div className="mt-6 border-t border-zinc-100 pt-4">
              <h4 className="text-sm font-semibold mb-3">Order Items</h4>
              <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                {currentItems.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-zinc-50 rounded-lg text-sm">
                    <div className="flex flex-col">
                      <span className="font-medium">{item.productName}</span>
                      <span className="text-xs text-zinc-500">
                        {item.quantity} x {formatCurrency(item.unitPrice)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold">{formatCurrency(item.totalRevenue)}</span>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-red-500"
                        onClick={() => handleRemoveItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {currentItems.length === 0 && (
                  <p className="py-4 text-zinc-400 text-xs italic">No items added yet</p>
                )}
              </div>
              
              {currentItems.length > 0 && (
                <div className="mt-4 p-3 bg-emerald-50 rounded-lg flex justify-between items-center">
                  <span className="text-sm font-medium text-emerald-800">Total Order Amount:</span>
                  <span className="text-lg font-bold text-emerald-700">{formatCurrency(totalRevenue)}</span>
                </div>
              )}
            </div>
            
            <Button 
              className="w-full mt-4" 
              size="lg"
              disabled={currentItems.length === 0}
              onClick={handleSubmitSale}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {editingSaleId ? 'Update Order' : 'Complete Order'}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Recent Orders</CardTitle>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input
              placeholder="Search orders..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order #</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Delivery Date</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-zinc-500">
                      {searchQuery ? 'No orders match your search.' : 'No orders recorded yet.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSales.slice(0, 20).map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-mono text-xs font-bold">{sale.orderNumber || 'N/A'}</TableCell>
                      <TableCell className="text-xs text-zinc-500">
                        {sale.saleDate ? new Date(sale.saleDate).toLocaleDateString() : new Date(sale.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{sale.customer?.orderName || 'Legacy Order'}</span>
                          <span className="text-[10px] text-zinc-400">{sale.customer?.phone || 'No Phone'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {sale.items ? (
                            sale.items.map((item, i) => (
                              <span key={i} className="text-xs">
                                {item.productName} (x{item.quantity})
                              </span>
                            ))
                          ) : (
                            <span className="text-xs">
                              {(sale as any).productName} (x{(sale as any).quantity})
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs max-w-[150px] truncate" title={sale.customer?.address}>
                        {sale.customer?.address || '-'}
                      </TableCell>
                      <TableCell className="text-xs">
                        {sale.deliveryDate ? new Date(sale.deliveryDate).toLocaleDateString() : '-'}
                      </TableCell>
                      <TableCell className="font-bold text-emerald-600">
                        {formatCurrency(sale.totalRevenue)}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-center gap-2">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleEditSale(sale)}
                            title="Edit Order (Copy to Form)"
                          >
                            <Pencil className="h-4 w-4 text-zinc-500" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => onDeleteSale(sale.id)}
                            className="text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
