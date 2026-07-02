import { NextResponse, type NextRequest } from 'next/server';
import { COOKIE, verifyToken } from '@/lib/jwt';

// Next.js 16: middleware was renamed to `proxy` (nodejs runtime).
// Guards the admin area + admin API; the login endpoints stay public.
export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === '/admin/login' || pathname === '/api/admin/login') {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE)?.value;
  const session = token ? await verifyToken(token) : null;
  if (session) return NextResponse.next();

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const url = req.nextUrl.clone();
  url.pathname = '/admin/login';
  return NextResponse.redirect(url);
}
