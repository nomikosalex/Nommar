// Server-only analytics aggregation for the admin dashboard.
// Pure functions over already-fetched rows — no DB access here — so they can be
// unit-tested against seeded data. All day/hour/weekday grouping is in Athens
// time, reusing the booking engine's helpers so semantics match exactly.
import { formatInTimeZone } from 'date-fns-tz';
import { TZ, localToUtc, weekdayOf, nextDayStr } from './availability';
import { OPENING_DATE } from './booking.config';

export type Preset = 'last7' | 'last30' | 'month' | 'season' | 'custom';

// ---------- date-string helpers (Athens calendar) ----------
export const athensToday = (now: Date = new Date()): string => formatInTimeZone(now, TZ, 'yyyy-MM-dd');
const athensDay = (d: Date): string => formatInTimeZone(d, TZ, 'yyyy-MM-dd');
const athensHour = (d: Date): number => Number(formatInTimeZone(d, TZ, 'H'));

// shift a YYYY-MM-DD by n calendar days (UTC-noon math avoids DST edge cases)
export function shiftDays(dateStr: string, n: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
}
// inclusive whole-calendar-day difference (b - a), Athens dates
const dayDiff = (aStr: string, bStr: string): number =>
  Math.round((localToUtc(bStr, 0).getTime() - localToUtc(aStr, 0).getTime()) / 86_400_000);

/** Resolve a preset (+ optional custom from/to) into Athens date strings. */
export function resolveRange(preset: Preset, from?: string, to?: string, now: Date = new Date()): { from: string; to: string } {
  const today = athensToday(now);
  switch (preset) {
    case 'last7': return { from: shiftDays(today, -6), to: today };
    case 'last30': return { from: shiftDays(today, -29), to: today };
    case 'month': return { from: today.slice(0, 7) + '-01', to: today };
    case 'season': return { from: OPENING_DATE, to: today < OPENING_DATE ? OPENING_DATE : today };
    case 'custom': return { from: from || today, to: to || today };
  }
}

// ---------- row shapes (match the route's Prisma selects) ----------
export type BookingRow = {
  startsAt: Date;
  endsAt: Date;
  priceCents: number | null;
  finalPriceCents: number | null;
  guestIndex: number;
  reservationId: number;
  service: { name: string; slug: string };
  reservation: { id: number; status: string; promoCode: string | null; guestCount: number; createdAt: Date };
};
export type StaffRow = { id: number; workingHours: { weekday: number; startMin: number; endMin: number }[] };
export type TimeOffRow = { staffId: number | null; startsAt: Date; endsAt: Date };

export type DashboardInput = {
  from: string; // Athens date
  to: string;
  preset: Preset;
  bookings: BookingRow[]; // all bookings with startsAt in [from, to]
  staff: StaffRow[]; // active staff + working hours
  timeOff: TimeOffRow[];
  upcoming: { finalPriceCents: number | null }[]; // CONFIRMED, startsAt > now
  now?: Date;
};

const cents = (n: number | null | undefined) => n ?? 0; // COALESCE null → 0 for sums
const median = (xs: number[]): number | null => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

const REALIZED = 'COMPLETED';
const BOOKED_STATUSES = new Set(['CONFIRMED', 'COMPLETED']); // "actual" demand / occupancy

export function buildDashboard(input: DashboardInput) {
  const now = input.now ?? new Date();
  const { from, to, bookings } = input;

  // ----- reservation-level sets (a visit's bookings share a day, so any booking
  // in range ⇒ that reservation is "scheduled in range") -----
  const resById = new Map<number, BookingRow['reservation']>();
  for (const b of bookings) if (!resById.has(b.reservationId)) resById.set(b.reservationId, b.reservation);
  const reservations = [...resById.values()];
  const countByStatus = (s: string) => reservations.filter((r) => r.status === s).length;

  const completedBk = bookings.filter((b) => b.reservation.status === REALIZED);
  const realizedRevenueCents = completedBk.reduce((s, b) => s + cents(b.finalPriceCents), 0);
  const completedReservations = countByStatus('COMPLETED');
  const completedAppointments = completedBk.length;

  const noShowCount = countByStatus('NO_SHOW');
  const cancelledCount = countByStatus('CANCELLED');
  const attendDenom = completedReservations + noShowCount; // due visits
  const totalRes = reservations.length;

  // ----- revenue over time (zero-filled Athens days) -----
  const revMap = new Map<string, number>();
  for (const b of completedBk) revMap.set(athensDay(b.startsAt), (revMap.get(athensDay(b.startsAt)) || 0) + cents(b.finalPriceCents));
  const revenueByDay: { day: string; cents: number }[] = [];
  for (let d = from; d <= to; d = shiftDays(d, 1)) revenueByDay.push({ day: d, cents: revMap.get(d) || 0 });

  // ----- top services (completed) -----
  const svcRev = new Map<string, number>();
  const svcCnt = new Map<string, number>();
  for (const b of completedBk) {
    svcRev.set(b.service.name, (svcRev.get(b.service.name) || 0) + cents(b.finalPriceCents));
    svcCnt.set(b.service.name, (svcCnt.get(b.service.name) || 0) + 1);
  }
  const topBy = <T,>(m: Map<string, number>, key: 'cents' | 'count') =>
    [...m.entries()].map(([name, v]) => ({ name, [key]: v }) as T).sort((a: any, b: any) => b[key] - a[key]).slice(0, 6);

  // ----- demand (CONFIRMED + COMPLETED) -----
  const demandBk = bookings.filter((b) => BOOKED_STATUSES.has(b.reservation.status));
  const byHour = Array.from({ length: 24 }, (_, h) => ({ hour: h, count: 0 }));
  const byWeekday = Array.from({ length: 7 }, (_, w) => ({ weekday: w, count: 0 }));
  for (const b of demandBk) {
    byHour[athensHour(b.startsAt)].count++;
    byWeekday[weekdayOf(athensDay(b.startsAt))].count++;
  }

  // ----- lead time (createdAt → startsAt), per reservation, CONFIRMED+COMPLETED -----
  const leadByRes = new Map<number, number>(); // reservationId → min lead days
  for (const b of demandBk) {
    const lead = dayDiff(athensDay(b.reservation.createdAt), athensDay(b.startsAt));
    const prev = leadByRes.get(b.reservationId);
    if (prev === undefined || lead < prev) leadByRes.set(b.reservationId, lead);
  }
  const leadDays = [...leadByRes.values()].map((n) => Math.max(0, n));
  const leadBuckets = [
    { key: 'same', count: leadDays.filter((d) => d === 0).length },
    { key: '1-3', count: leadDays.filter((d) => d >= 1 && d <= 3).length },
    { key: '4-7', count: leadDays.filter((d) => d >= 4 && d <= 7).length },
    { key: '8+', count: leadDays.filter((d) => d >= 8).length },
  ];

  // ----- discounts (realized) -----
  const promoReservations = reservations.filter((r) => r.promoCode).length;
  let totalDiscountCents = 0;
  let pricedBookings = 0;
  for (const b of completedBk) {
    if (b.priceCents != null && b.finalPriceCents != null) {
      totalDiscountCents += b.priceCents - b.finalPriceCents;
      pricedBookings++;
    }
  }

  // ----- guest mix -----
  const guestMix = { one: reservations.filter((r) => r.guestCount === 1).length, two: reservations.filter((r) => r.guestCount === 2).length };

  // ----- data quality -----
  const missingPriceCount = completedBk.filter((b) => b.finalPriceCents == null).length;

  // ----- utilisation (elapsed-window clamp) -----
  const utilisation = computeUtilisation(input, now);

  // ----- upcoming pipeline -----
  const upcomingRevenueCents = input.upcoming.reduce((s, u) => s + cents(u.finalPriceCents), 0);

  const aovCents = completedReservations > 0 ? Math.round(realizedRevenueCents / completedReservations) : null;

  return {
    range: { preset: input.preset, from, to },
    headline: {
      realizedRevenueCents,
      completedAppointments,
      completedReservations,
      aovCents,
      noShow: { count: noShowCount, denom: attendDenom, rate: attendDenom > 0 ? noShowCount / attendDenom : null },
      cancellation: { count: cancelledCount, denom: totalRes, rate: totalRes > 0 ? cancelledCount / totalRes : null },
      upcomingRevenueCents,
      upcomingCount: input.upcoming.length,
    },
    revenueByDay,
    utilisation,
    topServices: {
      byRevenue: topBy<{ name: string; cents: number }>(svcRev, 'cents'),
      byBookings: topBy<{ name: string; count: number }>(svcCnt, 'count'),
    },
    demand: { byHour, byWeekday },
    leadTime: { medianDays: median(leadDays), buckets: leadBuckets, sampleSize: leadDays.length },
    discounts: { promoReservations, totalDiscountCents, pricedBookings },
    guestMix,
    dataQuality: { missingPriceCount, totalCompletedBookings: completedAppointments },
    totals: { reservationsInRange: totalRes, bookingsInRange: bookings.length },
  };
}

/** Booked vs available therapist-minutes over the ELAPSED part of the range only. */
export function computeUtilisation(input: DashboardInput, now: Date) {
  const today = athensToday(now);
  // elapsed window: [from, min(to, today)] — never counts future capacity/bookings
  const elapsedTo = input.to < today ? input.to : today;
  if (elapsedTo < input.from) {
    return { bookedMinutes: 0, availableMinutes: 0, pct: null, bookedHours: 0, availableHours: 0, elapsedTo };
  }
  const elapsedEndUtc = localToUtc(nextDayStr(elapsedTo), 0);

  // available minutes: expand weekly WorkingHours across each elapsed day (≥ opening), minus TimeOff overlap
  let availableMinutes = 0;
  for (let d = input.from; d <= elapsedTo; d = shiftDays(d, 1)) {
    if (d < OPENING_DATE) continue;
    const weekday = weekdayOf(d);
    for (const s of input.staff) {
      for (const wh of s.workingHours) {
        if (wh.weekday !== weekday) continue;
        const wStart = localToUtc(d, wh.startMin);
        const wEnd = localToUtc(d, wh.endMin);
        let mins = wh.endMin - wh.startMin;
        for (const off of input.timeOff) {
          if (off.staffId !== null && off.staffId !== s.id) continue; // null = whole spa
          const overlapMs = Math.min(wEnd.getTime(), off.endsAt.getTime()) - Math.max(wStart.getTime(), off.startsAt.getTime());
          if (overlapMs > 0) mins -= overlapMs / 60_000;
        }
        availableMinutes += Math.max(0, mins);
      }
    }
  }

  // booked minutes: CONFIRMED + COMPLETED appointments that started within the elapsed window
  let bookedMinutes = 0;
  for (const b of input.bookings) {
    if (!BOOKED_STATUSES.has(b.reservation.status)) continue;
    if (b.startsAt >= elapsedEndUtc) continue;
    bookedMinutes += (b.endsAt.getTime() - b.startsAt.getTime()) / 60_000;
  }

  const round1 = (n: number) => Math.round(n / 6) / 10; // minutes → hours, 1 dp
  return {
    bookedMinutes: Math.round(bookedMinutes),
    availableMinutes: Math.round(availableMinutes),
    pct: availableMinutes > 0 ? bookedMinutes / availableMinutes : null,
    bookedHours: round1(bookedMinutes),
    availableHours: round1(availableMinutes),
    elapsedTo,
  };
}
