import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { storageConfigured, uploadImage } from '@/lib/storage';

export const dynamic = 'force-dynamic';

// Allowlist real image formats (file.type is client-declared — don't trust
// a bare image/* prefix, e.g. image/svg+xml can carry scripts).
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);

// POST /api/admin/upload (multipart: file) — uploads an image to Supabase Storage.
export async function POST(request: Request) {
  if (!(await getSession())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!storageConfigured()) return NextResponse.json({ error: 'Image storage is not configured.' }, { status: 501 });

  const form = await request.formData().catch(() => null);
  const file = form?.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'No file' }, { status: 400 });
  if (!ALLOWED_TYPES.has(file.type)) return NextResponse.json({ error: 'Only JPEG/PNG/WebP/GIF/AVIF images are allowed' }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Max file size is 5 MB' }, { status: 400 });

  try {
    const bytes = Buffer.from(await file.arrayBuffer());
    const url = await uploadImage({ name: file.name, type: file.type, bytes });
    return NextResponse.json({ ok: true, url });
  } catch {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
