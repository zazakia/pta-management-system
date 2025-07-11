import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/lib/supabase/types';
import { userProfilesCRUD } from '@/lib/supabase/crud';

export async function GET(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ 
      cookies: () => cookieStore 
    });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to view users
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!profile || !['admin', 'principal'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('school_id');
    const role = searchParams.get('role');

    try {
      const users = await userProfilesCRUD.getAll(schoolId || undefined, role || undefined);
      return NextResponse.json(users);
    } catch (dbError) {
      console.log('Database not available, returning empty users array');
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ 
      cookies: () => cookieStore 
    });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to create users
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!profile || !['admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only admins can create users.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { id, full_name, role, school_id } = body;

    try {
      const user = await userProfilesCRUD.create({
        id,
        full_name,
        role: role as any,
        school_id,
      });

      return NextResponse.json(user);
    } catch (dbError) {
      console.error('Database error creating user:', dbError);
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}