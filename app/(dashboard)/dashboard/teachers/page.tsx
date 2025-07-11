'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  UserCheck, 
  Plus, 
  Search, 
  Edit2, 
  Trash2,
  Users,
  GraduationCap,
  Mail,
  Phone,
  School,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  Filter,
  MoreHorizontal
} from 'lucide-react';
import useSWR, { mutate } from 'swr';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Teacher {
  id: string;
  full_name: string;
  email: string;
  role: string;
  school: {
    id: string;
    name: string;
  };
  classes: Array<{
    id: string;
    name: string;
    grade_level: string;
    students: Array<{
      id: string;
      name: string;
      payment_status: boolean;
    }>;
  }>;
  created_at: string;
}

function TeacherCard({ teacher }: { teacher: Teacher }) {
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(false);

  const totalStudents = teacher.classes?.reduce((sum, cls) => sum + (cls.students?.length || 0), 0) || 0;
  const paidStudents = teacher.classes?.reduce((sum, cls) => 
    sum + (cls.students?.filter(s => s.payment_status).length || 0), 0) || 0;
  const paymentRate = totalStudents > 0 ? Math.round((paidStudents / totalStudents) * 100) : 0;

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to remove ${teacher.full_name} as a teacher?`)) return;
    
    setDeleting(true);
    try {
      const response = await fetch(`/api/users/${teacher.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete teacher');
      
      mutate('/api/users?role=teacher');
    } catch (error) {
      console.error('Error deleting teacher:', error);
      alert('Failed to delete teacher');
    } finally {
      setDeleting(false);
    }
  };

  const handlePromoteToAdmin = async () => {
    if (!confirm(`Promote ${teacher.full_name} to admin role?`)) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/users/${teacher.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'admin' }),
      });
      
      if (!response.ok) throw new Error('Failed to promote teacher');
      
      mutate('/api/users?role=teacher');
    } catch (error) {
      console.error('Error promoting teacher:', error);
      alert('Failed to promote teacher');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <UserCheck className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-gray-900">{teacher.full_name}</h3>
              <div className="space-y-1 mt-2">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  {teacher.email}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <School className="h-4 w-4 mr-2" />
                  {teacher.school?.name || 'No school assigned'}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  {teacher.classes?.length || 0} classes, {totalStudents} students
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/teachers/${teacher.id}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/dashboard/teachers/${teacher.id}/edit`}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Teacher
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handlePromoteToAdmin} disabled={loading}>
                  <Users className="h-4 w-4 mr-2" />
                  Promote to Admin
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleDelete} 
                  disabled={deleting}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove Teacher
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Teacher Statistics */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {teacher.classes?.length || 0}
            </div>
            <div className="text-sm text-gray-600">Classes</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {totalStudents}
            </div>
            <div className="text-sm text-gray-600">Students</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {paymentRate}%
            </div>
            <div className="text-sm text-gray-600">Payment Rate</div>
          </div>
        </div>

        {/* Classes List */}
        {teacher.classes && teacher.classes.length > 0 && (
          <div className="mt-4">
            <h4 className="font-medium text-gray-900 mb-2">Classes</h4>
            <div className="space-y-2">
              {teacher.classes.map((cls) => {
                const classPaymentRate = cls.students?.length > 0 ? 
                  Math.round((cls.students.filter(s => s.payment_status).length / cls.students.length) * 100) : 0;
                
                return (
                  <div key={cls.id} className="flex items-center justify-between p-2 bg-white border rounded-md">
                    <div>
                      <span className="font-medium">{cls.name}</span>
                      <span className="text-sm text-gray-600 ml-2">({cls.grade_level})</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">
                        {cls.students?.length || 0} students
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        classPaymentRate >= 80 ? 'bg-green-100 text-green-800' :
                        classPaymentRate >= 50 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {classPaymentRate}% paid
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FilterBar({ 
  searchTerm, 
  setSearchTerm, 
  schoolFilter, 
  setSchoolFilter 
}: {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  schoolFilter: string;
  setSchoolFilter: (filter: string) => void;
}) {
  const { data: schools } = useSWR('/api/schools', fetcher);
  const safeSchools = Array.isArray(schools) ? schools : [];

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search teachers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <select
            value={schoolFilter}
            onChange={(e) => setSchoolFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">All Schools</option>
            {safeSchools.map((school: any) => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </select>

          <Button asChild>
            <Link href="/dashboard/teachers/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Teacher
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TeachersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [schoolFilter, setSchoolFilter] = useState('');

  // Fetch teachers (users with role 'teacher')
  const { data: teachers, isLoading, error } = useSWR('/api/users?role=teacher', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  const { data: schools } = useSWR('/api/schools', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000,
  });

  // Filter teachers based on search and school
  const filteredTeachers = teachers?.filter((teacher: Teacher) => {
    const matchesSearch = teacher.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSchool = !schoolFilter || teacher.school?.id === schoolFilter;
    
    return matchesSearch && matchesSchool;
  }) || [];

  const totalTeachers = teachers?.length || 0;
  const totalClasses = teachers?.reduce((sum: number, teacher: Teacher) => 
    sum + (teacher.classes?.length || 0), 0) || 0;
  const totalStudents = teachers?.reduce((sum: number, teacher: Teacher) => 
    sum + (teacher.classes?.reduce((classSum, cls) => classSum + (cls.students?.length || 0), 0) || 0), 0) || 0;

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">Error loading teachers: {error.message}</p>
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
            <UserCheck className="mr-3 h-6 w-6" />
            Teacher Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage teacher accounts and class assignments
          </p>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">{totalTeachers}</div>
          <div className="text-sm text-gray-600">
            Total Teachers
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{totalTeachers}</div>
            <div className="text-sm text-gray-600">Total Teachers</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{totalClasses}</div>
            <div className="text-sm text-gray-600">Classes Managed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{totalStudents}</div>
            <div className="text-sm text-gray-600">Students Taught</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">
              {Array.isArray(schools) ? schools.length : 0}
            </div>
            <div className="text-sm text-gray-600">Schools</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <FilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        schoolFilter={schoolFilter}
        setSchoolFilter={setSchoolFilter}
      />

      {/* Teachers Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-32 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredTeachers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {teachers?.length === 0 ? 'No teachers found' : 'No teachers match your filters'}
            </h3>
            <p className="text-gray-600 mb-4">
              {teachers?.length === 0 
                ? 'Get started by adding your first teacher.'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
            {teachers?.length === 0 && (
              <Button asChild>
                <Link href="/dashboard/teachers/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Teacher
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTeachers.map((teacher: Teacher) => (
            <TeacherCard key={teacher.id} teacher={teacher} />
          ))}
        </div>
      )}
    </div>
  );
}