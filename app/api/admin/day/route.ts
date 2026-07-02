import { NextResponse } from 'next/server';
import { fromZonedTime } from 'date-fns-tz';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';
const TZ = process.env.NEXT_PUBLIC_TZ || 'Europe/Athens';

function nextDay(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + 1));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
}

// GET /api/admin/day?date=YYYY-MM-DD — that day's appointments + active staff.
export async function GET(request: Request) {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const date = new URL(request.url).searchParams.get('date') || '';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: 'date required' }, { status: 400 });

  const from = fromZonedTime(`${date}T00:00:00`, TZ);
  const to = fromZonedTime(`${nextDay(date)}T00:00:00`, TZ);

  const [appointments, staff] = await Promise.all([
    prisma.booking.findMany({
      where: { startsAt: { gte: from, lt: to }, reservation: { status: { not: 'CANCELLED' } } },
      include: {
        service: { select: { name: true, durationMin: true } },
        staff: { select: { id: true, name: true } },
        room: { select: { name: true } },
        reservation: { select: { status: true, customerName: true } },
      },
      orderBy: { startsAt: 'asc' },
    }),
    prisma.staff.findMany({ where: { active: true }, select: { id: true, name: true }, orderBy: { id: 'asc' } }),
  ]);

  return NextResponse.json({ appointments, staff });
}
