import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { localToUtc, nextDayStr } from '@/lib/availability';
import { resolveRange, buildDashboard, type Preset } from '@/lib/analytics';

export const dynamic = 'force-dynamic';

const Query = z.object({
  preset: z.enum(['last7', 'last30', 'month', 'season', 'custom']).default('last30'),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// GET /api/admin/dashboard — one read-only endpoint returning every metric for a
// selected Athens date range. All aggregation happens here; the client gets JSON.
export async function GET(request: Request) {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(request.url);
  const parsed = Query.safeParse({
    preset: url.searchParams.get('preset') ?? undefined,
    from: url.searchParams.get('from') ?? undefined,
    to: url.searchParams.get('to') ?? undefined,
  });
  if (!parsed.success) return NextResponse.json({ error: 'Invalid range' }, { status: 400 });

  const now = new Date();
  const { from, to } = resolveRange(parsed.data.preset as Preset, parsed.data.from, parsed.data.to, now);
  if (from > to) return NextResponse.json({ error: 'from must be on or before to' }, { status: 400 });

  const startUtc = localToUtc(from, 0);
  const endUtc = localToUtc(nextDayStr(to), 0); // exclusive next-midnight

  const [bookings, staff, timeOff, upcoming] = await Promise.all([
    prisma.booking.findMany({
      where: { startsAt: { gte: startUtc, lt: endUtc } },
      select: {
        startsAt: true, endsAt: true, priceCents: true, finalPriceCents: true, guestIndex: true, reservationId: true,
        service: { select: { name: true, slug: true } },
        reservation: { select: { id: true, status: true, promoCode: true, guestCount: true, createdAt: true } },
      },
    }),
    prisma.staff.findMany({ where: { active: true }, select: { id: true, workingHours: { select: { weekday: true, startMin: true, endMin: true } } } }),
    // TimeOff overlapping the range (for the utilisation subtraction)
    prisma.timeOff.findMany({ where: { startsAt: { lt: endUtc }, endsAt: { gt: startUtc } }, select: { staffId: true, startsAt: true, endsAt: true } }),
    // forward-looking pipeline: confirmed & not yet started (independent of range)
    prisma.booking.findMany({ where: { reservation: { is: { status: 'CONFIRMED' } }, startsAt: { gt: now } }, select: { finalPriceCents: true } }),
  ]);

  const data = buildDashboard({ from, to, preset: parsed.data.preset as Preset, bookings, staff, timeOff, upcoming, now });
  return NextResponse.json(data);
}
