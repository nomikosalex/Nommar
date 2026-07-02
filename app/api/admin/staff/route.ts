import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function guard() {
  return !!(await getSession());
}

// GET — staff with working hours + the services they perform.
export async function GET() {
  if (!(await guard())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const staff = await prisma.staff.findMany({
    include: {
      workingHours: { orderBy: [{ weekday: 'asc' }, { startMin: 'asc' }] },
      services: { select: { id: true, name: true } },
    },
    orderBy: { id: 'asc' },
  });
  return NextResponse.json({ staff });
}

// POST — create a staff member { name, serviceIds?[] }.
export async function POST(request: Request) {
  if (!(await guard())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const name = String(body?.name ?? '').trim();
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  const serviceIds: number[] = Array.isArray(body?.serviceIds) ? body.serviceIds.map(Number) : [];
  const staff = await prisma.staff.create({
    data: { name, services: { connect: serviceIds.map((id) => ({ id })) } },
  });
  return NextResponse.json({ ok: true, staff }, { status: 201 });
}

// PATCH — { id, name?, active?, serviceIds? } (serviceIds replaces the set).
export async function PATCH(request: Request) {
  if (!(await guard())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const id = Number(body?.id);
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (body.name != null) data.name = String(body.name).trim();
  if (typeof body.active === 'boolean') data.active = body.active;
  if (Array.isArray(body.serviceIds)) data.services = { set: body.serviceIds.map((sid: number) => ({ id: Number(sid) })) };

  const staff = await prisma.staff.update({ where: { id }, data });
  return NextResponse.json({ ok: true, staff });
}

// DELETE — only if no bookings reference them; otherwise deactivate.
export async function DELETE(request: Request) {
  if (!(await guard())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const count = await prisma.booking.count({ where: { staffId: id } });
  if (count > 0) {
    await prisma.staff.update({ where: { id }, data: { active: false } });
    return NextResponse.json({ ok: true, deactivated: true });
  }
  await prisma.staff.delete({ where: { id } });
  return NextResponse.json({ ok: true, deleted: true });
}
