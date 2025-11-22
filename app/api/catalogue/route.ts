// app/api/catalogue/route.ts
import { NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient, supabaseAdmin } from '@/lib/supabaseClient';
import type { CatalogueDomain } from '@/lib/navigation/catalogue';

type DomainRow = {
  id: string;
  label: string;
  slug: string;
};

export async function GET() {
  try {
    const supabase = supabaseAdmin ?? createRouteHandlerSupabaseClient();

    if (!supabase) {
      throw new Error('Le client Supabase administrateur est indisponible');
    }

    const { data, error } = await supabase
      .from('domains')
      .select('id, label, slug')
      .order('label', { ascending: true });

    if (error) {
      throw error;
    }

    const rows = ((data as unknown as DomainRow[] | null) ?? []);

    const domains: CatalogueDomain[] = rows.map((domain) => ({
      id: domain.id,
      label: domain.label,
      slug: domain.slug,
      // pour matcher le type CatalogueDomain existant,
      // on initialise les tags à un tableau vide
      tags: [],
    }));

    return NextResponse.json(
      { domains },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    );
  } catch (error) {
    console.error('Failed to fetch catalogue domains from Supabase', error);
    const message = error instanceof Error ? error.message : 'Impossible de récupérer le catalogue';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
