import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth';
import { COOKIE, createToken } from '@/lib/jwt';
import { rateLimit, clientIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const rl = rateLimit(`login:${clientIp(request)}`, 8, 10 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: 'Too many attempts. Try again later.' }, { status: 429 });

  const { email, password } = await request.json().catch(() => ({}));
  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  const user = await prisma.adminUser.findUnique({ where: { email } });
  // Always run a bcrypt compare (dummy hash when the email is unknown) so the
  // response time doesn't reveal which emails exist.
  const DUMMY_HASH = '$2b$10$C6UzMDM.H6dfI/f/IKcEeO7bIWqzWJz0zC5oGqpqQKcqQqQKcqQKe';
  const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
  }

  const token = await createToken(email);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === 'production',
  });
  return res;
}
