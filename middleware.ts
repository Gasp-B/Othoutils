import { NextResponse, type NextRequest } from 'next/server';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 100;

const rateLimitStore = new Map<string, { count: number; expires: number }>();

function getClientKey(request: NextRequest) {
  const xForwardedFor = request.headers.get('x-forwarded-for');
  if (xForwardedFor) {
    return xForwardedFor.split(',')[0]?.trim() ?? 'unknown';
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  const connectingIp = request.headers.get('cf-connecting-ip');
  if (connectingIp) {
    return connectingIp;
  }

  return 'global';
}

function getUpdatedEntry(key: string) {
  const now = Date.now();
  const existing = rateLimitStore.get(key);

  if (!existing || existing.expires < now) {
    const freshEntry = { count: 0, expires: now + WINDOW_MS };
    rateLimitStore.set(key, freshEntry);
    return freshEntry;
  }

  return existing;
}

export function middleware(request: NextRequest) {
  const key = getClientKey(request);
  const entry = getUpdatedEntry(key);

  entry.count += 1;

  if (entry.count > MAX_REQUESTS) {
    const limitedResponse = new NextResponse('Too Many Requests', {
      status: 429,
      headers: {
        'Retry-After': `${Math.ceil((entry.expires - Date.now()) / 1000)}`,
        'X-RateLimit-Limit': `${MAX_REQUESTS}`,
        'X-RateLimit-Remaining': '0',
      },
    });

    applySecurityHeaders(limitedResponse);
    return limitedResponse;
  }

  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', `${MAX_REQUESTS}`);
  response.headers.set('X-RateLimit-Remaining', `${Math.max(0, MAX_REQUESTS - entry.count)}`);
  response.headers.set('X-RateLimit-Reset', `${entry.expires}`);

  applySecurityHeaders(response);

  return response;
}

function applySecurityHeaders(response: NextResponse) {
  const connectSources = ["'self'", process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://*.supabase.co']
    .filter(Boolean)
    .join(' ');

  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "font-src 'self' data:",
    "img-src 'self' data:",
    "object-src 'none'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    `connect-src ${connectSources}`,
  ].join('; ');

  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};
