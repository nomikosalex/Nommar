import type { Metadata } from 'next';
import Contact from '@/components/sections/Contact';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Contact & Booking',
  description:
    'Visit or book Nommar Beauty & Spa in Kamari, Santorini. Find our location, hours, contact details and reserve your appointment.',
  path: '/contact',
});

export default function Page() {
  return <Contact />;
}
