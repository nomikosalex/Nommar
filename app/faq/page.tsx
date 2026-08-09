import type { Metadata } from 'next';
import FAQ from '@/components/sections/FAQ';
import { pageMetadata, jsonLdScript } from '@/lib/seo';
import { FAQS } from '@/lib/data';

export const metadata: Metadata = pageMetadata({
  title: 'FAQ',
  description:
    'Answers to common questions about Nommar Beauty & Spa — the Japanese head spa, location, opening hours, pricing, couples treatments, booking and hair removal.',
  path: '/faq',
});

// English-only, matching every other page's structured data (the site's EN/GR
// toggle is client-side only — see lib/lang.tsx — so search/AI crawlers only
// ever see the English-rendered HTML regardless).
const JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map((f) => ({
    '@type': 'Question',
    name: f.q[0],
    acceptedAnswer: { '@type': 'Answer', text: f.a[0] },
  })),
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(JSON_LD) }} />
      <FAQ />
    </>
  );
}
