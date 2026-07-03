import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, clientIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

// POST /api/reservations/[token]/cancel — guest self-service cancel.
// Setting status=CANCELLED frees the slots automatically: the availability engine
// (lib/availability.ts loadContext) excludes bookings whose reservation is CANCELLED.
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const rl = rateLimit(`cancel:${clientIp(request)}`, 20, 10 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });

  const { token } = await params;
  const reservation = await prisma.reservation.findUnique({ where: { token }, select: { id: true, status: true } });
  if (!reservation) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (reservation.status === 'CANCELLED') return NextResponse.json({ ok: true, alreadyCancelled: true });

  await prisma.reservation.update({ where: { token }, data: { status: 'CANCELLED' } });
  return NextResponse.json({ ok: true });
}
