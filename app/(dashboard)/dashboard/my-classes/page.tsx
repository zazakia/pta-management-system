'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  GraduationCap, 
  Users, 
  CheckCircle,
  XCircle,
  TrendingUp,
  Calendar,
  Eye,
  FileText,
  Clock
} from 'lucide-react';
import useSWR from 'swr';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function MyClassesPage() {
  const { data: profile } = useSWR('/api/profile', fetcher);
  const { data: classes, isLoading } = useSWR(
    profile ? `/api/classes?teacher_id=${profile.id}` : null, 
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  const safeClasses = Array.isArray(classes) ? classes : [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
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

  const totalStudents = safeClasses.reduce((sum, cls) => sum + (cls.students?.length || 0), 0);
  const paidStudents = safeClasses.reduce((sum, cls) => 
    sum + (cls.students?.filter((s: any) => s.payment_status).length || 0), 0);
  const paymentRate = totalStudents > 0 ? Math.round((paidStudents / totalStudents) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <GraduationCap className="mr-3 h-6 w-6" />
            My Classes
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your assigned classes and track student payments
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{safeClasses.length}</div>
            <div className="text-sm text-gray-600">Total Classes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{totalStudents}</div>
            <div className="text-sm text-gray-600">Total Students</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{paidStudents}</div>
            <div className="text-sm text-gray-600">Paid Students</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{paymentRate}%</div>
            <div className="text-sm text-gray-600">Payment Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Classes List */}
      {safeClasses.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Assigned</h3>
            <p className="text-gray-600">
              You don't have any classes assigned to you yet. Contact your administrator to assign classes.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {safeClasses.map((cls: any) => {
            const classStudents = cls.students || [];
            const classPaidStudents = classStudents.filter((s: any) => s.payment_status);
            const classPaymentRate = classStudents.length > 0 ? 
              Math.round((classPaidStudents.length / classStudents.length) * 100) : 0;

            return (
              <Card key={cls.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        <GraduationCap className="mr-2 h-5 w-5" />
                        {cls.name}
                      </CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{cls.grade_level}</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${
                        classPaymentRate >= 80 ? 'text-green-600' :
                        classPaymentRate >= 50 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {classPaymentRate}%
                      </div>
                      <div className="text-sm text-gray-600">Payment Rate</div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Class Statistics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 text-gray-500 mr-2" />
                        <span className="text-sm text-gray-600">
                          {classStudents.length} Students
                        </span>
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        <span className="text-sm text-gray-600">
                          {classPaidStudents.length} Paid
                        </span>
                      </div>
                    </div>

                    {/* Payment Status Bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${classPaymentRate}%` }}
                      />
                    </div>

                    {/* Recent Students */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Students</h4>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {classStudents.slice(0, 5).map((student: any) => (
                          <div key={student.id} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{student.name}</span>
                            {student.payment_status ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                          </div>
                        ))}
                        {classStudents.length > 5 && (
                          <div className="text-xs text-gray-500 text-center pt-1">
                            +{classStudents.length - 5} more students
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2 pt-2">
                      <Button asChild variant="outline" size="sm" className="flex-1">
                        <Link href={`/dashboard/classes/${cls.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="sm" className="flex-1">
                        <Link href={`/dashboard/classes/${cls.id}/report`}>
                          <FileText className="h-4 w-4 mr-2" />
                          Report
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}