import { NextResponse } from 'next/server';
import { fromZonedTime, formatInTimeZone } from 'date-fns-tz';
import { prisma } from '@/lib/prisma';
import { TZ } from '@/lib/availability';
import { sendReminderEmail } from '@/lib/bookingEmails';

export const dynamic = 'force-dynamic';

// GET /api/cron/reminders — run daily by Vercel Cron (see vercel.json).
// Sends a one-time reminder for CONFIRMED reservations happening "tomorrow" (Athens).
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = request.headers.get('authorization');
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Tomorrow's local-day window [start, end) as UTC instants.
  const todayStr = formatInTimeZone(new Date(), TZ, 'yyyy-MM-dd');
  const [y, m, d] = todayStr.split('-').map(Number);
  const tomorrow = new Date(Date.UTC(y, m - 1, d + 1));
  const dayAfter = new Date(Date.UTC(y, m - 1, d + 2));
  const fmt = (dt: Date) => `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
  const start = fromZonedTime(`${fmt(tomorrow)}T00:00:00`, TZ);
  const end = fromZonedTime(`${fmt(dayAfter)}T00:00:00`, TZ);

  const reservations = await prisma.reservation.findMany({
    where: {
      status: 'CONFIRMED',
      reminded24: false,
      bookings: { some: { startsAt: { gte: start, lt: end } } },
    },
    include: { bookings: { include: { service: true, staff: true, room: true } } },
  });

  let sent = 0;
  for (const r of reservations) {
    try {
      await sendReminderEmail(r);
      await prisma.reservation.update({ where: { id: r.id }, data: { reminded24: true } });
      sent++;
    } catch {
      /* leave reminded24=false so the next run retries */
    }
  }

  return NextResponse.json({ ok: true, window: { start, end }, candidates: reservations.length, sent });
}
