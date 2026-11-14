import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function DELETE() {
  try {
    const now = new Date().toISOString();

    // 1. Delete transactions
    try {
      await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    } catch (e) {
      console.error('Error deleting transactions:', e);
    }

    // 2. Delete work sessions
    try {
      await supabase.from('work_sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    } catch (e) {
      console.error('Error deleting work_sessions:', e);
    }

    // 3. Delete salary cycles
    try {
      await supabase.from('salary_cycles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    } catch (e) {
      console.error('Error deleting salary_cycles:', e);
    }

    // 4. Delete wish items
    try {
      await supabase.from('wish_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    } catch (e) {
      console.error('Error deleting wish_items:', e);
    }

    // 5. Delete presets
    try {
      await supabase.from('job_presets').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    } catch (e) {
      console.error('Error deleting job_presets:', e);
    }

    // 6. Reset ALL wallet rows to 0 AND upsert id=1 to 0
    try {
      await supabase
        .from('wallet')
        .upsert({ id: 1, cash_balance: 0, last_updated: now });

      await supabase
        .from('wallet')
        .update({ cash_balance: 0, last_updated: now })
        .gte('id', 0);
    } catch (e) {
      console.error('Error resetting wallet:', e);
    }

    return NextResponse.json(
      { success: true, cash_balance: 0 },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
