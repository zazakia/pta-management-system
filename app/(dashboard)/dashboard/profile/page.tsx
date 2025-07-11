'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { 
  User, 
  Mail, 
  School, 
  Shield,
  Save,
  AlertCircle
} from 'lucide-react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ProfilePage() {
  const { data: profile, error, mutate } = useSWR('/api/profile', fetcher);
  const { data: schools } = useSWR('/api/schools', fetcher);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    role: '',
    school_id: ''
  });

  // Initialize form data when profile loads
  useState(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        role: profile.role || '',
        school_id: profile.school_id || ''
      });
    }
  });

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        mutate(); // Refresh profile data
        setIsEditing(false);
        alert('Profile updated successfully!');
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Error Loading Profile</h2>
            <p className="text-gray-600">Unable to load profile data. Database may not be configured.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Profile</h1>
        </div>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-32 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600">Manage your account information and preferences</p>
        </div>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)}>
            <User className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        ) : (
          <div className="space-x-2">
            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isLoading}>
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="mr-2 h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Full Name */}
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            {isEditing ? (
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Enter your full name"
              />
            ) : (
              <div className="flex items-center p-2 bg-gray-50 rounded-md">
                <User className="h-4 w-4 text-gray-400 mr-2" />
                <span>{profile.full_name || 'Not set'}</span>
              </div>
            )}
          </div>

          {/* Email (read-only) */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="flex items-center p-2 bg-gray-50 rounded-md">
              <Mail className="h-4 w-4 text-gray-400 mr-2" />
              <span>{profile.email || 'Not available'}</span>
              <span className="ml-auto text-xs text-gray-500">Cannot be changed</span>
            </div>
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label>Role</Label>
            {isEditing ? (
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
            ) : (
              <div className="flex items-center p-2 bg-gray-50 rounded-md">
                <Shield className="h-4 w-4 text-gray-400 mr-2" />
                <span className="capitalize">{profile.role || 'Not set'}</span>
              </div>
            )}
          </div>

          {/* School */}
          <div className="space-y-2">
            <Label htmlFor="school">School</Label>
            {isEditing ? (
              <select
                id="school"
                value={formData.school_id}
                onChange={(e) => setFormData(prev => ({ ...prev, school_id: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Select a school</option>
                {(schools || []).map((school: any) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center p-2 bg-gray-50 rounded-md">
                <School className="h-4 w-4 text-gray-400 mr-2" />
                <span>{profile.school?.name || 'Not assigned'}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Account Status */}
      <Card>
        <CardHeader>
          <CardTitle>Account Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Account Type:</span>
              <span className="font-medium capitalize">{profile.role || 'Standard'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Member Since:</span>
              <span className="font-medium">
                {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Profile Status:</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Active
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              If you need to change your email address or have issues with your account, 
              please contact your school administrator.
            </p>
            <div className="space-y-2">
              <h4 className="font-medium">Role Descriptions:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li><strong>Parent:</strong> View your children's payment status</li>
                <li><strong>Teacher:</strong> View students in your classes</li>
                <li><strong>Treasurer:</strong> Record payments and manage finances</li>
                <li><strong>Principal:</strong> Full access to school data</li>
                <li><strong>Admin:</strong> System administration access</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}