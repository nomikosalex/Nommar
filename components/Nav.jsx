'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { css } from '@/lib/css';
import { FX } from '@/lib/fx';
import { useLang } from '@/lib/lang';
import { useIsMobile } from '@/lib/useIsMobile';

const NAV = [
  { key: 'home', href: '/', tkey: 'navHome' },
  { key: 'services', href: '/services', tkey: 'navServices' },
  { key: 'packages', href: '/packages', tkey: 'navPackages' },
  { key: 'about', href: '/about', tkey: 'navAbout' },
  { key: 'contact', href: '/contact', tkey: 'navContact' },
];

export default function Nav() {
  const { t, lang, setLang } = useLang();
  const isMobile = useIsMobile();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const items = NAV.map((n) => ({ ...n, label: t[n.tkey], active: n.href === pathname }));

  return (
    <nav style={css('position:sticky;top:0;z-index:50;background:rgba(250,245,236,0.86);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid rgba(194,165,107,0.28);')}>
      <div style={css('max-width:1280px;margin:0 auto;padding:14px clamp(18px,4vw,56px);display:flex;align-items:center;justify-content:space-between;gap:24px;')}>
        <Link href="/" onClick={() => setMenuOpen(false)} style={css('display:flex;align-items:center;gap:13px;background:none;border:none;cursor:pointer;padding:0;text-decoration:none;')}>
          <img src="/assets/logo-emblem.png" alt="Nommar" width="42" height="42" style={css('width:42px;height:42px;object-fit:contain;display:block;')} />
          <span style={css('display:flex;flex-direction:column;align-items:flex-start;line-height:1;gap:4px;')}>
            <span style={css("font-family:var(--font-cinzel),serif;font-size:21px;letter-spacing:0.14em;font-weight:600;background:linear-gradient(180deg,#BFA15F,#E6CF95 48%,#BFA15F);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;")}>NOMMAR</span>
            <span style={css("font-family:var(--font-jost),sans-serif;font-size:8.5px;letter-spacing:0.42em;text-transform:uppercase;color:#A8967C;font-weight:400;")}>Beauty &amp; Spa</span>
          </span>
        </Link>

        {!isMobile && (
          <div style={css('display:flex;align-items:center;gap:clamp(18px,2.4vw,38px);')}>
            {items.map((item) => (
              <FX
                key={item.key}
                as={Link}
                href={item.href}
                style="position:relative;background:none;border:none;cursor:pointer;font-family:var(--font-jost),sans-serif;font-size:12.5px;letter-spacing:0.2em;text-transform:uppercase;color:#3D2F25;font-weight:400;padding:6px 0;text-decoration:none;"
                hover="color:#C2A56B;"
              >
                {item.label}
                {item.active && <span style={css('position:absolute;left:0;right:0;bottom:-2px;height:1px;background:#C2A56B;')} />}
              </FX>
            ))}
            <div style={css('width:1px;height:18px;background:rgba(194,165,107,0.4);')} />
            <div style={css("display:flex;align-items:center;gap:8px;font-family:var(--font-jost),sans-serif;font-size:11.5px;letter-spacing:0.16em;")}>
              <FX as="button" onClick={() => setLang('en')} style="background:none;border:none;cursor:pointer;padding:2px;letter-spacing:0.16em;" hover="color:#C2A56B;">
                <span style={css(lang === 'en' ? 'color:#C2A56B;font-weight:500;' : 'color:#A8967C;font-weight:400;')}>EN</span>
              </FX>
              <span style={css('color:rgba(168,150,124,0.7);')}>/</span>
              <FX as="button" onClick={() => setLang('gr')} style="background:none;border:none;cursor:pointer;padding:2px;letter-spacing:0.16em;" hover="color:#C2A56B;">
                <span style={css(lang === 'gr' ? 'color:#C2A56B;font-weight:500;' : 'color:#A8967C;font-weight:400;')}>GR</span>
              </FX>
            </div>
            <FX as={Link} href="/book" style="font-family:var(--font-jost),sans-serif;font-size:11.5px;letter-spacing:0.2em;text-transform:uppercase;color:#3D2F25;font-weight:500;background:linear-gradient(135deg,#E6CF95,#C2A56B);border:none;padding:12px 24px;cursor:pointer;border-radius:1px;box-shadow:0 6px 20px -6px rgba(194,165,107,0.6);transition:transform .4s ease,box-shadow .4s ease;text-decoration:none;" hover="transform:translateY(-2px);box-shadow:0 12px 28px -8px rgba(194,165,107,0.75);">{t.bookNow}</FX>
          </div>
        )}

        {isMobile && (
          <div style={css('display:flex;align-items:center;gap:16px;')}>
            <Link href="/book" onClick={() => setMenuOpen(false)} style={css("font-family:var(--font-jost),sans-serif;font-size:10.5px;letter-spacing:0.18em;text-transform:uppercase;color:#3D2F25;font-weight:500;background:linear-gradient(135deg,#E6CF95,#C2A56B);border:none;padding:10px 18px;cursor:pointer;border-radius:1px;text-decoration:none;")}>
              {t.bookNow}
            </Link>
            <button onClick={() => setMenuOpen((m) => !m)} aria-label="Menu" style={css('background:none;border:none;cursor:pointer;display:flex;flex-direction:column;gap:5px;padding:6px 2px;')}>
              <span style={css('width:24px;height:1.5px;background:#3D2F25;display:block;')} />
              <span style={css('width:24px;height:1.5px;background:#3D2F25;display:block;')} />
              <span style={css('width:24px;height:1.5px;background:#3D2F25;display:block;')} />
            </button>
          </div>
        )}
      </div>

      {isMobile && menuOpen && (
        <div style={css('border-top:1px solid rgba(194,165,107,0.28);background:#FAF5EC;padding:8px clamp(18px,5vw,40px) 22px;')}>
          {items.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              style={css("display:block;width:100%;text-align:left;background:none;border:none;border-bottom:1px solid rgba(194,165,107,0.18);cursor:pointer;font-family:var(--font-cinzel),serif;font-size:16px;letter-spacing:0.08em;color:#3D2F25;padding:15px 0;text-decoration:none;")}
            >
              {item.label}
            </Link>
          ))}
          <div style={css("display:flex;gap:14px;margin-top:18px;font-family:var(--font-jost),sans-serif;font-size:12px;letter-spacing:0.18em;color:#A8967C;")}>
            <button onClick={() => setLang('en')} style={css('background:none;border:none;cursor:pointer;color:' + (lang === 'en' ? '#C2A56B' : '#A8967C') + ';letter-spacing:0.18em;')}>EN</button>
            <span>/</span>
            <button onClick={() => setLang('gr')} style={css('background:none;border:none;cursor:pointer;color:' + (lang === 'gr' ? '#C2A56B' : '#A8967C') + ';letter-spacing:0.18em;')}>GR</button>
          </div>
        </div>
      )}
    </nav>
  );
}
