import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, clientIp } from '@/lib/rateLimit';
import { isTerminal, visitIsOver } from '@/lib/reservationStatus';

export const dynamic = 'force-dynamic';

// POST /api/reservations/[token]/cancel — guest self-service cancel.
// Setting status=CANCELLED frees the slots automatically: the availability engine
// (lib/availability.ts loadContext) excludes bookings whose reservation is CANCELLED.
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const rl = rateLimit(`cancel:${clientIp(request)}`, 20, 10 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 });

  const { token } = await params;
  const reservation = await prisma.reservation.findUnique({
    where: { token },
    select: { id: true, status: true, bookings: { select: { endsAt: true } } },
  });
  if (!reservation) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (reservation.status === 'CANCELLED') return NextResponse.json({ ok: true, alreadyCancelled: true });
  // Don't let a self-service cancel overwrite a set outcome (COMPLETED/NO_SHOW)
  // or wipe an already-finished visit — protects the analytics record.
  if (isTerminal(reservation.status) || visitIsOver(reservation.bookings)) {
    return NextResponse.json({ error: 'This booking can no longer be cancelled.' }, { status: 409 });
  }

  await prisma.reservation.update({ where: { token }, data: { status: 'CANCELLED' } });
  return NextResponse.json({ ok: true });
}
