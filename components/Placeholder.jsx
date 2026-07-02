import { css } from '@/lib/css';

// Decorative image placeholder. Swap for a real <img> once photography exists.
export default function Placeholder({ label, style }) {
  return (
    <div
      style={css(
        'position:relative;width:100%;height:100%;min-height:120px;overflow:hidden;background:#F1E6D3;background-image:linear-gradient(135deg, rgba(194,165,107,0.05) 25%, transparent 25%, transparent 50%, rgba(194,165,107,0.05) 50%, rgba(194,165,107,0.05) 75%, transparent 75%);background-size:18px 18px;display:flex;align-items:center;justify-content:center;' +
          (style || '')
      )}
    >
      <div style={css('position:absolute;inset:14px;border:1px solid rgba(194,165,107,0.28);')} />
      <div style={css('position:relative;display:flex;flex-direction:column;align-items:center;gap:14px;padding:24px;text-align:center;')}>
        <div style={css('width:30px;height:30px;border:1px solid rgba(194,165,107,0.7);border-radius:50%;display:flex;align-items:center;justify-content:center;')}>
          <div style={css('width:7px;height:7px;background:rgba(194,165,107,0.85);transform:rotate(45deg);')} />
        </div>
        <div style={css("font-family:var(--font-jost),sans-serif;font-size:11px;letter-spacing:0.32em;text-transform:uppercase;color:rgba(61,47,37,0.42);font-weight:400;")}>
          {label}
        </div>
      </div>
    </div>
  );
}
