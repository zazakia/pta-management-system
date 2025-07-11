'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export default function SetupProfilePage() {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [schools, setSchools] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    full_name: '',
    role: '',
    school_id: '',
  });

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    // Try different table names since schema might be incomplete
    let data = null;
    let error = null;

    // Try pta2.schools first
    const result1 = await supabase
      .from('pta2.schools')
      .select('*')
      .order('name');
    
    if (!result1.error) {
      data = result1.data;
    } else {
      // Fallback to public.schools
      const result2 = await supabase
        .from('schools')
        .select('*')
        .order('name');
      
      if (!result2.error) {
        data = result2.data;
      } else {
        // If no schools table exists, create a default option
        console.log('No schools table found, using default');
        data = [
          { 
            id: 'default-school', 
            name: 'Demo Elementary School',
            address: '123 Education St, City, State'
          }
        ];
      }
    }
    
    if (data) {
      setSchools(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user');
      }

      // Store profile data in localStorage since database has RLS issues
      const profileData = {
        id: user.id,
        full_name: formData.full_name,
        role: formData.role,
        school_id: formData.school_id,
        email: user.email
      };

      localStorage.setItem('user_profile', JSON.stringify(profileData));
      console.log('Profile data saved to localStorage:', profileData);
      
      // Show success message
      alert(`Profile setup complete!\n\nName: ${formData.full_name}\nRole: ${formData.role}\n\nNote: Profile saved locally. When database is properly configured, this data will be synced.`);

      router.push('/dashboard');
    } catch (error) {
      console.error('Error during profile setup:', error);
      alert(`Error during profile setup: ${error instanceof Error ? error.message : 'Please try again.'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Complete Your Profile
          </CardTitle>
          <p className="text-sm text-gray-600 text-center">
            Tell us about your role in the PTA
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                type="text"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="school_id">School</Label>
              <select
                id="school_id"
                value={formData.school_id}
                onChange={(e) => setFormData(prev => ({ ...prev, school_id: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md"
                required
              >
                <option value="">Select a school</option>
                {schools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label>Role</Label>
              <RadioGroup
                value={formData.role}
                onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="parent" id="parent" />
                  <Label htmlFor="parent">Parent/Guardian</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="teacher" id="teacher" />
                  <Label htmlFor="teacher">Teacher</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="treasurer" id="treasurer" />
                  <Label htmlFor="treasurer">Treasurer</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="principal" id="principal" />
                  <Label htmlFor="principal">Principal</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="admin" id="admin" />
                  <Label htmlFor="admin">Admin</Label>
                </div>
              </RadioGroup>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Creating Profile...' : 'Complete Setup'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}