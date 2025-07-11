'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Building2, 
  Plus, 
  Search, 
  Edit2, 
  Trash2,
  Users,
  GraduationCap,
  MapPin,
  Calendar,
  MoreHorizontal,
  UserCheck,
  School
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

interface School {
  id: string;
  name: string;
  address: string;
  created_at: string;
  users_count?: number;
  classes_count?: number;
  students_count?: number;
}

function SchoolCard({ school }: { school: School }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${school.name}?`)) return;
    
    setDeleting(true);
    try {
      const response = await fetch(`/api/schools/${school.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete school');
      
      mutate('/api/schools');
    } catch (error) {
      console.error('Error deleting school:', error);
      alert('Failed to delete school');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-blue-100 rounded-full">
              <School className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-gray-900 mb-2">{school.name}</h3>
              <div className="space-y-1">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  {school.address || 'No address provided'}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  Created {new Date(school.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={deleting}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/schools/${school.id}/edit`}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit School
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={`/dashboard/schools/${school.id}`}>
                  <School className="h-4 w-4 mr-2" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleDelete}
                disabled={deleting}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete School
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* School Statistics */}
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {school.users_count || 0}
            </div>
            <div className="text-sm text-gray-600">Users</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {school.classes_count || 0}
            </div>
            <div className="text-sm text-gray-600">Classes</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {school.students_count || 0}
            </div>
            <div className="text-sm text-gray-600">Students</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SchoolsPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const { data: schools, isLoading, error } = useSWR('/api/schools', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  const filteredSchools = schools?.filter((school: School) => {
    const matchesSearch = school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         school.address?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  }) || [];

  const totalSchools = schools?.length || 0;

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-600">Error loading schools: {error.message}</p>
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
            <Building2 className="mr-3 h-6 w-6" />
            School Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage schools and their information
          </p>
        </div>
        
        <Button asChild>
          <Link href="/dashboard/schools/new">
            <Plus className="mr-2 h-4 w-4" />
            Add School
          </Link>
        </Button>
      </div>

      {/* Summary Card */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{totalSchools}</div>
              <div className="text-sm text-gray-600">Total Schools</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {schools?.reduce((sum: number, school: any) => sum + (school.users_count || 0), 0) || 0}
              </div>
              <div className="text-sm text-gray-600">Total Users</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {schools?.reduce((sum: number, school: any) => sum + (school.classes_count || 0), 0) || 0}
              </div>
              <div className="text-sm text-gray-600">Total Classes</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {schools?.reduce((sum: number, school: any) => sum + (school.students_count || 0), 0) || 0}
              </div>
              <div className="text-sm text-gray-600">Total Students</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search schools..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Schools Grid */}
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
      ) : filteredSchools.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {schools?.length === 0 ? 'No schools found' : 'No schools match your search'}
            </h3>
            <p className="text-gray-600 mb-4">
              {schools?.length === 0 
                ? 'Get started by adding your first school.'
                : 'Try adjusting your search criteria.'
              }
            </p>
            {schools?.length === 0 && (
              <Button asChild>
                <Link href="/dashboard/schools/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add First School
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSchools.map((school: School) => (
            <SchoolCard key={school.id} school={school} />
          ))}
        </div>
      )}
    </div>
  );
}