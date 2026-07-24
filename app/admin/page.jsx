'use client';
import { useEffect, useState } from 'react';
import { css } from '@/lib/css';
import { FX } from '@/lib/fx';
import AdminHeader from '@/components/admin/AdminHeader';
import { useAdminLocale } from '@/lib/useAdminLocale';
import { canTransition, visitIsOver } from '@/lib/reservationStatus';

const TZ = 'Europe/Athens';
const fmtDateTime = (locale) =>
  new Intl.DateTimeFormat(locale === 'gr' ? 'el-GR' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: TZ });
const fmtTime = (locale) =>
  new Intl.DateTimeFormat(locale === 'gr' ? 'el-GR' : 'en-GB', { hour: '2-digit', minute: '2-digit', timeZone: TZ });

const STATUS_STYLE = {
  PENDING: 'background:#FBF3DF;color:#9A7B2E;',
  CONFIRMED: 'background:#E7F1E7;color:#3E7A4E;',
  CANCELLED: 'background:#F1E9E2;color:#A8967C;',
  COMPLETED: 'background:#DDEBDD;color:#2F6B41;',
  NO_SHOW: 'background:#F1E4E4;color:#9B5B5B;',
};

const COPY = {
  en: {
    heading: 'Bookings',
    subtitle: 'Confirm, cancel, and record outcomes. Times shown in Athens time.',
    loading: 'Loading…',
    loadError: 'Could not load bookings.',
    upcoming: (n) => `Upcoming (${n})`,
    pastCancelled: (n) => `Past & cancelled (${n})`,
    noUpcoming: 'No upcoming bookings.',
    clearAll: 'Clear all',
    confirm: 'Confirm',
    cancel: 'Cancel',
    markCompleted: 'Mark completed',
    markNoShow: 'Mark no-show',
    del: 'Delete',
    oneGuest: '1 guest',
    twoGuests: '2 guests',
    promo: 'promo',
    guest: (n) => `Guest ${n}`,
    attendPrompt: 'Did the guest attend?',
    status: { PENDING: 'Pending', CONFIRMED: 'Confirmed', CANCELLED: 'Cancelled', COMPLETED: 'Completed', NO_SHOW: 'No-show' },
    askCancel: 'Cancel this booking?',
    askCompleted: 'Mark this booking as completed? (The guest attended.)',
    askNoShow: 'Mark this booking as a no-show? (The guest did not attend.)',
    askDelete: 'Delete this booking permanently? This cannot be undone.',
    askPurge: 'Delete ALL past & cancelled bookings permanently? This cannot be undone.',
    source: 'Source', direct: 'direct',
  },
  gr: {
    heading: 'Κρατήσεις',
    subtitle: 'Επιβεβαίωση, ακύρωση και καταγραφή αποτελέσματος. Ώρες σε ώρα Αθήνας.',
    loading: 'Φόρτωση…',
    loadError: 'Δεν ήταν δυνατή η φόρτωση των κρατήσεων.',
    upcoming: (n) => `Επερχόμενες (${n})`,
    pastCancelled: (n) => `Παρελθόντα & ακυρωμένα (${n})`,
    noUpcoming: 'Καμία επερχόμενη κράτηση.',
    clearAll: 'Εκκαθάριση όλων',
    confirm: 'Επιβεβαίωση',
    cancel: 'Ακύρωση',
    markCompleted: 'Ολοκληρώθηκε',
    markNoShow: 'Δεν προσήλθε',
    del: 'Διαγραφή',
    oneGuest: '1 άτομο',
    twoGuests: '2 άτομα',
    promo: 'προσφορά',
    guest: (n) => `Άτομο ${n}`,
    attendPrompt: 'Προσήλθε ο πελάτης;',
    status: { PENDING: 'Σε αναμονή', CONFIRMED: 'Επιβεβαιωμένη', CANCELLED: 'Ακυρωμένη', COMPLETED: 'Ολοκληρώθηκε', NO_SHOW: 'Δεν προσήλθε' },
    askCancel: 'Ακύρωση αυτής της κράτησης;',
    askCompleted: 'Να σημειωθεί ως ολοκληρωμένη; (Ο πελάτης προσήλθε.)',
    askNoShow: 'Να σημειωθεί ως μη προσέλευση; (Ο πελάτης δεν προσήλθε.)',
    askDelete: 'Οριστική διαγραφή αυτής της κράτησης; Δεν αναιρείται.',
    askPurge: 'Οριστική διαγραφή ΟΛΩΝ των παρελθόντων & ακυρωμένων κρατήσεων; Δεν αναιρείται.',
    source: 'Πηγή', direct: 'απευθείας',
  },
};

// Human-readable first-touch source: UTM source (+ medium/campaign) → referrer
// host → "direct". Rendered as JSX text (React escapes it), never as HTML.
function sourceLabel(r, t) {
  if (r.utmSource) {
    const extra = [r.utmMedium, r.utmCampaign].filter(Boolean).join(' · ');
    return extra ? `${r.utmSource} (${extra})` : r.utmSource;
  }
  if (r.referrer) return r.referrer;
  return t.direct;
}

const earliest = (r) => Math.min(...r.bookings.map((b) => new Date(b.startsAt).getTime()));

export default function Dashboard() {
  const locale = useAdminLocale();
  const t = COPY[locale];
  const [reservations, setReservations] = useState(null);
  const [error, setError] = useState('');

  const load = () => {
    fetch('/api/admin/bookings')
      .then((r) => r.json())
      .then((d) => setReservations(d.reservations || []))
      .catch(() => setError(t.loadError));
  };

  // Load on mount, re-sync when the tab regains focus (guest-side cancellations
  // happen outside this page), and poll as a safety net.
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
    // Optimistic update for snappiness, then re-sync with server truth (which is
    // authoritative — the server rejects invalid transitions).
    setReservations((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    try {
      await fetch('/api/admin/bookings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
    } finally {
      load();
    }
  };

  const remove = async (id) => {
    if (!window.confirm(t.askDelete)) return;
    setReservations((rs) => rs.filter((r) => r.id !== id));
    await fetch('/api/admin/bookings', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) }).catch(load);
  };

  const purgeArchived = async () => {
    if (!window.confirm(t.askPurge)) return;
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
        <h1 style={css("font-family:var(--font-cinzel),serif;font-weight:500;font-size:clamp(24px,3vw,34px);letter-spacing:0.03em;margin:0 0 6px;")}>{t.heading}</h1>
        <p style={css("font-family:var(--font-jost),sans-serif;font-size:13px;color:#8A7965;margin:0 0 30px;")}>{t.subtitle}</p>

        {error && <p style={css('color:#9B4444;')}>{error}</p>}
        {reservations === null && <p style={css("font-family:var(--font-cormorant),serif;font-style:italic;font-size:18px;color:#8A7965;")}>{t.loading}</p>}

        {reservations !== null && (
          <>
            <Section title={t.upcoming(upcoming.length)}>
              {upcoming.length === 0 ? <Empty>{t.noUpcoming}</Empty> : upcoming.map((r) => <Card key={r.id} r={r} onStatus={setStatus} t={t} locale={locale} />)}
            </Section>
            {rest.length > 0 && (
              <Section
                title={t.pastCancelled(rest.length)}
                action={
                  <FX as="button" onClick={purgeArchived} style="font-family:var(--font-jost),sans-serif;font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:#9B4444;background:none;border:1px solid rgba(155,68,68,0.4);padding:7px 14px;cursor:pointer;border-radius:1px;" hover="border-color:#9B4444;background:#F1E9E2;">{t.clearAll}</FX>
                }
              >
                {rest.map((r) => <Card key={r.id} r={r} onStatus={setStatus} onDelete={remove} t={t} locale={locale} muted />)}
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

function Card({ r, onStatus, onDelete, muted, t, locale }) {
  const dt = fmtDateTime(locale);
  const tm = fmtTime(locale);
  const guests = [];
  for (let g = 1; g <= r.guestCount; g++) {
    const appts = r.bookings.filter((b) => b.guestIndex === g);
    if (appts.length) guests.push({ g, label: g === 1 ? r.customerName : appts[0].guestName || t.guest(g), appts });
  }

  // State-machine–driven button visibility (server is authoritative; this just
  // avoids offering illegal actions).
  const over = visitIsOver(r.bookings);
  const showConfirm = !over && canTransition(r.status, 'CONFIRMED');
  const showCancel = !over && canTransition(r.status, 'CANCELLED');
  const showOutcome = over && r.status === 'CONFIRMED'; // past confirmed → completed / no-show

  const ask = (msg, id, status) => window.confirm(msg) && onStatus(id, status);

  return (
    <div style={css('background:#FFFDF8;border:1px solid rgba(194,165,107,0.28);border-radius:2px;padding:18px 20px;' + (muted ? 'opacity:0.72;' : ''))}>
      <div style={css('display:flex;flex-wrap:wrap;gap:14px;align-items:center;justify-content:space-between;margin-bottom:12px;')}>
        <div style={css("font-family:var(--font-jost),sans-serif;font-size:14px;color:#3D2F25;font-weight:500;")}>
          {dt.format(new Date(earliest(r)))}
          <span style={css('color:#8A7965;font-weight:300;')}> · {r.guestCount === 2 ? t.twoGuests : t.oneGuest}</span>
        </div>
        <div style={css('display:flex;align-items:center;gap:10px;')}>
          <span style={css('font-family:var(--font-jost),sans-serif;font-size:10px;letter-spacing:0.16em;text-transform:uppercase;padding:5px 11px;border-radius:2px;' + (STATUS_STYLE[r.status] || ''))}>{t.status[r.status] || r.status}</span>
          {showConfirm && <FX as="button" onClick={() => onStatus(r.id, 'CONFIRMED')} style="font-family:var(--font-jost),sans-serif;font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:#3D2F25;background:linear-gradient(135deg,#E6CF95,#C2A56B);border:none;padding:8px 14px;cursor:pointer;border-radius:1px;" hover="transform:translateY(-1px);">{t.confirm}</FX>}
          {showCancel && <FX as="button" onClick={() => ask(t.askCancel, r.id, 'CANCELLED')} style="font-family:var(--font-jost),sans-serif;font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:#9B4444;background:none;border:1px solid rgba(155,68,68,0.4);padding:8px 14px;cursor:pointer;border-radius:1px;" hover="border-color:#9B4444;">{t.cancel}</FX>}
          {onDelete && <FX as="button" onClick={() => onDelete(r.id)} title={t.del} style="font-family:var(--font-jost),sans-serif;font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:#8A7965;background:none;border:1px solid rgba(138,121,101,0.4);padding:8px 12px;cursor:pointer;border-radius:1px;" hover="border-color:#9B4444;color:#9B4444;">{t.del}</FX>}
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
        {r.customerEmail} · {r.customerPhone}{r.promoCode ? ` · ${t.promo} ${r.promoCode}` : ''}{r.notes ? ` · “${r.notes}”` : ''}
      </div>
      <div style={css("font-family:var(--font-jost),sans-serif;font-size:11.5px;color:#A8967C;margin-top:4px;")}>
        {t.source}: {sourceLabel(r, t)}
      </div>

      {/* Outcome actions live in their own bar, away from Delete, behind a
          confirm() — for past confirmed visits only. */}
      {showOutcome && (
        <div style={css('display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin-top:14px;padding-top:14px;border-top:1px solid rgba(194,165,107,0.22);')}>
          <span style={css("font-family:var(--font-jost),sans-serif;font-size:11px;letter-spacing:0.1em;color:#8A7965;")}>{t.attendPrompt}</span>
          <FX as="button" onClick={() => ask(t.askCompleted, r.id, 'COMPLETED')} style="font-family:var(--font-jost),sans-serif;font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:#2F6B41;background:#E7F1E7;border:1px solid #B8D8BE;padding:8px 14px;cursor:pointer;border-radius:1px;" hover="background:#DBEBDB;">{t.markCompleted}</FX>
          <FX as="button" onClick={() => ask(t.askNoShow, r.id, 'NO_SHOW')} style="font-family:var(--font-jost),sans-serif;font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:#9A7B2E;background:#F3EEE2;border:1px solid #E6CF95;padding:8px 14px;cursor:pointer;border-radius:1px;" hover="background:#EDE4CF;">{t.markNoShow}</FX>
        </div>
      )}
    </div>
  );
}
