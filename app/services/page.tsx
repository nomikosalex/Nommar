import type { Metadata } from 'next';
import Services from '@/components/sections/Services';

export const metadata: Metadata = {
  title: 'Services',
  description:
    'Explore the Nommar menu — signature Japanese head spa, massage, body treatments and personalized facial rituals in Kamari, Santorini.',
};

export default function Page() {
  return <Services />;
}
