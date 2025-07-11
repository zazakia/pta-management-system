import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/lib/supabase/types';
import { classesCRUD } from '@/lib/supabase/crud';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ 
      cookies: () => cookieStore 
    });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
      const classData = await classesCRUD.getById(resolvedParams.id);
      return NextResponse.json(classData);
    } catch (dbError) {
      console.log('Database not available');
      return NextResponse.json({ error: 'Class not found' }, { status: 404 });
    }
  } catch (error) {
    console.error('Error fetching class:', error);
    return NextResponse.json(
      { error: 'Failed to fetch class' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ 
      cookies: () => cookieStore 
    });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to update classes
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

    const body = await request.json();
    const { name, grade_level, teacher_id, school_id } = body;

    try {
      const classData = await classesCRUD.update(resolvedParams.id, {
        name,
        grade_level,
        teacher_id,
        school_id,
      });

      return NextResponse.json(classData);
    } catch (dbError) {
      console.error('Database error updating class:', dbError);
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Error updating class:', error);
    return NextResponse.json(
      { error: 'Failed to update class' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ 
      cookies: () => cookieStore 
    });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has permission to delete classes
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

    try {
      await classesCRUD.delete(resolvedParams.id);
      return NextResponse.json({ success: true });
    } catch (dbError) {
      console.error('Database error deleting class:', dbError);
      return NextResponse.json(
        { error: 'Database not available' },
        { status: 503 }
      );
    }
  } catch (error) {
    console.error('Error deleting class:', error);
    return NextResponse.json(
      { error: 'Failed to delete class' },
      { status: 500 }
    );
  }
}