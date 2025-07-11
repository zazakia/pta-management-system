'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Download,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  CreditCard,
  Users,
  FileText
} from 'lucide-react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function CollectionsPage() {
  const { data: payments, isLoading } = useSWR('/api/payments', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  const { data: parents } = useSWR('/api/parents', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  const safePayments = Array.isArray(payments) ? payments : [];
  const safeParents = Array.isArray(parents) ? parents : [];

  const totalCollections = safePayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  const paidParents = safeParents.filter((p: any) => p.payment_status);
  const collectionRate = safeParents.length > 0 ? (paidParents.length / safeParents.length) * 100 : 0;

  // Monthly collections
  const monthlyCollections = safePayments.reduce((acc: any, payment: any) => {
    const month = new Date(payment.created_at).toLocaleString('default', { month: 'short' });
    acc[month] = (acc[month] || 0) + (payment.amount || 0);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <DollarSign className="mr-3 h-6 w-6" />
            Collections Overview
          </h1>
          <p className="text-gray-600 mt-1">
            Track and manage all payment collections
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-full mr-4">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Collections</p>
                <p className="text-2xl font-bold">₱{totalCollections.toLocaleString()}</p>
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
                <p className="text-sm text-gray-600">Collection Rate</p>
                <p className="text-2xl font-bold">{Math.round(collectionRate)}%</p>
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
                <p className="text-sm text-gray-600">Paid Parents</p>
                <p className="text-2xl font-bold">{paidParents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-full mr-4">
                <Clock className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold">{safeParents.length - paidParents.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Monthly Collections
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Object.keys(monthlyCollections).length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p>No collection data available</p>
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-end space-x-2">
                {Object.entries(monthlyCollections).map(([month, amount]: [string, any]) => (
                  <div key={month} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-green-500 rounded-t min-h-[20px]"
                      style={{ height: `${(amount / Math.max(...Object.values(monthlyCollections).map(v => Number(v)))) * 200}px` }}
                    ></div>
                    <div className="mt-2 text-xs text-gray-600">{month}</div>
                    <div className="text-xs font-medium">₱{amount.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="mr-2 h-5 w-5" />
              Recent Collections
            </CardTitle>
          </CardHeader>
          <CardContent>
            {safePayments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No recent collections</p>
              </div>
            ) : (
              <div className="space-y-3">
                {safePayments.slice(0, 5).map((payment: any) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="font-medium">{payment.parent?.name || 'Unknown'}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(payment.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">₱{payment.amount}</p>
                      <p className="text-sm text-gray-500 capitalize">{payment.payment_method}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}