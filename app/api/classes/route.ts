import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/lib/supabase/types';
import { classesCRUD } from '@/lib/supabase/crud';

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
    const teacherId = searchParams.get('teacher_id');

    try {
      let classes;
      if (teacherId) {
        classes = await classesCRUD.getByTeacher(teacherId);
      } else {
        classes = await classesCRUD.getAll(schoolId || undefined);
      }
      return NextResponse.json(classes);
    } catch (dbError) {
      console.log('Database not available, returning empty classes array');
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('Error fetching classes:', error);
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
    const { name, school_id, grade_level, teacher_id } = body;

    const classData = await classesCRUD.create({
      name,
      school_id,
      grade_level,
      teacher_id,
    });

    return NextResponse.json(classData);
  } catch (error) {
    console.error('Error creating class:', error);
    return NextResponse.json(
      { error: 'Failed to create class' },
      { status: 500 }
    );
  }
}