import type { Metadata } from 'next';
import SocialHub from '@/components/social/SocialHub';

// QR / link-in-bio destination — kept out of search so it doesn't compete with
// the main site. Not linked from the nav; reachable only by direct URL.
export const metadata: Metadata = {
  title: 'Nommar — Reviews & Socials',
  robots: { index: false, follow: false },
};

export default function Page() {
  return <SocialHub />;
}
