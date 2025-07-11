import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/lib/supabase/types';
import { studentsCRUD } from '@/lib/supabase/crud';

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
    const classId = searchParams.get('class_id');
    const parentId = searchParams.get('parent_id');

    try {
      const students = await studentsCRUD.getAll(classId || undefined, parentId || undefined);
      return NextResponse.json(students);
    } catch (dbError) {
      console.log('Database not available, returning empty students array');
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('Error fetching students:', error);
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
    const { name, class_id, parent_id, student_number } = body;

    const student = await studentsCRUD.create({
      name,
      class_id,
      parent_id,
      student_number,
    });

    return NextResponse.json(student);
  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json(
      { error: 'Failed to create student' },
      { status: 500 }
    );
  }
}