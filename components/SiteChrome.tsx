'use client';
import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { css } from '@/lib/css';
import { LangProvider } from '@/lib/lang';
import { CONFIG } from '@/lib/site.config';
import { SmoothScroll } from '@/components/layout/SmoothScroll';
import AnnouncementBanner from '@/components/AnnouncementBanner';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import FloatingBook from '@/components/FloatingBook';

// Client shell: language context + smooth scroll + persistent chrome around pages.
export default function SiteChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  // Admin area gets no marketing chrome / smooth scroll.
  if (pathname?.startsWith('/admin')) {
    return <>{children}</>;
  }

  return (
    <LangProvider>
      <SmoothScroll>
        <div
          data-motion={CONFIG.enableMotion ? 'on' : 'off'}
          style={css("font-family:var(--font-jost),sans-serif;background:#FAF5EC;color:#3D2F25;min-height:100dvh;overflow-x:hidden;font-weight:300;")}
        >
          <a href="#main" className="skip-link">Skip to content</a>
          <AnnouncementBanner />
          <Nav />
          <main id="main">{children}</main>
          <Footer />
          <FloatingBook />
        </div>
      </SmoothScroll>
    </LangProvider>
  );
}
