'use client';

import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap, Users, GraduationCap, CreditCard, BarChart3 } from 'lucide-react';

interface PTALoginProps {
  mode: 'signin' | 'signup';
}

export function PTALogin({ mode }: PTALoginProps) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [demoLoading, setDemoLoading] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          // Check if user has a profile
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            router.push('/dashboard');
          } else {
            // New user - redirect to profile setup
            router.push('/setup-profile');
          }
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth, router]);

  const handleAdminAccess = async () => {
    setDemoLoading(true);
    try {
      // Check if Supabase is configured
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        alert('Please configure your Supabase environment variables in .env.local file');
        return;
      }

      // Auto-fill admin credentials
      const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
      const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
      
      if (emailInput && passwordInput) {
        emailInput.value = 'admin@gmail.com';
        passwordInput.value = 'admin123456';
        
        // Trigger events to update form state
        emailInput.dispatchEvent(new Event('input', { bubbles: true }));
        passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
        
        alert('Demo credentials filled! Now click "Sign In to PTA" or manually create an account with these credentials:\n\nEmail: admin@gmail.com\nPassword: admin123456\n\nAfter signing in, set your role to "admin" in the profile setup.');
      } else {
        alert('Demo Credentials:\n\nEmail: admin@gmail.com\nPassword: admin123456\n\nPlease enter these credentials manually and set your role to "admin" during profile setup.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Demo Credentials:\n\nEmail: admin@gmail.com\nPassword: admin123456');
    } finally {
      setDemoLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="w-full max-w-4xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Login Form */}
          <Card className="w-full">
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">
                {mode === 'signin' ? 'Welcome Back' : 'Join PTA'}
              </CardTitle>
              <p className="text-sm text-gray-600 text-center">
                {mode === 'signin' 
                  ? 'Sign in to your PTA account'
                  : 'Create your PTA account'
                }
              </p>
            </CardHeader>
            <CardContent>
              <Auth
                supabaseClient={supabase as any}
                view={mode === 'signin' ? 'sign_in' : 'sign_up'}
                appearance={{
                  theme: ThemeSupa,
                  variables: {
                    default: {
                      colors: {
                        brand: '#404040',
                        brandAccent: '#525252',
                      },
                    },
                  },
                }}
                providers={[]}
                redirectTo={`${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`}
                showLinks={true}
                localization={{
                  variables: {
                    sign_in: {
                      email_label: 'Email Address',
                      password_label: 'Password',
                      button_label: 'Sign In to PTA',
                      loading_button_label: 'Signing in...',
                    },
                    sign_up: {
                      email_label: 'Email Address',
                      password_label: 'Password',
                      button_label: 'Create PTA Account',
                      loading_button_label: 'Creating account...',
                    },
                  },
                }}
              />
            </CardContent>
          </Card>

          {/* Demo Access Card */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-center flex items-center justify-center">
                <Zap className="mr-2 h-6 w-6 text-yellow-500" />
                Quick Demo Access
              </CardTitle>
              <p className="text-sm text-gray-600 text-center">
                Get instant access to explore the full PTA management system
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Admin Access Button */}
              <Button
                onClick={handleAdminAccess}
                disabled={demoLoading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 text-lg"
              >
                {demoLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Loading demo credentials...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-5 w-5" />
                    Fill Demo Credentials
                  </>
                )}
              </Button>

              {/* Features Preview */}
              <div className="mt-6 space-y-3">
                <h4 className="font-medium text-gray-900">With admin access you can:</h4>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <CreditCard className="mr-2 h-4 w-4 text-green-500" />
                    Record and track PTA payments
                  </div>
                  <div className="flex items-center">
                    <Users className="mr-2 h-4 w-4 text-blue-500" />
                    Manage parents and students
                  </div>
                  <div className="flex items-center">
                    <GraduationCap className="mr-2 h-4 w-4 text-purple-500" />
                    Organize classes and teachers
                  </div>
                  <div className="flex items-center">
                    <BarChart3 className="mr-2 h-4 w-4 text-orange-500" />
                    View detailed reports and analytics
                  </div>
                </div>
              </div>

              {/* Demo Credentials */}
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h4 className="font-medium text-blue-900 mb-2">Demo Credentials:</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-700">Email:</span>
                    <code className="font-mono text-blue-900">admin@gmail.com</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Password:</span>
                    <code className="font-mono text-blue-900">admin123456</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-700">Role:</span>
                    <span className="font-medium text-blue-900">Admin</span>
                  </div>
                </div>
                <p className="text-xs text-blue-600 mt-2">
                  ⚡ Click "Fill Demo Credentials" to auto-fill the form, then sign up/in normally
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}