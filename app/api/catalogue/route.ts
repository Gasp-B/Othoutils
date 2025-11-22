// app/api/catalogue/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET() {
  try {
    // Récupère les domaines
    const { data: domains, error: domainError } = await supabase
      .from('domains')
      .select('id, label, slug')
      .order('label', { ascending: true });

    if (domainError) {
      console.error('[GET /api/catalogue] Supabase error:', domainError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Renvoie la forme attendue par ton Header :
    // { domains: CatalogueDomain[] }
    return NextResponse.json({
      domains: domains ?? [],
    });
  } catch (err) {
    console.error('[GET /api/catalogue] Unexpected error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
