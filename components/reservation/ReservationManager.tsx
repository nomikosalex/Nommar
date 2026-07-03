'use client';

import { useState } from 'react';
import Link from 'next/link';

type Appt = { time: string; service: string; dur: number; staff: string; room: string };
type GuestBlock = { label: string; appts: Appt[] };

export type ReservationView = {
  token: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED';
  emailVerified: boolean;
  locale: 'en' | 'gr';
  day: string;
  guests: GuestBlock[];
};

const COPY = {
  en: {
    title: 'Your booking',
    on: 'on',
    statusPending: 'Awaiting confirmation',
    statusConfirmed: 'Confirmed',
    statusCancelled: 'Cancelled',
    verifyPrompt: 'Please confirm your email address so we can finalise your booking.',
    verifyBtn: 'Confirm my email',
    verifiedMsg: 'Thank you — your email is confirmed.',
    cancelBtn: 'Cancel booking',
    cancelConfirm: 'Cancel this booking? This cannot be undone.',
    cancelledMsg: 'This booking has been cancelled.',
    arriveEarly: 'Please arrive 10 minutes before your appointment.',
    working: 'Please wait…',
    error: 'Something went wrong. Please try again.',
    backHome: 'Back to Nommar',
  },
  gr: {
    title: 'Η κράτησή σας',
    on: 'στις',
    statusPending: 'Σε αναμονή επιβεβαίωσης',
    statusConfirmed: 'Επιβεβαιωμένη',
    statusCancelled: 'Ακυρωμένη',
    verifyPrompt: 'Παρακαλούμε επιβεβαιώστε το email σας για να ολοκληρώσουμε την κράτησή σας.',
    verifyBtn: 'Επιβεβαίωση email',
    verifiedMsg: 'Ευχαριστούμε — το email σας επιβεβαιώθηκε.',
    cancelBtn: 'Ακύρωση κράτησης',
    cancelConfirm: 'Ακύρωση αυτής της κράτησης; Δεν μπορεί να αναιρεθεί.',
    cancelledMsg: 'Αυτή η κράτηση ακυρώθηκε.',
    arriveEarly: 'Παρακαλούμε προσέλθετε 10 λεπτά νωρίτερα από το ραντεβού σας.',
    working: 'Παρακαλώ περιμένετε…',
    error: 'Κάτι πήγε στραβά. Δοκιμάστε ξανά.',
    backHome: 'Επιστροφή στο Nommar',
  },
} as const;

const card = 'background:#FFFDF8;border:1px solid rgba(194,165,107,0.35);border-radius:2px;padding:clamp(26px,4vw,44px);max-width:560px;margin:40px auto;font-family:var(--font-jost),sans-serif;color:#3D2F25;';
const btn = 'display:inline-block;background:#C2A56B;color:#FAF5EC;border:none;border-radius:2px;font-size:14px;letter-spacing:0.04em;padding:12px 26px;cursor:pointer;';
const ghost = 'display:inline-block;background:transparent;color:#9B4444;border:1px solid #E3B7B7;border-radius:2px;font-size:13px;padding:10px 22px;cursor:pointer;';

export default function ReservationManager({ view }: { view: ReservationView }) {
  const t = COPY[view.locale];
  const [status, setStatus] = useState(view.status);
  const [verified, setVerified] = useState(view.emailVerified);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const statusLabel = status === 'CONFIRMED' ? t.statusConfirmed : status === 'CANCELLED' ? t.statusCancelled : t.statusPending;
  const statusColor = status === 'CONFIRMED' ? '#3E7C58' : status === 'CANCELLED' ? '#9B4444' : '#8A7965';

  const verify = async () => {
    setBusy(true); setError('');
    try {
      const r = await fetch(`/api/reservations/${view.token}/verify`, { method: 'POST' });
      if (!r.ok) throw new Error();
      setVerified(true);
    } catch { setError(t.error); } finally { setBusy(false); }
  };

  const cancel = async () => {
    if (!window.confirm(t.cancelConfirm)) return;
    setBusy(true); setError('');
    try {
      const r = await fetch(`/api/reservations/${view.token}/cancel`, { method: 'POST' });
      if (!r.ok) throw new Error();
      setStatus('CANCELLED');
    } catch { setError(t.error); } finally { setBusy(false); }
  };

  return (
    <div style={cssObj(card)}>
      <h1 style={{ fontFamily: 'var(--font-cormorant), serif', fontSize: 28, color: '#C2A56B', margin: '0 0 6px' }}>{t.title}</h1>
      <p style={{ margin: '0 0 4px', color: '#6E5E50' }}>{t.on} {view.day}</p>
      <p style={{ margin: '0 0 22px', fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: statusColor }}>{statusLabel}</p>

      {view.guests.map((g, gi) => (
        <div key={gi} style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: '#3D2F25', fontWeight: 600 }}>{g.label}</div>
          {g.appts.map((a, ai) => (
            <div key={ai} style={{ fontSize: 14, color: '#6E5E50', padding: '3px 0' }}>
              {a.time} — {a.service} ({a.dur}′) · {a.staff} · {a.room}
            </div>
          ))}
        </div>
      ))}

      <p style={{ fontStyle: 'italic', color: '#6E5E50', fontSize: 14, margin: '18px 0 24px' }}>{t.arriveEarly}</p>

      {error && <p style={{ color: '#9B4444', fontSize: 13 }}>{error}</p>}

      {status === 'CANCELLED' ? (
        <p style={{ color: '#9B4444', fontSize: 14 }}>{t.cancelledMsg}</p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
          {!verified && (
            <button onClick={verify} disabled={busy} style={cssObj(btn)}>{busy ? t.working : t.verifyBtn}</button>
          )}
          {verified && (
            <span style={{ color: '#3E7C58', fontSize: 13 }}>✓ {t.verifiedMsg}</span>
          )}
          <button onClick={cancel} disabled={busy} style={cssObj(ghost)}>{t.cancelBtn}</button>
        </div>
      )}

      {!verified && status !== 'CANCELLED' && (
        <p style={{ color: '#8A7965', fontSize: 13, marginTop: 14 }}>{t.verifyPrompt}</p>
      )}

      <p style={{ marginTop: 28 }}>
        <Link href="/" style={{ color: '#C2A56B', fontSize: 13, textDecoration: 'none' }}>← {t.backHome}</Link>
      </p>
    </div>
  );
}

// Parse a semicolon CSS string into a React style object (matches the app's inline-style idiom).
function cssObj(s: string): React.CSSProperties {
  const out: Record<string, string> = {};
  for (const rule of s.split(';')) {
    const i = rule.indexOf(':');
    if (i === -1) continue;
    const key = rule.slice(0, i).trim().replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    if (key) out[key] = rule.slice(i + 1).trim();
  }
  return out as React.CSSProperties;
}
