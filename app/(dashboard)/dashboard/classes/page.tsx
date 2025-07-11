'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  GraduationCap, 
  Plus, 
  Search, 
  Users, 
  UserCheck,
  Edit,
  Trash2
} from 'lucide-react';
import Link from 'next/link';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ClassesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: classes, error, isLoading } = useSWR('/api/classes', fetcher);
  const { data: profile } = useSWR('/api/profile', fetcher);

  const filteredClasses = (classes || []).filter((cls: any) =>
    cls.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.grade_level?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Classes</h1>
        </div>
        <div className="grid gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-gray-200 rounded"></div>
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
          <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
          <p className="text-gray-600">Manage school classes and assignments</p>
        </div>
        {(profile?.role === 'admin' || profile?.role === 'principal') && (
          <Button asChild>
            <Link href="/dashboard/classes/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Class
            </Link>
          </Button>
        )}
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search classes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Classes List */}
      <div className="grid gap-4">
        {error ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500">Error loading classes. Database may not be configured.</p>
            </CardContent>
          </Card>
        ) : filteredClasses.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Found</h3>
              <p className="text-gray-500 mb-4">
                {searchTerm ? 'No classes match your search.' : 'No classes have been created yet.'}
              </p>
              {(profile?.role === 'admin' || profile?.role === 'principal') && !searchTerm && (
                <Button asChild>
                  <Link href="/dashboard/classes/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Class
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredClasses.map((cls: any) => (
            <Card key={cls.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">{cls.name}</h3>
                      <Badge variant="secondary">{cls.grade_level}</Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div className="flex items-center">
                        <UserCheck className="h-4 w-4 mr-2" />
                        Teacher: {cls.teacher?.full_name || 'Unassigned'}
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        Students: {cls.students?.length || 0}
                      </div>
                      <div className="flex items-center">
                        <GraduationCap className="h-4 w-4 mr-2" />
                        School: {cls.school?.name || 'Unknown'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/classes/${cls.id}`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    {(profile?.role === 'admin' || profile?.role === 'principal') && (
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Stats Summary */}
      {filteredClasses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-blue-600">{filteredClasses.length}</p>
                <p className="text-sm text-gray-600">Total Classes</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {filteredClasses.reduce((sum: number, cls: any) => sum + (cls.students?.length || 0), 0)}
                </p>
                <p className="text-sm text-gray-600">Total Students</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-600">
                  {filteredClasses.filter((cls: any) => cls.teacher_id).length}
                </p>
                <p className="text-sm text-gray-600">Assigned Teachers</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}