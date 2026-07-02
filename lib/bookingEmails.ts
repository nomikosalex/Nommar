import { formatInTimeZone } from 'date-fns-tz';
import { TZ } from './availability';
import { sendEmail } from './email';

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
  bookings: ApptLike[];
};

const at = (d: Date) => formatInTimeZone(d, TZ, 'HH:mm');
const dateOf = (d: Date) => formatInTimeZone(d, TZ, "EEEE d MMMM yyyy");

// Escape user-provided text before interpolating into email HTML (names/notes
// come straight from the public booking form).
const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

function lines(r: ReservationLike): string {
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

// Guest confirmation + spa notification. Failures are swallowed.
export async function sendReservationEmails(r: ReservationLike) {
  const first = [...r.bookings].sort((a, b) => +a.startsAt - +b.startsAt)[0];
  const day = first ? dateOf(first.startsAt) : '';
  const body = lines(r);
  const spaEmail = process.env.SPA_EMAIL || 'hello@nommar.gr';

  const guest = sendEmail({
    to: r.customerEmail,
    subject: `Your Nommar booking request — ${day}`,
    html: `<div style="font-family:Georgia,serif;color:#3D2F25;max-width:560px">
      <h2 style="color:#C2A56B">Thank you, ${esc(r.customerName)}</h2>
      <p>We've received your booking request for <strong>${day}</strong> and will confirm shortly.</p>
      <pre style="font-family:inherit;white-space:pre-wrap;background:#FAF5EC;padding:14px;border:1px solid #E6CF95">${esc(body)}</pre>
      <p style="color:#8A7965">Nommar — Beauty &amp; Spa · Kamari, Santorini</p></div>`,
    text: `Thank you, ${r.customerName}. Request for ${day}:\n${body}\nWe'll confirm shortly. — Nommar, Kamari, Santorini`,
  });

  const spa = sendEmail({
    to: spaEmail,
    subject: `New booking — ${day} (${r.guestCount} guest${r.guestCount > 1 ? 's' : ''})`,
    html: `<div style="font-family:Arial,sans-serif;color:#3D2F25">
      <h3>New booking request — ${day}</h3>
      <pre style="font-family:inherit;white-space:pre-wrap">${esc(body)}</pre>
      <p>${esc(r.customerName)} · ${esc(r.customerEmail)} · ${esc(r.customerPhone)}</p>
      ${r.notes ? `<p><em>${esc(r.notes)}</em></p>` : ''}</div>`,
    text: `New booking ${day} (${r.guestCount} guest(s)):\n${body}\n${r.customerName}, ${r.customerEmail}, ${r.customerPhone}${r.notes ? '\nNotes: ' + r.notes : ''}`,
  });

  await Promise.allSettled([guest, spa]);
}
