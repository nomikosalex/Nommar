'use client';

import { useEffect, useState } from 'react';
import { css } from '@/lib/css';
import { useLang } from '@/lib/lang';
import { PROMO, OPENING_DATE } from '@/lib/booking.config';

// Site-wide sale banner. Markets the promo code (the actual discount is applied when
// the customer enters the code at checkout). Dismissible; re-shows if the code changes.
const KEY = 'nommar_promo_dismissed';

const COPY = {
  en: (pct: number, code: string) => ({
    msg: `Summer offer — ${pct}% off all treatments. Use code`,
    code,
    tail: 'at checkout.',
    close: 'Dismiss',
  }),
  gr: (pct: number, code: string) => ({
    msg: `Καλοκαιρινή προσφορά — ${pct}% έκπτωση σε όλες τις θεραπείες. Κωδικός`,
    code,
    tail: 'στο ταμείο.',
    close: 'Κλείσιμο',
  }),
};

export default function AnnouncementBanner() {
  const { lang } = useLang();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!PROMO.active) return;
    // Don't advertise the promo while the spa is still closed (pre-opening the
    // OpeningBanner carries the message; this one auto-appears from opening day).
    const todayAthens = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Athens' }).format(new Date());
    if (todayAthens < OPENING_DATE) return;
    try {
      if (localStorage.getItem(KEY) !== PROMO.code) setShow(true);
    } catch {
      setShow(true);
    }
  }, []);

  if (!PROMO.active || !show) return null;
  const c = COPY[lang](PROMO.pct, PROMO.code);

  const dismiss = () => {
    try { localStorage.setItem(KEY, PROMO.code); } catch { /* ignore */ }
    setShow(false);
  };

  return (
    <div style={css('background:linear-gradient(135deg,#E6CF95,#C2A56B);color:#3D2F25;font-family:var(--font-jost),sans-serif;font-size:13px;letter-spacing:0.02em;text-align:center;padding:9px 40px;position:relative;')}>
      <span>
        ✦ {c.msg}{' '}
        <strong style={css('letter-spacing:0.08em;')}>{c.code}</strong>{' '}
        {c.tail}
      </span>
      <button
        onClick={dismiss}
        aria-label={c.close}
        style={css('position:absolute;right:4px;top:50%;transform:translateY(-50%);min-width:44px;min-height:44px;display:flex;align-items:center;justify-content:center;background:transparent;border:none;color:#3D2F25;font-size:18px;line-height:1;cursor:pointer;opacity:0.7;')}
      >
        ×
      </button>
    </div>
  );
}
