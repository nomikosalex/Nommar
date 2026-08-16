import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

async function guard() {
  return !!(await getSession());
}

// GET — all gallery images (incl. inactive), for the admin grid.
export async function GET() {
  if (!(await guard())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const images = await prisma.galleryImage.findMany({ orderBy: { displayOrder: 'asc' } });
  return NextResponse.json({ images });
}

function validateUpdate(u: any): string | null {
  if (!Number.isInteger(Number(u?.id))) return 'Update is missing a valid id';
  if (u?.displayOrder !== undefined && !Number.isInteger(Number(u.displayOrder))) return 'Invalid display order';
  if (u?.active !== undefined && typeof u.active !== 'boolean') return 'Invalid active flag';
  return null;
}
const cleanUpdate = (u: any) => {
  const data: Record<string, unknown> = {};
  if (u.captionEn !== undefined) data.captionEn = String(u.captionEn ?? '').trim() || null;
  if (u.captionGr !== undefined) data.captionGr = String(u.captionGr ?? '').trim() || null;
  if (u.displayOrder !== undefined) data.displayOrder = Number(u.displayOrder);
  if (typeof u.active === 'boolean') data.active = u.active;
  return data;
};

// PUT — batch save: { updates:[{id,…}] } applied in ONE transaction. Rows
// themselves are created by /api/admin/upload (target=gallery), not here —
// this route only ever updates existing rows (captions, order, active).
export async function PUT(request: Request) {
  if (!(await guard())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const updates: any[] = Array.isArray(body?.updates) ? body.updates : [];
  if (updates.length === 0) return NextResponse.json({ error: 'No changes to save' }, { status: 400 });

  for (const u of updates) {
    const err = validateUpdate(u);
    if (err) return NextResponse.json({ error: `Image ${u?.id ?? '?'}: ${err}` }, { status: 400 });
  }

  try {
    // ONE atomic transaction — array form, never a per-item loop.
    await prisma.$transaction(updates.map((u) => prisma.galleryImage.update({ where: { id: Number(u.id) }, data: cleanUpdate(u) })));
    return NextResponse.json({ ok: true, updated: updates.length });
  } catch (e: any) {
    if (e?.code === 'P2025') return NextResponse.json({ error: 'One of the images no longer exists — reload and try again' }, { status: 409 });
    return NextResponse.json({ error: 'Could not save changes — no changes were applied' }, { status: 500 });
  }
}

// DELETE — immediate + atomic. No other table references GalleryImage, so a
// hard delete is always safe (unlike Service, which soft-deletes when
// bookings reference it).
export async function DELETE(request: Request) {
  if (!(await guard())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  await prisma.galleryImage.delete({ where: { id } }).catch((e: any) => {
    if (e?.code !== 'P2025') throw e; // already gone — treat as success
  });
  return NextResponse.json({ ok: true, deleted: true });
}
