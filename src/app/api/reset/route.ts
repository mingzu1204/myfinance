import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function DELETE() {
  try {
    // Delete in dependency order
    const { error: txError } = await supabase
      .from('transactions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // delete all

    if (txError) throw txError;

    const { error: sessionsError } = await supabase
      .from('work_sessions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (sessionsError) throw sessionsError;

    const { error: cyclesError } = await supabase
      .from('salary_cycles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (cyclesError) throw cyclesError;

    const { error: wishesError } = await supabase
      .from('wish_items')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (wishesError) throw wishesError;

    const { error: presetsError } = await supabase
      .from('job_presets')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (presetsError) throw presetsError;

    // Reset wallet to 0
    const { error: walletError } = await supabase
      .from('wallet')
      .update({ cash_balance: 0, last_updated: new Date().toISOString() })
      .eq('id', 1);

    if (walletError) throw walletError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
