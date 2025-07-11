'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  UserPlus, 
  Plus, 
  Search, 
  Edit2, 
  Trash2,
  Users,
  Crown,
  UserCheck,
  User,
  Shield,
  Mail,
  Calendar,
  MoreHorizontal,
  Filter
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

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  school: {
    id: string;
    name: string;
  };
  created_at: string;
  last_sign_in_at?: string;
}

const roleIcons = {
  admin: Crown,
  principal: Shield,
  treasurer: UserCheck,
  teacher: UserCheck,
  parent: User,
};

const roleColors = {
  admin: 'bg-purple-100 text-purple-800',
  principal: 'bg-blue-100 text-blue-800',
  treasurer: 'bg-green-100 text-green-800',
  teacher: 'bg-orange-100 text-orange-800',
  parent: 'bg-gray-100 text-gray-800',
};

function UserCard({ user }: { user: User }) {
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const RoleIcon = roleIcons[user.role as keyof typeof roleIcons] || User;

  const handleChangeRole = async (newRole: string) => {
    if (!confirm(`Change ${user.full_name}'s role to ${newRole}?`)) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      
      if (!response.ok) throw new Error('Failed to update user role');
      
      mutate('/api/users');
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${user.full_name}?`)) return;
    
    setDeleting(true);
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete user');
      
      mutate('/api/users');
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-gray-100 rounded-full">
              <RoleIcon className="h-6 w-6 text-gray-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <h3 className="font-semibold text-lg text-gray-900">{user.full_name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[user.role as keyof typeof roleColors]}`}>
                  {user.role}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center text-sm text-gray-600">
                  <Mail className="h-4 w-4 mr-2" />
                  {user.email}
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-2" />
                  Joined {new Date(user.created_at).toLocaleDateString()}
                </div>
                {user.last_sign_in_at && (
                  <div className="flex items-center text-sm text-gray-600">
                    <User className="h-4 w-4 mr-2" />
                    Last active {new Date(user.last_sign_in_at).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={loading || deleting}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleChangeRole('admin')}>
                <Crown className="h-4 w-4 mr-2" />
                Make Admin
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleChangeRole('principal')}>
                <Shield className="h-4 w-4 mr-2" />
                Make Principal
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleChangeRole('treasurer')}>
                <UserCheck className="h-4 w-4 mr-2" />
                Make Treasurer
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleChangeRole('teacher')}>
                <UserCheck className="h-4 w-4 mr-2" />
                Make Teacher
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleChangeRole('parent')}>
                <User className="h-4 w-4 mr-2" />
                Make Parent
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleDelete}
                disabled={deleting}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete User
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const { data: users, isLoading, error } = useSWR('/api/users', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  });

  const filteredUsers = users?.filter((user: User) => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = !roleFilter || user.role === roleFilter;
    
    return matchesSearch && matchesRole;
  }) || [];

  const userStats = users?.reduce((acc: any, user: User) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {}) || {};

  if (error) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-red-600">Error loading users: {error.message}</p>
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
            <UserPlus className="mr-3 h-6 w-6" />
            User Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage user accounts and roles
          </p>
        </div>
        
        <Button asChild>
          <Link href="/dashboard/users/new">
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Link>
        </Button>
      </div>

      {/* User Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {Object.entries(userStats).map(([role, count]) => {
          const RoleIcon = roleIcons[role as keyof typeof roleIcons] || User;
          return (
            <Card key={role}>
              <CardContent className="p-4 text-center">
                <RoleIcon className="h-8 w-8 mx-auto mb-2 text-gray-600" />
                <div className="text-2xl font-bold text-gray-900">{count as number}</div>
                <div className="text-sm text-gray-600 capitalize">{role}s</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="principal">Principal</option>
              <option value="treasurer">Treasurer</option>
              <option value="teacher">Teacher</option>
              <option value="parent">Parent</option>
            </select>

            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              Advanced Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-24 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {users?.length === 0 ? 'No users found' : 'No users match your filters'}
            </h3>
            <p className="text-gray-600 mb-4">
              {users?.length === 0 
                ? 'Get started by adding your first user.'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
            {users?.length === 0 && (
              <Button asChild>
                <Link href="/dashboard/users/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add First User
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user: User) => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      )}
    </div>
  );
}