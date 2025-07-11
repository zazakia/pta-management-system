'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Download,
  Calendar,
  DollarSign,
  Users,
  FileText
} from 'lucide-react';
import useSWR from 'swr';
import { PAYMENT_CATEGORY_OPTIONS, getCategoryConfig, PaymentCategory } from '@/lib/constants/payment-categories';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ReportsPage() {
  const { data: payments, isLoading: paymentsLoading } = useSWR('/api/payments', fetcher);
  const { data: parents, isLoading: parentsLoading } = useSWR('/api/parents', fetcher);
  const { data: students, isLoading: studentsLoading } = useSWR('/api/students', fetcher);

  const safePayments = Array.isArray(payments) ? payments : [];
  const safeParents = Array.isArray(parents) ? parents : [];
  const safeStudents = Array.isArray(students) ? students : [];

  const totalAmount = safePayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  const paidParents = safeParents.filter((p: any) => p.payment_status);
  const paymentRate = safeParents.length > 0 ? (paidParents.length / safeParents.length) * 100 : 0;

  // Monthly payment data for chart
  const monthlyData = safePayments.reduce((acc: any, payment: any) => {
    const month = new Date(payment.created_at).toLocaleString('default', { month: 'short' });
    acc[month] = (acc[month] || 0) + (payment.amount || 0);
    return acc;
  }, {});

  // Category breakdown
  const categoryData = safePayments.reduce((acc: any, payment: any) => {
    const category = payment.category || 'membership';
    if (!acc[category]) {
      acc[category] = { total: 0, count: 0 };
    }
    acc[category].total += payment.amount || 0;
    acc[category].count += 1;
    return acc;
  }, {});

  if (paymentsLoading || parentsLoading || studentsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Reports</h1>
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
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Financial reports and payment analytics</p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-full mr-4">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Collections</p>
                <p className="text-2xl font-bold">PHP {totalAmount.toLocaleString()}</p>
                <p className="text-xs text-green-600">+15% from last month</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-full mr-4">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Payment Rate</p>
                <p className="text-2xl font-bold">{Math.round(paymentRate)}%</p>
                <p className="text-xs text-blue-600">{paidParents.length}/{safeParents.length} parents</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-full mr-4">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Students</p>
                <p className="text-2xl font-bold">{safeStudents.length}</p>
                <p className="text-xs text-orange-600">Across all classes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-full mr-4">
                <FileText className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Average Payment</p>
                <p className="text-2xl font-bold">PHP {safePayments.length > 0 ? Math.round(totalAmount / safePayments.length) : 250}</p>
                <p className="text-xs text-purple-600">Per transaction</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Collections Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Monthly Collections
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(monthlyData).length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No payment data available</p>
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-end space-x-2">
                {Object.entries(monthlyData).map(([month, amount]: [string, any]) => (
                  <div key={month} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-blue-500 rounded-t min-h-[20px]"
                      style={{ height: `${(amount / Math.max(...Object.values(monthlyData).map(v => Number(v)))) * 200}px` }}
                    ></div>
                    <div className="mt-2 text-xs text-gray-600">{month}</div>
                    <div className="text-xs font-medium">PHP {amount}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Income by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="mr-2 h-5 w-5" />
              Income by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(categoryData).length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <PieChart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No payment data available</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(categoryData).map(([category, data]: [string, any]) => {
                  const config = getCategoryConfig(category as PaymentCategory);
                  const percentage = totalAmount > 0 ? (data.total / totalAmount) * 100 : 0;
                  
                  return (
                    <div key={category} className="flex items-center justify-between p-3 border rounded-lg">
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
            )}
          </CardContent>
        </Card>

        {/* Payment Status Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="mr-2 h-5 w-5" />
              Payment Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              {safeParents.length === 0 ? (
                <div className="text-center text-gray-500">
                  <PieChart className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No parent data available</p>
                </div>
              ) : (
                <div className="text-center">
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    <div 
                      className="absolute inset-0 rounded-full border-8 border-green-500"
                      style={{
                        background: `conic-gradient(
                          #10b981 0deg ${paymentRate * 3.6}deg,
                          #e5e7eb ${paymentRate * 3.6}deg 360deg
                        )`
                      }}
                    ></div>
                    <div className="absolute inset-4 bg-white rounded-full flex items-center justify-center">
                      <span className="text-xl font-bold">{Math.round(paymentRate)}%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span className="text-sm">Paid: {paidParents.length}</span>
                    </div>
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-3 h-3 bg-gray-300 rounded"></div>
                      <span className="text-sm">Unpaid: {safeParents.length - paidParents.length}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="mr-2 h-5 w-5" />
            Recent Payment Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {safePayments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No recent payment activity</p>
            </div>
          ) : (
            <div className="space-y-3">
              {safePayments.slice(0, 5).map((payment: any) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{payment.parent?.name || 'Unknown Parent'}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(payment.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="font-medium text-green-600">
                    PHP {payment.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">{safePayments.length}</p>
              <p className="text-sm text-gray-600">Total Transactions</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-green-600">PHP {totalAmount.toLocaleString()}</p>
              <p className="text-sm text-gray-600">Total Revenue</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-orange-600">{safeParents.length - paidParents.length}</p>
              <p className="text-sm text-gray-600">Outstanding Payments</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-purple-600">
                PHP {(safeParents.length - paidParents.length) * 250}
              </p>
              <p className="text-sm text-gray-600">Potential Revenue</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}