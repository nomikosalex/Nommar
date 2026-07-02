import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { slugify } from '@/lib/data';
import { CATEGORY_LIST } from '@/lib/booking.config';

export const dynamic = 'force-dynamic';

async function guard() {
  return !!(await getSession());
}

// GET — all services (incl. inactive) with how many staff perform each.
export async function GET() {
  if (!(await guard())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const services = await prisma.service.findMany({
    include: { _count: { select: { staff: true } } },
    orderBy: { id: 'asc' },
  });
  return NextResponse.json({ services });
}

function validate(body: any) {
  const name = String(body?.name ?? '').trim();
  const category = String(body?.category ?? '');
  const durationMin = Number(body?.durationMin);
  if (!name) return 'Name is required';
  if (!CATEGORY_LIST.includes(category)) return 'Invalid category';
  if (!Number.isInteger(durationMin) || durationMin < 5 || durationMin > 600) return 'Duration must be 5–600 min';
  if (body?.priceCents != null && (!Number.isInteger(Number(body.priceCents)) || Number(body.priceCents) < 0)) return 'Invalid price';
  return null;
}

// Only accept http(s) image URLs (what our uploader produces).
function validImageUrl(u: unknown): boolean {
  if (typeof u !== 'string' || !u) return false;
  try {
    return ['http:', 'https:'].includes(new URL(u).protocol);
  } catch {
    return false;
  }
}

// POST — create a service.
export async function POST(request: Request) {
  if (!(await guard())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const err = validate(body);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const slug = slugify(body.name);
  if (await prisma.service.findUnique({ where: { slug } })) {
    return NextResponse.json({ error: 'A service with that name already exists' }, { status: 400 });
  }
  const service = await prisma.service.create({
    data: {
      slug,
      name: body.name.trim(),
      category: body.category,
      durationMin: Number(body.durationMin),
      priceCents: body.priceCents != null && body.priceCents !== '' ? Number(body.priceCents) : null,
      description: String(body.description ?? '').trim(),
      imageUrl: validImageUrl(body.imageUrl) ? body.imageUrl : null,
    },
  });
  return NextResponse.json({ ok: true, service }, { status: 201 });
}

// PATCH — update fields (name/category/duration/price/description/active).
export async function PATCH(request: Request) {
  if (!(await guard())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const id = Number(body?.id);
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (body.name != null) data.name = String(body.name).trim();
  if (body.category != null) {
    if (!CATEGORY_LIST.includes(body.category)) return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    data.category = body.category;
  }
  if (body.durationMin != null) data.durationMin = Number(body.durationMin);
  if (body.description != null) data.description = String(body.description).trim();
  if (typeof body.active === 'boolean') data.active = body.active;
  if (body.imageUrl !== undefined) data.imageUrl = validImageUrl(body.imageUrl) ? body.imageUrl : null;
  if (body.priceCents !== undefined) data.priceCents = body.priceCents === null || body.priceCents === '' ? null : Number(body.priceCents);

  const service = await prisma.service.update({ where: { id }, data });
  return NextResponse.json({ ok: true, service });
}

// DELETE — only if no bookings reference it; otherwise deactivate instead.
export async function DELETE(request: Request) {
  if (!(await guard())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const count = await prisma.booking.count({ where: { serviceId: id } });
  if (count > 0) {
    await prisma.service.update({ where: { id }, data: { active: false } });
    return NextResponse.json({ ok: true, deactivated: true });
  }
  await prisma.service.delete({ where: { id } });
  return NextResponse.json({ ok: true, deleted: true });
}
