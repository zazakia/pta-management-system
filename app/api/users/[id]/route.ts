import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/lib/supabase/types';
import { userProfilesCRUD } from '@/lib/supabase/crud';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ 
      cookies: () => cookieStore 
    });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Users can view their own profile or admins/principals can view any profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (session.user.id !== resolvedParams.id && 
        (!profile || !['admin', 'principal'].includes(profile.role))) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    try {
      const user = await userProfilesCRUD.getById(resolvedParams.id);
      return NextResponse.json(user);
    } catch (dbError) {
      console.log('Database not available');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ 
      cookies: () => cookieStore 
    });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Users can update their own profile or admins can update any profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (session.user.id !== resolvedParams.id && 
        (!profile || !['admin'].includes(profile.role))) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { full_name, role, school_id } = body;

    try {
      const user = await userProfilesCRUD.update(resolvedParams.id, {
        full_name,
        role: role as any,
        school_id,
      });

      return NextResponse.json(user);
    } catch (dbError) {
      console.error('Database error updating user:', dbError);
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ 
      cookies: () => cookieStore 
    });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can delete users and they cannot delete themselves
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!profile || !['admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only admins can delete users.' },
        { status: 403 }
      );
    }

    if (session.user.id === resolvedParams.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      );
    }

    try {
      await userProfilesCRUD.delete(resolvedParams.id);
      return NextResponse.json({ success: true });
    } catch (dbError) {
      console.error('Database error deleting user:', dbError);
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}