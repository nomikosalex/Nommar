import { createClient } from '@supabase/supabase-js';

// Server-side Supabase Storage helper (uses the service-role key — never import
// this into client components).
const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'images';

export function storageConfigured(): boolean {
  return Boolean(URL && KEY);
}

function client() {
  return createClient(URL as string, KEY as string, { auth: { persistSession: false } });
}

// Upload image bytes and return a public URL.
export async function uploadImage(file: { name: string; type: string; bytes: Buffer }, prefix = 'services'): Promise<string> {
  const supa = client();
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `${prefix}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supa.storage.from(BUCKET).upload(path, file.bytes, { contentType: file.type, upsert: false });
  if (error) throw error;
  return supa.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
