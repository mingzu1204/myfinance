import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('wallet')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, operation } = body as {
      amount: number;
      operation: 'add' | 'set' | 'subtract';
    };

    if (typeof amount !== 'number') {
      return NextResponse.json({ error: 'amount must be a number' }, { status: 400 });
    }
    if (!['add', 'set', 'subtract'].includes(operation)) {
      return NextResponse.json({ error: 'operation must be add, set, or subtract' }, { status: 400 });
    }

    // Fetch current wallet
    const { data: wallet, error: fetchError } = await supabase
      .from('wallet')
      .select('cash_balance')
      .eq('id', 1)
      .single();

    if (fetchError) throw fetchError;

    let newBalance: number;
    if (operation === 'add') {
      newBalance = (wallet.cash_balance ?? 0) + amount;
    } else if (operation === 'subtract') {
      newBalance = (wallet.cash_balance ?? 0) - amount;
    } else {
      newBalance = amount;
    }

    const { data, error } = await supabase
      .from('wallet')
      .update({ cash_balance: newBalance, last_updated: new Date().toISOString() })
      .eq('id', 1)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
