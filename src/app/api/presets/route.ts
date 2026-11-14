import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('job_presets')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, hourly_rate, night_allowance_pct, color, description } = body;

    if (!name || hourly_rate === undefined) {
      return NextResponse.json({ error: 'name and hourly_rate are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('job_presets')
      .insert({
        name,
        hourly_rate,
        night_allowance_pct: night_allowance_pct ?? 0,
        color: color ?? '#7c3aed',
        description: description ?? null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
