import type { Metadata } from 'next';
import Contact from '@/components/sections/Contact';

export const metadata: Metadata = {
  title: 'Contact & Booking',
  description:
    'Visit or book Nommar Beauty & Spa in Kamari, Santorini. Find our location, hours, contact details and reserve your appointment.',
};

export default function Page() {
  return <Contact />;
}
