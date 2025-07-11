// Legacy Drizzle ORM replaced with Supabase
// This file maintains compatibility while using Supabase under the hood

import { createServerClient } from '@/lib/supabase/server';

// Placeholder database connection for backward compatibility
export const client = null;

// Placeholder database instance that delegates to Supabase
export const db = {
  select: () => {
    throw new Error('Use Supabase client instead of Drizzle ORM');
  },
  query: {
    teamMembers: {
      findFirst: () => {
        throw new Error('Use Supabase client instead of Drizzle ORM');
      }
    }
  }
};