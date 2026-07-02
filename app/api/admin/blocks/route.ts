import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/admin/blocks — upcoming time-off blocks.
export async function GET() {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const blocks = await prisma.timeOff.findMany({
    where: { endsAt: { gte: new Date() } },
    include: { staff: { select: { name: true } } },
    orderBy: { startsAt: 'asc' },
  });
  return NextResponse.json({ blocks });
}

// POST /api/admin/blocks — { staffId|null, startsAt, endsAt, reason? } (ISO datetimes)
export async function POST(request: Request) {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { staffId, startsAt, endsAt, reason } = await request.json().catch(() => ({}));
  const start = new Date(startsAt);
  const end = new Date(endsAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
    return NextResponse.json({ error: 'Valid start and end are required' }, { status: 400 });
  }
  const block = await prisma.timeOff.create({
    data: { staffId: staffId ?? null, startsAt: start, endsAt: end, reason: reason || null },
  });
  return NextResponse.json({ ok: true, block }, { status: 201 });
}

// DELETE /api/admin/blocks?id=123
export async function DELETE(request: Request) {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await prisma.timeOff.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
