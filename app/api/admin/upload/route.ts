import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { storageConfigured, uploadImage } from '@/lib/storage';

export const dynamic = 'force-dynamic';

// Allowlist real image formats (file.type is client-declared — don't trust
// a bare image/* prefix, e.g. image/svg+xml can carry scripts).
// Match the bucket's allowed MIME types (jpeg/png/webp). image/svg+xml is excluded
// deliberately — it can carry scripts; file.type is client-declared so don't trust image/*.
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

// POST /api/admin/upload (multipart: file) — uploads an image to Supabase Storage.
export async function POST(request: Request) {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!storageConfigured()) return NextResponse.json({ error: 'Image storage is not configured.' }, { status: 501 });

  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  // Images attach to an existing service (path is keyed by id) — save-first is enforced.
  const serviceId = Number(form?.get('serviceId'));
  if (!Number.isInteger(serviceId) || serviceId <= 0) return NextResponse.json({ error: 'Save the service first, then add an image.' }, { status: 400 });
  const exists = await prisma.service.findUnique({ where: { id: serviceId }, select: { id: true } });
  if (!exists) return NextResponse.json({ error: 'Service not found' }, { status: 404 });
  if (!(file instanceof File)) return NextResponse.json({ error: 'No file' }, { status: 400 });
  if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: 'Only JPEG, PNG or WebP images are allowed' }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Max file size is 5 MB' }, { status: 400 });

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const url = await uploadImage({ name: file.name, type: file.type, bytes }, serviceId);
    return NextResponse.json({ ok: true, url });
  } catch {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
