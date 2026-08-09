import type { Metadata } from 'next';
import { getBaseUrl } from './urls';

// Next.js shallow-merges metadata across layout/page segments: if a page sets
// its own `openGraph`, the WHOLE object replaces the layout's (fields aren't
// merged field-by-field) — so every page must repeat shared fields like the
// image, not just its own title/description. Centralized here to keep that
// single source of truth instead of duplicating it in every page.tsx.
export const SITE_NAME = 'Nommar — Beauty & Spa';
const OG_IMAGE = {
  url: `${getBaseUrl()}/assets/nommar-social-wide.jpg`,
  width: 1200,
  height: 630,
  alt: 'Nommar — Beauty & Spa by Margarita',
};

// Escapes `<` so a value containing a literal "</script>" (e.g. admin-edited
// service copy) can't break out of the JSON-LD <script> tag — < is a
// valid JSON escape, so it round-trips correctly for any JSON-LD consumer.
export function jsonLdScript(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export function pageMetadata({ title, description, path }: { title: string; description: string; path: string }): Metadata {
  const url = `${getBaseUrl()}${path}`;
  const ogTitle = `${title} · ${SITE_NAME}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      title: ogTitle,
      description,
      url,
      images: [OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description,
      images: [OG_IMAGE.url],
    },
  };
}
