'use client';
import Link from 'next/link';
import { css } from '@/lib/css';
import { FX } from '@/lib/fx';
import { useLang } from '@/lib/lang';
import { CONTACT, YEAR } from '@/lib/data';

const NAV = [
  { href: '/', tkey: 'navHome' },
  { href: '/services', tkey: 'navServices' },
  { href: '/packages', tkey: 'navPackages' },
  { href: '/about', tkey: 'navAbout' },
  { href: '/contact', tkey: 'navContact' },
];

export default function Footer() {
  const { t } = useLang();

  return (
    <footer style={css('background:#3D2F25;color:#E4D6BF;')}>
      <div style={css('max-width:1240px;margin:0 auto;padding:clamp(54px,7vw,88px) clamp(24px,6vw,72px) clamp(30px,4vw,48px);display:grid;grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr));gap:clamp(36px,4vw,56px);')}>
        <div>
          <div style={css('display:flex;align-items:center;gap:12px;margin-bottom:18px;')}>
            <img src="/assets/logo-emblem.png" alt="Nommar" width="46" height="46" style={css('width:46px;height:46px;object-fit:contain;')} />
            <span style={css("font-family:var(--font-cinzel),serif;font-size:22px;letter-spacing:0.14em;font-weight:600;background:linear-gradient(180deg,#BFA15F,#E6CF95 48%,#BFA15F);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;")}>NOMMAR</span>
          </div>
          <div style={css("font-family:var(--font-jost),sans-serif;font-size:10px;letter-spacing:0.36em;text-transform:uppercase;color:#A8967C;margin-bottom:6px;")}>Beauty &amp; Spa</div>
          <div style={css("font-family:var(--font-pinyon),cursive;font-size:28px;color:#C2A56B;margin-bottom:18px;")}>by Margarita</div>
          <p style={css("font-family:var(--font-cormorant),serif;font-style:italic;font-size:17px;line-height:1.5;color:#C9B89B;max-width:30ch;margin:0;")}>Wellness begins the moment you allow yourself to slow down.</p>
        </div>
        <div>
          <div style={css("font-family:var(--font-jost),sans-serif;font-size:11px;letter-spacing:0.24em;text-transform:uppercase;color:#C2A56B;margin-bottom:18px;")}>Explore</div>
          <div style={css('display:flex;flex-direction:column;gap:12px;align-items:flex-start;')}>
            {NAV.map((item) => (
              <FX key={item.href} as={Link} href={item.href} style="background:none;border:none;cursor:pointer;font-family:var(--font-jost),sans-serif;font-weight:300;font-size:14px;color:#E4D6BF;letter-spacing:0.04em;padding:0;text-align:left;text-decoration:none;" hover="color:#C2A56B;">
                {t[item.tkey]}
              </FX>
            ))}
          </div>
        </div>
        <div>
          <div style={css("font-family:var(--font-jost),sans-serif;font-size:11px;letter-spacing:0.24em;text-transform:uppercase;color:#C2A56B;margin-bottom:18px;")}>Visit</div>
          <div style={css("font-family:var(--font-jost),sans-serif;font-weight:300;font-size:14px;line-height:1.9;color:#C9B89B;")}>
            {CONTACT.location[0]}<br />{CONTACT.location[1]}<br />{CONTACT.phones[0]}<br />{CONTACT.phones[1]}
          </div>
        </div>
        <div>
          <div style={css("font-family:var(--font-jost),sans-serif;font-size:11px;letter-spacing:0.24em;text-transform:uppercase;color:#C2A56B;margin-bottom:18px;")}>Connect</div>
          <div style={css("font-family:var(--font-jost),sans-serif;font-weight:300;font-size:14px;line-height:1.9;color:#C9B89B;")}>
            <FX as="a" href={CONTACT.instagram.url} target="_blank" rel="noopener" style="color:#C9B89B;text-decoration:none;" hover="color:#C2A56B;">{CONTACT.instagram.handle}</FX>
            <br />{CONTACT.email}<br />{CONTACT.hours}
          </div>
          <FX as={Link} href="/book" style="margin-top:20px;display:inline-block;font-family:var(--font-jost),sans-serif;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#3D2F25;font-weight:500;background:linear-gradient(135deg,#E6CF95,#C2A56B);border:none;padding:12px 22px;cursor:pointer;border-radius:1px;transition:transform .35s ease;text-decoration:none;" hover="transform:translateY(-2px);">{t.bookNow}</FX>
        </div>
      </div>
      <div style={css('border-top:1px solid rgba(194,165,107,0.22);')}>
        <div style={css('max-width:1240px;margin:0 auto;padding:22px clamp(24px,6vw,72px);display:flex;flex-wrap:wrap;gap:10px;justify-content:space-between;align-items:center;')}>
          <span style={css("font-family:var(--font-jost),sans-serif;font-weight:300;font-size:11.5px;letter-spacing:0.08em;color:#A8967C;")}>© {YEAR} Nommar — Beauty &amp; Spa by Margarita</span>
          <span style={css("font-family:var(--font-jost),sans-serif;font-weight:300;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#7A6A55;")}>Kamari · Santorini · Greece</span>
        </div>
      </div>
    </footer>
  );
}
