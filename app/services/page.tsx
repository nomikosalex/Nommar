import type { Metadata } from 'next';
import Services from '@/components/sections/Services';
import { pageMetadata, jsonLdScript } from '@/lib/seo';
import { prisma } from '@/lib/prisma';
import { getBaseUrl } from '@/lib/urls';

export const metadata: Metadata = pageMetadata({
  title: 'Services',
  description:
    'Explore the Nommar menu — signature Japanese head spa, massage, body treatments and personalized facial rituals in Kamari, Santorini.',
  path: '/services',
});

// Prices/descriptions are admin-editable — revalidate hourly rather than on
// every request (force-dynamic) or never (fully static).
export const revalidate = 3600;

const PROVIDER = { '@type': 'DaySpa', name: 'Nommar — Beauty & Spa by Margarita', url: getBaseUrl() };

// One Service entry per active treatment — read server-side directly from the
// DB (prices are admin-editable and nullable, never present in the static
// marketing copy) so AI/search engines get exact current facts, not a stale
// snapshot. A service with no price set omits `offers` rather than emitting 0.
async function serviceJsonLd() {
  const services = await prisma.service.findMany({
    where: { active: true },
    select: { name: true, category: true, description: true, durationMin: true, priceCents: true },
    orderBy: { id: 'asc' },
  });
  const base = getBaseUrl();
  return services.map((s) => ({
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: s.name,
    description: s.description,
    serviceType: s.category,
    areaServed: 'Kamari, Santorini',
    provider: PROVIDER,
    additionalProperty: { '@type': 'PropertyValue', name: 'duration', value: `${s.durationMin} min` },
    ...(s.priceCents != null
      ? {
          offers: {
            '@type': 'Offer',
            price: (s.priceCents / 100).toFixed(2),
            priceCurrency: 'EUR',
            availability: 'https://schema.org/InStock',
            url: `${base}/book`,
          },
        }
      : {}),
  }));
}

export default async function Page() {
  const jsonLd = await serviceJsonLd();
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <Services />
    </>
  );
}
