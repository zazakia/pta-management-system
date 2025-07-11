'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CreditCard, 
  CheckCircle,
  Calendar,
  DollarSign,
  FileText,
  Download,
  Receipt,
  Clock,
  AlertCircle,
  TrendingUp
} from 'lucide-react';
import useSWR from 'swr';
import { getCategoryConfig } from '@/lib/constants/payment-categories';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function MyPaymentsPage() {
  const { data: profile } = useSWR('/api/profile', fetcher);
  const { data: payments, isLoading } = useSWR(
    profile ? `/api/payments?parent_id=${profile.id}` : null, 
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  const { data: students } = useSWR(
    profile ? `/api/students?parent_id=${profile.id}` : null, 
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  const safePayments = Array.isArray(payments) ? payments : [];
  const safeStudents = Array.isArray(students) ? students : [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
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

  const totalPaid = safePayments.reduce((sum, payment) => sum + payment.amount, 0);
  const paidStudents = safeStudents.filter((student: any) => student.payment_status);
  const paymentStatus = paidStudents.length === safeStudents.length ? 'complete' : 'partial';

  // Group payments by year
  const paymentsByYear = safePayments.reduce((acc: any, payment) => {
    const year = new Date(payment.created_at).getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(payment);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <CreditCard className="mr-3 h-6 w-6" />
            My Payment History
          </h1>
          <p className="text-gray-600 mt-1">
            View your payment history and download receipts
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export History
        </Button>
      </div>

      {/* Payment Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">₱{totalPaid.toLocaleString()}</div>
            <div className="text-sm text-gray-600">Total Paid</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Receipt className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">{safePayments.length}</div>
            <div className="text-sm text-gray-600">Total Payments</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">{paidStudents.length}</div>
            <div className="text-sm text-gray-600">Paid Students</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              {paymentStatus === 'complete' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              )}
            </div>
            <div className={`text-2xl font-bold ${
              paymentStatus === 'complete' ? 'text-green-600' : 'text-yellow-600'
            }`}>
              {paymentStatus === 'complete' ? 'Complete' : 'Partial'}
            </div>
            <div className="text-sm text-gray-600">Payment Status</div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Status for Students */}
      {safeStudents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="mr-2 h-5 w-5" />
              Student Payment Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {safeStudents.map((student: any) => (
                <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-full ${
                      student.payment_status ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {student.payment_status ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Clock className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <p className="text-sm text-gray-600">{student.class?.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      student.payment_status 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {student.payment_status ? 'Paid' : 'Unpaid'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      {safePayments.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Payment History</h3>
            <p className="text-gray-600">
              You don't have any payment records yet. Your payment history will appear here once you make payments.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(paymentsByYear)
            .sort(([a], [b]) => parseInt(b) - parseInt(a))
            .map(([year, yearPayments]) => (
              <Card key={year}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Calendar className="mr-2 h-5 w-5" />
                      {year} Payments
                    </span>
                    <span className="text-sm text-gray-600">
                      {(yearPayments as any[]).length} payments
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {(yearPayments as any[])
                      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                      .map((payment) => {
                        const categoryConfig = getCategoryConfig(payment.category || 'membership');
                        
                        return (
                          <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                            <div className="flex items-center space-x-4">
                              <div className={`p-2 rounded-full bg-${categoryConfig.color}-100`}>
                                <Receipt className={`h-4 w-4 text-${categoryConfig.color}-600`} />
                              </div>
                              <div>
                                <p className="font-medium">{categoryConfig.label}</p>
                                <div className="flex items-center space-x-4 text-sm text-gray-600">
                                  <span className="flex items-center">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {new Date(payment.created_at).toLocaleDateString()}
                                  </span>
                                  <span className="capitalize">
                                    {payment.payment_method || 'cash'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg text-green-600">
                                ₱{payment.amount.toLocaleString()}
                              </p>
                              <div className="flex items-center space-x-2">
                                <Button variant="outline" size="sm">
                                  <FileText className="h-3 w-3 mr-1" />
                                  Receipt
                                </Button>
                                {payment.receipt_url && (
                                  <Button variant="outline" size="sm">
                                    <Download className="h-3 w-3 mr-1" />
                                    Download
                                  </Button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );
}