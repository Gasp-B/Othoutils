import createMiddleware from 'next-intl/middleware';
import type { NextRequest } from 'next/server';

import { proxy } from './proxy';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export function middleware(request: NextRequest) {
  const proxyResponse = proxy(request);

  if (proxyResponse.status === 429) {
    return proxyResponse;
  }

  const i18nResponse = intlMiddleware(request);

  proxyResponse.headers.forEach((value, key) => {
    i18nResponse.headers.set(key, value);
  });

  return i18nResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
