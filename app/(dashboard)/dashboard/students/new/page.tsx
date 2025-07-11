'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ParentSearchSelect } from '@/components/parent-search-select';
import { GraduationCap, ArrowLeft, AlertCircle } from 'lucide-react';
import useSWR, { mutate } from 'swr';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface StudentFormData {
  name: string;
  student_number: string;
  class_id: string;
  parent_id: string;
}

export default function NewStudentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedParent, setSelectedParent] = useState<any>(null);
  const [formData, setFormData] = useState<StudentFormData>({
    name: '',
    student_number: '',
    class_id: '',
    parent_id: ''
  });

  const { data: classes } = useSWR('/api/classes', fetcher);
  const safeClasses = Array.isArray(classes) ? classes : [];

  const handleParentSelect = (parent: any) => {
    setSelectedParent(parent);
    setFormData(prev => ({ ...prev, parent_id: parent?.id || '' }));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedParent) {
      setError('Please select a parent/guardian');
      return;
    }

    if (!formData.class_id) {
      setError('Please select a class');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create student');
      }

      // Refresh student data
      mutate('/api/students');
      mutate('/api/parents');
      
      router.push('/dashboard/students');
    } catch (error) {
      console.error('Error creating student:', error);
      setError(error instanceof Error ? error.message : 'Failed to create student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <Button variant="outline" asChild>
            <Link href="/dashboard/students">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Students
            </Link>
          </Button>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <GraduationCap className="mr-3 h-6 w-6" />
          Add New Student
        </h1>
        <p className="text-gray-600 mt-2">
          Create a new student record and link to a parent/guardian
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Student Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Student Name *</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  name: e.target.value 
                }))}
                placeholder="Enter student's full name"
                required
              />
            </div>

            {/* Student Number */}
            <div className="space-y-2">
              <Label htmlFor="student_number">Student Number (Optional)</Label>
              <Input
                id="student_number"
                type="text"
                value={formData.student_number}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  student_number: e.target.value 
                }))}
                placeholder="Enter student ID/number"
              />
            </div>

            {/* Class Selection */}
            <div className="space-y-2">
              <Label htmlFor="class_id">Class *</Label>
              <select
                id="class_id"
                value={formData.class_id}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  class_id: e.target.value 
                }))}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select a class</option>
                {safeClasses.map((classItem: any) => (
                  <option key={classItem.id} value={classItem.id}>
                    {classItem.name} - {classItem.grade_level}
                    {classItem.teacher?.full_name && ` (${classItem.teacher.full_name})`}
                  </option>
                ))}
              </select>
            </div>

            {/* Parent Selection */}
            <div className="space-y-2">
              <Label>Parent/Guardian *</Label>
              <ParentSearchSelect
                onSelect={handleParentSelect}
                selectedParent={selectedParent}
              />
              {selectedParent && (
                <div className="p-3 bg-blue-50 rounded-md">
                  <p className="text-sm font-medium text-blue-900">
                    Selected: {selectedParent.name}
                  </p>
                  <p className="text-sm text-blue-700">
                    Contact: {selectedParent.contact_number || 'N/A'}
                  </p>
                  <p className="text-sm text-blue-700">
                    Current Students: {selectedParent.students?.length || 0}
                  </p>
                  <p className="text-sm text-blue-700">
                    Payment Status: {selectedParent.payment_status ? 'Paid' : 'Unpaid'}
                  </p>
                </div>
              )}
            </div>

            {/* Payment Status Info */}
            {selectedParent && (
              <div className={`p-4 rounded-md border ${
                selectedParent.payment_status 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-orange-50 border-orange-200'
              }`}>
                <div className="flex items-start">
                  <AlertCircle className={`h-5 w-5 mt-0.5 mr-2 ${
                    selectedParent.payment_status ? 'text-green-600' : 'text-orange-600'
                  }`} />
                  <div>
                    <h4 className={`font-medium ${
                      selectedParent.payment_status ? 'text-green-800' : 'text-orange-800'
                    }`}>
                      Payment Status Notice
                    </h4>
                    <p className={`text-sm mt-1 ${
                      selectedParent.payment_status ? 'text-green-700' : 'text-orange-700'
                    }`}>
                      {selectedParent.payment_status 
                        ? 'This parent has already paid. The new student will automatically be marked as paid.'
                        : 'This parent has not paid yet. The new student will be marked as unpaid until payment is recorded.'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="flex items-center p-3 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={loading || !selectedParent || !formData.class_id}
                className="flex-1"
              >
                {loading ? 'Creating Student...' : 'Create Student'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard/students')}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}