import { formatInTimeZone } from 'date-fns-tz';
import { el, enGB } from 'date-fns/locale';
import { TZ } from './availability';
import { sendEmail } from './email';
import { reservationUrl, getBaseUrl } from './urls';
import { PROMO } from './booking.config';

type Locale = 'en' | 'gr';

type ApptLike = {
  guestIndex: number;
  guestName: string | null;
  sequenceIndex: number;
  startsAt: Date;
  service: { name: string; durationMin: number };
  staff: { name: string };
  room: { name: string };
};
type ReservationLike = {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  guestCount: number;
  notes: string | null;
  token: string;
  locale: string;
  promoCode: string | null;
  bookings: ApptLike[];
};

// Escape user-provided text before interpolating into email HTML (names/notes
// come straight from the public booking form).
const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

const at = (d: Date) => formatInTimeZone(d, TZ, 'HH:mm');
const dateOf = (d: Date, loc: Locale) =>
  formatInTimeZone(d, TZ, 'EEEE d MMMM yyyy', { locale: loc === 'gr' ? el : enGB });

// ---------- localized copy ----------
const COPY = {
  en: {
    verifySubject: (day: string) => `Please confirm your booking — ${day}`,
    verifyIntro: `We've received your booking request. Please confirm your email so we can finalise it.`,
    verifyCta: 'Confirm my email',
    confirmedSubject: (day: string) => `Your booking is confirmed — ${day}`,
    confirmedIntro: (day: string) => `Your booking for <strong>${day}</strong> is confirmed. We can't wait to welcome you!`,
    reminderSubject: (day: string) => `Appointment reminder — ${day}`,
    reminderIntro: (day: string) => `A gentle reminder — your appointment is tomorrow, ${day}.`,
    cancelledSubject: (day: string) => `Regarding your Nommar booking — ${day}`,
    cancelledIntro: (day: string) => `We're sorry — your booking for <strong>${day}</strong> has been cancelled and will not take place.`,
    cancelledOutro: `We'd love to welcome you another time — you can book again whenever suits you.`,
    bookAgain: 'Book again',
    greeting: (name: string) => `Thank you, ${name}`,
    hello: (name: string) => `Hello, ${name}`,
    arriveEarly: 'Please arrive 10 minutes before your appointment.',
    promoLine: (code: string, pct: number) => `Promo code ${code} applied — ${pct}% off.`,
    yourAppointments: 'Your appointments:',
    manageCta: 'Manage or cancel your booking',
    footer: 'Nommar — Beauty &amp; Spa · Kamari, Santorini',
  },
  gr: {
    verifySubject: (day: string) => `Επιβεβαιώστε την κράτησή σας — ${day}`,
    verifyIntro: `Λάβαμε το αίτημα κράτησής σας. Παρακαλούμε επιβεβαιώστε το email σας για να την ολοκληρώσουμε.`,
    verifyCta: 'Επιβεβαίωση email',
    confirmedSubject: (day: string) => `Η κράτησή σας επιβεβαιώθηκε — ${day}`,
    confirmedIntro: (day: string) => `Η κράτησή σας για <strong>${day}</strong> επιβεβαιώθηκε. Ανυπομονούμε να σας υποδεχθούμε!`,
    reminderSubject: (day: string) => `Υπενθύμιση ραντεβού — ${day}`,
    reminderIntro: (day: string) => `Μια σύντομη υπενθύμιση — το ραντεβού σας είναι αύριο, ${day}.`,
    cancelledSubject: (day: string) => `Σχετικά με την κράτησή σας στο Nommar — ${day}`,
    cancelledIntro: (day: string) => `Λυπούμαστε — η κράτησή σας για <strong>${day}</strong> ακυρώθηκε και δεν θα πραγματοποιηθεί.`,
    cancelledOutro: `Θα χαρούμε να σας υποδεχθούμε μια άλλη φορά — μπορείτε να κάνετε νέα κράτηση όποτε σας βολεύει.`,
    bookAgain: 'Νέα κράτηση',
    greeting: (name: string) => `Ευχαριστούμε, ${name}`,
    hello: (name: string) => `Γεια σας, ${name}`,
    arriveEarly: 'Παρακαλούμε προσέλθετε 10 λεπτά νωρίτερα από το ραντεβού σας.',
    promoLine: (code: string, pct: number) => `Κωδικός προσφοράς ${code} — έκπτωση ${pct}%.`,
    yourAppointments: 'Τα ραντεβού σας:',
    manageCta: 'Διαχείριση ή ακύρωση κράτησης',
    footer: 'Nommar — Beauty &amp; Spa · Καμάρι, Σαντορίνη',
  },
} as const;

const locOf = (r: ReservationLike): Locale => (r.locale === 'gr' ? 'gr' : 'en');

// Itinerary as plain text (used in <pre> and text bodies). Values are spa-controlled
// except guestName (escaped where rendered as HTML).
function itinerary(r: ReservationLike, loc: Locale): string {
  const out: string[] = [];
  for (let g = 1; g <= r.guestCount; g++) {
    const appts = r.bookings.filter((b) => b.guestIndex === g).sort((a, b) => a.sequenceIndex - b.sequenceIndex);
    if (appts.length === 0) continue;
    const label = g === 1 ? r.customerName : appts[0].guestName || `Guest ${g}`;
    out.push(`${label}:`);
    for (const a of appts) out.push(`  • ${at(a.startsAt)} — ${a.service.name} (${a.service.durationMin}′) · ${a.staff.name} · ${a.room.name}`);
  }
  return out.join('\n');
}

function button(url: string, label: string): string {
  return `<p style="margin:22px 0"><a href="${url}" style="display:inline-block;background:#C2A56B;color:#FAF5EC;text-decoration:none;font-family:Arial,sans-serif;font-size:14px;letter-spacing:0.04em;padding:12px 26px;border-radius:2px">${label}</a></p>`;
}

function promoBlock(r: ReservationLike, loc: Locale): string {
  if (!r.promoCode) return '';
  return `<p style="color:#8A7965;font-size:13px">${COPY[loc].promoLine(esc(r.promoCode), PROMO.pct)}</p>`;
}

// Shared HTML shell for guest emails.
function shell(loc: Locale, name: string, intro: string, body: string, cta: { url: string; label: string }, r: ReservationLike): string {
  return `<div style="font-family:Georgia,serif;color:#3D2F25;max-width:560px">
    <h2 style="color:#C2A56B">${esc(COPY[loc].greeting(name))}</h2>
    <p>${intro}</p>
    <p style="font-family:Arial,sans-serif;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;color:#8A7965;margin:20px 0 6px">${COPY[loc].yourAppointments}</p>
    <pre style="font-family:inherit;white-space:pre-wrap;background:#FAF5EC;padding:14px;border:1px solid #E6CF95">${esc(body)}</pre>
    <p style="color:#6E5E50;font-style:italic">${COPY[loc].arriveEarly}</p>
    ${promoBlock(r, loc)}
    ${button(cta.url, cta.label)}
    <p style="color:#8A7965">${COPY[loc].footer}</p></div>`;
}

// ---------- guest: verification (sent on booking) + spa notification ----------
export async function sendNewBookingEmails(r: ReservationLike) {
  const loc = locOf(r);
  const first = [...r.bookings].sort((a, b) => +a.startsAt - +b.startsAt)[0];
  const day = first ? dateOf(first.startsAt, loc) : '';
  const dayEn = first ? dateOf(first.startsAt, 'en') : '';
  const body = itinerary(r, loc);
  const url = reservationUrl(r.token);
  const spaEmail = process.env.SPA_EMAIL || 'info@nommar.gr';

  const guest = sendEmail({
    to: r.customerEmail,
    subject: COPY[loc].verifySubject(day),
    html: shell(loc, r.customerName, COPY[loc].verifyIntro, body, { url, label: COPY[loc].verifyCta }, r),
    text: `${COPY[loc].greeting(r.customerName)}\n${COPY[loc].verifyIntro}\n\n${COPY[loc].yourAppointments}\n${body}\n\n${COPY[loc].arriveEarly}\n${COPY[loc].verifyCta}: ${url}`,
  });

  // Spa notification stays English (internal).
  const spa = sendEmail({
    to: spaEmail,
    subject: `New booking — ${dayEn} (${r.guestCount} guest${r.guestCount > 1 ? 's' : ''})`,
    html: `<div style="font-family:Arial,sans-serif;color:#3D2F25">
      <h3>New booking request — ${dayEn}</h3>
      <pre style="font-family:inherit;white-space:pre-wrap">${esc(itinerary(r, 'en'))}</pre>
      <p>${esc(r.customerName)} · ${esc(r.customerEmail)} · ${esc(r.customerPhone)}</p>
      ${r.promoCode ? `<p>Promo: ${esc(r.promoCode)}</p>` : ''}
      ${r.notes ? `<p><em>${esc(r.notes)}</em></p>` : ''}</div>`,
    text: `New booking ${dayEn} (${r.guestCount} guest(s)):\n${itinerary(r, 'en')}\n${r.customerName}, ${r.customerEmail}, ${r.customerPhone}${r.promoCode ? '\nPromo: ' + r.promoCode : ''}${r.notes ? '\nNotes: ' + r.notes : ''}`,
  });

  await Promise.allSettled([guest, spa]);
}

// ---------- guest: booking confirmed by admin ----------
export async function sendConfirmedEmail(r: ReservationLike) {
  const loc = locOf(r);
  const first = [...r.bookings].sort((a, b) => +a.startsAt - +b.startsAt)[0];
  const day = first ? dateOf(first.startsAt, loc) : '';
  const body = itinerary(r, loc);
  const url = reservationUrl(r.token);
  await sendEmail({
    to: r.customerEmail,
    subject: COPY[loc].confirmedSubject(day),
    html: shell(loc, r.customerName, COPY[loc].confirmedIntro(day), body, { url, label: COPY[loc].manageCta }, r),
    text: `${COPY[loc].greeting(r.customerName)}\n${COPY[loc].confirmedIntro(day).replace(/<[^>]+>/g, '')}\n\n${COPY[loc].yourAppointments}\n${body}\n\n${COPY[loc].arriveEarly}\n${COPY[loc].manageCta}: ${url}`,
  });
}

// ---------- guest: 24h reminder ----------
export async function sendReminderEmail(r: ReservationLike) {
  const loc = locOf(r);
  const first = [...r.bookings].sort((a, b) => +a.startsAt - +b.startsAt)[0];
  const day = first ? dateOf(first.startsAt, loc) : '';
  const body = itinerary(r, loc);
  const url = reservationUrl(r.token);
  await sendEmail({
    to: r.customerEmail,
    subject: COPY[loc].reminderSubject(day),
    html: shell(loc, r.customerName, COPY[loc].reminderIntro(day), body, { url, label: COPY[loc].manageCta }, r),
    text: `${COPY[loc].greeting(r.customerName)}\n${COPY[loc].reminderIntro(day)}\n\n${COPY[loc].yourAppointments}\n${body}\n\n${COPY[loc].arriveEarly}\n${COPY[loc].manageCta}: ${url}`,
  });
}

// ---------- guest: booking cancelled by admin (only for previously-confirmed) ----------
export async function sendCancelledEmail(r: ReservationLike) {
  const loc = locOf(r);
  const c = COPY[loc];
  const first = [...r.bookings].sort((a, b) => +a.startsAt - +b.startsAt)[0];
  const day = first ? dateOf(first.startsAt, loc) : '';
  const body = itinerary(r, loc);
  const bookUrl = `${getBaseUrl()}/book`;
  await sendEmail({
    to: r.customerEmail,
    subject: c.cancelledSubject(day),
    html: `<div style="font-family:Georgia,serif;color:#3D2F25;max-width:560px">
      <h2 style="color:#C2A56B">${esc(c.greeting(r.customerName))}</h2>
      <p>${c.cancelledIntro(day)}</p>
      <pre style="font-family:inherit;white-space:pre-wrap;background:#FAF5EC;padding:14px;border:1px solid #E6CF95;text-decoration:line-through;color:#8A7965">${esc(body)}</pre>
      <p>${c.cancelledOutro}</p>
      ${button(bookUrl, c.bookAgain)}
      <p style="color:#8A7965">${c.footer}</p></div>`,
    text: `${c.greeting(r.customerName)}\n${c.cancelledIntro(day).replace(/<[^>]+>/g, '')}\n\n${body}\n\n${c.cancelledOutro}\n${c.bookAgain}: ${bookUrl}`,
  });
}
