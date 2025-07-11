import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { Database } from '@/lib/supabase/types';
import { paymentsCRUD } from '@/lib/supabase/crud';

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
    const parentId = searchParams.get('parent_id');
    const schoolId = searchParams.get('school_id');

    try {
      const payments = await paymentsCRUD.getAll(parentId || undefined, schoolId || undefined);
      return NextResponse.json(payments);
    } catch (dbError) {
      console.log('Database not available, returning empty payments array');
      return NextResponse.json([]);
    }
  } catch (error) {
    console.error('Error fetching payments:', error);
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

    // Check if user has permission to record payments
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (!profile || !['treasurer', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { parent_id, amount, category, receipt_url, payment_method, notes } = body;

    const payment = await paymentsCRUD.create({
      parent_id,
      amount: amount || 250,
      category: category || 'membership',
      receipt_url,
      created_by: session.user.id,
      payment_method: payment_method || 'cash',
      notes,
    });

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Error recording payment:', error);
    return NextResponse.json(
      { error: 'Failed to record payment' },
      { status: 500 }
    );
  }
}