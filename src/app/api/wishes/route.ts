import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('wish_items')
      .select('*')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, price_vnd, image_url, tiktok_links, priority, notes } = body;

    if (!name || price_vnd === undefined) {
      return NextResponse.json({ error: 'name and price_vnd are required' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('wish_items')
      .insert({
        name,
        price_vnd,
        image_url: image_url ?? null,
        tiktok_links: tiktok_links ?? [],
        priority: priority ?? 0,
        notes: notes ?? null,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
