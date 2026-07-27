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

// Validate one UPDATE (only the provided fields). Returns an error string or null.
function validateUpdate(u: any): string | null {
  if (u?.name !== undefined && !String(u.name).trim()) return 'Name is required';
  if (u?.category !== undefined && !CATEGORY_LIST.includes(u.category)) return 'Invalid category';
  if (u?.durationMin !== undefined) { const d = Number(u.durationMin); if (!Number.isInteger(d) || d < 5 || d > 600) return 'Duration must be 5–600 min'; }
  if (u?.priceCents !== undefined && u.priceCents !== null && (!Number.isInteger(Number(u.priceCents)) || Number(u.priceCents) < 0)) return 'Invalid price';
  return null;
}
const cleanUpdate = (u: any) => {
  const data: Record<string, unknown> = {};
  if (u.name !== undefined) data.name = String(u.name).trim();
  if (u.category !== undefined) data.category = u.category;
  if (u.durationMin !== undefined) data.durationMin = Number(u.durationMin);
  if (u.description !== undefined) data.description = String(u.description ?? '').trim();
  if (typeof u.active === 'boolean') data.active = u.active;
  if (u.imageUrl !== undefined) data.imageUrl = validImageUrl(u.imageUrl) ? u.imageUrl : null;
  if (u.priceCents !== undefined) data.priceCents = u.priceCents === null || u.priceCents === '' ? null : Number(u.priceCents);
  return data;
};

// PUT — batch save: { creates:[…], updates:[{id,…}] } applied in ONE transaction.
// All-or-nothing: any validation error or DB failure leaves ZERO services changed.
export async function PUT(request: Request) {
  if (!(await guard())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const creates: any[] = Array.isArray(body?.creates) ? body.creates : [];
  const updates: any[] = Array.isArray(body?.updates) ? body.updates : [];
  if (creates.length === 0 && updates.length === 0) return NextResponse.json({ error: 'No changes to save' }, { status: 400 });

  // --- validate everything up front (name the offending row) ---
  for (const c of creates) {
    const err = validate(c);
    if (err) return NextResponse.json({ error: `${String(c?.name || 'New service').trim() || 'New service'}: ${err}` }, { status: 400 });
  }
  for (const u of updates) {
    if (!Number.isInteger(Number(u?.id))) return NextResponse.json({ error: 'Update is missing a valid id' }, { status: 400 });
    const err = validateUpdate(u);
    if (err) return NextResponse.json({ error: `${String(u?.name || 'Service ' + u.id)}: ${err}` }, { status: 400 });
  }

  // --- slug collisions for creates (existing + within batch) → clear message ---
  const existing = new Set((await prisma.service.findMany({ select: { slug: true } })).map((s) => s.slug));
  const batchSlugs = new Set<string>();

  try {
    const data = creates.map((c) => {
      const slug = slugify(c.name);
      if (existing.has(slug) || batchSlugs.has(slug)) { const e: any = new Error('dup'); e._name = String(c.name).trim(); throw e; }
      batchSlugs.add(slug);
      return { slug, name: String(c.name).trim(), category: c.category, durationMin: Number(c.durationMin), priceCents: c.priceCents != null && c.priceCents !== '' ? Number(c.priceCents) : null, description: String(c.description ?? '').trim() };
    });
    // ONE atomic transaction — array form, never a per-item loop.
    await prisma.$transaction([
      ...data.map((d) => prisma.service.create({ data: d })),
      ...updates.map((u) => prisma.service.update({ where: { id: Number(u.id) }, data: cleanUpdate(u) })),
    ]);
    return NextResponse.json({ ok: true, created: creates.length, updated: updates.length });
  } catch (e: any) {
    if (e?._name) return NextResponse.json({ error: `A service named "${e._name}" already exists` }, { status: 409 });
    if (e?.code === 'P2002') return NextResponse.json({ error: 'A service with that name already exists' }, { status: 409 });
    if (e?.code === 'P2025') return NextResponse.json({ error: 'One of the services no longer exists — reload and try again' }, { status: 409 });
    return NextResponse.json({ error: 'Could not save changes — no changes were applied' }, { status: 500 });
  }
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
