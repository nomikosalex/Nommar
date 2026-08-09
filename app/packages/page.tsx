import type { Metadata } from 'next';
import Packages from '@/components/sections/Packages';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Wellness Journeys',
  description:
    'Curated wellness journeys combining head spa, massage, body and facial rituals at Nommar Beauty & Spa, Kamari, Santorini.',
  path: '/packages',
});

export default function Page() {
  return <Packages />;
}
