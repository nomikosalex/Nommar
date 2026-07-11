'use client';
import { useEffect, useState } from 'react';
import { css } from '@/lib/css';
import { FX } from '@/lib/fx';
import AdminHeader from '@/components/admin/AdminHeader';

const TZ = 'Europe/Athens';
const dt = new Intl.DateTimeFormat('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: TZ });
const tm = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: TZ });

const STATUS_STYLE = {
  PENDING: 'background:#FBF3DF;color:#9A7B2E;',
  CONFIRMED: 'background:#E7F1E7;color:#3E7A4E;',
  CANCELLED: 'background:#F1E9E2;color:#A8967C;',
};

const earliest = (r) => Math.min(...r.bookings.map((b) => new Date(b.startsAt).getTime()));

export default function Dashboard() {
  const [reservations, setReservations] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    fetch('/api/admin/bookings')
      .then((r) => r.json())
      .then((d) => setReservations(d.reservations || []))
      .catch(() => setError('Could not load bookings.'));
  };

  // Load on mount, re-sync when the tab regains focus (guest-side cancellations /
  // email verifications happen outside this page), and poll as a safety net.
  useEffect(() => {
    load();
    const onFocus = () => document.visibilityState === 'visible' && load();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    const iv = setInterval(load, 60000);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
      clearInterval(iv);
    };
  }, []);

  const setStatus = async (id, status) => {
    // Optimistic update for snappiness, then re-sync with server truth.
    setReservations((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    try {
      await fetch('/api/admin/bookings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
    } finally {
      load();
    }
  };

  const remove = async (id) => {
    if (!window.confirm('Delete this booking permanently? This cannot be undone.')) return;
    setReservations((rs) => rs.filter((r) => r.id !== id));
    await fetch('/api/admin/bookings', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }).catch(load);
  };

  const purgeArchived = async () => {
    if (!window.confirm('Delete ALL past & cancelled bookings permanently? This cannot be undone.')) return;
    await fetch('/api/admin/bookings', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ purge: true }) }).catch(() => {});
    load();
  };

  const now = Date.now();
  const list = reservations || [];
  const upcoming = list.filter((r) => earliest(r) >= now && r.status !== 'CANCELLED');
  const rest = list.filter((r) => !(earliest(r) >= now && r.status !== 'CANCELLED'));

  return (
    <>
      <AdminHeader />
      <main style={css('max-width:1180px;margin:0 auto;padding:clamp(28px,4vw,48px) clamp(18px,4vw,40px);')}>
        <h1 style={css("font-family:var(--font-cinzel),serif;font-weight:500;font-size:clamp(24px,3vw,34px);letter-spacing:0.03em;margin:0 0 6px;")}>Bookings</h1>
        <p style={css("font-family:var(--font-jost),sans-serif;font-size:13px;color:#8A7965;margin:0 0 30px;")}>Confirm or cancel requests. Times shown in Athens time.</p>

        {error && <p style={css('color:#9B4444;')}>{error}</p>}
        {reservations === null && <p style={css("font-family:var(--font-cormorant),serif;font-style:italic;font-size:18px;color:#8A7965;")}>Loading…</p>}

        {reservations !== null && (
          <>
            <Section title={`Upcoming (${upcoming.length})`}>
              {upcoming.length === 0 ? <Empty>No upcoming bookings.</Empty> : upcoming.map((r) => <Card key={r.id} r={r} onStatus={setStatus} />)}
            </Section>
            {rest.length > 0 && (
              <Section
                title={`Past & cancelled (${rest.length})`}
                action={
                  <FX as="button" onClick={purgeArchived} style="font-family:var(--font-jost),sans-serif;font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:#9B4444;background:none;border:1px solid rgba(155,68,68,0.4);padding:7px 14px;cursor:pointer;border-radius:1px;" hover="border-color:#9B4444;background:#F1E9E2;">Clear all</FX>
                }
              >
                {rest.map((r) => <Card key={r.id} r={r} onStatus={setStatus} onDelete={remove} muted />)}
              </Section>
            )}
          </>
        )}
      </main>
    </>
  );
}

function Section({ title, children, action }) {
  return (
    <section style={css('margin-bottom:40px;')}>
      <div style={css('display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px;')}>
        <div style={css("font-family:var(--font-jost),sans-serif;font-size:11px;letter-spacing:0.24em;text-transform:uppercase;color:#C2A56B;")}>{title}</div>
        {action}
      </div>
      <div style={css('display:flex;flex-direction:column;gap:12px;')}>{children}</div>
    </section>
  );
}
function Empty({ children }) {
  return <p style={css("font-family:var(--font-cormorant),serif;font-style:italic;font-size:18px;color:#8A7965;margin:0;")}>{children}</p>;
}

function Card({ r, onStatus, onDelete, muted }) {
  const guests = [];
  for (let g = 1; g <= r.guestCount; g++) {
    const appts = r.bookings.filter((b) => b.guestIndex === g);
    if (appts.length) guests.push({ g, label: g === 1 ? r.customerName : appts[0].guestName || `Guest ${g}`, appts });
  }
  return (
    <div style={css('background:#FFFDF8;border:1px solid rgba(194,165,107,0.28);border-radius:2px;padding:18px 20px;' + (muted ? 'opacity:0.72;' : ''))}>
      <div style={css('display:flex;flex-wrap:wrap;gap:14px;align-items:center;justify-content:space-between;margin-bottom:12px;')}>
        <div style={css("font-family:var(--font-jost),sans-serif;font-size:14px;color:#3D2F25;font-weight:500;")}>
          {dt.format(new Date(earliest(r)))}
          <span style={css('color:#8A7965;font-weight:300;')}> · {r.guestCount === 2 ? '2 guests' : '1 guest'}</span>
        </div>
        <div style={css('display:flex;align-items:center;gap:10px;')}>
          {r.emailVerified === false && r.status !== 'CANCELLED' && (
            <span title="Guest has not confirmed their email" style={css('font-family:var(--font-jost),sans-serif;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;padding:5px 10px;border-radius:2px;background:#FBF0DC;color:#9A7B33;border:1px solid #E6CF95;')}>Email unverified</span>
          )}
          <span style={css('font-family:var(--font-jost),sans-serif;font-size:10px;letter-spacing:0.16em;text-transform:uppercase;padding:5px 11px;border-radius:2px;' + (STATUS_STYLE[r.status] || ''))}>{r.status}</span>
          {r.status !== 'CONFIRMED' && <FX as="button" onClick={() => onStatus(r.id, 'CONFIRMED')} style="font-family:var(--font-jost),sans-serif;font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:#3D2F25;background:linear-gradient(135deg,#E6CF95,#C2A56B);border:none;padding:8px 14px;cursor:pointer;border-radius:1px;" hover="transform:translateY(-1px);">Confirm</FX>}
          {r.status !== 'CANCELLED' && <FX as="button" onClick={() => onStatus(r.id, 'CANCELLED')} style="font-family:var(--font-jost),sans-serif;font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:#9B4444;background:none;border:1px solid rgba(155,68,68,0.4);padding:8px 14px;cursor:pointer;border-radius:1px;" hover="border-color:#9B4444;">Cancel</FX>}
          {onDelete && <FX as="button" onClick={() => onDelete(r.id)} title="Delete permanently" style="font-family:var(--font-jost),sans-serif;font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:#8A7965;background:none;border:1px solid rgba(138,121,101,0.4);padding:8px 12px;cursor:pointer;border-radius:1px;" hover="border-color:#9B4444;color:#9B4444;">Delete</FX>}
        </div>
      </div>
      <div style={css('display:flex;flex-wrap:wrap;gap:22px;')}>
        {guests.map((gr) => (
          <div key={gr.g} style={css('min-width:230px;')}>
            <div style={css("font-family:var(--font-jost),sans-serif;font-size:12.5px;color:#3D2F25;font-weight:500;margin-bottom:4px;")}>{gr.label}</div>
            {gr.appts.map((a) => (
              <div key={a.id} style={css("font-family:var(--font-jost),sans-serif;font-weight:300;font-size:12.5px;color:#8A7965;line-height:1.7;")}>
                {tm.format(new Date(a.startsAt))} · {a.service.name} ({a.service.durationMin}′) · {a.staff.name} · {a.room.name}
              </div>
            ))}
          </div>
        ))}
      </div>
      <div style={css("font-family:var(--font-jost),sans-serif;font-size:12px;color:#8A7965;margin-top:12px;")}>
        {r.customerEmail} · {r.customerPhone}{r.promoCode ? ` · promo ${r.promoCode}` : ''}{r.notes ? ` · “${r.notes}”` : ''}
      </div>
    </div>
  );
}
