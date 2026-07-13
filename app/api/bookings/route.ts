import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { createReservationForRequest } from '@/lib/availability';
import { sendSpaNotification } from '@/lib/bookingEmails';
import { rateLimit, clientIp } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

const Body = z.object({
  start: z.string().min(1), // ISO UTC instant
  guests: z.array(z.object({ services: z.array(z.string().min(1)).min(1) })).min(1).max(2),
  customer: z.object({
    name: z.string().trim().min(1).max(120),
    email: z.string().trim().email(),
    phone: z.string().trim().min(5).max(40),
  }),
  guest2: z
    .object({
      name: z.string().trim().max(80).optional(),
      email: z.string().trim().email().optional().or(z.literal('')),
      phone: z.string().trim().max(40).optional(),
    })
    .optional(),
  notes: z.string().trim().max(1000).optional(),
  promoCode: z.string().trim().max(40).optional(),
  locale: z.enum(['en', 'gr']).optional(),
});

const STATUS: Record<string, number> = { invalid: 400, notfound: 404, past: 409, unavailable: 409 };
const MESSAGES: Record<string, string> = {
  invalid: 'Those services are not valid.',
  past: 'That time is in the past — please choose another.',
  unavailable: 'Sorry, that time is no longer available. Please choose another slot.',
};

// POST /api/bookings — create a reservation (1–2 guests, chained services).
export async function POST(request: Request) {
  const rl = rateLimit(`booking:${clientIp(request)}`, 10, 10 * 60 * 1000);
  if (!rl.ok) return NextResponse.json({ error: 'Too many requests. Please try again shortly.' }, { status: 429 });

  const json = await request.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 });

  const d = parsed.data;
  const result = await createReservationForRequest({
    guests: d.guests,
    start: d.start,
    customer: d.customer,
    guest2: d.guest2,
    notes: d.notes,
    promoCode: d.promoCode,
    locale: d.locale,
  });

  if (!result.ok) {
    return NextResponse.json({ error: MESSAGES[result.code] || 'Could not book.' }, { status: STATUS[result.code] ?? 400 });
  }

  // Load the full reservation for the confirmation email + response.
  const reservation = await prisma.reservation.findUnique({
    where: { id: result.reservationId },
    include: { bookings: { include: { service: true, staff: true, room: true } } },
  });
  // Guest gets no email at booking time (deliberate) — spa gets the alert.
  if (reservation) sendSpaNotification(reservation).catch(() => {});

  return NextResponse.json({ ok: true, reservationId: result.reservationId }, { status: 201 });
}
