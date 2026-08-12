import { css } from '@/lib/css';

// Decorative placeholder for content that doesn't have real photography yet —
// a soft branded watermark (the Nommar mark) instead of a generic pattern, so
// empty spots read as intentional, not missing. Swap for a real <img> once
// photography exists.
export default function Placeholder({ label, style }) {
  return (
    <div
      style={css(
        'position:relative;width:100%;height:100%;min-height:120px;overflow:hidden;background:linear-gradient(135deg,#F6EFE2,#F1E6D3);display:flex;align-items:center;justify-content:center;' +
          (style || '')
      )}
    >
      <div style={css('position:absolute;inset:14px;border:1px solid rgba(194,165,107,0.28);')} />
      <img
        src="/assets/logo-emblem.png"
        alt=""
        aria-hidden="true"
        style={css('position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:55%;max-width:260px;height:auto;opacity:0.1;')}
      />
      <div style={css("position:relative;font-family:var(--font-jost),sans-serif;font-size:11px;letter-spacing:0.32em;text-transform:uppercase;color:rgba(61,47,37,0.42);font-weight:400;padding:24px;text-align:center;")}>
        {label}
      </div>
    </div>
  );
}
