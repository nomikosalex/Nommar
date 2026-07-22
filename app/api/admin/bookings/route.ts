import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { sendConfirmedEmail, sendCancelledEmail } from '@/lib/bookingEmails';
import { isValidStatus, canTransition, REQUIRES_PAST_VISIT, visitIsOver } from '@/lib/reservationStatus';

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

// PATCH /api/admin/bookings — { id, status } drive a reservation through its
// lifecycle: PENDING → CONFIRMED → (COMPLETED | NO_SHOW), CANCELLED from
// PENDING/CONFIRMED. CANCELLED/COMPLETED/NO_SHOW are terminal. COMPLETED/NO_SHOW
// may only be set once the visit is over. Invalid jumps are rejected here.
export async function PATCH(request: Request) {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id, status } = await request.json().catch(() => ({}));
  if (!id || !isValidStatus(status)) {
    return NextResponse.json({ error: 'id and a valid status are required' }, { status: 400 });
  }

  const prev = await prisma.reservation.findUnique({
    where: { id: Number(id) },
    select: { status: true, bookings: { select: { endsAt: true } } },
  });
  if (!prev) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Setting the status it already has is a harmless no-op (idempotent).
  if (status === prev.status) return NextResponse.json({ ok: true, unchanged: true });

  if (!canTransition(prev.status, status)) {
    return NextResponse.json({ error: `Cannot change status from ${prev.status} to ${status}.` }, { status: 400 });
  }
  if (REQUIRES_PAST_VISIT.includes(status) && !visitIsOver(prev.bookings)) {
    return NextResponse.json({ error: 'Cannot mark completed / no-show before the appointment has ended.' }, { status: 400 });
  }

  const reservation = await prisma.reservation.update({ where: { id: Number(id) }, data: { status } });

  // Email the guest on two transitions:
  //  • → CONFIRMED (from anything else): confirmation email.
  //  • CONFIRMED → CANCELLED: cancellation email (declining a PENDING stays silent).
  const notifyConfirm = status === 'CONFIRMED' && prev?.status !== 'CONFIRMED';
  const notifyCancel = status === 'CANCELLED' && prev?.status === 'CONFIRMED';
  if (notifyConfirm || notifyCancel) {
    const full = await prisma.reservation.findUnique({
      where: { id: reservation.id },
      include: { bookings: { include: { service: true, staff: true, room: true } } },
    });
    if (full) (notifyConfirm ? sendConfirmedEmail(full) : sendCancelledEmail(full)).catch(() => {});
  }

  return NextResponse.json({ ok: true, reservation });
}

// A reservation can be deleted only once it's finished with: cancelled, or every
// appointment is already in the past. Guards against nuking an active booking.
function isArchivable(r: { status: string; bookings: { endsAt: Date }[] }, now: Date): boolean {
  if (r.status === 'CANCELLED') return true;
  return r.bookings.length > 0 && r.bookings.every((b) => b.endsAt < now);
}

// DELETE /api/admin/bookings — remove archivable reservations (cascade deletes
// their Booking rows). Body: { id } for one, or { purge: true } for all past/cancelled.
export async function DELETE(request: Request) {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const now = new Date();

  if (body?.purge === true) {
    const all = await prisma.reservation.findMany({ select: { id: true, status: true, bookings: { select: { endsAt: true } } } });
    const ids = all.filter((r) => isArchivable(r, now)).map((r) => r.id);
    const del = await prisma.reservation.deleteMany({ where: { id: { in: ids } } });
    return NextResponse.json({ ok: true, deleted: del.count });
  }

  const id = Number(body?.id);
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const r = await prisma.reservation.findUnique({ where: { id }, select: { id: true, status: true, bookings: { select: { endsAt: true } } } });
  if (!r) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!isArchivable(r, now)) return NextResponse.json({ error: 'Only past or cancelled bookings can be deleted.' }, { status: 400 });

  await prisma.reservation.delete({ where: { id } });
  return NextResponse.json({ ok: true, deleted: 1 });
}
