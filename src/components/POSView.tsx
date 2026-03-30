import React, { useState, useMemo } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  User, 
  CreditCard, 
  ChevronRight,
  Package,
  Image as ImageIcon,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Badge } from './ui/Badge';
import { Product, Sale, SaleItem } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface POSViewProps {
  products: Product[];
  onAddSale: (sale: Omit<Sale, 'id' | 'orderNumber'>) => Promise<void>;
  sales: Sale[];
}

export const POSView = ({ products, onAddSale, sales }: POSViewProps) => {
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('KPay');

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return ['All', ...Array.from(cats)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.sku?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return;
    
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id);
      if (existing) {
        return prev.map(item => 
          item.productId === product.id 
            ? { 
                ...item, 
                quantity: item.quantity + 1,
                totalRevenue: (item.quantity + 1) * item.unitPrice,
                totalCost: (item.quantity + 1) * item.unitCost
              }
            : item
        );
      }
      const landedCost = product.costPrice + (product.shippingPrice || 0);
      return [...prev, {
        productId: product.id,
        productName: product.name,
        quantity: 1,
        unitPrice: product.sellingPrice,
        unitCost: landedCost,
        totalRevenue: product.sellingPrice,
        totalCost: landedCost
      }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(0, item.quantity + delta);
        if (newQty === 0) return null;
        return {
          ...item,
          quantity: newQty,
          totalRevenue: newQty * item.unitPrice,
          totalCost: newQty * item.unitCost
        };
      }
      return item;
    }).filter(Boolean) as SaleItem[]);
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const subtotal = cart.reduce((acc, item) => acc + item.totalRevenue, 0);
  const tax = subtotal * 0.05; // 5% tax example
  const total = subtotal + tax;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    
    const saleData = {
      items: cart,
      customer: {
        orderName: customerName || 'Walk-in Customer',
        paymentMethod,
        saleDate: new Date().toISOString().split('T')[0],
      },
      totalRevenue: subtotal,
      totalCost: cart.reduce((acc, item) => acc + item.totalCost, 0),
      date: new Date().toISOString(),
    };

    await onAddSale(saleData as any);
    setCart([]);
    setCustomerName('');
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden bg-zinc-50">
      {/* Middle Section: Product Grid */}
      <div className="flex-1 flex flex-col min-w-0 p-4 lg:p-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <Input 
              placeholder="Search products..." 
              className="pl-10 h-10 bg-white border-zinc-200 rounded-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-hide">
            {categories.map(cat => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'primary' : 'secondary'}
                className={cn(
                  "whitespace-nowrap rounded-lg px-4 h-9 text-xs font-bold uppercase tracking-wider transition-all",
                  selectedCategory === cat ? "bg-zinc-900 text-white shadow-sm" : "bg-white text-zinc-400 border border-zinc-200 hover:text-zinc-900"
                )}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide">
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {filteredProducts.map(product => (
              <motion.div
                key={product.id}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <Card 
                  className={cn(
                    "group cursor-pointer overflow-hidden border-zinc-200 hover:border-zinc-900 transition-all duration-200 rounded-xl shadow-sm bg-white",
                    product.stock <= 0 && "opacity-60 grayscale"
                  )}
                  onClick={() => addToCart(product)}
                >
                  <div className="aspect-square relative bg-zinc-50 flex items-center justify-center overflow-hidden border-b border-zinc-100">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-zinc-200" />
                    )}
                    {product.stock <= 5 && product.stock > 0 && (
                      <Badge className="absolute top-2 right-2 bg-zinc-900 text-white border-none text-[9px] font-bold uppercase tracking-tighter px-1.5 py-0.5">
                        Low Stock
                      </Badge>
                    )}
                    {product.stock <= 0 && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                        <span className="text-zinc-900 font-bold text-[9px] uppercase tracking-widest">Sold Out</span>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-bold text-zinc-900 truncate mb-1 text-xs uppercase tracking-tight">{product.name}</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-900 font-bold text-xs">{formatCurrency(product.sellingPrice)}</span>
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-tighter">
                        Stock: {product.stock}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
          {filteredProducts.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-zinc-400 py-20">
              <Package className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-sm font-medium">No products found</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar: Cart/Checkout */}
      <aside className="w-80 lg:w-96 bg-white border-l border-zinc-200 flex flex-col shadow-sm">
        <div className="p-6 border-b border-zinc-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-zinc-900" />
              Cart
            </h2>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider bg-zinc-100 px-2 py-0.5 rounded-full">
              {cart.reduce((acc, item) => acc + item.quantity, 0)} Items
            </span>
          </div>
          
          <div className="space-y-3">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-300" />
              <Input 
                placeholder="Customer Name" 
                className="pl-9 h-9 rounded-lg text-xs"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {['KPay', 'Wave', 'Cash'].map(method => (
                <Button
                  key={method}
                  variant={paymentMethod === method ? 'primary' : 'secondary'}
                  size="sm"
                  className={cn(
                    "rounded-lg h-8 text-[10px] font-bold uppercase tracking-wider transition-all",
                    paymentMethod === method ? "bg-zinc-900 text-white" : "bg-white text-zinc-400 border border-zinc-200"
                  )}
                  onClick={() => setPaymentMethod(method)}
                >
                  {method}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide">
          <AnimatePresence mode="popLayout">
            {cart.map(item => (
              <motion.div
                key={item.productId}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-100 group"
              >
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-xs truncate text-zinc-900">{item.productName}</h4>
                  <p className="text-zinc-500 font-medium text-[10px]">{formatCurrency(item.unitPrice)}</p>
                </div>
                <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-zinc-100">
                  <button 
                    onClick={() => updateQuantity(item.productId, -1)}
                    className="p-1 hover:bg-zinc-50 rounded-md transition-colors text-zinc-400 hover:text-zinc-900"
                  >
                    <Minus className="h-2.5 w-2.5" />
                  </button>
                  <span className="text-[10px] font-bold w-4 text-center text-zinc-900">{item.quantity}</span>
                  <button 
                    onClick={() => updateQuantity(item.productId, 1)}
                    className="p-1 hover:bg-zinc-50 rounded-md transition-colors text-zinc-400 hover:text-zinc-900"
                  >
                    <Plus className="h-2.5 w-2.5" />
                  </button>
                </div>
                <button 
                  onClick={() => removeFromCart(item.productId)}
                  className="p-1.5 text-zinc-300 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
          {cart.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-zinc-300 py-10">
              <ShoppingCart className="h-10 w-10 mb-2 opacity-20" />
              <p className="text-xs font-medium">Cart is empty</p>
            </div>
          )}
        </div>

        <div className="p-6 bg-zinc-50 border-t border-zinc-200 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              <span>Subtotal</span>
              <span className="text-zinc-900">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              <span>Tax (5%)</span>
              <span className="text-zinc-900">{formatCurrency(tax)}</span>
            </div>
            <div className="pt-3 border-t border-zinc-200 flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-widest text-zinc-900">Total</span>
              <span className="text-xl font-black text-zinc-900">{formatCurrency(total)}</span>
            </div>
          </div>
          
          <Button 
            className="w-full h-11 text-xs font-bold uppercase tracking-widest rounded-xl shadow-sm" 
            variant="primary"
            disabled={cart.length === 0}
            onClick={handleCheckout}
          >
            Checkout
            <ChevronRight className="ml-2 h-3.5 w-3.5" />
          </Button>
        </div>
      </aside>
    </div>
  );
};
