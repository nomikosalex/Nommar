'use client';

import { css } from '@/lib/css';
import { useLang } from '@/lib/lang';

// Prominent, non-dismissible announcement at the very top of the site.
// Set SHOW to false once the spa has opened.
const SHOW = true;

export default function OpeningBanner() {
  const { t } = useLang();
  if (!SHOW) return null;

  return (
    <div
      role="status"
      style={css(
        'background:#3D2F25;color:#F4E6C6;text-align:center;padding:12px 44px;' +
          'font-family:var(--font-cinzel),serif;font-weight:600;' +
          'font-size:clamp(14px,2.4vw,22px);letter-spacing:0.12em;text-transform:uppercase;line-height:1.3;',
      )}
    >
      <span aria-hidden="true" style={css('color:#C2A56B;margin-right:12px;')}>✦</span>
      {t.openingBanner}
      <span aria-hidden="true" style={css('color:#C2A56B;margin-left:12px;')}>✦</span>
    </div>
  );
}
