import type { Metadata } from 'next';
import Packages from '@/components/sections/Packages';

export const metadata: Metadata = {
  title: 'Wellness Journeys',
  description:
    'Curated wellness journeys combining head spa, massage, body and facial rituals at Nommar Beauty & Spa, Kamari, Santorini.',
};

export default function Page() {
  return <Packages />;
}
