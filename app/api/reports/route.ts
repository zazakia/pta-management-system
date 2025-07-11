import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/lib/supabase/types';
import { reportingCRUD } from '@/lib/supabase/crud';

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
    const reportType = searchParams.get('type');
    const schoolId = searchParams.get('school_id');
    const teacherId = searchParams.get('teacher_id');

    let report;
    
    if (reportType === 'school-summary' && schoolId) {
      report = await reportingCRUD.getSchoolSummary(schoolId);
    } else if (reportType === 'teacher-report' && teacherId) {
      report = await reportingCRUD.getTeacherReport(teacherId);
    } else {
      return NextResponse.json(
        { error: 'Invalid report type or missing parameters' },
        { status: 400 }
      );
    }
    
    return NextResponse.json(report);
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    );
  }
}