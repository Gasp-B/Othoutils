import { and, eq, sql } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
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
import { generateUniqueSlug } from '@/lib/utils/slug';

function normalizeValue(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error('La valeur fournie est vide.');
  }

  return normalized;
}

export async function createDomain(label: string, locale: Locale = defaultLocale) {
  const normalized = normalizeValue(label);
  const db = getDb();

  const [existingDomain] = await db
    .select({
      id: domainsTranslations.domainId,
      label: domainsTranslations.label,
      locale: domainsTranslations.locale,
    })
    .from(domainsTranslations)
    .where(and(eq(domainsTranslations.label, normalized), eq(domainsTranslations.locale, locale)))
    .limit(1);

  if (existingDomain) {
    throw new Error('Ce domaine existe déjà.');
  }

  const [existingTranslation] = await db
    .select({ id: domainsTranslations.id, domainId: domainsTranslations.domainId })
    .from(domainsTranslations)
    .where(eq(domainsTranslations.label, normalized))
    .limit(1);

  const domainId =
    existingTranslation?.domainId ?? (await db.insert(domains).values({}).returning({ id: domains.id }))[0]?.id;

  if (!domainId) {
    throw new Error("Impossible de créer ou retrouver le domaine.");
  }

  const slug = await generateUniqueSlug({
    db,
    name: normalized,
    table: domainsTranslations,
    slugColumn: domainsTranslations.slug,
    idColumn: domainsTranslations.id,
    localeColumn: domainsTranslations.locale,
    locale,
  });

  const [created] = await db
    .insert(domainsTranslations)
    .values({ domainId, label: normalized, slug, locale })
    .onConflictDoUpdate({
      target: [domainsTranslations.domainId, domainsTranslations.locale],
      set: { label: normalized, slug },
    })
    .returning({ id: domainsTranslations.domainId, label: domainsTranslations.label });

  return created;
}

export async function createTag(label: string, locale: Locale = defaultLocale) {
  const normalized = normalizeValue(label);
  const db = getDb();

  const [existingTag] = await db
    .select({
      id: tagsTranslations.tagId,
      label: tagsTranslations.label,
      locale: tagsTranslations.locale,
    })
    .from(tagsTranslations)
    .where(and(eq(tagsTranslations.label, normalized), eq(tagsTranslations.locale, locale)))
    .limit(1);

  if (existingTag) {
    throw new Error('Ce tag existe déjà.');
  }

  const [existingTranslation] = await db
    .select({ id: tagsTranslations.id, tagId: tagsTranslations.tagId })
    .from(tagsTranslations)
    .where(eq(tagsTranslations.label, normalized))
    .limit(1);

  const tagId = existingTranslation?.tagId ?? (await db.insert(tags).values({}).returning({ id: tags.id }))[0]?.id;

  if (!tagId) {
    throw new Error('Impossible de créer ou retrouver le tag.');
  }

  const [created] = await db
    .insert(tagsTranslations)
    .values({ tagId, label: normalized, locale })
    .onConflictDoUpdate({
      target: [tagsTranslations.tagId, tagsTranslations.locale],
      set: { label: normalized },
    })
    .returning({ id: tagsTranslations.tagId, label: tagsTranslations.label });

  return created;
}

export async function deleteDomain(id: string, locale: Locale = defaultLocale) {
  const db = getDb();
  const localizedDomain = alias(domainsTranslations, 'localized_domain_delete');
  const fallbackDomain = alias(domainsTranslations, 'fallback_domain_delete');

  const [translation] = await db
    .select({
      label: sql<string>`COALESCE(${localizedDomain.label}, ${fallbackDomain.label})`,
    })
    .from(domains)
    .leftJoin(localizedDomain, and(eq(localizedDomain.domainId, domains.id), eq(localizedDomain.locale, locale)))
    .leftJoin(fallbackDomain, and(eq(fallbackDomain.domainId, domains.id), eq(fallbackDomain.locale, defaultLocale)))
    .where(eq(domains.id, id))
    .limit(1);

  const deleted = await db.transaction(async (tx) => {
    await tx.delete(testDomains).where(eq(testDomains.domainId, id));

    const [removed] = await tx.delete(domains).where(eq(domains.id, id)).returning({ id: domains.id });

    if (!removed) {
      return null;
    }

    return { id: removed.id, label: translation?.label ?? '' };
  });

  return deleted;
}

export async function deleteTag(id: string, locale: Locale = defaultLocale) {
  const db = getDb();
  const localizedTag = alias(tagsTranslations, 'localized_tag_delete');
  const fallbackTag = alias(tagsTranslations, 'fallback_tag_delete');

  const [translation] = await db
    .select({
      label: sql<string>`COALESCE(${localizedTag.label}, ${fallbackTag.label})`,
    })
    .from(tags)
    .leftJoin(localizedTag, and(eq(localizedTag.tagId, tags.id), eq(localizedTag.locale, locale)))
    .leftJoin(fallbackTag, and(eq(fallbackTag.tagId, tags.id), eq(fallbackTag.locale, defaultLocale)))
    .where(eq(tags.id, id))
    .limit(1);

  const deleted = await db.transaction(async (tx) => {
    await tx.delete(testTags).where(eq(testTags.tagId, id));

    const [removed] = await tx.delete(tags).where(eq(tags.id, id)).returning({ id: tags.id });

    if (!removed) {
      return null;
    }

    return { id: removed.id, label: translation?.label ?? '' };
  });

  return deleted;
}
