'use client';

import { useEffect, useState } from 'react';
import { css } from '@/lib/css';
import { FX } from '@/lib/fx';
import { useLang } from '@/lib/lang';

// Minimal cookie/consent notice. The site only uses functional storage (admin
// session cookie + language/preference in localStorage) — no tracking — so a
// simple accept/decline notice that remembers the choice is sufficient.
const KEY = 'nommar_cookie_consent';

export default function CookieConsent() {
  const { t } = useLang();
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {
      /* storage unavailable — don't nag */
    }
  }, []);

  if (!show) return null;

  const choose = (value: 'accepted' | 'declined') => {
    try { localStorage.setItem(KEY, value); } catch { /* ignore */ }
    setShow(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Cookie notice"
      style={css(
        'position:fixed;left:0;right:0;bottom:0;z-index:80;background:#FFFDF8;' +
          'border-top:1px solid rgba(194,165,107,0.4);box-shadow:0 -8px 30px -18px rgba(61,47,37,0.5);' +
          'padding:16px clamp(16px,5vw,40px) calc(16px + env(safe-area-inset-bottom));',
      )}
    >
      <div style={css('max-width:1100px;margin:0 auto;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:14px;')}>
        <p style={css('font-family:var(--font-jost),sans-serif;font-size:13px;line-height:1.6;color:#6E5E50;margin:0;max-width:62ch;flex:1 1 320px;')}>
          {t.cookieText}
        </p>
        <div style={css('display:flex;gap:10px;flex-shrink:0;')}>
          <FX
            as="button"
            onClick={() => choose('declined')}
            style="font-family:var(--font-jost),sans-serif;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#8A7965;background:transparent;border:1px solid rgba(194,165,107,0.5);padding:11px 20px;min-height:44px;cursor:pointer;border-radius:2px;"
            hover="border-color:#C2A56B;color:#3D2F25;"
          >
            {t.cookieDecline}
          </FX>
          <FX
            as="button"
            onClick={() => choose('accepted')}
            style="font-family:var(--font-jost),sans-serif;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#3D2F25;font-weight:500;background:linear-gradient(135deg,#E6CF95,#C2A56B);border:none;padding:11px 22px;min-height:44px;cursor:pointer;border-radius:2px;"
            hover="transform:translateY(-1px);"
          >
            {t.cookieAccept}
          </FX>
        </div>
      </div>
    </div>
  );
}
