import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/lib/supabase/types';
import { parentsCRUD } from '@/lib/supabase/crud';

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

    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('school_id');

    try {
      const parents = await parentsCRUD.getAll(schoolId || undefined);
      return NextResponse.json(parents);
    } catch (dbError) {
      console.log('Database not available, returning empty parents array');
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('Error fetching parents:', error);
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

    const body = await request.json();
    const { name, contact_number, email, school_id, user_id } = body;

    const parent = await parentsCRUD.create({
      name,
      contact_number,
      email,
      school_id,
      user_id,
    });

    return NextResponse.json(parent);
  } catch (error) {
    console.error('Error creating parent:', error);
    return NextResponse.json(
      { error: 'Failed to create parent' },
      { status: 500 }
    );
  }
}