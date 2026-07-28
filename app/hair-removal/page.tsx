import type { Metadata } from 'next';
import HairRemoval from '@/components/sections/HairRemoval';

export const metadata: Metadata = {
  title: 'Hair Removal',
  description:
    'Hair removal, brow and lash price list at Nommar Beauty & Spa, Kamari, Santorini. By request — contact us to arrange your appointment.',
};

export default function Page() {
  return <HairRemoval />;
}
