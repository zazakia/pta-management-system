import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/lib/supabase/types';
import { schoolsCRUD } from '@/lib/supabase/crud';

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

    try {
      const school = await schoolsCRUD.getById(resolvedParams.id);
      return NextResponse.json(school);
    } catch (dbError) {
      console.log('Database not available');
      return NextResponse.json({ error: 'School not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error fetching school:', error);
    return NextResponse.json(
      { error: 'Failed to fetch school' },
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

    // Check if user has permission to update schools
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!profile || !['admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only admins can update schools.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, address } = body;

    try {
      const school = await schoolsCRUD.update(resolvedParams.id, {
        name,
        address,
      });

      return NextResponse.json(school);
    } catch (dbError) {
      console.error('Database error updating school:', dbError);
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Error updating school:', error);
    return NextResponse.json(
      { error: 'Failed to update school' },
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

    // Check if user has permission to delete schools
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!profile || !['admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Only admins can delete schools.' },
        { status: 403 }
      );
    }

    try {
      await schoolsCRUD.delete(resolvedParams.id);
      return NextResponse.json({ success: true });
    } catch (dbError) {
      console.error('Database error deleting school:', dbError);
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Error deleting school:', error);
    return NextResponse.json(
      { error: 'Failed to delete school' },
      { status: 500 }
    );
  }
}