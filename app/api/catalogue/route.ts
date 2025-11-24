import { NextRequest, NextResponse } from 'next/server';
import { defaultLocale, locales, type Locale } from '@/i18n/routing';
import { getCatalogueTaxonomy } from '@/lib/navigation/catalogue';
import { createRouteHandlerSupabaseClient } from '@/lib/supabaseClient';

// Fonction de résolution robuste (identique à celle des référentiels)
function resolveLocale(request: NextRequest): Locale {
  const { searchParams } = new URL(request.url);
  const queryLocale = searchParams.get('locale');

  if (queryLocale && locales.includes(queryLocale as Locale)) {
    return queryLocale as Locale;
  }

  const requestedLocale = request.headers.get('x-orthoutil-locale') ?? request.headers.get('accept-language');
  if (requestedLocale) {
    const normalized = requestedLocale.split(',')[0]?.split('-')[0]?.trim();
    if (normalized && locales.includes(normalized as Locale)) {
      return normalized as Locale;
    }
  }

  return defaultLocale;
}

export async function GET(request: NextRequest) {
  try {
    // 1. Résolution fiable de la locale
    const locale = resolveLocale(request);

    // 2. Création du client Supabase (nécessaire pour l'accès aux données)
    const supabase = await createRouteHandlerSupabaseClient();

    // 3. Récupération de la taxonomie via la lib
    const domains = await getCatalogueTaxonomy(locale, supabase);

    return NextResponse.json(
      { domains },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store', // Important pour éviter le cache de langue
        },
      },
    );
  } catch (error) {
    console.error('Failed to fetch catalogue taxonomy', error);
    const message = error instanceof Error ? error.message : 'Impossible de récupérer le catalogue';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}