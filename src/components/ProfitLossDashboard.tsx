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
        <h2 className="text-2xl font-bold tracking-tight">Financial Report</h2>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-zinc-500" />
          <Select 
            value={selectedMonth} 
            onChange={(e) => onMonthChange(e.target.value)}
            className="w-[180px]"
          >
            <option value="all">All Time</option>
            {/* Generate last 12 months */}
            {Array.from({ length: 12 }).map((_, i) => {
              const d = new Date();
              d.setDate(1); // Set to 1st to avoid month overflow (e.g., March 31 -> Feb 28)
              d.setMonth(d.getMonth() - i);
              const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
              const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
              return <option key={value} value={value}>{label}</option>;
            })}
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Total COGS</CardTitle>
            <ShoppingCart className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalCOGS)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Total Expenses</CardTitle>
            <CreditCard className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalExpenses)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Total Purchases</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalPurchase)}</div>
          </CardContent>
        </Card>
        <Card className={stats.netProfit >= 0 ? 'border-emerald-100 bg-emerald-50/30' : 'border-red-100 bg-red-50/30'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Net Profit (Accounting)</CardTitle>
            {stats.netProfit >= 0 ? (
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", stats.netProfit >= 0 ? "text-emerald-600" : "text-red-600")}>
              {formatCurrency(stats.netProfit)}
            </div>
            <p className="text-[10px] text-zinc-400 mt-1">Revenue - (COGS + Expenses)</p>
          </CardContent>
        </Card>
        <Card className={stats.netCash >= 0 ? 'border-blue-100 bg-blue-50/30' : 'border-red-100 bg-red-50/30'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Remaining Cash (Actual)</CardTitle>
            {stats.netCash >= 0 ? (
              <DollarSign className="h-4 w-4 text-blue-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", stats.netCash >= 0 ? "text-blue-600" : "text-red-600")}>
              {formatCurrency(stats.netCash)}
            </div>
            <p className="text-[10px] text-zinc-400 mt-1">Revenue - (Purchases + Expenses)</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Financial Overview</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis tickFormatter={(value) => `K${value / 1000}k`} />
              <Tooltip
                formatter={(value: number) => [formatCurrency(value), '']}
                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-zinc-600" />
            Monthly Financial Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead>Total Revenue</TableHead>
                  <TableHead>Total Purchases</TableHead>
                  <TableHead>Total COGS</TableHead>
                  <TableHead>Total Expenses</TableHead>
                  <TableHead>Net Profit</TableHead>
                  <TableHead>Rem. Cash</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthlyReports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-zinc-500">
                      No reports available yet
                    </TableCell>
                  </TableRow>
                ) : (
                  monthlyReports.map((report) => {
                    const [year, month] = report.month.split('-');
                    const date = new Date(parseInt(year), parseInt(month) - 1);
                    const monthLabel = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                    
                    return (
                      <TableRow key={report.month}>
                        <TableCell className="font-medium">{monthLabel}</TableCell>
                        <TableCell className="text-emerald-600">{formatCurrency(report.totalRevenue)}</TableCell>
                        <TableCell className="text-blue-600">{formatCurrency(report.totalPurchase)}</TableCell>
                        <TableCell className="text-amber-600">{formatCurrency(report.totalCOGS)}</TableCell>
                        <TableCell className="text-red-600">{formatCurrency(report.totalExpenses)}</TableCell>
                        <TableCell className={cn(
                          "font-bold",
                          report.netProfit >= 0 ? "text-emerald-700" : "text-red-700"
                        )}>
                          {formatCurrency(report.netProfit)}
                        </TableCell>
                        <TableCell className={cn(
                          "font-bold",
                          report.netCash >= 0 ? "text-blue-700" : "text-red-700"
                        )}>
                          {formatCurrency(report.netCash)}
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
