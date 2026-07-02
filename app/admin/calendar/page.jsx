'use client';
import { useEffect, useState } from 'react';
import { css } from '@/lib/css';
import { FX } from '@/lib/fx';
import AdminHeader from '@/components/admin/AdminHeader';

const TZ = 'Europe/Athens';
const DAY_START = 8 * 60; // 08:00
const DAY_END = 21 * 60; // 21:00
const ROW_H = 24; // px per 30 min
const pxPerMin = ROW_H / 30;

const hm = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TZ });
const localMin = (iso) => { const [h, m] = hm.format(new Date(iso)).split(':').map(Number); return h * 60 + m; };
const minToTime = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const shiftDay = (dateStr, delta) => { const [y, m, d] = dateStr.split('-').map(Number); const dt = new Date(Date.UTC(y, m - 1, d + delta)); return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`; };
const prettyDate = (d) => { const [y, m, day] = d.split('-').map(Number); return new Date(y, m - 1, day).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }); };

const STATUS_BG = { PENDING: 'linear-gradient(135deg,#F4E4BC,#E6CF95)', CONFIRMED: 'linear-gradient(135deg,#CFE6CF,#A9D3AC)' };

export default function Calendar() {
  const [date, setDate] = useState(todayStr());
  const [data, setData] = useState(null);

  useEffect(() => {
    setData(null);
    fetch(`/api/admin/day?date=${date}`).then((r) => r.json()).then(setData).catch(() => setData({ appointments: [], staff: [] }));
  }, [date]);

  const appts = data?.appointments || [];
  // Columns: active staff + any staff appearing in appointments.
  const colMap = new Map();
  (data?.staff || []).forEach((s) => colMap.set(s.id, s.name));
  appts.forEach((a) => { if (!colMap.has(a.staff.id)) colMap.set(a.staff.id, a.staff.name); });
  const columns = [...colMap.entries()].map(([id, name]) => ({ id, name }));

  const hours = [];
  for (let t = DAY_START; t <= DAY_END; t += 60) hours.push(t);
  const gridH = (DAY_END - DAY_START) * pxPerMin;

  return (
    <>
      <AdminHeader />
      <main style={css('max-width:1180px;margin:0 auto;padding:clamp(28px,4vw,48px) clamp(18px,4vw,40px);')}>
        <div style={css('display:flex;flex-wrap:wrap;gap:14px;align-items:center;justify-content:space-between;margin-bottom:8px;')}>
          <h1 style={css("font-family:var(--font-cinzel),serif;font-weight:500;font-size:clamp(24px,3vw,34px);margin:0;")}>Calendar</h1>
          <div style={css('display:flex;align-items:center;gap:8px;')}>
            <FX as="button" onClick={() => setDate(shiftDay(date, -1))} style="font-family:var(--font-jost),sans-serif;font-size:16px;color:#3D2F25;background:#FFFDF8;border:1px solid rgba(194,165,107,0.45);width:36px;height:36px;cursor:pointer;border-radius:2px;" hover="border-color:#C2A56B;">‹</FX>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={css("font-family:var(--font-jost),sans-serif;font-size:13px;color:#3D2F25;background:#FAF5EC;border:1px solid rgba(194,165,107,0.4);border-radius:2px;padding:8px 11px;outline:none;cursor:pointer;")} />
            <FX as="button" onClick={() => setDate(shiftDay(date, 1))} style="font-family:var(--font-jost),sans-serif;font-size:16px;color:#3D2F25;background:#FFFDF8;border:1px solid rgba(194,165,107,0.45);width:36px;height:36px;cursor:pointer;border-radius:2px;" hover="border-color:#C2A56B;">›</FX>
            <FX as="button" onClick={() => setDate(todayStr())} style="font-family:var(--font-jost),sans-serif;font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:#8A7965;background:none;border:1px solid rgba(194,165,107,0.45);padding:9px 12px;cursor:pointer;border-radius:2px;" hover="border-color:#C2A56B;color:#3D2F25;">Today</FX>
          </div>
        </div>
        <p style={css("font-family:var(--font-cormorant),serif;font-style:italic;font-size:18px;color:#8A7965;margin:0 0 24px;")}>{prettyDate(date)}{appts.length ? ` · ${appts.length} appointment${appts.length === 1 ? '' : 's'}` : ''}</p>

        {data === null && <p style={css("font-family:var(--font-cormorant),serif;font-style:italic;font-size:18px;color:#8A7965;")}>Loading…</p>}

        {data !== null && columns.length === 0 && <p style={css("font-family:var(--font-jost),sans-serif;font-size:14px;color:#8A7965;")}>No active therapists.</p>}

        {data !== null && columns.length > 0 && (
          <div style={css('overflow-x:auto;border:1px solid rgba(194,165,107,0.3);border-radius:2px;background:#FFFDF8;')}>
            <div style={css('display:grid;grid-template-columns:60px repeat(' + columns.length + ',minmax(150px,1fr));min-width:' + (60 + columns.length * 150) + 'px;')}>
              {/* header row */}
              <div style={css('border-bottom:1px solid rgba(194,165,107,0.3);')} />
              {columns.map((c) => (
                <div key={c.id} style={css("font-family:var(--font-cinzel),serif;font-size:14px;color:#3D2F25;text-align:center;padding:10px 6px;border-bottom:1px solid rgba(194,165,107,0.3);border-left:1px solid rgba(194,165,107,0.18);")}>{c.name}</div>
              ))}

              {/* time gutter */}
              <div style={css('position:relative;height:' + gridH + 'px;')}>
                {hours.map((t) => (
                  <div key={t} style={css('position:absolute;top:' + (t - DAY_START) * pxPerMin + 'px;right:6px;font-family:var(--font-jost),sans-serif;font-size:10.5px;color:#A8967C;transform:translateY(-6px);')}>{minToTime(t)}</div>
                ))}
              </div>

              {/* staff columns */}
              {columns.map((c) => (
                <div key={c.id} style={css('position:relative;height:' + gridH + 'px;border-left:1px solid rgba(194,165,107,0.18);')}>
                  {hours.map((t) => (
                    <div key={t} style={css('position:absolute;left:0;right:0;top:' + (t - DAY_START) * pxPerMin + 'px;border-top:1px solid rgba(194,165,107,0.14);')} />
                  ))}
                  {appts.filter((a) => a.staff.id === c.id).map((a) => {
                    const s = localMin(a.startsAt);
                    const top = (s - DAY_START) * pxPerMin;
                    const h = Math.max(a.service.durationMin * pxPerMin - 2, 16);
                    const guest = a.guestIndex === 1 ? a.reservation.customerName : a.guestName || 'Guest 2';
                    return (
                      <div key={a.id} title={`${a.service.name} · ${guest} · ${a.room.name}`} style={css('position:absolute;left:3px;right:3px;top:' + top + 'px;height:' + h + 'px;overflow:hidden;border-radius:2px;padding:3px 6px;font-family:var(--font-jost),sans-serif;color:#3D2F25;box-shadow:0 4px 10px -6px rgba(61,47,37,0.5);background:' + (STATUS_BG[a.reservation.status] || '#EEE') + ';')}>
                        <div style={css('font-size:11px;font-weight:500;line-height:1.15;white-space:nowrap;text-overflow:ellipsis;overflow:hidden;')}>{minToTime(s)} {a.service.name}</div>
                        <div style={css('font-size:10px;color:#6E5E50;white-space:nowrap;text-overflow:ellipsis;overflow:hidden;')}>{guest} · {a.room.name}</div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={css('display:flex;gap:18px;margin-top:14px;font-family:var(--font-jost),sans-serif;font-size:11px;color:#8A7965;')}>
          <span><span style={css('display:inline-block;width:11px;height:11px;border-radius:2px;background:linear-gradient(135deg,#F4E4BC,#E6CF95);vertical-align:middle;margin-right:5px;')} />Pending</span>
          <span><span style={css('display:inline-block;width:11px;height:11px;border-radius:2px;background:linear-gradient(135deg,#CFE6CF,#A9D3AC);vertical-align:middle;margin-right:5px;')} />Confirmed</span>
        </div>
      </main>
    </>
  );
}
