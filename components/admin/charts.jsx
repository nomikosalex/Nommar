'use client';
// Lightweight, dependency-free chart primitives for the admin dashboard.
// CSS/flex bars (responsive, no SVG coordinate math), direct value labels
// (better than hover on Margarita's phone), recessive gridless tracks.
// Palette validated via the dataviz skill: deep gold #B0862E (single series),
// + teal #2F6F86 for the one 2-category mark (guest mix), with legend + labels.
import { css } from '@/lib/css';

export const GOLD = '#B0862E';
export const TEAL = '#2F6F86';
const INK = '#3D2F25';
const MUTED = '#8A7965';
const TRACK = '#EFE7D6';

// Vertical bars — revenue-by-day, demand-by-hour/weekday. One series; the title
// names it, so no legend. Scrolls horizontally on narrow screens.
export function VBars({ data, valueFmt = (v) => String(v), color = GOLD, height = 150, minColWidth = 22 }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div style={css('overflow-x:auto;padding-bottom:4px;')}>
      <div style={css(`display:flex;align-items:flex-end;gap:6px;height:${height}px;min-width:min(100%,${data.length * minColWidth}px);`)}>
        {data.map((d, i) => {
          const h = d.value > 0 ? Math.max(2, Math.round((d.value / max) * (height - 26))) : 0;
          return (
            <div key={i} style={css('flex:1 0 auto;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:4px;min-width:14px;')} title={`${d.label}: ${valueFmt(d.value)}`}>
              <span style={css(`font-family:var(--font-jost),sans-serif;font-size:9px;color:${MUTED};height:12px;`)}>{d.value > 0 ? d.short ?? valueFmt(d.value) : ''}</span>
              <div style={css(`width:100%;max-width:34px;height:${h}px;background:${color};border-radius:3px 3px 0 0;`)} />
              <span style={css(`font-family:var(--font-jost),sans-serif;font-size:9px;color:${MUTED};white-space:nowrap;`)}>{d.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Horizontal bars — top services, lead-time buckets. One series, direct labels.
export function HBars({ data, valueFmt = (v) => String(v), color = GOLD }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div style={css('display:flex;flex-direction:column;gap:8px;')}>
      {data.map((d, i) => (
        <div key={i} style={css('display:flex;align-items:center;gap:10px;')}>
          <div style={css(`flex:0 0 40%;font-family:var(--font-jost),sans-serif;font-size:12px;color:${INK};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;`)} title={d.label}>{d.label}</div>
          <div style={css(`flex:1;height:14px;background:${TRACK};border-radius:3px;overflow:hidden;`)}>
            <div style={css(`height:100%;width:${Math.round((d.value / max) * 100)}%;min-width:${d.value > 0 ? 3 : 0}px;background:${color};border-radius:3px;`)} />
          </div>
          <div style={css(`flex:0 0 auto;font-family:var(--font-jost),sans-serif;font-size:12px;color:${MUTED};min-width:54px;text-align:right;`)}>{valueFmt(d.value)}</div>
        </div>
      ))}
    </div>
  );
}

// Guest mix — the one 2-category mark. Split bar + legend + counts.
export function SplitBar({ segments }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  return (
    <div>
      <div style={css('display:flex;gap:2px;height:22px;border-radius:3px;overflow:hidden;background:' + TRACK + ';')}>
        {total > 0 && segments.map((s, i) => s.value > 0 && (
          <div key={i} style={css(`width:${(s.value / total) * 100}%;background:${s.color};`)} title={`${s.label}: ${s.value}`} />
        ))}
      </div>
      <div style={css('display:flex;flex-wrap:wrap;gap:16px;margin-top:10px;')}>
        {segments.map((s, i) => (
          <div key={i} style={css('display:flex;align-items:center;gap:6px;')}>
            <span style={css(`width:10px;height:10px;border-radius:2px;background:${s.color};display:inline-block;`)} />
            <span style={css(`font-family:var(--font-jost),sans-serif;font-size:12px;color:${INK};`)}>{s.label}</span>
            <span style={css(`font-family:var(--font-jost),sans-serif;font-size:12px;color:${MUTED};`)}>{s.value}{total > 0 ? ` · ${Math.round((s.value / total) * 100)}%` : ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
