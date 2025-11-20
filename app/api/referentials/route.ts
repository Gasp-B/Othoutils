import { NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient } from '@/lib/supabaseClient';
import { toolsCatalog } from '@/lib/db/schema';
import { referentialsResponseSchema } from '@/lib/validation/referentials';

type ReferentialRow = {
  id: string;
  title: string;
  category: string;
  color_label: string | null;
  tags: string[] | null;
  description: string | null;
  notes: string | null;
};

export async function GET() {
  try {
    const supabase = createRouteHandlerSupabaseClient();

    const { data, error } = await supabase
      .from(toolsCatalog._.name)
      .select([
        'id',
        'title',
        'category',
        'color_label',
        'tags',
        'description',
        'notes',
      ]);

    if (error) {
      throw error;
    }

    const rows = ((data as unknown as ReferentialRow[] | null) ?? []);

    const payload = referentialsResponseSchema.parse({
      referentials:
        rows.map((section) => ({
          id: section.id,
          name: section.title,
          description: section.description ?? null,
          subsections: [
            {
              id: `${section.id}-category`,
              name: section.category,
              formatLabel: null,
              colorLabel: section.color_label ?? null,
              notes: section.notes ?? null,
              tags:
                section.tags?.map((tag, index) => ({
                  id: `${section.id}-tag-${index}`,
                  name: tag,
                  colorLabel: null,
                })) ?? [],
            },
          ],
        })) ?? [],
    });

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Failed to fetch referentials from Supabase', error);
    const message = error instanceof Error ? error.message : 'Impossible de récupérer les référentiels';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
