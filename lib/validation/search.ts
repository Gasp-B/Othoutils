import { z } from 'zod';
import { defaultLocale, locales } from '@/i18n/routing';

export const searchLocaleSchema = z.enum(locales).default(defaultLocale);

export type SearchLocale = z.infer<typeof searchLocaleSchema>;
