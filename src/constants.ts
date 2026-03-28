import { Account } from './types';

export const EXPENSE_TYPES = [
  'Packaging',
  'Deliveries',
  'Salaries',
  'Rent',
  'Utilities',
  'Stationery',
  'Marketing',
  'Other'
] as const;

export const DEFAULT_CATEGORIES = ['Supplements', 'Skincare', 'Other'] as const;

export const PAYMENT_METHODS = ['KPay', 'WavePay', 'AYA Pay', 'UAB Pay', 'Bank Transfer', 'Cash on Delivery'] as const;

export const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'acc_cash', name: 'Cash', type: 'asset', code: '1000' },
  { id: 'acc_ar', name: 'Accounts Receivable', type: 'asset', code: '1100' },
  { id: 'acc_inventory', name: 'Inventory', type: 'asset', code: '1200' },
  { id: 'acc_ap', name: 'Accounts Payable', type: 'liability', code: '2000' },
  { id: 'acc_equity', name: 'Owner Equity', type: 'equity', code: '3000' },
  { id: 'acc_revenue', name: 'Sales Revenue', type: 'revenue', code: '4000' },
  { id: 'acc_expense', name: 'Operating Expense', type: 'expense', code: '5000' },
];
