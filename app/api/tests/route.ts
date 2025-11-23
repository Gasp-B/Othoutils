import { NextResponse, type NextRequest } from 'next/server';
import { defaultLocale, locales, type Locale } from '@/i18n/routing';
import { createTestWithRelations, updateTestWithRelations } from '@/lib/tests/mutations';
import { getTestsWithMetadata } from '@/lib/tests/queries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedLocale = (searchParams.get('locale') as Locale | null) ?? defaultLocale;
    const locale = locales.includes(requestedLocale) ? requestedLocale : defaultLocale;
    const tests = await getTestsWithMetadata(locale);

    return NextResponse.json(
      { tests },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        },
      },
    );
  } catch (error) {
    console.error('Failed to fetch tests', error);
    const message = error instanceof Error ? error.message : 'Impossible de récupérer les tests';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const test = await createTestWithRelations(payload);

    return NextResponse.json({ test }, { status: 201 });
  } catch (error) {
    console.error('Failed to create test with relations', error);
    const message = error instanceof Error ? error.message : "Impossible de créer le test";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const payload = await request.json();
    const test = await updateTestWithRelations(payload);

    return NextResponse.json({ test }, { status: 200 });
  } catch (error) {
    console.error('Failed to update test with relations', error);
    const message = error instanceof Error ? error.message : "Impossible de mettre à jour le test";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
