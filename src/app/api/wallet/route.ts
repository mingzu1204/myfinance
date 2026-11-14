import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    let { data, error } = await supabase
      .from('wallet')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (!data) {
      const { data: created } = await supabase
        .from('wallet')
        .upsert({ id: 1, cash_balance: 0, last_updated: new Date().toISOString() })
        .select()
        .single();
      data = created || { id: 1, cash_balance: 0 };
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, operation, note } = body as {
      amount: number;
      operation: 'add' | 'set' | 'subtract';
      note?: string;
    };

    if (typeof amount !== 'number') {
      return NextResponse.json({ error: 'amount must be a number' }, { status: 400 });
    }
    if (!['add', 'set', 'subtract'].includes(operation)) {
      return NextResponse.json({ error: 'operation must be add, set, or subtract' }, { status: 400 });
    }

    // Fetch current wallet
    let { data: wallet } = await supabase
      .from('wallet')
      .select('cash_balance')
      .eq('id', 1)
      .maybeSingle();

    const currentBalance = Number(wallet?.cash_balance ?? 0);
    let newBalance: number;
    if (operation === 'add') {
      newBalance = currentBalance + amount;
    } else if (operation === 'subtract') {
      newBalance = Math.max(0, currentBalance - amount);
    } else {
      newBalance = Math.max(0, amount);
    }

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('wallet')
      .upsert({ id: 1, cash_balance: newBalance, last_updated: now })
      .select()
      .single();

    if (error) throw error;

    // Record transaction
    const txAmount = operation === 'subtract' ? -amount : (operation === 'add' ? amount : (newBalance - currentBalance));
    const txDesc = note?.trim() || (operation === 'add' ? 'Nạp thêm tiền mặt' : operation === 'subtract' ? 'Rút/Chi tiêu tiền mặt' : 'Điều chỉnh số dư ví');

    try {
      await supabase.from('transactions').insert({
        type: operation === 'add' ? 'manual_add' : operation === 'subtract' ? 'manual_subtract' : 'manual_set',
        amount: txAmount,
        description: txDesc,
        created_at: now,
      });
    } catch (e) {
      console.error('Failed to log transaction:', e);
    }

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
