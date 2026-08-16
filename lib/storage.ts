import { createClient } from '@supabase/supabase-js';

// Server-side Supabase Storage helper (uses the service-role key — never import
// this into client components).
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // service-role (server-only) — bypasses Storage RLS
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'service-images';

export function storageConfigured(): boolean {
  return Boolean(URL && KEY);
}

function client() {
  return createClient(URL as string, KEY as string, { auth: { persistSession: false } });
}

function extOf(name: string): string {
  return (name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function uploadToPath(file: { type: string; bytes: Buffer }, path: string): Promise<string> {
  const supa = client();
  const { error } = await supa.storage.from(BUCKET).upload(path, file.bytes, { contentType: file.type, upsert: false });
  if (error) throw error;
  return supa.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

// Upload image bytes for a given service and return its public URL. The service
// must already exist (path is keyed by its id) — the caller enforces save-first.
// Path: services/{serviceId}/{timestamp}.{ext}  (ext kept as the real format).
export async function uploadImage(file: { name: string; type: string; bytes: Buffer }, serviceId: number): Promise<string> {
  return uploadToPath(file, `services/${serviceId}/${Date.now()}.${extOf(file.name)}`);
}

// Upload a gallery photo and return its public URL. Unlike services, gallery
// images have no pre-existing parent row to key the path off — the caller
// creates the GalleryImage row right after this resolves.
// Path: gallery/{timestamp}.{ext}
export async function uploadGalleryImage(file: { name: string; type: string; bytes: Buffer }): Promise<string> {
  return uploadToPath(file, `gallery/${Date.now()}.${extOf(file.name)}`);
}
