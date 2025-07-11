'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  Search, 
  Calendar,
  DollarSign,
  User,
  FileText,
  Download
} from 'lucide-react';
import Link from 'next/link';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function PaymentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: payments, error, isLoading } = useSWR('/api/payments', fetcher);
  const { data: profile } = useSWR('/api/profile', fetcher);

  const filteredPayments = (payments || []).filter((payment: any) =>
    payment.parent?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.notes?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAmount = filteredPayments.reduce((sum: number, payment: any) => sum + (payment.amount || 0), 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Payments</h1>
        </div>
        <div className="grid gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-gray-200 rounded"></div>
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
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600">View and manage PTA payment records</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button asChild>
            <Link href="/dashboard/record-payment">
              <CreditCard className="mr-2 h-4 w-4" />
              Record Payment
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
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
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-full mr-4">
                <CreditCard className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Payments</p>
                <p className="text-2xl font-bold">{filteredPayments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-full mr-4">
                <Calendar className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-2xl font-bold">
                  {filteredPayments.filter((p: any) => 
                    new Date(p.created_at).getMonth() === new Date().getMonth()
                  ).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-full mr-4">
                <User className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Average Payment</p>
                <p className="text-2xl font-bold">
                  PHP {filteredPayments.length > 0 ? Math.round(totalAmount / filteredPayments.length) : 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search payments by parent name or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Payments List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="mr-2 h-5 w-5" />
            Payment Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Error loading payments. Database may not be configured.</p>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Payments Found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ? 'No payments match your search.' : 'No payments have been recorded yet.'}
              </p>
              {!searchTerm && (
                <Button asChild>
                  <Link href="/dashboard/record-payment">
                    <CreditCard className="mr-2 h-4 w-4" />
                    Record First Payment
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPayments.map((payment: any) => (
                <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-medium text-gray-900">{payment.parent?.name || 'Unknown Parent'}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(payment.created_at).toLocaleDateString()} • {payment.payment_method}
                        </p>
                        {payment.notes && (
                          <p className="text-sm text-gray-500 mt-1">{payment.notes}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-600">PHP {payment.amount}</p>
                      {payment.receipt_url && (
                        <Badge variant="secondary" className="text-xs">
                          <FileText className="h-3 w-3 mr-1" />
                          Receipt
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}