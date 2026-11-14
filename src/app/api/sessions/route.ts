import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const preset_id = searchParams.get('preset_id');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') ?? '50', 10);

    let query = supabase
      .from('work_sessions')
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
      .order('created_at', { ascending: false })
      .limit(limit);

    if (preset_id) query = query.eq('preset_id', preset_id);
    if (status) query = query.eq('status', status);

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      preset_id,
      work_date,
      check_in,
      check_out,
      total_hours,
      day_hours,
      night_hours,
      calculated_amount,
      cycle_id,
      notes,
    } = body;

    if (!preset_id || !work_date || !check_in || !check_out || total_hours === undefined || calculated_amount === undefined) {
      return NextResponse.json(
        { error: 'preset_id, work_date, check_in, check_out, total_hours, and calculated_amount are required' },
        { status: 400 }
      );
    }

    let targetCycleId = cycle_id;

    // If no cycle_id provided, find or create the open cycle for this preset
    if (!targetCycleId) {
      const { data: openCycle } = await supabase
        .from('salary_cycles')
        .select('id, total_calculated')
        .eq('preset_id', preset_id)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (openCycle) {
        targetCycleId = openCycle.id;
        // Update cycle total_calculated
        await supabase
          .from('salary_cycles')
          .update({ total_calculated: (openCycle.total_calculated ?? 0) + calculated_amount })
          .eq('id', targetCycleId);
      } else {
        // Create new cycle 1
        const { count } = await supabase
          .from('salary_cycles')
          .select('*', { count: 'exact', head: true })
          .eq('preset_id', preset_id);

        const newCycleNum = (count ?? 0) + 1;
        const { data: createdCycle } = await supabase
          .from('salary_cycles')
          .insert({
            preset_id,
            cycle_number: newCycleNum,
            start_date: work_date,
            total_calculated: calculated_amount,
            status: 'open',
          })
          .select('id')
          .single();

        if (createdCycle) {
          targetCycleId = createdCycle.id;
        }
      }
    } else {
      // cycle_id was explicitly provided
      const { data: cycle, error: cycleReadError } = await supabase
        .from('salary_cycles')
        .select('total_calculated')
        .eq('id', targetCycleId)
        .single();

      if (!cycleReadError && cycle) {
        await supabase
          .from('salary_cycles')
          .update({ total_calculated: (cycle.total_calculated ?? 0) + calculated_amount })
          .eq('id', targetCycleId);
      }
    }

    const { data: session, error: sessionError } = await supabase
      .from('work_sessions')
      .insert({
        preset_id,
        work_date,
        check_in,
        check_out,
        total_hours,
        day_hours: day_hours ?? 0,
        night_hours: night_hours ?? 0,
        calculated_amount,
        cycle_id: targetCycleId ?? null,
        notes: notes ?? null,
        status: 'pending',
      })
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
      .single();

    if (sessionError) throw sessionError;

    return NextResponse.json(session, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
