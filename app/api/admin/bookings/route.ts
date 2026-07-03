import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { sendConfirmedEmail } from '@/lib/bookingEmails';

export const dynamic = 'force-dynamic';

// GET /api/admin/bookings — reservations with their appointments.
export async function GET() {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const reservations = await prisma.reservation.findMany({
    include: {
      bookings: {
        include: { service: { select: { name: true, durationMin: true } }, staff: { select: { name: true } }, room: { select: { name: true } } },
        orderBy: [{ guestIndex: 'asc' }, { sequenceIndex: 'asc' }],
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return NextResponse.json({ reservations });
}

// PATCH /api/admin/bookings — { id, status } confirm/cancel a whole reservation.
export async function PATCH(request: Request) {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, status } = await request.json().catch(() => ({}));
  if (!id || !['CONFIRMED', 'CANCELLED', 'PENDING'].includes(status)) {
    return NextResponse.json({ error: 'id and a valid status are required' }, { status: 400 });
  }

  const prev = await prisma.reservation.findUnique({ where: { id: Number(id) }, select: { status: true } });
  const reservation = await prisma.reservation.update({ where: { id: Number(id) }, data: { status } });

  // Send the guest a confirmation email on the PENDING/CANCELLED → CONFIRMED transition only.
  if (status === 'CONFIRMED' && prev?.status !== 'CONFIRMED') {
    const full = await prisma.reservation.findUnique({
      where: { id: reservation.id },
      include: { bookings: { include: { service: true, staff: true, room: true } } },
    });
    if (full) sendConfirmedEmail(full).catch(() => {});
  }

  return NextResponse.json({ ok: true, reservation });
}
