// app/api/catalogue/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ⚠️ service role côté serveur ONLY
);

export async function GET() {
  try {
    // Adapte au schéma de ta BDD
    const { data, error } = await supabase
      .from('sections') // ou "domains", "categories" etc.
      .select('id, label, slug')
      .order('position', { ascending: true });

    if (error) {
      console.error('[GET /api/catalogue] Supabase error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    return NextResponse.json({
      items: data ?? [],
    });
  } catch (err) {
    console.error('[GET /api/catalogue] Unexpected error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
