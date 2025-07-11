import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/lib/supabase/types';
import { parentsCRUD } from '@/lib/supabase/crud';

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

    const parent = await parentsCRUD.getById(resolvedParams.id);
    
    return NextResponse.json(parent);
  } catch (error) {
    console.error('Error fetching parent:', error);
    return NextResponse.json(
      { error: 'Failed to fetch parent' },
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

    const body = await request.json();
    const { name, contact_number, email, school_id } = body;

    const parent = await parentsCRUD.update(resolvedParams.id, {
      name,
      contact_number,
      email,
      school_id,
    });

    return NextResponse.json(parent);
  } catch (error) {
    console.error('Error updating parent:', error);
    return NextResponse.json(
      { error: 'Failed to update parent' },
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

    // Check if user has permission to delete parents
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!profile || !['treasurer', 'admin', 'principal'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    await parentsCRUD.delete(resolvedParams.id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting parent:', error);
    return NextResponse.json(
      { error: 'Failed to delete parent' },
      { status: 500 }
    );
  }
}