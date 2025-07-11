'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  GraduationCap, 
  Users, 
  CreditCard, 
  Calendar,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function MyChildrenPage() {
  const { data: profile } = useSWR('/api/profile', fetcher);
  const { data: students, error, isLoading } = useSWR(
    profile?.id ? `/api/students?parent_id=${profile.id}` : null, 
    fetcher
  );
  const { data: payments } = useSWR(
    profile?.id ? `/api/payments?parent_id=${profile.id}` : null,
    fetcher
  );

  const safeStudents = Array.isArray(students) ? students : [];
  const safePayments = Array.isArray(payments) ? payments : [];
  
  const totalStudents = safeStudents.length;
  const paidStudents = safeStudents.filter((s: any) => s.payment_status);
  const latestPayment = safePayments[0];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">My Children</h1>
        </div>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-24 bg-gray-200 rounded"></div>
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Children</h1>
        <p className="text-gray-600">View your children's enrollment and payment status</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-full mr-4">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Children</p>
                <p className="text-2xl font-bold">{totalStudents}</p>
                <p className="text-xs text-blue-600">Enrolled students</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-full mr-4">
                <CreditCard className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Payment Status</p>
                <p className="text-2xl font-bold">
                  {paidStudents.length === totalStudents && totalStudents > 0 ? "Paid" : "Pending"}
                </p>
                <p className="text-xs text-green-600">{paidStudents.length}/{totalStudents} paid</p>
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
                <p className="text-sm text-gray-600">Last Payment</p>
                <p className="text-2xl font-bold">
                  {latestPayment ? "PHP 250" : "None"}
                </p>
                <p className="text-xs text-orange-600">
                  {latestPayment 
                    ? new Date(latestPayment.created_at).toLocaleDateString()
                    : "No payments yet"
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Children List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <GraduationCap className="mr-2 h-5 w-5" />
            My Children
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Data</h3>
              <p className="text-gray-500">Unable to load student information. Database may not be configured.</p>
            </div>
          ) : totalStudents === 0 ? (
            <div className="text-center py-8">
              <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Children Found</h3>
              <p className="text-gray-500 mb-4">
                No students are currently linked to your account.
              </p>
              <p className="text-sm text-gray-400">
                Please contact your school administrator to link your children to your account.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {safeStudents.map((student: any) => (
                <div key={student.id} className="p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-medium text-gray-900">{student.name}</h3>
                        <Badge 
                          variant={student.payment_status ? "default" : "secondary"}
                          className={student.payment_status ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}
                        >
                          {student.payment_status ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Paid
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-3 w-3 mr-1" />
                              Unpaid
                            </>
                          )}
                        </Badge>
                      </div>
                      
                      <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <GraduationCap className="h-4 w-4 mr-2" />
                          Class: {student.class?.name || 'Not assigned'}
                        </div>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2" />
                          Grade: {student.class?.grade_level || 'Unknown'}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          Student ID: {student.student_number || 'Not set'}
                        </div>
                      </div>

                      {student.class?.teacher && (
                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium">Teacher:</span> {student.class.teacher.full_name}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Information */}
      {totalStudents > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="mr-2 h-5 w-5" />
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="flex items-start">
                  <div className="p-2 bg-blue-100 rounded-full mr-4">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-blue-900">PTA Membership Fee</h4>
                    <p className="text-sm text-blue-700 mt-1">
                      The annual PTA membership fee is PHP 250 per family. 
                      Payment covers all children in your family.
                    </p>
                  </div>
                </div>
              </div>

              {paidStudents.length === totalStudents ? (
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <div>
                      <p className="font-medium text-green-900">Payment Complete</p>
                      <p className="text-sm text-green-700">
                        All your children are marked as paid. Thank you for your contribution!
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="flex items-center">
                    <AlertCircle className="h-5 w-5 text-orange-600 mr-2" />
                    <div>
                      <p className="font-medium text-orange-900">Payment Pending</p>
                      <p className="text-sm text-orange-700">
                        Please contact the school treasurer to complete your PTA membership payment.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment History */}
      {safePayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payment History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {safePayments.map((payment: any) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">PTA Membership Fee</p>
                    <p className="text-sm text-gray-600">
                      {new Date(payment.created_at).toLocaleDateString()} • {payment.payment_method}
                    </p>
                    {payment.notes && (
                      <p className="text-sm text-gray-500 mt-1">{payment.notes}</p>
                    )}
                  </div>
                  <span className="font-medium text-green-600">
                    PHP {payment.amount}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}