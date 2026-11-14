import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const preset_id = searchParams.get('preset_id');
    const status = searchParams.get('status');

    let query = supabase
      .from('salary_cycles')
      .select(`
        *,
        job_presets (
          id,
          name,
          hourly_rate,
          night_allowance_pct,
          color
        )
      `)
      .order('created_at', { ascending: false });

    if (preset_id) query = query.eq('preset_id', preset_id);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;

    if (error) throw error;

    const formattedData = data?.map((item: any) => ({
      ...item,
      preset: item.job_presets || item.preset,
      job_presets: item.job_presets || item.preset,
    }));

    return NextResponse.json(formattedData);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { preset_id, cycle_number, start_date, status } = body;

    if (!preset_id || !start_date) {
      return NextResponse.json({ error: 'preset_id and start_date are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('salary_cycles')
      .insert({
        preset_id,
        cycle_number: cycle_number ?? 1,
        start_date,
        status: status ?? 'open',
        total_calculated: 0,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
