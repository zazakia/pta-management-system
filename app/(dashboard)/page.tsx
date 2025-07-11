'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  GraduationCap, 
  CreditCard, 
  TrendingUp, 
  DollarSign,
  UserCheck,
  AlertCircle,
  Plus,
  Eye
} from 'lucide-react';
import useSWR from 'swr';
import Link from 'next/link';
import { Suspense } from 'react';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Stats Widget Component
function StatsWidget({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend,
  color = "blue"
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: any;
  trend?: string;
  color?: string;
}) {
  const colorClasses = {
    blue: "text-blue-600 bg-blue-100",
    green: "text-green-600 bg-green-100",
    orange: "text-orange-600 bg-orange-100",
    red: "text-red-600 bg-red-100",
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500">{subtitle}</p>
            {trend && (
              <div className="flex items-center mt-1">
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                <span className="text-xs text-green-600">{trend}</span>
              </div>
            )}
          </div>
          <div className={`p-3 rounded-full ${colorClasses[color as keyof typeof colorClasses]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Role-specific dashboard components
function ParentDashboard({ profile }: { profile: any }) {
  const { data: students } = useSWR(`/api/students?parent_id=${profile.id}`, fetcher);
  const { data: payments } = useSWR(`/api/payments?parent_id=${profile.id}`, fetcher);

  const paidStudents = students?.filter((s: any) => s.payment_status) || [];
  const totalStudents = students?.length || 0;
  const latestPayment = payments?.[0];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsWidget
          title="My Children"
          value={totalStudents}
          subtitle="Total students"
          icon={Users}
          color="blue"
        />
        <StatsWidget
          title="Payment Status"
          value={paidStudents.length === totalStudents ? "Paid" : "Unpaid"}
          subtitle={`${paidStudents.length}/${totalStudents} paid`}
          icon={CreditCard}
          color={paidStudents.length === totalStudents ? "green" : "red"}
        />
        <StatsWidget
          title="Last Payment"
          value={latestPayment ? "PHP 250" : "None"}
          subtitle={latestPayment ? new Date(latestPayment.created_at).toLocaleDateString() : "No payments yet"}
          icon={DollarSign}
          color="green"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <GraduationCap className="mr-2 h-5 w-5" />
            My Children
          </CardTitle>
        </CardHeader>
        <CardContent>
          {totalStudents === 0 ? (
            <p className="text-gray-500 text-center py-4">No students linked to your account.</p>
          ) : (
            <div className="space-y-3">
              {students?.map((student: any) => (
                <div key={student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div>
                    <p className="font-medium">{student.name}</p>
                    <p className="text-sm text-gray-600">{student.class?.name}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    student.payment_status 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {student.payment_status ? 'Paid' : 'Unpaid'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TreasurerDashboard({ profile }: { profile: any }) {
  const { data: payments } = useSWR('/api/payments', fetcher);
  const { data: parents } = useSWR('/api/parents', fetcher);
  
  // Safely handle undefined/null data from API
  const safePayments = Array.isArray(payments) ? payments : [];
  const safeParents = Array.isArray(parents) ? parents : [];
  
  const totalPayments = safePayments.length;
  const totalAmount = safePayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  const paidParents = safeParents.filter((p: any) => p.payment_status);
  const totalParents = safeParents.length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsWidget
          title="Total Collections"
          value={`PHP ${totalAmount.toLocaleString()}`}
          subtitle={`${totalPayments} payments`}
          icon={DollarSign}
          color="green"
        />
        <StatsWidget
          title="Payment Rate"
          value={`${Math.round((paidParents.length / totalParents) * 100) || 0}%`}
          subtitle={`${paidParents.length}/${totalParents} paid`}
          icon={TrendingUp}
          color="blue"
        />
        <StatsWidget
          title="Pending"
          value={totalParents - paidParents.length}
          subtitle="Unpaid parents"
          icon={AlertCircle}
          color="orange"
        />
        <StatsWidget
          title="This Month"
          value={safePayments.filter((p: any) => 
            new Date(p.created_at).getMonth() === new Date().getMonth()
          ).length}
          subtitle="New payments"
          icon={CreditCard}
          color="green"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <Plus className="mr-2 h-5 w-5" />
                Quick Actions
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/record-payment">
                <CreditCard className="mr-2 h-4 w-4" />
                Record Payment
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/parents">
                <Users className="mr-2 h-4 w-4" />
                Manage Parents
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/reports">
                <Eye className="mr-2 h-4 w-4" />
                View Reports
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="mr-2 h-5 w-5" />
              Recent Payments
            </CardTitle>
          </CardHeader>
          <CardContent>
            {totalPayments === 0 ? (
              <p className="text-gray-500 text-center py-4">No payments recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {safePayments.slice(0, 5).map((payment: any) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                    <div>
                      <p className="font-medium">{payment.parent?.name}</p>
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
      </div>
    </div>
  );
}

function TeacherDashboard({ profile }: { profile: any }) {
  const { data: classes } = useSWR(`/api/classes?teacher_id=${profile.id}`, fetcher);
  
  const totalClasses = classes?.length || 0;
  const totalStudents = classes?.reduce((sum: number, c: any) => sum + (c.students?.length || 0), 0) || 0;
  const paidStudents = classes?.reduce((sum: number, c: any) => 
    sum + (c.students?.filter((s: any) => s.payment_status).length || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsWidget
          title="My Classes"
          value={totalClasses}
          subtitle="Total classes"
          icon={GraduationCap}
          color="blue"
        />
        <StatsWidget
          title="Total Students"
          value={totalStudents}
          subtitle="Across all classes"
          icon={Users}
          color="green"
        />
        <StatsWidget
          title="Payment Rate"
          value={`${Math.round((paidStudents / totalStudents) * 100) || 0}%`}
          subtitle={`${paidStudents}/${totalStudents} paid`}
          icon={TrendingUp}
          color="orange"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <GraduationCap className="mr-2 h-5 w-5" />
            My Classes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {totalClasses === 0 ? (
            <p className="text-gray-500 text-center py-4">No classes assigned to you.</p>
          ) : (
            <div className="space-y-3">
              {classes?.map((classItem: any) => {
                const classPaidStudents = classItem.students?.filter((s: any) => s.payment_status) || [];
                const classTotal = classItem.students?.length || 0;
                
                return (
                  <div key={classItem.id} className="p-4 border rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{classItem.name}</h3>
                      <span className="text-sm text-gray-600">
                        {classItem.grade_level}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">
                        {classTotal} students
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        classPaidStudents.length === classTotal 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {classPaidStudents.length}/{classTotal} paid
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function AdminDashboard({ profile }: { profile: any }) {
  const { data: parents } = useSWR('/api/parents', fetcher);
  const { data: students } = useSWR('/api/students', fetcher);
  const { data: payments } = useSWR('/api/payments', fetcher);
  const { data: classes } = useSWR('/api/classes', fetcher);

  // Safely handle undefined/null data from API
  const safeParents = Array.isArray(parents) ? parents : [];
  const safeStudents = Array.isArray(students) ? students : [];
  const safePayments = Array.isArray(payments) ? payments : [];
  const safeClasses = Array.isArray(classes) ? classes : [];

  const totalParents = safeParents.length;
  const paidParents = safeParents.filter((p: any) => p.payment_status);
  const totalStudents = safeStudents.length;
  const totalAmount = safePayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsWidget
          title="Total Parents"
          value={totalParents}
          subtitle={`${paidParents.length} paid`}
          icon={Users}
          color="blue"
        />
        <StatsWidget
          title="Total Students"
          value={totalStudents}
          subtitle={`${safeClasses.length} classes`}
          icon={GraduationCap}
          color="green"
        />
        <StatsWidget
          title="Total Collections"
          value={`PHP ${totalAmount.toLocaleString()}`}
          subtitle={`${safePayments.length} payments`}
          icon={DollarSign}
          color="green"
        />
        <StatsWidget
          title="Payment Rate"
          value={`${Math.round((paidParents.length / totalParents) * 100) || 0}%`}
          subtitle="Collection rate"
          icon={TrendingUp}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <Button asChild variant="outline" size="sm">
              <Link href="/reports">
                <Eye className="mr-2 h-4 w-4" />
                Reports
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/parents">
                <Users className="mr-2 h-4 w-4" />
                Parents
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/students">
                <GraduationCap className="mr-2 h-4 w-4" />
                Students
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/classes">
                <UserCheck className="mr-2 h-4 w-4" />
                Classes
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Paid Parents:</span>
                <span className="font-medium">{paidParents.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Pending:</span>
                <span className="font-medium">{totalParents - paidParents.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Collection Rate:</span>
                <span className="font-medium">{Math.round((paidParents.length / totalParents) * 100) || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${(paidParents.length / totalParents) * 100 || 0}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Main Dashboard Component
export default function HomePage() {
  const { data: profile, isLoading } = useSWR('/api/profile', fetcher);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
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

  if (!profile) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">Profile Not Found</h2>
          <p className="text-gray-600 mb-4">
            Please complete your profile setup to access the dashboard.
          </p>
          <Button asChild>
            <Link href="/setup-profile">Complete Profile</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Render role-specific dashboard
  switch (profile.role) {
    case 'parent':
      return <ParentDashboard profile={profile} />;
    case 'teacher':
      return <TeacherDashboard profile={profile} />;
    case 'treasurer':
      return <TreasurerDashboard profile={profile} />;
    case 'principal':
    case 'admin':
      return <AdminDashboard profile={profile} />;
    default:
      return (
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Unknown Role</h2>
            <p className="text-gray-600">
              Your account role is not recognized. Please contact an administrator.
            </p>
          </CardContent>
        </Card>
      );
  }
}
