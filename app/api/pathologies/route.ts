// app/api/pathologies/route.ts

import { NextResponse } from 'next/server';
import { and, eq, ilike, or, sql } from 'drizzle-orm';
import { getDb } from '@/lib/db/client';
import { pathologies, pathologyTranslations } from '@/lib/db/schema';

const db = getDb();

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const locale = searchParams.get('locale') ?? 'fr';
    const q = searchParams.get('q')?.trim();
    const limit = Number(searchParams.get('limit') ?? 20);

    const baseQuery = db
      .select({
        id: pathologies.id,
        slug: pathologies.slug,
        label: pathologyTranslations.label,
        description: pathologyTranslations.description,
        synonyms: pathologyTranslations.synonyms,
      })
      .from(pathologies)
      .leftJoin(
        pathologyTranslations,
        and(
          eq(pathologyTranslations.pathologyId, pathologies.id),
          eq(pathologyTranslations.locale, locale),
        ),
      );

    const fallbackQuery = db
      .select({
        id: pathologies.id,
        slug: pathologies.slug,
        label: pathologyTranslations.label,
        description: pathologyTranslations.description,
        synonyms: pathologyTranslations.synonyms,
      })
      .from(pathologies)
      .leftJoin(
        pathologyTranslations,
        and(
          eq(pathologyTranslations.pathologyId, pathologies.id),
          eq(pathologyTranslations.locale, 'fr'),
        ),
      );

    if (!q) {
      const rows = await baseQuery.limit(limit);
      return NextResponse.json({ items: rows });
    }

    const likeQ = `%${q}%`;

    const synonymsCondition = sql`EXISTS (
      SELECT 1
      FROM unnest(${pathologyTranslations.synonyms}) AS s
      WHERE s ILIKE ${likeQ}
    )`;

    const rows = await baseQuery
      .where(
        or(
          ilike(pathologyTranslations.label, likeQ),
          ilike(pathologyTranslations.description, likeQ),
          synonymsCondition,
        ),
      )
      .limit(limit);

    if (rows.length === 0) {
      const frRows = await fallbackQuery
        .where(
          or(
            ilike(pathologyTranslations.label, likeQ),
            ilike(pathologyTranslations.description, likeQ),
            synonymsCondition,
          ),
        )
        .limit(limit);

      return NextResponse.json({ items: frRows });
    }

    return NextResponse.json({ items: rows });
  } catch (err) {
    console.error('[GET /api/pathologies] Error:', err);
    return NextResponse.json({ error: 'server_error' }, { status: 500 });
  }
}