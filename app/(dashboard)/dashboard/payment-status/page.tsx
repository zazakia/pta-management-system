'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  ClipboardCheck, 
  Search, 
  CheckCircle,
  XCircle,
  Users,
  GraduationCap,
  TrendingUp,
  Filter,
  Download,
  Eye,
  AlertCircle
} from 'lucide-react';
import useSWR from 'swr';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function PaymentStatusPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');

  const { data: profile } = useSWR('/api/profile', fetcher);
  const { data: classes } = useSWR(
    profile ? `/api/classes?teacher_id=${profile.id}` : null, 
    fetcher,
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
    }
  );

  const { data: allStudents } = useSWR('/api/students', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  const safeClasses = Array.isArray(classes) ? classes : [];
  const safeAllStudents = Array.isArray(allStudents) ? allStudents : [];

  // Get students from teacher's classes
  const myStudents = safeAllStudents.filter((student: any) => {
    return safeClasses.some((cls: any) => cls.id === student.class_id);
  });

  // Filter students based on search and filters
  const filteredStudents = myStudents.filter((student: any) => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.parent?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.student_number?.includes(searchTerm);
    
    const matchesStatus = !statusFilter || 
                         (statusFilter === 'paid' && student.payment_status) ||
                         (statusFilter === 'unpaid' && !student.payment_status);
    
    const matchesClass = !classFilter || student.class_id === classFilter;
    
    return matchesSearch && matchesStatus && matchesClass;
  });

  const totalStudents = myStudents.length;
  const paidStudents = myStudents.filter((student: any) => student.payment_status).length;
  const paymentRate = totalStudents > 0 ? Math.round((paidStudents / totalStudents) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <ClipboardCheck className="mr-3 h-6 w-6" />
            Payment Status Overview
          </h1>
          <p className="text-gray-600 mt-1">
            Track payment status for students in your classes
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
          <Button asChild>
            <Link href="/dashboard/reports">
              <Eye className="mr-2 h-4 w-4" />
              View Reports
            </Link>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">{totalStudents}</div>
            <div className="text-sm text-gray-600">Total Students</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">{paidStudents}</div>
            <div className="text-sm text-gray-600">Paid Students</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <XCircle className="h-5 w-5 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-red-600">{totalStudents - paidStudents}</div>
            <div className="text-sm text-gray-600">Unpaid Students</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-600">{paymentRate}%</div>
            <div className="text-sm text-gray-600">Payment Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Class Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <GraduationCap className="mr-2 h-5 w-5" />
            Payment Status by Class
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {safeClasses.map((cls: any) => {
              const classStudents = myStudents.filter((student: any) => student.class_id === cls.id);
              const classPaidStudents = classStudents.filter((student: any) => student.payment_status);
              const classPaymentRate = classStudents.length > 0 ? 
                Math.round((classPaidStudents.length / classStudents.length) * 100) : 0;

              return (
                <div key={cls.id} className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium">{cls.name}</h3>
                    <span className="text-sm text-gray-600">{cls.grade_level}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Students: {classStudents.length}</span>
                      <span>Paid: {classPaidStudents.length}</span>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          classPaymentRate >= 80 ? 'bg-green-500' :
                          classPaymentRate >= 50 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${classPaymentRate}%` }}
                      />
                    </div>
                    
                    <div className="text-center">
                      <span className={`text-sm font-medium ${
                        classPaymentRate >= 80 ? 'text-green-600' :
                        classPaymentRate >= 50 ? 'text-yellow-600' :
                        'text-red-600'
                      }`}>
                        {classPaymentRate}% Complete
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Status</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>

            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Classes</option>
              {safeClasses.map((cls: any) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.grade_level})
                </option>
              ))}
            </select>

            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              More Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Students List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Student Payment Status
            </span>
            <span className="text-sm text-gray-600">
              {filteredStudents.length} students
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No students found matching your criteria</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredStudents.map((student: any) => (
                <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full ${
                      student.payment_status ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {student.payment_status ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    
                    <div>
                      <p className="font-medium">{student.name}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>{student.class?.name} ({student.class?.grade_level})</span>
                        <span>Parent: {student.parent?.name}</span>
                        {student.student_number && (
                          <span>ID: {student.student_number}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      student.payment_status 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {student.payment_status ? 'Paid' : 'Unpaid'}
                    </span>
                    
                    {student.parent?.contact_number && (
                      <Button variant="outline" size="sm">
                        Contact Parent
                      </Button>
                    )}
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