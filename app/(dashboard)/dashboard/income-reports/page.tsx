'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  Download,
  DollarSign,
  PieChart,
  BarChart3,
  Calendar,
  Filter
} from 'lucide-react';
import useSWR from 'swr';
import { PAYMENT_CATEGORY_OPTIONS, getCategoryConfig, PaymentCategory } from '@/lib/constants/payment-categories';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function IncomeReportsPage() {
  const [dateFilter, setDateFilter] = useState('current-year');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  const { data: payments, isLoading: paymentsLoading } = useSWR('/api/payments', fetcher);
  const safePayments = Array.isArray(payments) ? payments : [];

  // Filter payments based on selected filters
  const filteredPayments = safePayments.filter((payment: any) => {
    const paymentDate = new Date(payment.created_at);
    const currentYear = new Date().getFullYear();
    
    // Date filter
    let dateMatch = true;
    if (dateFilter === 'current-year') {
      dateMatch = paymentDate.getFullYear() === currentYear;
    } else if (dateFilter === 'last-year') {
      dateMatch = paymentDate.getFullYear() === currentYear - 1;
    } else if (dateFilter === 'current-month') {
      const currentMonth = new Date().getMonth();
      dateMatch = paymentDate.getFullYear() === currentYear && paymentDate.getMonth() === currentMonth;
    }
    
    // Category filter
    const categoryMatch = categoryFilter === 'all' || payment.category === categoryFilter;
    
    return dateMatch && categoryMatch;
  });

  // Calculate summary statistics
  const totalIncome = filteredPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  const paymentCount = filteredPayments.length;
  const averagePayment = paymentCount > 0 ? totalIncome / paymentCount : 0;

  // Group by category
  const incomeByCategory = filteredPayments.reduce((acc: any, payment: any) => {
    const category = payment.category || 'other';
    if (!acc[category]) {
      acc[category] = { total: 0, count: 0, payments: [] };
    }
    acc[category].total += payment.amount || 0;
    acc[category].count += 1;
    acc[category].payments.push(payment);
    return acc;
  }, {});

  // Group by month for trend analysis
  const incomeByMonth = filteredPayments.reduce((acc: any, payment: any) => {
    const month = new Date(payment.created_at).toLocaleString('default', { month: 'short', year: 'numeric' });
    if (!acc[month]) {
      acc[month] = 0;
    }
    acc[month] += payment.amount || 0;
    return acc;
  }, {});

  if (paymentsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Income Reports</h1>
        </div>
        <div className="grid gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-32 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Income Reports</h1>
          <p className="text-gray-600">Track and analyze all income sources</p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="all-time">All Time</option>
                <option value="current-year">Current Year</option>
                <option value="last-year">Last Year</option>
                <option value="current-month">Current Month</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="all">All Categories</option>
                {PAYMENT_CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">PHP {totalIncome.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{paymentCount} payments
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Count</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{paymentCount}</div>
            <p className="text-xs text-muted-foreground">
              Total transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Payment</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">PHP {averagePayment.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Per transaction
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Income by Category */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <PieChart className="mr-2 h-5 w-5" />
            Income by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(incomeByCategory).map(([category, data]: [string, any]) => {
              const config = getCategoryConfig(category as PaymentCategory);
              const percentage = totalIncome > 0 ? (data.total / totalIncome) * 100 : 0;
              
              return (
                <div key={category} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full bg-${config.color}-500`}></div>
                    <div>
                      <p className="font-medium">{config.label}</p>
                      <p className="text-sm text-gray-600">{data.count} payments</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">PHP {data.total.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">{percentage.toFixed(1)}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Monthly Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Monthly Income Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-end space-x-2">
            {Object.entries(incomeByMonth).map(([month, amount]: [string, any]) => {
              const maxAmount = Math.max(...Object.values(incomeByMonth) as number[]);
              const height = maxAmount > 0 ? (amount / maxAmount) * 200 : 0;
              
              return (
                <div key={month} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-blue-500 rounded-t min-h-[20px]"
                    style={{ height: `${height}px` }}
                  ></div>
                  <div className="mt-2 text-xs text-gray-600 text-center">{month}</div>
                  <div className="text-xs font-medium text-center">PHP {amount.toLocaleString()}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Payments */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredPayments.slice(0, 10).map((payment: any) => {
              const config = getCategoryConfig(payment.category as PaymentCategory);
              return (
                <div key={payment.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full bg-${config.color}-500`}></div>
                    <div>
                      <p className="font-medium">{payment.parent?.name || 'Unknown'}</p>
                      <p className="text-sm text-gray-600">{config.label}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">PHP {payment.amount?.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}