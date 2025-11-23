import { NextRequest, NextResponse } from 'next/server';
import { and, eq, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { defaultLocale, locales, type Locale } from '@/i18n/routing';
import { getDb } from '@/lib/db/client';
import { domains, domainsTranslations, tags, tagsTranslations } from '@/lib/db/schema';
import {
  taxonomyDeletionSchema,
  taxonomyMutationSchema,
  taxonomyResponseSchema,
} from '@/lib/validation/tests';
import { createDomain, createTag, deleteDomain, deleteTag } from '@/lib/tests/taxonomy';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedLocale = (searchParams.get('locale') as Locale | null) ?? defaultLocale;
    const locale = locales.includes(requestedLocale) ? requestedLocale : defaultLocale;
    const localizedDomain = alias(domainsTranslations, 'localized_domain');
    const fallbackDomain = alias(domainsTranslations, 'fallback_domain');
    const localizedTag = alias(tagsTranslations, 'localized_tag');
    const fallbackTag = alias(tagsTranslations, 'fallback_tag');
    const domainLabelExpression = sql<string>`COALESCE(${localizedDomain.label}, ${fallbackDomain.label})`;
    const domainSlugExpression = sql<string>`COALESCE(${localizedDomain.slug}, ${fallbackDomain.slug})`;
    const tagLabelExpression = sql<string>`COALESCE(${localizedTag.label}, ${fallbackTag.label})`;

    const [domainRows, tagRows] = await Promise.all([
      getDb()
        .select({ id: domains.id, label: domainLabelExpression, slug: domainSlugExpression })
        .from(domains)
        .leftJoin(localizedDomain, and(eq(localizedDomain.domainId, domains.id), eq(localizedDomain.locale, locale)))
        .leftJoin(fallbackDomain, and(eq(fallbackDomain.domainId, domains.id), eq(fallbackDomain.locale, defaultLocale)))
        .orderBy(domainLabelExpression),
      getDb()
        .select({ id: tags.id, label: tagLabelExpression })
        .from(tags)
        .leftJoin(localizedTag, and(eq(localizedTag.tagId, tags.id), eq(localizedTag.locale, locale)))
        .leftJoin(fallbackTag, and(eq(fallbackTag.tagId, tags.id), eq(fallbackTag.locale, defaultLocale)))
        .orderBy(tagLabelExpression),
    ]);

    const payload = taxonomyResponseSchema.parse({
      domains: domainRows,
      tags: tagRows,
    });

    return NextResponse.json(payload, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    console.error('Failed to fetch taxonomy for tests', error);
    const message = error instanceof Error ? error.message : 'Impossible de récupérer les domaines et tags';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = taxonomyMutationSchema.parse(await request.json());

    if (payload.type === 'domain') {
      const created = await createDomain(payload.value, payload.locale ?? defaultLocale);
      return NextResponse.json({ domain: created }, { status: 201 });
    }

    const created = await createTag(payload.value, payload.locale ?? defaultLocale);
    return NextResponse.json({ tag: created }, { status: 201 });
  } catch (error) {
    console.error('Failed to create taxonomy entry', error);
    const message = error instanceof Error ? error.message : 'Impossible de créer cet élément';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const payload = taxonomyDeletionSchema.parse(await request.json());

    if (payload.type === 'domain') {
      const deleted = await deleteDomain(payload.id, payload.locale ?? defaultLocale);

      if (!deleted) {
        return NextResponse.json({ error: 'Domaine introuvable' }, { status: 404 });
      }

      return NextResponse.json({ domain: deleted }, { status: 200 });
    }

    const deleted = await deleteTag(payload.id, payload.locale ?? defaultLocale);

    if (!deleted) {
      return NextResponse.json({ error: 'Tag introuvable' }, { status: 404 });
    }

    return NextResponse.json({ tag: deleted }, { status: 200 });
  } catch (error) {
    console.error('Failed to delete taxonomy entry', error);
    const message = error instanceof Error ? error.message : "Impossible de supprimer cet élément";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
