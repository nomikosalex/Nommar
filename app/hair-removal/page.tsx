import type { Metadata } from 'next';
import HairRemoval from '@/components/sections/HairRemoval';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Hair Removal',
  description:
    'Hair removal, brow and lash price list at Nommar Beauty & Spa, Kamari, Santorini. By request — contact us to arrange your appointment.',
  path: '/hair-removal',
});

export default function Page() {
  return <HairRemoval />;
}
