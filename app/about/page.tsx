import type { Metadata } from 'next';
import About from '@/components/sections/About';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Our Story',
  description:
    'The story behind Nommar — a Kamari sanctuary where the rhythm of Santorini meets the quiet discipline of Japanese head-spa rituals.',
  path: '/about',
});

export default function Page() {
  return <About />;
}
