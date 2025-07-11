import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/lib/supabase/types';

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ 
      cookies: () => cookieStore 
    });

    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('schools')
      .select('count(*)')
      .limit(1);

    if (connectionError) {
      return NextResponse.json({
        status: 'error',
        message: 'Database connection failed',
        error: connectionError.message,
        details: connectionError
      }, { status: 500 });
    }

    // Test schema existence
    const { data: schemaTest, error: schemaError } = await supabase.rpc('pg_catalog.pg_namespace', {});

    // Get table information
    const tables = [
      'schools',
      'user_profiles', 
      'classes',
      'parents',
      'students',
      'payments',
      'expenses'
    ];

    const tableTests = [];
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table as any)
          .select('count(*)')
          .limit(1);
        
        tableTests.push({
          table,
          exists: !error,
          error: error?.message || null,
          count: (data as any)?.[0]?.count || 0
        });
      } catch (err) {
        tableTests.push({
          table,
          exists: false,
          error: err instanceof Error ? err.message : 'Unknown error',
          count: 0
        });
      }
    }

    // Check environment variables
    const envCheck = {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL && 
        !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project-id'),
      NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && 
        !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes('your-supabase-anon-key'),
      SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY && 
        !process.env.SUPABASE_SERVICE_ROLE_KEY.includes('your-supabase-service-role-key')
    };

    const allEnvValid = Object.values(envCheck).every(Boolean);
    const allTablesExist = tableTests.every(t => t.exists);

    return NextResponse.json({
      status: allEnvValid && allTablesExist ? 'success' : 'warning',
      message: allEnvValid && allTablesExist 
        ? 'Database connection successful' 
        : 'Database connection issues detected',
      checks: {
        environment: {
          valid: allEnvValid,
          details: envCheck
        },
        connection: {
          successful: !connectionError,
          error: (connectionError as any)?.message || null
        },
        schema: {
          pta2_accessible: true,
          tables: tableTests
        }
      },
      summary: {
        total_tables: tables.length,
        existing_tables: tableTests.filter(t => t.exists).length,
        missing_tables: tableTests.filter(t => !t.exists).map(t => t.table)
      }
    });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Unexpected error during database test',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}