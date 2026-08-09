import type { Metadata, Viewport } from 'next';
import { Cinzel, Cormorant_Garamond, Jost, Pinyon_Script } from 'next/font/google';
import './globals.css';
import SiteChrome from '@/components/SiteChrome';
import { getBaseUrl } from '@/lib/urls';
import { jsonLdScript } from '@/lib/seo';

// Canonical origin — driven by NEXT_PUBLIC_BASE_URL so it's correct in every
// environment (localhost / nommar.vercel.app now / nommar.gr after cutover).
const BASE = getBaseUrl();
const SOCIAL_IMAGE = `${BASE}/assets/nommar-social.jpg`;
// 1200x630 (OG/Twitter card ratio) variant of the square brand image above.
const SOCIAL_IMAGE_WIDE = `${BASE}/assets/nommar-social-wide.jpg`;

// Self-hosted via next/font (no extra requests, no layout shift). Exposed as CSS
// variables that the inline styles reference, e.g. font-family:var(--font-jost).
const cinzel = Cinzel({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-cinzel', display: 'swap' });
const cormorant = Cormorant_Garamond({ subsets: ['latin'], weight: ['400', '500', '600'], style: ['normal', 'italic'], variable: '--font-cormorant', display: 'swap' });
const jost = Jost({ subsets: ['latin'], weight: ['300', '400', '500'], variable: '--font-jost', display: 'swap' });
const pinyon = Pinyon_Script({ subsets: ['latin'], weight: ['400'], variable: '--font-pinyon', display: 'swap' });
const fontVars = `${cinzel.variable} ${cormorant.variable} ${jost.variable} ${pinyon.variable}`;

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover', // allow env(safe-area-inset-*) on notched iPhones
  themeColor: '#FAF5EC',
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: {
    default: 'Nommar — Beauty & Spa by Margarita · Kamari, Santorini',
    template: '%s · Nommar — Beauty & Spa',
  },
  description:
    'Nommar — Beauty & Spa by Margarita. Japanese-inspired head spa, massage, body and facial rituals in Kamari, Santorini.',
  icons: { icon: '/assets/logo-emblem.png' },
  alternates: { canonical: BASE },
  openGraph: {
    type: 'website',
    siteName: 'Nommar — Beauty & Spa',
    title: 'Nommar — Beauty & Spa by Margarita · Kamari, Santorini',
    description: 'Japanese-inspired head spa, massage, body and facial rituals in Kamari, Santorini.',
    images: [
      {
        url: SOCIAL_IMAGE_WIDE,
        width: 1200,
        height: 630,
        alt: 'Nommar — Beauty & Spa by Margarita',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nommar — Beauty & Spa by Margarita · Kamari, Santorini',
    description: 'Japanese-inspired head spa, massage, body and facial rituals in Kamari, Santorini.',
    images: [SOCIAL_IMAGE_WIDE],
  },
};

// LocalBusiness (DaySpa) structured data (Google rich results / Maps / AI answer engines).
// DaySpa is schema.org's most specific applicable subtype (LocalBusiness > HealthAndBeautyBusiness > DaySpa).
const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'DaySpa',
  name: 'Nommar — Beauty & Spa by Margarita',
  description: 'Japanese-inspired head spa, massage, body and facial rituals in Kamari, Santorini.',
  image: SOCIAL_IMAGE,
  logo: SOCIAL_IMAGE,
  url: BASE,
  address: { '@type': 'PostalAddress', addressLocality: 'Kamari', addressRegion: 'Santorini', addressCountry: 'GR' },
  geo: { '@type': 'GeoCoordinates', latitude: 36.380054, longitude: 25.4846011 },
  hasMap: 'https://maps.app.goo.gl/nNmHFmrjEtzoLXYPA',
  telephone: '+306980133499',
  email: 'info@nommar.gr',
  sameAs: ['https://www.instagram.com/nommar.beauty.spa/', 'https://www.tiktok.com/@nommar31'],
  openingHours: 'Mo-Su 10:00-21:00',
  priceRange: '€€€',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={fontVars}>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(JSON_LD) }} />
      </head>
      <body>
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
