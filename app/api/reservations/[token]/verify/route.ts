import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, clientIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

// POST /api/reservations/[token]/verify — guest confirms their email (double opt-in).
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const rl = rateLimit(`verify:${clientIp(request)}`, 20, 10 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });

  const { token } = await params;
  const reservation = await prisma.reservation.findUnique({ where: { token }, select: { id: true } });
  if (!reservation) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.reservation.update({ where: { token }, data: { emailVerified: true } });
  return NextResponse.json({ ok: true });
}
