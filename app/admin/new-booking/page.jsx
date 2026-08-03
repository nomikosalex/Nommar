'use client';
import { useEffect, useMemo, useState } from 'react';
import { fromZonedTime } from 'date-fns-tz';
import { css } from '@/lib/css';
import { FX } from '@/lib/fx';
import AdminHeader from '@/components/admin/AdminHeader';
import { useAdminLocale } from '@/lib/useAdminLocale';
import { formatEur } from '@/lib/money';
import { OPENING_DATE } from '@/lib/booking.config';

const ATHENS_TZ = 'Europe/Athens';

const todayAthens = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Athens' }).format(new Date());
const nowAthensHHMM = () => {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Athens', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
  const h = Number(parts.find((p) => p.type === 'hour').value);
  const m = Number(parts.find((p) => p.type === 'minute').value);
  const rounded = Math.ceil((h * 60 + m) / 30) * 30;
  return `${String(Math.floor(rounded / 60) % 24).padStart(2, '0')}:${String(rounded % 60).padStart(2, '0')}`;
};
const addMinutesToHHMM = (hhmm, mins) => {
  const [h, m] = hhmm.split(':').map(Number);
  const total = (h * 60 + m + mins + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
};

// Quick-select presets for the "Block time" tab — pre-fill a reason + duration
// for recurring outside-of-Nommar commitments (e.g. Margarita's home nail
// appointments) so logging one is a couple of taps, not a full form.
const PRESETS = [{ label: 'Nails appointment', reason: 'Nails appointment', durationMin: 60 }];

const COPY = {
  en: {
    heading: 'Quick Booking', subtitle: 'For reservations taken by phone. Pick the therapist first — everything else narrows down from there.',
    tabBook: 'Book guest', tabBlock: 'Block time',
    therapist: 'Therapist', pickTherapist: 'Select a therapist…', service: 'Service', pickService: 'Select a service…',
    date: 'Date', time: 'Time', noTimes: 'No free times for this therapist on this day.', loadingTimes: 'Checking availability…',
    guestName: 'Guest name', phone: 'Phone (optional)', email: 'Email (optional)', language: 'Guest language', notes: 'Notes (optional)',
    submit: 'Confirm booking', submitting: 'Booking…', pickTherapistFirst: 'Choose a therapist to see their services.',
    success: 'Booked! Reservation', viewBookings: 'View in Bookings', another: 'Book another',
    required: 'Guest name, therapist, service and time are all required.',
    blockSubtitle: 'For time a therapist is unavailable to Nommar (an outside appointment, personal errand, etc). Blocks only that therapist — no room is held.',
    startTime: 'Start', endTime: 'End', reason: 'Reason', reasonPlaceholder: 'e.g. Nails appointment',
    quickPresets: 'Quick add', addBlock: 'Add block', adding: 'Adding…', blockRequired: 'Therapist, date, start and end time are required.',
    startBeforeEnd: 'End time must be after start time.',
    upcoming: 'Upcoming blocks', noUpcoming: 'No upcoming blocks.', remove: 'Remove',
    blockAdded: 'Time blocked.',
  },
  gr: {
    heading: 'Γρήγορη Κράτηση', subtitle: 'Για κρατήσεις από τηλέφωνο. Επιλέξτε πρώτα τον θεραπευτή — τα υπόλοιπα περιορίζονται ανάλογα.',
    tabBook: 'Κράτηση πελάτη', tabBlock: 'Αποκλεισμός ώρας',
    therapist: 'Θεραπευτής', pickTherapist: 'Επιλέξτε θεραπευτή…', service: 'Θεραπεία', pickService: 'Επιλέξτε θεραπεία…',
    date: 'Ημερομηνία', time: 'Ώρα', noTimes: 'Δεν υπάρχουν διαθέσιμες ώρες για αυτόν τον θεραπευτή αυτή τη μέρα.', loadingTimes: 'Έλεγχος διαθεσιμότητας…',
    guestName: 'Όνομα πελάτη', phone: 'Τηλέφωνο (προαιρετικό)', email: 'Email (προαιρετικό)', language: 'Γλώσσα πελάτη', notes: 'Σημειώσεις (προαιρετικό)',
    submit: 'Επιβεβαίωση κράτησης', submitting: 'Κράτηση…', pickTherapistFirst: 'Επιλέξτε θεραπευτή για να δείτε τις θεραπείες του.',
    success: 'Η κράτηση έγινε! Αρ. κράτησης', viewBookings: 'Προβολή στις Κρατήσεις', another: 'Νέα κράτηση',
    required: 'Όνομα, θεραπευτής, θεραπεία και ώρα είναι υποχρεωτικά.',
    blockSubtitle: 'Για ώρες που ένας θεραπευτής δεν είναι διαθέσιμος στο Nommar (εξωτερικό ραντεβού, προσωπική υπόθεση κ.λπ). Αποκλείει μόνο τον θεραπευτή — καμία αίθουσα δεν δεσμεύεται.',
    startTime: 'Έναρξη', endTime: 'Λήξη', reason: 'Αιτία', reasonPlaceholder: 'π.χ. Ραντεβού νυχιών',
    quickPresets: 'Γρήγορη προσθήκη', addBlock: 'Προσθήκη αποκλεισμού', adding: 'Προσθήκη…', blockRequired: 'Θεραπευτής, ημερομηνία, ώρα έναρξης και λήξης είναι υποχρεωτικά.',
    startBeforeEnd: 'Η ώρα λήξης πρέπει να είναι μετά την ώρα έναρξης.',
    upcoming: 'Προσεχείς αποκλεισμοί', noUpcoming: 'Κανένας προσεχής αποκλεισμός.', remove: 'Αφαίρεση',
    blockAdded: 'Η ώρα αποκλείστηκε.',
  },
};

const card = 'background:#FFFDF8;border:1px solid rgba(194,165,107,0.28);border-radius:2px;';
const label = "font-family:var(--font-jost),sans-serif;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#A8967C;margin-bottom:6px;display:block;";
const inp = "font-family:var(--font-jost),sans-serif;font-size:13px;color:#3D2F25;background:#FAF5EC;border:1px solid rgba(194,165,107,0.4);border-radius:2px;padding:9px 11px;outline:none;width:100%;";
const addBtn = "font-family:var(--font-jost),sans-serif;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#3D2F25;background:linear-gradient(135deg,#E6CF95,#C2A56B);border:none;padding:12px 22px;cursor:pointer;border-radius:1px;";
const field = 'display:flex;flex-direction:column;gap:0;';

export default function NewBooking() {
  const locale = useAdminLocale();
  const t = COPY[locale];
  const [mode, setMode] = useState('book'); // 'book' | 'block'

  const [staff, setStaff] = useState(null);
  useEffect(() => {
    fetch('/api/admin/staff').then((r) => r.json()).then((d) => setStaff((d.staff || []).filter((s) => s.active)));
  }, []);

  const tabBtn = (m, text) => (
    <FX
      as="button"
      onClick={() => setMode(m)}
      style={"font-family:var(--font-jost),sans-serif;font-size:11.5px;letter-spacing:0.14em;text-transform:uppercase;cursor:pointer;padding:10px 18px;border-radius:1px;border:1px solid rgba(194,165,107,0.45);" + (mode === m ? 'background:linear-gradient(135deg,#E6CF95,#C2A56B);color:#3D2F25;' : 'background:none;color:#8A7965;')}
      hover={mode === m ? '' : 'border-color:#C2A56B;color:#3D2F25;'}
    >
      {text}
    </FX>
  );

  return (
    <>
      <AdminHeader />
      <main style={css('max-width:720px;margin:0 auto;padding:clamp(28px,4vw,48px) clamp(18px,4vw,40px);')}>
        <h1 style={css("font-family:var(--font-cinzel),serif;font-weight:500;font-size:clamp(24px,3vw,34px);margin:0 0 6px;")}>{t.heading}</h1>
        <p style={css("font-family:var(--font-jost),sans-serif;font-size:13px;color:#8A7965;margin:0 0 20px;")}>{mode === 'book' ? t.subtitle : t.blockSubtitle}</p>

        <div style={css('display:flex;gap:8px;margin-bottom:20px;')}>
          {tabBtn('book', t.tabBook)}
          {tabBtn('block', t.tabBlock)}
        </div>

        {mode === 'book' ? <BookGuest t={t} locale={locale} staff={staff} /> : <BlockTime t={t} staff={staff} />}
      </main>
    </>
  );
}

function BookGuest({ t, locale, staff }) {
  const [services, setServices] = useState([]);
  const [staffId, setStaffId] = useState('');
  const [serviceSlug, setServiceSlug] = useState('');
  const [date, setDate] = useState(() => (todayAthens() > OPENING_DATE ? todayAthens() : OPENING_DATE));
  const [slots, setSlots] = useState(null);
  const [time, setTime] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [guestLocale, setGuestLocale] = useState(locale);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(null);

  useEffect(() => {
    fetch('/api/admin/services').then((r) => r.json()).then((d) => setServices((d.services || []).filter((s) => s.active)));
  }, []);

  const chosenStaff = staff?.find((s) => s.id === Number(staffId));
  const staffServiceIds = useMemo(() => new Set((chosenStaff?.services || []).map((s) => s.id)), [chosenStaff]);
  const availableServices = services.filter((s) => staffServiceIds.has(s.id));

  // Reset service/time whenever the therapist changes, so a stale selection
  // (from a different therapist's service list) can't be submitted.
  useEffect(() => { setServiceSlug(''); setTime(''); setSlots(null); }, [staffId]);
  useEffect(() => { setTime(''); setSlots(null); }, [serviceSlug, date]);

  useEffect(() => {
    if (!staffId || !serviceSlug || !date) return;
    setSlots(null);
    const url = `/api/admin/manual-booking?date=${date}&staffId=${staffId}&service=${encodeURIComponent(serviceSlug)}`;
    fetch(url).then((r) => r.json()).then((d) => setSlots(d.slots || []));
  }, [staffId, serviceSlug, date]);

  const submit = async () => {
    setError('');
    if (!name.trim() || !staffId || !serviceSlug || !time) { setError(t.required); return; }
    setSubmitting(true);
    const r = await fetch('/api/admin/manual-booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        staffId: Number(staffId),
        service: serviceSlug,
        start: time,
        customer: { name: name.trim(), phone: phone.trim() || undefined, email: email.trim() || undefined },
        locale: guestLocale,
        notes: notes.trim() || undefined,
      }),
    });
    const d = await r.json().catch(() => ({}));
    setSubmitting(false);
    if (!r.ok) { setError(d.error || 'Could not book.'); return; }
    setDone(d.reservationId);
  };

  const reset = () => {
    setStaffId(''); setServiceSlug(''); setTime(''); setSlots(null);
    setName(''); setPhone(''); setEmail(''); setNotes(''); setDone(null); setError('');
  };

  if (done) {
    return (
      <div style={css(card + 'padding:26px;text-align:center;')}>
        <p style={css("font-family:var(--font-jost),sans-serif;font-size:15px;color:#3E7A4E;margin:0 0 18px;")}>{t.success} #{done}</p>
        <div style={css('display:flex;gap:10px;justify-content:center;')}>
          <FX as="a" href="/admin" style={addBtn + 'text-decoration:none;display:inline-block;'} hover="transform:translateY(-1px);">{t.viewBookings}</FX>
          <FX as="button" onClick={reset} style="font-family:var(--font-jost),sans-serif;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#8A7965;background:none;border:1px solid rgba(194,165,107,0.45);padding:12px 22px;cursor:pointer;border-radius:1px;" hover="border-color:#C2A56B;color:#3D2F25;">{t.another}</FX>
        </div>
      </div>
    );
  }

  return (
    <div style={css(card + 'padding:22px 24px;display:flex;flex-direction:column;gap:16px;')}>
      <div style={css(field)}>
        <label style={css(label)}>{t.therapist}</label>
        <select value={staffId} onChange={(e) => setStaffId(e.target.value)} style={css(inp + 'cursor:pointer;')}>
          <option value="">{t.pickTherapist}</option>
          {(staff || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div style={css(field)}>
        <label style={css(label)}>{t.service}</label>
        <select value={serviceSlug} onChange={(e) => setServiceSlug(e.target.value)} disabled={!staffId} style={css(inp + (staffId ? 'cursor:pointer;' : 'opacity:0.5;'))}>
          <option value="">{staffId ? t.pickService : t.pickTherapistFirst}</option>
          {availableServices.map((s) => (
            <option key={s.id} value={s.slug}>{s.name} — {s.durationMin}min{s.priceCents != null ? ` — ${formatEur(s.priceCents, locale)}` : ''}</option>
          ))}
        </select>
      </div>

      <div style={css('display:flex;gap:14px;flex-wrap:wrap;')}>
        <div style={css(field + 'flex:1;min-width:160px;')}>
          <label style={css(label)}>{t.date}</label>
          <input type="date" value={date} min={OPENING_DATE} onChange={(e) => setDate(e.target.value)} style={css(inp)} />
        </div>
        <div style={css(field + 'flex:2;min-width:220px;')}>
          <label style={css(label)}>{t.time}</label>
          {!serviceSlug ? null : slots === null ? (
            <p style={css("font-family:var(--font-cormorant),serif;font-style:italic;font-size:14px;color:#8A7965;margin:9px 0;")}>{t.loadingTimes}</p>
          ) : slots.length === 0 ? (
            <p style={css("font-family:var(--font-jost),sans-serif;font-size:13px;color:#9B4444;margin:9px 0;")}>{t.noTimes}</p>
          ) : (
            <div style={css('display:flex;flex-wrap:wrap;gap:7px;')}>
              {slots.map((s) => (
                <button key={s.iso} onClick={() => setTime(s.iso)} style={css('font-family:var(--font-jost),sans-serif;font-size:12.5px;cursor:pointer;padding:7px 12px;border-radius:2px;' + (time === s.iso ? 'background:linear-gradient(135deg,#E6CF95,#C2A56B);color:#3D2F25;border:1px solid #C2A56B;' : 'background:transparent;color:#3D2F25;border:1px solid rgba(194,165,107,0.4);'))}>{s.time}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={css('height:1px;background:rgba(194,165,107,0.25);margin:4px 0;')} />

      <div style={css('display:flex;gap:14px;flex-wrap:wrap;')}>
        <div style={css(field + 'flex:1;min-width:200px;')}>
          <label style={css(label)}>{t.guestName}</label>
          <input value={name} onChange={(e) => setName(e.target.value)} style={css(inp)} />
        </div>
        <div style={css(field + 'flex:1;min-width:160px;')}>
          <label style={css(label)}>{t.phone}</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} style={css(inp)} />
        </div>
      </div>
      <div style={css('display:flex;gap:14px;flex-wrap:wrap;')}>
        <div style={css(field + 'flex:1;min-width:200px;')}>
          <label style={css(label)}>{t.email}</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} style={css(inp)} />
        </div>
        <div style={css(field + 'min-width:120px;')}>
          <label style={css(label)}>{t.language}</label>
          <select value={guestLocale} onChange={(e) => setGuestLocale(e.target.value)} style={css(inp + 'cursor:pointer;')}>
            <option value="en">EN</option>
            <option value="gr">ΕΛ</option>
          </select>
        </div>
      </div>
      <div style={css(field)}>
        <label style={css(label)}>{t.notes}</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} style={css(inp + 'resize:vertical;font-family:var(--font-jost),sans-serif;')} />
      </div>

      {error && <div style={css("color:#9B4444;font-family:var(--font-jost),sans-serif;font-size:13px;")}>{error}</div>}

      <div>
        <FX as="button" onClick={submit} disabled={submitting} style={addBtn + (submitting ? 'opacity:0.6;' : '')} hover="transform:translateY(-1px);">{submitting ? t.submitting : t.submit}</FX>
      </div>
    </div>
  );
}

function BlockTime({ t, staff }) {
  const [staffId, setStaffId] = useState('');
  const [date, setDate] = useState(todayAthens());
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [blocks, setBlocks] = useState(null);

  const load = () => fetch('/api/admin/blocks').then((r) => r.json()).then((d) => setBlocks(d.blocks || []));
  useEffect(load, []);

  const applyPreset = (preset) => {
    const s = start || nowAthensHHMM();
    setStart(s);
    setEnd(addMinutesToHHMM(s, preset.durationMin));
    setReason(preset.reason);
  };

  const add = async () => {
    setError(''); setMsg('');
    if (!staffId || !date || !start || !end) { setError(t.blockRequired); return; }
    if (start >= end) { setError(t.startBeforeEnd); return; }
    setSubmitting(true);
    const r = await fetch('/api/admin/blocks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        staffId: Number(staffId),
        startsAt: fromZonedTime(`${date}T${start}:00`, ATHENS_TZ).toISOString(),
        endsAt: fromZonedTime(`${date}T${end}:00`, ATHENS_TZ).toISOString(),
        reason: reason.trim() || undefined,
      }),
    });
    setSubmitting(false);
    if (!r.ok) { const d = await r.json().catch(() => ({})); setError(d.error || 'Could not add.'); return; }
    setStart(''); setEnd(''); setReason(''); setMsg(t.blockAdded);
    load();
  };

  const remove = async (id) => { await fetch(`/api/admin/blocks?id=${id}`, { method: 'DELETE' }); load(); };

  const dt = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Athens' });

  return (
    <div style={css('display:flex;flex-direction:column;gap:20px;')}>
      <div style={css(card + 'padding:22px 24px;display:flex;flex-direction:column;gap:16px;')}>
        <div style={css(field)}>
          <label style={css(label)}>{t.therapist}</label>
          <select value={staffId} onChange={(e) => setStaffId(e.target.value)} style={css(inp + 'cursor:pointer;')}>
            <option value="">{t.pickTherapist}</option>
            {(staff || []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        <div style={css(field)}>
          <label style={css(label)}>{t.quickPresets}</label>
          <div style={css('display:flex;flex-wrap:wrap;gap:8px;')}>
            {PRESETS.map((p) => (
              <button key={p.label} onClick={() => applyPreset(p)} style={css('font-family:var(--font-jost),sans-serif;font-size:12px;cursor:pointer;padding:8px 14px;border-radius:2px;background:transparent;color:#3D2F25;border:1px solid rgba(194,165,107,0.4);')}>{p.label} · {p.durationMin}min</button>
            ))}
          </div>
        </div>

        <div style={css('display:flex;gap:14px;flex-wrap:wrap;')}>
          <div style={css(field + 'flex:1;min-width:150px;')}>
            <label style={css(label)}>{t.date}</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={css(inp)} />
          </div>
          <div style={css(field + 'min-width:110px;')}>
            <label style={css(label)}>{t.startTime}</label>
            <input type="time" value={start} onChange={(e) => setStart(e.target.value)} style={css(inp)} />
          </div>
          <div style={css(field + 'min-width:110px;')}>
            <label style={css(label)}>{t.endTime}</label>
            <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} style={css(inp)} />
          </div>
        </div>

        <div style={css(field)}>
          <label style={css(label)}>{t.reason}</label>
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t.reasonPlaceholder} style={css(inp)} />
        </div>

        {error && <div style={css("color:#9B4444;font-family:var(--font-jost),sans-serif;font-size:13px;")}>{error}</div>}
        {msg && <div style={css("color:#3E7A4E;font-family:var(--font-jost),sans-serif;font-size:13px;")}>{msg}</div>}

        <div>
          <FX as="button" onClick={add} disabled={submitting} style={addBtn + (submitting ? 'opacity:0.6;' : '')} hover="transform:translateY(-1px);">{submitting ? t.adding : t.addBlock}</FX>
        </div>
      </div>

      <div>
        <div style={css("font-family:var(--font-jost),sans-serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#A8967C;margin-bottom:10px;")}>{t.upcoming}</div>
        {blocks === null ? null : blocks.length === 0 ? (
          <p style={css("font-family:var(--font-jost),sans-serif;font-size:13px;color:#8A7965;")}>{t.noUpcoming}</p>
        ) : (
          <div style={css('display:flex;flex-direction:column;gap:8px;')}>
            {blocks.map((b) => (
              <div key={b.id} style={css('display:flex;align-items:center;justify-content:space-between;gap:12px;background:#F3EADA;border:1px solid rgba(194,165,107,0.3);padding:10px 14px;border-radius:2px;')}>
                <span style={css("font-family:var(--font-jost),sans-serif;font-size:13px;color:#3D2F25;")}><strong>{b.staff ? b.staff.name : 'Whole spa'}</strong> · {dt.format(new Date(b.startsAt))} → {dt.format(new Date(b.endsAt))}{b.reason ? ` · ${b.reason}` : ''}</span>
                <button onClick={() => remove(b.id)} style={css("font-family:var(--font-jost),sans-serif;font-size:11px;color:#9B4444;background:none;border:none;cursor:pointer;")}>{t.remove}</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
