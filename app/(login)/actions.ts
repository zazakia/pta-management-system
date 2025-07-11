'use server';

import { z } from 'zod';
import { createServerClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

const signInSchema = z.object({
  email: z.string().email().min(3).max(255),
  password: z.string().min(8).max(100)
});

export async function signIn(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const result = signInSchema.safeParse({ email, password });
  
  if (!result.success) {
    return {
      error: 'Invalid email or password format.',
      email,
      password
    };
  }

  const supabase = await createServerClient();
  
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    return {
      error: 'Invalid email or password. Please try again.',
      email,
      password
    };
  }

  redirect('/');
}

const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export async function signUp(prevState: any, formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const result = signUpSchema.safeParse({ email, password });
  
  if (!result.success) {
    return {
      error: 'Invalid email or password format.',
      email,
      password
    };
  }

  const supabase = await createServerClient();
  
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/auth/callback`
    }
  });

  if (error) {
    return {
      error: 'Failed to create account. Please try again.',
      email,
      password
    };
  }

  return {
    success: 'Please check your email to confirm your account.'
  };
}

export async function signOut() {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  redirect('/sign-in');
}

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(8).max(100),
  newPassword: z.string().min(8).max(100),
  confirmPassword: z.string().min(8).max(100)
});

export async function updatePassword(prevState: any, formData: FormData) {
  const currentPassword = formData.get('currentPassword') as string;
  const newPassword = formData.get('newPassword') as string;
  const confirmPassword = formData.get('confirmPassword') as string;

  const result = updatePasswordSchema.safeParse({
    currentPassword,
    newPassword,
    confirmPassword
  });

  if (!result.success) {
    return {
      error: 'Invalid password format.',
      currentPassword,
      newPassword,
      confirmPassword
    };
  }

  if (newPassword !== confirmPassword) {
    return {
      error: 'New password and confirmation password do not match.',
      currentPassword,
      newPassword,
      confirmPassword
    };
  }

  const supabase = await createServerClient();
  
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });

  if (error) {
    return {
      error: 'Failed to update password. Please try again.',
      currentPassword,
      newPassword,
      confirmPassword
    };
  }

  return {
    success: 'Password updated successfully.'
  };
}

export async function deleteAccount(prevState: any, formData: FormData) {
  try {
    const supabase = await createServerClient();
    
    // Sign out the user
    await supabase.auth.signOut();
    
    // Note: Account deletion would typically be handled by Supabase admin API
    // For now, we just sign out the user
    redirect('/sign-in');
  } catch (error) {
    return {
      error: 'Failed to delete account. Please try again.'
    };
  }
}

const updateAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address')
});

export async function updateAccount(prevState: any, formData: FormData) {
  const name = formData.get('name') as string;
  const email = formData.get('email') as string;

  const result = updateAccountSchema.safeParse({ name, email });
  
  if (!result.success) {
    return {
      error: 'Invalid name or email format.',
      name,
      email
    };
  }

  const supabase = await createServerClient();
  
  const { error } = await supabase.auth.updateUser({
    email,
    data: { full_name: name }
  });

  if (error) {
    return {
      error: 'Failed to update account. Please try again.',
      name,
      email
    };
  }

  return { 
    name, 
    success: 'Account updated successfully.' 
  };
}

// Placeholder functions for team functionality
export async function removeTeamMember(formData: FormData) {
  return { error: 'Team functionality not implemented yet.' };
}

export async function inviteTeamMember(formData: FormData) {
  return { error: 'Team functionality not implemented yet.' };
}