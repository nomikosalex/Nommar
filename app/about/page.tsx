import type { Metadata } from 'next';
import About from '@/components/sections/About';

export const metadata: Metadata = {
  title: 'Our Story',
  description:
    'The story behind Nommar — a Kamari sanctuary where the rhythm of Santorini meets the quiet discipline of Japanese head-spa rituals.',
};

export default function Page() {
  return <About />;
}
