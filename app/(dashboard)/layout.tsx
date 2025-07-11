'use client';

import Link from 'next/link';
import React, { useState, Suspense, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { 
  CircleIcon, 
  Home, 
  LogOut, 
  Users, 
  GraduationCap, 
  CreditCard, 
  BarChart3, 
  Settings,
  UserCheck,
  School,
  Plus,
  FileText,
  CalendarDays,
  DollarSign,
  Eye,
  Edit3,
  UserPlus,
  Building2,
  ClipboardCheck,
  TrendingUp,
  Activity
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import useSWR, { mutate } from 'swr';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function UserMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: profile } = useSWR('/api/profile', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // 1 minute
  });
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const handleSignOut = useCallback(async () => {
    await supabase.auth.signOut();
    mutate('/api/profile');
    router.push('/');
  }, [supabase, router]);

  if (!profile) {
    return (
      <div className="flex items-center space-x-4">
        <Button asChild className="rounded-full">
          <Link href="/sign-up">Sign Up</Link>
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <DropdownMenuTrigger>
        <Avatar className="cursor-pointer size-9">
          <AvatarImage alt={profile.full_name || ''} />
          <AvatarFallback>
            {profile.full_name
              ?.split(' ')
              .map((n: string) => n[0])
              .join('') || 'U'}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="flex flex-col gap-1">
        <DropdownMenuItem className="cursor-pointer">
          <Link href="/dashboard" className="flex w-full items-center">
            <Home className="mr-2 h-4 w-4" />
            <span>Dashboard</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="cursor-pointer">
          <Link href="/dashboard/profile" className="flex w-full items-center">
            <Settings className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </Link>
        </DropdownMenuItem>
        <form action={handleSignOut} className="w-full">
          <button type="submit" className="flex w-full">
            <DropdownMenuItem className="w-full flex-1 cursor-pointer">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign out</span>
            </DropdownMenuItem>
          </button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Sidebar() {
  const { data: profile } = useSWR('/api/profile', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // 1 minute
  });

  const navItems = useMemo(() => {
    const baseItems = [
      { href: '/dashboard', icon: Home, label: 'Dashboard' },
    ];

    if (!profile) return baseItems;

    switch (profile.role) {
      case 'parent':
        return [
          ...baseItems,
          { 
            label: 'Family',
            items: [
              { href: '/dashboard/my-children', icon: Users, label: 'My Children' },
              { href: '/dashboard/my-payments', icon: CreditCard, label: 'Payment History' },
              { href: '/dashboard/profile', icon: Settings, label: 'My Profile' },
            ]
          }
        ];
      case 'teacher':
        return [
          ...baseItems,
          { 
            label: 'Teaching',
            items: [
              { href: '/dashboard/my-classes', icon: GraduationCap, label: 'My Classes' },
              { href: '/dashboard/students', icon: Users, label: 'Class Students' },
              { href: '/dashboard/payment-status', icon: ClipboardCheck, label: 'Payment Status' },
            ]
          },
          { 
            label: 'Account',
            items: [
              { href: '/dashboard/profile', icon: Settings, label: 'My Profile' },
            ]
          }
        ];
      case 'treasurer':
        return [
          ...baseItems,
          { 
            label: 'Payments',
            items: [
              { href: '/dashboard/record-payment', icon: Plus, label: 'Record Payment' },
              { href: '/dashboard/payments', icon: CreditCard, label: 'All Payments' },
              { href: '/dashboard/reports', icon: BarChart3, label: 'Payment Reports' },
              { href: '/dashboard/income-reports', icon: TrendingUp, label: 'Income Reports' },
              { href: '/dashboard/collections', icon: DollarSign, label: 'Collections' },
            ]
          },
          { 
            label: 'Management',
            items: [
              { href: '/dashboard/parents', icon: Users, label: 'Parents' },
              { href: '/dashboard/parents/new', icon: UserPlus, label: 'Add Parent' },
              { href: '/dashboard/students', icon: GraduationCap, label: 'Students' },
              { href: '/dashboard/students/new', icon: Plus, label: 'Add Student' },
            ]
          },
          { 
            label: 'Reports',
            items: [
              { href: '/dashboard/reports', icon: FileText, label: 'Financial Reports' },
              { href: '/dashboard/exports', icon: Eye, label: 'Export Data' },
            ]
          }
        ];
      case 'principal':
      case 'admin':
        return [
          ...baseItems,
          { 
            label: 'Overview',
            items: [
              { href: '/dashboard/reports', icon: BarChart3, label: 'School Reports' },
              { href: '/dashboard/analytics', icon: Activity, label: 'Analytics' },
              { href: '/dashboard/collections', icon: DollarSign, label: 'Collections' },
            ]
          },
          { 
            label: 'Payments',
            items: [
              { href: '/dashboard/record-payment', icon: Plus, label: 'Record Payment' },
              { href: '/dashboard/payments', icon: CreditCard, label: 'All Payments' },
              { href: '/dashboard/reports', icon: FileText, label: 'Payment Reports' },
              { href: '/dashboard/income-reports', icon: TrendingUp, label: 'Income Reports' },
            ]
          },
          { 
            label: 'Management',
            items: [
              { href: '/dashboard/parents', icon: Users, label: 'Parents' },
              { href: '/dashboard/students', icon: GraduationCap, label: 'Students' },
              { href: '/dashboard/classes', icon: School, label: 'Classes' },
              { href: '/dashboard/teachers', icon: UserCheck, label: 'Teachers' },
            ]
          },
          { 
            label: 'Administration',
            items: [
              { href: '/dashboard/users', icon: UserPlus, label: 'User Management' },
              { href: '/dashboard/schools', icon: Building2, label: 'Schools' },
              { href: '/dashboard/settings', icon: Settings, label: 'Settings' },
              { href: '/dashboard/exports', icon: Eye, label: 'Export Data' },
            ]
          }
        ];
      default:
        return baseItems;
    }
  }, [profile]);

  return (
    <aside className="w-64 bg-white border-r border-gray-200">
      <div className="p-6">
        <Link href="/" className="flex items-center">
          <School className="h-8 w-8 text-blue-600" />
          <span className="ml-2 text-xl font-bold text-gray-900">PTA Manager</span>
        </Link>
      </div>
      <nav className="mt-6">
        <div className="px-3">
          {navItems.map((item, index) => (
            <div key={index}>
              {'href' in item ? (
                // Single navigation item
                <Link
                  href={(item as any).href}
                  className="group flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:text-gray-900 hover:bg-gray-50 mb-1 transition-colors duration-150"
                  prefetch={true}
                >
                  {React.createElement((item as any).icon, { className: "mr-3 h-5 w-5" })}
                  {item.label}
                </Link>
              ) : (
                // Grouped navigation section
                <div className="mb-6">
                  <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    {item.label}
                  </h3>
                  <div className="space-y-1">
                    {(item as any).items?.map((subItem: any) => (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        className="group flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:text-gray-900 hover:bg-gray-50 transition-colors duration-150"
                        prefetch={true}
                      >
                        {React.createElement(subItem.icon, { className: "mr-3 h-4 w-4" })}
                        {subItem.label}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </nav>
    </aside>
  );
}

function Header() {
  const { data: profile } = useSWR('/api/profile', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 60000, // 1 minute
  });

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="px-6 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            Welcome back, {profile?.full_name || 'User'}
          </h1>
          <p className="text-sm text-gray-600 capitalize">
            {profile?.role} • {profile?.school?.name}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Suspense fallback={<div className="h-9" />}>
            <MemoizedUserMenu />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

// Memoized components for better performance
const MemoizedUserMenu = React.memo(UserMenu);
const MemoizedSidebar = React.memo(Sidebar);
const MemoizedHeader = React.memo(Header);

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-gray-50">
      <MemoizedSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <MemoizedHeader />
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
