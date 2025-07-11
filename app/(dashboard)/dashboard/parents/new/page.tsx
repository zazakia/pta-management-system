'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, ArrowLeft, AlertCircle } from 'lucide-react';
import useSWR, { mutate } from 'swr';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface ParentFormData {
  name: string;
  contact_number: string;
  email: string;
  school_id: string;
  user_id?: string;
}

export default function NewParentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState<ParentFormData>({
    name: '',
    contact_number: '',
    email: '',
    school_id: ''
  });

  const { data: schools } = useSWR('/api/schools', fetcher);
  const { data: profile } = useSWR('/api/profile', fetcher);
  
  // Ensure schools is always an array
  const safeSchools = Array.isArray(schools) ? schools : [];

  // Pre-select user's school if they have one
  useState(() => {
    if (profile?.school_id) {
      setFormData(prev => ({ ...prev, school_id: profile.school_id }));
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/parents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create parent');
      }

      // Refresh parent data
      mutate('/api/parents');
      
      router.push('/dashboard/parents');
    } catch (error) {
      console.error('Error creating parent:', error);
      setError(error instanceof Error ? error.message : 'Failed to create parent');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <Button variant="outline" asChild>
            <Link href="/dashboard/parents">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Parents
            </Link>
          </Button>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 flex items-center">
          <Users className="mr-3 h-6 w-6" />
          Add New Parent/Guardian
        </h1>
        <p className="text-gray-600 mt-2">
          Create a new parent/guardian record in the system
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Parent/Guardian Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  name: e.target.value 
                }))}
                placeholder="Enter parent/guardian full name"
                required
              />
            </div>

            {/* Contact Number */}
            <div className="space-y-2">
              <Label htmlFor="contact_number">Contact Number</Label>
              <Input
                id="contact_number"
                type="tel"
                value={formData.contact_number}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  contact_number: e.target.value 
                }))}
                placeholder="Enter phone number"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  email: e.target.value 
                }))}
                placeholder="Enter email address"
              />
            </div>

            {/* School Selection */}
            <div className="space-y-2">
              <Label htmlFor="school_id">School *</Label>
              <select
                id="school_id"
                value={formData.school_id}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  school_id: e.target.value 
                }))}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select a school</option>
                {safeSchools.map((school: any) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Information Notice */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 mr-2" />
                <div>
                  <h4 className="font-medium text-blue-800">Payment Status</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    New parents will be created with "unpaid" status. You can record their payment 
                    later through the payment recording system, which will automatically mark 
                    all their children as paid.
                  </p>
                </div>
              </div>
            </div>

            {/* Optional Account Linking */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-gray-600 mt-0.5 mr-2" />
                <div>
                  <h4 className="font-medium text-gray-800">Account Linking</h4>
                  <p className="text-sm text-gray-700 mt-1">
                    Parents can create their own accounts and link to this record later. 
                    This allows them to view their children's status and payment history 
                    through the parent dashboard.
                  </p>
                </div>
              </div>
            </div>

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
                disabled={loading || !formData.name || !formData.school_id}
                className="flex-1"
              >
                {loading ? 'Creating Parent...' : 'Create Parent'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push('/dashboard/parents')}
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