import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST /api/admin/hours — add a working-hours block { staffId, weekday, startMin, endMin }
export async function POST(request: Request) {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { staffId, weekday, startMin, endMin } = await request.json().catch(() => ({}));
  if (
    !Number.isInteger(staffId) ||
    !Number.isInteger(weekday) || weekday < 0 || weekday > 6 ||
    !Number.isInteger(startMin) || !Number.isInteger(endMin) || startMin < 0 || endMin > 1440 || startMin >= endMin
  ) {
    return NextResponse.json({ error: 'Invalid working-hours values' }, { status: 400 });
  }
  const row = await prisma.workingHours.create({ data: { staffId, weekday, startMin, endMin } });
  return NextResponse.json({ ok: true, row }, { status: 201 });
}

// DELETE /api/admin/hours?id=123
export async function DELETE(request: Request) {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await prisma.workingHours.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
