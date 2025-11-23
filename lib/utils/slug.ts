/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unnecessary-type-assertion */
import { and, eq, like, ne } from 'drizzle-orm';

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[^\w\s-]/g, '')
    .replace(/[-_\s]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

type GenerateUniqueSlugParams = {
  db: any;
  name: string;
  table: any;
  slugColumn: any;
  idColumn?: any;
  excludeId?: string;
  reserved?: Set<string>;
  localeColumn?: any;
  locale?: string;
};

export async function generateUniqueSlug({
  db,
  name,
  table,
  slugColumn,
  idColumn,
  excludeId,
  reserved = new Set<string>(),
  localeColumn,
  locale,
}: GenerateUniqueSlugParams): Promise<string> {
  const baseSlug = slugify(name) || 'item';
  const pattern = `${baseSlug}%`;

  const localeCondition = localeColumn && locale ? eq(localeColumn, locale) : null;
  const baseCondition = localeCondition ? and(like(slugColumn, pattern), localeCondition) : like(slugColumn, pattern);
  const condition =
    excludeId && idColumn ? and(baseCondition, ne(idColumn, excludeId)) : baseCondition;

  const existingRows = await db
    .select({ slug: slugColumn })
    .from(table as any)
    .where(condition);

  const taken = new Set<string>(reserved);
  for (const row of existingRows) {
    if (typeof row.slug === 'string') {
      taken.add(row.slug);
    }
  }

  let candidate = baseSlug;
  let suffix = 2;
  while (taken.has(candidate)) {
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  reserved.add(candidate);
  return candidate;
}
