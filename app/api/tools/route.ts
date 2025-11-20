import { NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient, createDrizzleClient } from '@/lib/supabaseClient';
import { toolsCatalog } from '@/lib/db/schema';
import { toolsResponseSchema } from '@/lib/validation/tools';

export async function GET() {
  try {
    const supabase = createRouteHandlerSupabaseClient();
    const db = createDrizzleClient(supabase);

    const tools = await db
      .select({
        id: toolsCatalog.id,
        title: toolsCatalog.title,
        category: toolsCatalog.category,
        colorLabel: toolsCatalog.colorLabel,
        tags: toolsCatalog.tags,
        description: toolsCatalog.description,
        links: toolsCatalog.links,
        notes: toolsCatalog.notes,
        targetPopulation: toolsCatalog.targetPopulation,
        status: toolsCatalog.status,
        createdAt: toolsCatalog.createdAt,
      })
      .from(toolsCatalog);

    const payload = toolsResponseSchema.parse({ tools });

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Failed to fetch tools from Supabase', error);
    const message = error instanceof Error ? error.message : 'Impossible de récupérer les outils';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
