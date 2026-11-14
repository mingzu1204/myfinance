import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { total_received, diff_note } = body;

    if (total_received === undefined) {
      return NextResponse.json({ error: 'total_received is required' }, { status: 400 });
    }

    // 1. Fetch the cycle to get total_calculated and preset_id
    const { data: cycle, error: cycleReadError } = await supabase
      .from('salary_cycles')
      .select('*')
      .eq('id', id)
      .single();

    if (cycleReadError) throw cycleReadError;
    if (!cycle) return NextResponse.json({ error: 'Cycle not found' }, { status: 404 });
    if (cycle.status === 'closed') {
      return NextResponse.json({ error: 'Cycle is already closed' }, { status: 400 });
    }

    const diff_amount = total_received - (cycle.total_calculated ?? 0);
    const now = new Date().toISOString();

    // 2. Close the cycle
    const { data: updatedCycle, error: cycleUpdateError } = await supabase
      .from('salary_cycles')
      .update({
        status: 'closed',
        total_received,
        diff_amount,
        diff_note: diff_note ?? null,
        closed_at: now,
      })
      .eq('id', id)
      .select()
      .single();

    if (cycleUpdateError) throw cycleUpdateError;

    // 3. Update wallet: cash_balance += total_received
    let { data: wallet } = await supabase
      .from('wallet')
      .select('cash_balance')
      .eq('id', 1)
      .maybeSingle();

    const currentBal = Number(wallet?.cash_balance ?? 0);
    const newBal = currentBal + Number(total_received);

    const { data: updatedWallet, error: walletUpdateError } = await supabase
      .from('wallet')
      .upsert({
        id: 1,
        cash_balance: newBal,
        last_updated: now,
      })
      .select()
      .single();

    if (walletUpdateError) throw walletUpdateError;

    // 4. Update all sessions of this cycle: status='approved'
    const { error: sessionsUpdateError } = await supabase
      .from('work_sessions')
      .update({ status: 'approved' })
      .eq('cycle_id', id);

    if (sessionsUpdateError) throw sessionsUpdateError;

    // 5. Insert transaction
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        type: 'salary_receive',
        amount: total_received,
        preset_id: cycle.preset_id,
        cycle_id: id,
      });

    if (transactionError) throw transactionError;

    // 6. Create new cycle for this preset
    const today = new Date().toISOString().split('T')[0];
    const { data: newCycle, error: newCycleError } = await supabase
      .from('salary_cycles')
      .insert({
        preset_id: cycle.preset_id,
        cycle_number: (cycle.cycle_number ?? 1) + 1,
        start_date: today,
        status: 'open',
        total_calculated: 0,
      })
      .select()
      .single();

    if (newCycleError) throw newCycleError;

    return NextResponse.json({
      cycle: updatedCycle,
      new_cycle: newCycle,
      diff_amount,
      wallet: updatedWallet || { id: 1, cash_balance: newBal },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
