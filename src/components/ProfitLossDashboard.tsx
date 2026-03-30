import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card';
import { formatCurrency } from '../lib/utils';
import { DashboardStats, MonthlyReport } from '../types';
import { TrendingUp, TrendingDown, DollarSign, ShoppingCart, CreditCard, Calendar, FileText, Package } from 'lucide-react';
import { Select } from './ui/Select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from './ui/Table';
import { cn } from '../lib/utils';

interface ProfitLossDashboardProps {
  stats: DashboardStats;
  selectedMonth: string;
  onMonthChange: (month: string) => void;
  monthlyReports: MonthlyReport[];
}

export const ProfitLossDashboard = ({ stats, selectedMonth, onMonthChange, monthlyReports }: ProfitLossDashboardProps) => {
  const data = [
    { name: 'Revenue', value: stats.totalRevenue, color: '#10b981' },
    { name: 'Purchases', value: stats.totalPurchase, color: '#3b82f6' },
    { name: 'COGS', value: stats.totalCOGS, color: '#f59e0b' },
    { name: 'Expenses', value: stats.totalExpenses, color: '#ef4444' },
    { name: 'Net Profit', value: stats.netProfit, color: '#8b5cf6' },
    { name: 'Rem. Cash', value: stats.netCash, color: '#0ea5e9' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-bold tracking-tight">Financial Overview</h2>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-zinc-400" />
          <Select 
            value={selectedMonth} 
            onChange={(e) => onMonthChange(e.target.value)}
            className="w-[160px] h-9 text-xs rounded-lg"
          >
            <option value="all">All Time</option>
            {/* Generate last 12 months */}
            {Array.from({ length: 12 }).map((_, i) => {
              const d = new Date();
              d.setDate(1); 
              d.setMonth(d.getMonth() - i);
              const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
              const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
              return <option key={value} value={value}>{label}</option>;
            })}
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-sm border-zinc-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-zinc-900" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-black text-zinc-900">{formatCurrency(stats.totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-zinc-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">COGS</CardTitle>
            <ShoppingCart className="h-4 w-4 text-zinc-900" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-black text-zinc-900">{formatCurrency(stats.totalCOGS)}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-zinc-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Expenses</CardTitle>
            <CreditCard className="h-4 w-4 text-zinc-900" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-black text-zinc-900">{formatCurrency(stats.totalExpenses)}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-zinc-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Purchases</CardTitle>
            <Package className="h-4 w-4 text-zinc-900" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-black text-zinc-900">{formatCurrency(stats.totalPurchase)}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-zinc-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Net Profit</CardTitle>
            {stats.netProfit >= 0 ? (
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={cn("text-xl font-black", stats.netProfit >= 0 ? "text-emerald-600" : "text-red-600")}>
              {formatCurrency(stats.netProfit)}
            </div>
            <p className="text-[9px] font-medium text-zinc-400 mt-1 uppercase tracking-tighter">Revenue - (COGS + Expenses)</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-zinc-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1">
            <CardTitle className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Net Cash</CardTitle>
            {stats.netCash >= 0 ? (
              <DollarSign className="h-4 w-4 text-zinc-900" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={cn("text-xl font-black", stats.netCash >= 0 ? "text-zinc-900" : "text-red-600")}>
              {formatCurrency(stats.netCash)}
            </div>
            <p className="text-[9px] font-medium text-zinc-400 mt-1 uppercase tracking-tighter">Revenue - (Purchases + Expenses)</p>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-zinc-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-zinc-900">Performance Chart</CardTitle>
        </CardHeader>
        <CardContent className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 600, fill: '#a1a1aa' }} 
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 600, fill: '#a1a1aa' }}
                tickFormatter={(value) => `K${value / 1000}k`} 
              />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                labelStyle={{ fontWeight: 700, fontSize: '12px', marginBottom: '4px' }}
                itemStyle={{ fontSize: '12px', fontWeight: 600 }}
                formatter={(value: number) => [formatCurrency(value), '']}
                cursor={{ fill: 'rgba(0,0,0,0.02)' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={32}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-zinc-200">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-zinc-900">Monthly Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-zinc-100">
                  <TableHead className="text-[10px] font-bold uppercase text-zinc-400">Month</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-zinc-400">Revenue</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-zinc-400">COGS</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-zinc-400">Expenses</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase text-zinc-400">Profit</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-zinc-400 text-xs">
                      No data available
                    </TableCell>
                  </TableRow>
                ) : (
                  monthlyReports.map((report) => {
                    const [year, month] = report.month.split('-');
                    const date = new Date(parseInt(year), parseInt(month) - 1);
                    const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                    
                    return (
                      <TableRow key={report.month} className="border-zinc-50 hover:bg-zinc-50/50 transition-colors">
                        <TableCell className="text-xs font-semibold text-zinc-900">{monthLabel}</TableCell>
                        <TableCell className="text-xs font-medium text-zinc-600">{formatCurrency(report.totalRevenue)}</TableCell>
                        <TableCell className="text-xs font-medium text-zinc-600">{formatCurrency(report.totalCOGS)}</TableCell>
                        <TableCell className="text-xs font-medium text-zinc-600">{formatCurrency(report.totalExpenses)}</TableCell>
                        <TableCell className={cn(
                          "text-xs font-bold",
                          report.netProfit >= 0 ? "text-emerald-600" : "text-red-600"
                        )}>
                          {formatCurrency(report.netProfit)}
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
    </div>
  );
};

// Removed duplicate imports at the end
