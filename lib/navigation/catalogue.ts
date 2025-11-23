import { alias, and, eq, sql } from 'drizzle-orm';
import { defaultLocale, type Locale } from '@/i18n/routing';
import { getDb } from '@/lib/db/client';
import {
  domains,
  domainsTranslations,
  tags,
  tagsTranslations,
  testDomains,
  testTags,
} from '@/lib/db/schema';
import { slugify } from '@/lib/utils/slug';

export type CatalogueTag = { id: string; label: string; slug: string };
export type CatalogueDomain = { id: string; label: string; slug: string; tags: CatalogueTag[] };

export async function getCatalogueTaxonomy(locale: Locale = defaultLocale): Promise<CatalogueDomain[]> {
  const db = getDb();
  const localizedDomain = alias(domainsTranslations, 'localized_domain');
  const fallbackDomain = alias(domainsTranslations, 'fallback_domain');
  const localizedTag = alias(tagsTranslations, 'localized_tag');
  const fallbackTag = alias(tagsTranslations, 'fallback_tag');

  const domainLabelExpression = sql<string>`COALESCE(${localizedDomain.label}, ${fallbackDomain.label})`;
  const domainSlugExpression = sql<string>`COALESCE(${localizedDomain.slug}, ${fallbackDomain.slug})`;
  const tagLabelExpression = sql<string>`COALESCE(${localizedTag.label}, ${fallbackTag.label})`;

  const [domainRows, tagRows, domainTagRelations] = await Promise.all([
    db
      .select({ id: domains.id, label: domainLabelExpression, slug: domainSlugExpression })
      .from(domains)
      .leftJoin(localizedDomain, and(eq(localizedDomain.domainId, domains.id), eq(localizedDomain.locale, locale)))
      .leftJoin(fallbackDomain, and(eq(fallbackDomain.domainId, domains.id), eq(fallbackDomain.locale, defaultLocale)))
      .orderBy(domainLabelExpression),
    db
      .select({ id: tags.id, label: tagLabelExpression })
      .from(tags)
      .leftJoin(localizedTag, and(eq(localizedTag.tagId, tags.id), eq(localizedTag.locale, locale)))
      .leftJoin(fallbackTag, and(eq(fallbackTag.tagId, tags.id), eq(fallbackTag.locale, defaultLocale)))
      .orderBy(tagLabelExpression),
    db
      .select({ domainId: testDomains.domainId, tagId: testTags.tagId })
      .from(testDomains)
      .innerJoin(testTags, eq(testDomains.testId, testTags.testId)),
  ]);

  const tagsById = new Map<string, CatalogueTag>(
    tagRows
      .filter((tag): tag is { id: string; label: string } => typeof tag.label === 'string' && tag.label.length > 0)
      .map((tag) => [tag.id, { ...tag, slug: slugify(tag.label) }]),
  );

  const tagsByDomain = new Map<string, CatalogueTag[]>();

  const validDomainRows = domainRows.filter(
    (domain): domain is { id: string; label: string; slug: string } =>
      typeof domain.label === 'string' && typeof domain.slug === 'string' && domain.label.length > 0,
  );

  for (const relation of domainTagRelations) {
    const tag = tagsById.get(relation.tagId);

    if (!tag) {
      continue;
    }

    const existing = tagsByDomain.get(relation.domainId) ?? [];

    if (!existing.some((item) => item.id === tag.id)) {
      existing.push(tag);
      tagsByDomain.set(relation.domainId, existing);
    }
  }

  return validDomainRows.map((domain) => ({
    ...domain,
    // Si aucun tag n’est lié à ce domaine → tableau vide
    tags: tagsByDomain.get(domain.id) ?? [],
  }));

}
