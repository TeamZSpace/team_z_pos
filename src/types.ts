export interface Supplier {
  id: string;
  name: string;
  phone: string;
}

export interface Category {
  id: string;
  name: string;
  parentId?: string; // If present, this is a subcategory
}

export interface Product {
  id: string;
  name: string;
  category: string;
  subCategory?: string;
  costPrice: number;
  shippingPrice: number;
  sellingPrice: number;
  stock: number;
  madeIn?: string;
  supplierId?: string;
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  totalRevenue: number;
  totalCost: number;
}

export interface Customer {
  id: string;
  facebookName: string;
  orderName: string;
  phone: string;
  address: string;
}

export interface Sale {
  id: string;
  orderNumber: string;
  items: SaleItem[];
  customer: {
    facebookName: string;
    orderName: string;
    phone: string;
    address: string;
    paymentMethod: string;
  };
  totalRevenue: number;
  totalCost: number;
  date: string;
  paymentVoucherUrl?: string;
}

export type ExpenseType = 
  | 'Packaging' 
  | 'Deliveries' 
  | 'Salaries' 
  | 'Rent' 
  | 'Utilities' 
  | 'Stationery' 
  | 'Marketing'
  | 'Other';

export interface Expense {
  id: string;
  type: ExpenseType;
  amount: number;
  description: string;
  date: string;
  voucherUrl?: string; // Base64 or URL
}

export interface DashboardStats {
  totalRevenue: number;
  totalCOGS: number;
  totalExpenses: number;
  netProfit: number;
}

export interface MonthlyReport {
  month: string;
  totalRevenue: number;
  totalExpenses: number;
  totalCOGS: number;
  netProfit: number;
}
