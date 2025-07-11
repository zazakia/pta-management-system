'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Plus, 
  Search, 
  Edit2, 
  Trash2,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  GraduationCap,
  CreditCard
} from 'lucide-react';
import useSWR, { mutate } from 'swr';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface Parent {
  id: string;
  name: string;
  contact_number: string | null;
  email: string | null;
  payment_status: boolean;
  payment_date: string | null;
  students: Array<{
    id: string;
    name: string;
    class: {
      name: string;
      grade_level: string;
    };
  }>;
  school: {
    name: string;
  };
}

function ParentCard({ parent }: { parent: Parent }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${parent.name}? This will also remove all associated students.`)) return;
    
    setDeleting(true);
    try {
      const response = await fetch(`/api/parents/${parent.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete parent');
      
      mutate('/api/parents');
      mutate('/api/students');
    } catch (error) {
      console.error('Error deleting parent:', error);
      alert('Failed to delete parent');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-semibold text-lg">{parent.name}</h3>
              {parent.payment_status ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
            </div>
            
            <div className="space-y-2 text-sm text-gray-600">
              {parent.contact_number && (
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  {parent.contact_number}
                </div>
              )}
              {parent.email && (
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  {parent.email}
                </div>
              )}
              <div className="flex items-center">
                <GraduationCap className="h-4 w-4 mr-2" />
                {parent.students?.length || 0} student{parent.students?.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <Link href={`/dashboard/parents/${parent.id}/edit`}>
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

        {/* Payment Status */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Payment Status:</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              parent.payment_status 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {parent.payment_status ? 'Paid' : 'Unpaid'}
            </span>
          </div>
          {parent.payment_status && parent.payment_date && (
            <p className="text-xs text-gray-500 mt-1">
              Paid on {new Date(parent.payment_date).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Students */}
        {parent.students && parent.students.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-medium text-sm mb-2">Children:</h4>
            <div className="space-y-2">
              {parent.students.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div>
                    <p className="font-medium text-sm">{student.name}</p>
                    <p className="text-xs text-gray-600">
                      {student.class?.name} ({student.class?.grade_level})
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        {!parent.payment_status && (
          <div className="border-t pt-4 mt-4">
            <Button 
              asChild 
              size="sm" 
              className="w-full"
            >
              <Link href={`/dashboard/record-payment?parent=${parent.id}`}>
                <CreditCard className="mr-2 h-4 w-4" />
                Record Payment
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FilterBar({ 
  searchTerm, 
  setSearchTerm, 
  paymentFilter, 
  setPaymentFilter 
}: {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  paymentFilter: string;
  setPaymentFilter: (filter: string) => void;
}) {
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative col-span-2">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search parents by name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">All Payment Status</option>
            <option value="paid">Paid</option>
            <option value="unpaid">Unpaid</option>
          </select>
        </div>

        <div className="flex justify-end mt-4">
          <Button asChild>
            <Link href="/dashboard/parents/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Parent
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ParentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');

  const { data: parents, isLoading, error } = useSWR<Parent[]>('/api/parents', fetcher);

  const filteredParents = parents?.filter(parent => {
    const matchesSearch = parent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         parent.contact_number?.includes(searchTerm) ||
                         parent.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesPayment = !paymentFilter || 
                          (paymentFilter === 'paid' && parent.payment_status) ||
                          (paymentFilter === 'unpaid' && !parent.payment_status);

    return matchesSearch && matchesPayment;
  }) || [];

  const totalParents = parents?.length || 0;
  const paidParents = parents?.filter(p => p.payment_status).length || 0;
  const totalStudents = parents?.reduce((sum, p) => sum + (p.students?.length || 0), 0) || 0;

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-600">Error loading parents: {error.message}</p>
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
            <Users className="mr-3 h-6 w-6" />
            Parent Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage parent/guardian records and payment status
          </p>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">{totalParents}</div>
          <div className="text-sm text-gray-600">
            {paidParents} paid • {totalParents - paidParents} unpaid
          </div>
        </div>
      </div>

      {/* Filters */}
      <FilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        paymentFilter={paymentFilter}
        setPaymentFilter={setPaymentFilter}
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{totalParents}</div>
            <div className="text-sm text-gray-600">Total Parents</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{paidParents}</div>
            <div className="text-sm text-gray-600">Paid</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{totalParents - paidParents}</div>
            <div className="text-sm text-gray-600">Unpaid</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{totalStudents}</div>
            <div className="text-sm text-gray-600">Total Students</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {Math.round((paidParents / totalParents) * 100) || 0}%
            </div>
            <div className="text-sm text-gray-600">Payment Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Parents Grid */}
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
      ) : filteredParents.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {parents?.length === 0 ? 'No parents found' : 'No parents match your filters'}
            </h3>
            <p className="text-gray-600 mb-4">
              {parents?.length === 0 
                ? 'Get started by adding your first parent/guardian.'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
            {parents?.length === 0 && (
              <Button asChild>
                <Link href="/dashboard/parents/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Parent
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredParents.map((parent) => (
            <ParentCard key={parent.id} parent={parent} />
          ))}
        </div>
      )}
    </div>
  );
}