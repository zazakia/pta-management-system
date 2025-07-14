'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  GraduationCap, 
  Plus, 
  Search, 
  Edit2, 
  Trash2,
  CheckCircle,
  XCircle,
  Users
} from 'lucide-react';
import useSWR, { mutate } from 'swr';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Student {
  id: string;
  name: string;
  student_number: string | null;
  payment_status: boolean;
  class: {
    name: string;
    grade_level: string;
  };
  parent: {
    id: string;
    name: string;
    contact_number: string | null;
    payment_status: boolean;
  };
}

function StudentCard({ student }: { student: Student }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${student.name}?`)) return;
    
    setDeleting(true);
    try {
      const response = await fetch(`/api/students/${student.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete student');
      
      mutate('/api/students');
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Failed to delete student');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-semibold text-lg">{student.name}</h3>
              {student.payment_status ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
            
            <div className="space-y-1 text-sm text-gray-600">
              {student.student_number && (
                <p>Student #: {student.student_number}</p>
              )}
              <p>Class: {student.class?.name} ({student.class?.grade_level})</p>
              <p>Parent: {student.parent?.name}</p>
              {student.parent?.contact_number && (
                <p>Contact: {student.parent.contact_number}</p>
              )}
            </div>

            <div className="mt-3 flex items-center space-x-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                student.payment_status 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {student.payment_status ? 'Paid' : 'Unpaid'}
              </span>
              
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                student.parent?.payment_status 
                  ? 'bg-blue-100 text-blue-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                Parent: {student.parent?.payment_status ? 'Paid' : 'Unpaid'}
              </span>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <Link href={`/dashboard/students/${student.id}/edit`}>
                <Edit2 className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FilterBar({ 
  searchTerm, 
  setSearchTerm, 
  classFilter, 
  setClassFilter, 
  paymentFilter, 
  setPaymentFilter 
}: {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  classFilter: string;
  setClassFilter: (filter: string) => void;
  paymentFilter: string;
  setPaymentFilter: (filter: string) => void;
}) {
  const { data: classes } = useSWR('/api/classes', fetcher);
  const safeClasses = Array.isArray(classes) ? classes : [];

  return (
    <Card className="mb-6">
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
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">All Classes</option>
            {safeClasses.map((classItem: any) => (
              <option key={classItem.id} value={classItem.id}>
                {classItem.name} ({classItem.grade_level})
              </option>
            ))}
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">All Payment Status</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>

          <Button asChild>
            <Link href="/dashboard/students/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Student
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');

  const { data: students, isLoading, error } = useSWR<Student[]>('/api/students', fetcher);

  // Ensure students is always an array
  const studentsArray = Array.isArray(students) ? students : [];

  const filteredStudents = studentsArray.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.parent?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.student_number?.includes(searchTerm);
    
    const matchesClass = !classFilter || (student.class as any)?.id === classFilter;
    
    const matchesPayment = !paymentFilter || 
                          (paymentFilter === 'paid' && student.payment_status) ||
                          (paymentFilter === 'unpaid' && !student.payment_status);

    return matchesSearch && matchesClass && matchesPayment;
  });

  const totalStudents = studentsArray.length;
  const paidStudents = studentsArray.filter(s => s.payment_status).length;

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-600">Error loading students: {error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <GraduationCap className="mr-3 h-6 w-6" />
            Student Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage student records and payment status
          </p>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">{totalStudents}</div>
          <div className="text-sm text-gray-600">
            {paidStudents} paid • {totalStudents - paidStudents} unpaid
          </div>
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        classFilter={classFilter}
        setClassFilter={setClassFilter}
        paymentFilter={paymentFilter}
        setPaymentFilter={setPaymentFilter}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{totalStudents}</div>
            <div className="text-sm text-gray-600">Total Students</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{paidStudents}</div>
            <div className="text-sm text-gray-600">Paid Students</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{totalStudents - paidStudents}</div>
            <div className="text-sm text-gray-600">Unpaid Students</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {Math.round((paidStudents / totalStudents) * 100) || 0}%
            </div>
            <div className="text-sm text-gray-600">Payment Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Students Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-24 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredStudents.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {students?.length === 0 ? 'No students found' : 'No students match your filters'}
            </h3>
            <p className="text-gray-600 mb-4">
              {students?.length === 0 
                ? 'Get started by adding your first student.'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
            {students?.length === 0 && (
              <Button asChild>
                <Link href="/dashboard/students/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Student
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student) => (
            <StudentCard key={student.id} student={student} />
          ))}
        </div>
      )}
    </div>
  );
}