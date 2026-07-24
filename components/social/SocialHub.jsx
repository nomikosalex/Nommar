'use client';
import Link from 'next/link';
import { css } from '@/lib/css';
import { FX } from '@/lib/fx';
import { useLang } from '@/lib/lang';

// ---- Links (swap these) ------------------------------------------------------
const GOOGLE_REVIEW_URL = 'https://maps.google.com/?cid=1556539912969315022';
const INSTAGRAM_URL = 'https://www.instagram.com/nommar.beauty.spa/';
const TIKTOK_URL = 'https://www.tiktok.com/@nommar31';
const INSTAGRAM_HANDLE = '@nommar.beauty.spa';
const TIKTOK_HANDLE = '@nommar31';
// -----------------------------------------------------------------------------

const COPY = {
  en: {
    tagline: 'Beauty & Spa · Kamari, Santorini',
    reviewTitle: 'Loved your visit? Leave us a review',
    reviewSub: 'It takes 30 seconds and helps us enormously.',
    reviewCta: 'Leave a Google review',
    socials: 'Follow our socials',
    book: 'Book your ritual',
  },
  gr: {
    tagline: 'Ομορφιά & Spa · Καμάρι, Σαντορίνη',
    reviewTitle: 'Σας άρεσε η επίσκεψή σας; Αφήστε μας μια κριτική',
    reviewSub: 'Παίρνει 30 δευτερόλεπτα και μας βοηθάει πολύ.',
    reviewCta: 'Κριτική στο Google',
    socials: 'Ακολουθήστε μας',
    book: 'Κλείστε το ραντεβού σας',
  },
};

const GOLD = '#C2A56B';

function Stars() {
  return (
    <div aria-hidden="true" style={css('display:flex;justify-content:center;gap:6px;margin-bottom:18px;')}>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} width="18" height="18" viewBox="0 0 24 24" fill={GOLD}>
          <path d="M12 2l2.9 6.26L21.5 9.3l-4.75 4.36 1.2 6.44L12 17.3l-5.95 3.8 1.2-6.44L2.5 9.3l6.6-1.04z" />
        </svg>
      ))}
    </div>
  );
}

function InstagramIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="1.6" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.2" cy="6.8" r="1.15" fill={GOLD} stroke="none" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={GOLD} aria-hidden="true">
      <path d="M16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.08-.14 1.62.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
    </svg>
  );
}

function SocialRow({ href, icon, name, handle }) {
  return (
    <FX
      as="a"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style="display:flex;align-items:center;gap:14px;min-height:48px;padding:12px 18px;background:#FFFDF8;border:1px solid rgba(194,165,107,0.3);border-radius:2px;text-decoration:none;transition:transform .3s ease,border-color .3s ease;"
      hover="transform:translateY(-2px);border-color:#C2A56B;"
    >
      <span style={css('display:flex;align-items:center;justify-content:center;width:24px;')}>{icon}</span>
      <span style={css('display:flex;flex-direction:column;')}>
        <span style={css('font-family:var(--font-jost),sans-serif;font-size:14px;letter-spacing:0.02em;color:#3D2F25;')}>{name}</span>
        <span style={css('font-family:var(--font-jost),sans-serif;font-weight:300;font-size:12.5px;color:#8A7965;')}>{handle}</span>
      </span>
    </FX>
  );
}

export default function SocialHub() {
  const { lang, setLang } = useLang(); // defaults EN, restores stored nommar_lang on mount
  const c = COPY[lang === 'gr' ? 'gr' : 'en'];

  const langBtn = (code, label) => (
    <FX
      as="button"
      onClick={() => setLang(code)}
      aria-label={code === 'en' ? 'English' : 'Ελληνικά'}
      aria-pressed={lang === code}
      style={'background:none;border:none;cursor:pointer;padding:8px 8px;min-height:44px;font-family:var(--font-jost),sans-serif;font-size:12px;letter-spacing:0.16em;color:' + (lang === code ? '#C2A56B;font-weight:500;' : '#A8967C;font-weight:400;')}
      hover="color:#C2A56B;"
    >
      {label}
    </FX>
  );

  return (
    <main
      style={css(
        'min-height:100dvh;background:#FAF5EC;color:#3D2F25;display:flex;flex-direction:column;align-items:center;' +
        'padding:calc(env(safe-area-inset-top) + 18px) clamp(18px,5vw,24px) calc(env(safe-area-inset-bottom) + 28px);',
      )}
    >
      <div style={css('width:100%;max-width:440px;display:flex;flex-direction:column;flex:1;')}>
        {/* language toggle */}
        <div style={css('display:flex;justify-content:flex-end;align-items:center;gap:2px;margin-bottom:6px;')}>
          {langBtn('en', 'EN')}
          <span style={css('color:#D8CBB6;font-size:12px;')}>/</span>
          {langBtn('gr', 'ΕΛ')}
        </div>

        {/* header */}
        <header style={css('text-align:center;margin-bottom:clamp(20px,4vh,34px);')}>
          <img src="/assets/logo-emblem.png" alt="Nommar" width="60" height="60" style={css('width:60px;height:60px;object-fit:contain;display:block;margin:0 auto 10px;')} />
          <div style={css('font-family:var(--font-cinzel),serif;font-size:26px;letter-spacing:0.18em;font-weight:600;background:linear-gradient(180deg,#BFA15F,#E6CF95 48%,#BFA15F);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;')}>
            NOMMAR
          </div>
          <p style={css('font-family:var(--font-cormorant),serif;font-style:italic;font-size:16px;color:#8A7965;margin:8px 0 0;')}>{c.tagline}</p>
        </header>

        {/* PRIMARY — Google review */}
        <section style={css('background:#FFFDF8;border:1px solid rgba(194,165,107,0.35);border-radius:2px;padding:clamp(26px,5vw,36px) clamp(22px,5vw,32px);box-shadow:0 26px 56px -36px rgba(61,47,37,0.5);text-align:center;margin-bottom:clamp(22px,4vh,32px);')}>
          <Stars />
          <h1 style={css('font-family:var(--font-cinzel),serif;font-weight:500;font-size:clamp(20px,4.4vw,24px);line-height:1.3;letter-spacing:0.02em;color:#3D2F25;margin:0 0 12px;')}>{c.reviewTitle}</h1>
          <p style={css('font-family:var(--font-cormorant),serif;font-style:italic;font-size:18px;line-height:1.5;color:#6E5E50;margin:0 auto 26px;max-width:30ch;')}>{c.reviewSub}</p>
          <FX
            as="a"
            href={GOOGLE_REVIEW_URL}
            target="_blank"
            rel="noopener noreferrer"
            style="display:block;font-family:var(--font-jost),sans-serif;font-size:13px;letter-spacing:0.2em;text-transform:uppercase;color:#3D2F25;font-weight:500;background:linear-gradient(135deg,#E6CF95,#C2A56B);border:none;padding:17px 26px;min-height:48px;cursor:pointer;border-radius:2px;box-shadow:0 12px 28px -10px rgba(194,165,107,0.65);transition:transform .3s ease;text-decoration:none;"
            hover="transform:translateY(-2px);"
          >
            {c.reviewCta}
          </FX>
        </section>

        {/* SECONDARY — socials (lighter) */}
        <section style={css('margin-bottom:clamp(22px,4vh,32px);')}>
          <h2 style={css('font-family:var(--font-jost),sans-serif;font-size:11px;letter-spacing:0.24em;text-transform:uppercase;color:#C2A56B;text-align:center;margin:0 0 16px;')}>{c.socials}</h2>
          <div style={css('display:flex;flex-direction:column;gap:12px;')}>
            <SocialRow href={INSTAGRAM_URL} icon={<InstagramIcon />} name="Instagram" handle={INSTAGRAM_HANDLE} />
            <SocialRow href={TIKTOK_URL} icon={<TikTokIcon />} name="TikTok" handle={TIKTOK_HANDLE} />
          </div>
        </section>

        {/* footer */}
        <footer style={css('margin-top:auto;padding-top:14px;display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:10px 18px;')}>
          <FX as={Link} href="/" style="font-family:var(--font-jost),sans-serif;font-size:13px;letter-spacing:0.05em;color:#8A7965;text-decoration:none;border-bottom:1px solid rgba(194,165,107,0.5);padding-bottom:2px;" hover="color:#C2A56B;">
            nommar.gr
          </FX>
          <span style={css('color:#D8CBB6;')}>·</span>
          <FX as={Link} href="/book" style="font-family:var(--font-jost),sans-serif;font-size:13px;letter-spacing:0.16em;text-transform:uppercase;color:#C2A56B;font-weight:500;text-decoration:none;border-bottom:1px solid rgba(194,165,107,0.5);padding-bottom:2px;" hover="color:#3D2F25;">
            {c.book}
          </FX>
        </footer>
      </div>
    </main>
  );
}
