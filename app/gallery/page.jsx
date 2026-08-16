import Gallery from '@/components/sections/Gallery';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Gallery',
  description:
    'Photos from Nommar — a Japanese-inspired head spa and wellness spa in Kamari, Santorini. Treatments, spaces and the details of a visit.',
  path: '/gallery',
});

export default function Page() {
  return <Gallery />;
}
