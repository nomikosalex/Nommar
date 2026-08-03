import { fromZonedTime, formatInTimeZone } from 'date-fns-tz';
import { prisma } from './prisma';
import { Prisma } from './generated/prisma/client';
import { packageBySlug, duetBySlug } from './data';
import { SLOT_GRID_MIN, MAX_GUESTS, CROSS_SELL_DISCOUNT_PCT, PROMO, validatePromo, finalPriceCents, ceilToGrid, OPENING_DATE } from './booking.config';

export const TZ = process.env.NEXT_PUBLIC_TZ || 'Europe/Athens';

// ---------- timezone helpers ----------
// Exported for reuse by analytics (lib/analytics.ts) so day-boundary + weekday
// logic is identical to the booking engine's. Weekday convention (Sun=0..Sat=6)
// matches WorkingHours.weekday.
export function localToUtc(dateStr: string, minutes: number): Date {
  const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
  const mm = String(minutes % 60).padStart(2, '0');
  return fromZonedTime(`${dateStr}T${hh}:${mm}:00`, TZ);
}
export function weekdayOf(dateStr: string): number {
  return Number(formatInTimeZone(localToUtc(dateStr, 12 * 60), TZ, 'i')) % 7; // 0=Sun..6=Sat
}
export function nextDayStr(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + 1));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
}
function minsToHHMM(min: number) {
  return `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;
}
const overlaps = (aS: number, aE: number, bS: number, bE: number) => aS < bE && aE > bS;
const overlapsD = (aS: Date, aE: Date, bS: Date, bE: Date) => aS < bE && aE > bS;

// ---------- types ----------
type SvcRow = { id: number; slug: string; name: string; category: string; durationMin: number; priceCents: number | null };
type Component = SvcRow & {
  guestIndex: number;
  sequenceIndex: number;
  packageSlug: string | null;
  isDuet?: boolean; // couples-package component: counts toward cross-sell base but never discounted
  priceOverrideCents?: number; // duet split price — overrides the service's own priceCents
};
type Segment = Component & { startMin: number; endMin: number; utcStart: Date; utcEnd: Date };
type GuestInput = { services: string[] };

// ---------- context loading ----------
async function loadContext(dateStr: string) {
  const weekday = weekdayOf(dateStr);
  const dayStart = localToUtc(dateStr, 0);
  const dayEnd = localToUtc(nextDayStr(dateStr), 0);

  const [servicesRaw, staff, roomsRaw, bookings, timeOff] = await Promise.all([
    prisma.service.findMany({ where: { active: true }, select: { id: true, slug: true, name: true, category: true, durationMin: true, priceCents: true } }),
    prisma.staff.findMany({
      where: { active: true },
      select: { id: true, name: true, services: { select: { slug: true } }, workingHours: { where: { weekday }, select: { startMin: true, endMin: true } } },
    }),
    prisma.room.findMany({ where: { active: true }, select: { id: true, name: true, categories: true, capacity: true } }),
    prisma.booking.findMany({
      where: { startsAt: { lt: dayEnd }, endsAt: { gt: dayStart }, reservation: { status: { not: 'CANCELLED' } } },
      select: { staffId: true, roomId: true, startsAt: true, endsAt: true },
    }),
    prisma.timeOff.findMany({ where: { startsAt: { lt: dayEnd }, endsAt: { gt: dayStart } }, select: { staffId: true, startsAt: true, endsAt: true } }),
  ]);

  const serviceBySlug = new Map(servicesRaw.map((s) => [s.slug, s]));
  const staffList = staff.map((s) => ({
    id: s.id,
    name: s.name,
    slugs: new Set(s.services.map((x) => x.slug)),
    hours: s.workingHours,
  }));
  const rooms = roomsRaw.map((r) => ({ id: r.id, name: r.name, categories: new Set(r.categories.split(',')), capacity: r.capacity }));

  return { weekday, dayStart, dayEnd, serviceBySlug, staffList, rooms, bookings, timeOff };
}

type Ctx = Awaited<ReturnType<typeof loadContext>>;

// ---------- chain resolution ----------
// Expand each guest's selected slugs (services or packages) into ordered components.
// A `duetSlug`, when present, is a COUPLES package: its service chain is placed on
// BOTH guests in parallel with the combined price split evenly across the rows,
// then each guest's own à-la-carte add-ons follow.
function resolveChains(
  guests: GuestInput[],
  serviceBySlug: Map<string, SvcRow>,
  duetSlug?: string | null,
): { chains: Component[][]; error?: string } {
  let duetError: string | undefined;
  const duet = duetSlug ? duetBySlug(duetSlug) : null;
  if (duetSlug) {
    // A duet inherently needs exactly two guests — never trust the client on this.
    if (!duet || guests.length !== 2 || !Array.isArray(duet.serviceSlugs) || duet.serviceSlugs.length === 0) {
      return { chains: [], error: 'Invalid duet' };
    }
  }

  const chains: Component[][] = [];
  guests.forEach((g, gi) => {
    const comps: Component[] = [];
    let seq = 0;

    // Duet components first (same start for both guests), split price evenly.
    if (duet) {
      const total = duet.totalPriceCents as number;
      const perGuest = Math.floor(total / guests.length) + (gi === 0 ? total - Math.floor(total / guests.length) * guests.length : 0);
      const n = duet.serviceSlugs.length;
      const perComp = Math.floor(perGuest / n);
      const compRem = perGuest - perComp * n;
      duet.serviceSlugs.forEach((cs: string, ci: number) => {
        const csv = serviceBySlug.get(cs);
        if (!csv) { duetError = 'Invalid duet'; return; }
        comps.push({ ...csv, guestIndex: gi + 1, sequenceIndex: seq++, packageSlug: duetSlug!, isDuet: true, priceOverrideCents: perComp + (ci === 0 ? compRem : 0) });
      });
    }

    for (const slug of g.services) {
      const svc = serviceBySlug.get(slug);
      if (svc) {
        comps.push({ ...svc, guestIndex: gi + 1, sequenceIndex: seq++, packageSlug: null });
        continue;
      }
      const pkg = packageBySlug(slug);
      if (pkg && Array.isArray(pkg.serviceSlugs)) {
        // A normal package may carry a fixed totalPriceCents (bundle discount off
        // its parts), split across its components the same way a duet splits
        // across guests — remainder cent(s) to the first component.
        const total = pkg.totalPriceCents as number | undefined;
        const n = pkg.serviceSlugs.length;
        const perComp = total != null ? Math.floor(total / n) : null;
        const compRem = total != null ? total - (perComp as number) * n : 0;
        pkg.serviceSlugs.forEach((cs: string, ci: number) => {
          const csv = serviceBySlug.get(cs);
          if (!csv) return; // handled below via error
          comps.push({
            ...csv,
            guestIndex: gi + 1,
            sequenceIndex: seq++,
            packageSlug: slug,
            priceOverrideCents: total != null ? (perComp as number) + (ci === 0 ? compRem : 0) : undefined,
          });
        });
      }
    }
    chains.push(comps);
  });
  if (duetError) return { chains: [], error: duetError };
  const requested = guests.reduce((n, g) => n + g.services.length, 0);
  // A pure duet has no à-la-carte selections but is still a valid request.
  if ((!duet && requested === 0) || chains.some((c) => c.length === 0)) return { chains: [], error: 'No services selected' };
  return { chains };
}

// Lay out one guest's components on the :00/:30 grid from startMin.
function buildSegments(chain: Component[], startMin: number, dateStr: string): Segment[] {
  const segs: Segment[] = [];
  let cur = startMin;
  for (const c of chain) {
    const s = cur;
    const e = s + c.durationMin;
    segs.push({ ...c, startMin: s, endMin: e, utcStart: localToUtc(dateStr, s), utcEnd: localToUtc(dateStr, e) });
    cur = ceilToGrid(e); // next service starts at the next :00/:30 — the gap is cleaning time
  }
  return segs;
}

// ---------- resource assignment (backtracking) ----------
function staffCanWork(st: Ctx['staffList'][number], seg: Segment, ctx: Ctx): boolean {
  if (!st.slugs.has(seg.slug)) return false;
  if (!st.hours.some((w) => seg.startMin >= w.startMin && seg.endMin <= w.endMin)) return false;
  for (const t of ctx.timeOff) {
    if ((t.staffId === null || t.staffId === st.id) && overlapsD(seg.utcStart, seg.utcEnd, t.startsAt, t.endsAt)) return false;
  }
  for (const b of ctx.bookings) {
    if (b.staffId === st.id && overlapsD(seg.utcStart, seg.utcEnd, b.startsAt, b.endsAt)) return false;
  }
  return true;
}
// A room can HOST a segment if it allows the category. Whether it has a free bed
// (capacity) at that time is checked separately in solve() against existing
// bookings + the in-progress assignment.
function roomCanHost(room: Ctx['rooms'][number], seg: Segment): boolean {
  return room.categories.has(seg.category);
}
// How many beds of this room are already taken during the segment by EXISTING bookings.
function roomBusyExisting(room: Ctx['rooms'][number], seg: Segment, ctx: Ctx): number {
  let n = 0;
  for (const b of ctx.bookings) {
    if (b.roomId === room.id && overlapsD(seg.utcStart, seg.utcEnd, b.startsAt, b.endsAt)) n++;
  }
  return n;
}

type Assigned = { seg: Segment; staffId: number; roomId: number };

// Try to assign (staff, room) to every segment. Prefers keeping one therapist per
// guest (continuity); switches only when forced. Returns assignment or null.
export function solve(segments: Segment[], ctx: Ctx): Assigned[] | null {
  const ordered = [...segments].sort((a, b) => a.startMin - b.startMin || a.guestIndex - b.guestIndex);
  const assigned: Assigned[] = [];
  const guestTherapist = new Map<number, number>(); // guestIndex -> staffId used so far

  // A therapist is exclusive (one treatment at a time).
  const staffFree = (id: number, seg: Segment) =>
    !assigned.some((a) => a.staffId === id && overlaps(seg.startMin, seg.endMin, a.seg.startMin, a.seg.endMin));
  // Beds already taken in a room during this segment by the in-progress assignment.
  const roomAssignedCount = (roomId: number, seg: Segment) =>
    assigned.filter((a) => a.roomId === roomId && overlaps(seg.startMin, seg.endMin, a.seg.startMin, a.seg.endMin)).length;

  function place(i: number): boolean {
    if (i === ordered.length) return true;
    const seg = ordered[i];

    const eligibleStaff = ctx.staffList.filter((s) => staffCanWork(s, seg, ctx) && staffFree(s.id, seg));
    // Continuity: try this guest's existing therapist first.
    const preferred = guestTherapist.get(seg.guestIndex);
    eligibleStaff.sort((a, b) => (b.id === preferred ? 1 : 0) - (a.id === preferred ? 1 : 0));

    // A room is usable while its used beds (existing bookings + in-progress
    // assignment) stay below its capacity.
    const eligibleRooms = ctx.rooms.filter(
      (r) => roomCanHost(r, seg) && roomBusyExisting(r, seg, ctx) + roomAssignedCount(r.id, seg) < r.capacity,
    );

    for (const st of eligibleStaff) {
      const hadTherapist = guestTherapist.has(seg.guestIndex);
      const prev = guestTherapist.get(seg.guestIndex);
      if (!hadTherapist) guestTherapist.set(seg.guestIndex, st.id);
      for (const room of eligibleRooms) {
        assigned.push({ seg, staffId: st.id, roomId: room.id });
        if (place(i + 1)) return true;
        assigned.pop();
      }
      if (!hadTherapist) guestTherapist.delete(seg.guestIndex);
      else guestTherapist.set(seg.guestIndex, prev!);
    }
    return false;
  }

  return place(0) ? assigned : null;
}

// ---------- public API ----------

/** Feasible :00/:30 start times on `dateStr` for the whole request (1–2 guests, chained services). */
export async function availableStartTimesForRequest(dateStr: string, guests: GuestInput[], duetSlug?: string | null) {
  if (guests.length < 1 || guests.length > MAX_GUESTS) return { error: 'Invalid guest count', slots: [] as { time: string; iso: string }[] };
  // The spa isn't open before OPENING_DATE — no slots exist there.
  if (dateStr < OPENING_DATE) return { slots: [] as { time: string; iso: string }[] };
  const ctx = await loadContext(dateStr);
  const { chains, error } = resolveChains(guests, ctx.serviceBySlug, duetSlug);
  if (error) return { error, slots: [] };

  const now = new Date();
  const slots: { time: string; iso: string }[] = [];

  for (let S = 0; S + 1 <= 24 * 60; S += SLOT_GRID_MIN) {
    const allSegs: Segment[] = [];
    let fits = true;
    for (const chain of chains) {
      const segs = buildSegments(chain, S, dateStr);
      if (segs[segs.length - 1].endMin > 24 * 60) { fits = false; break; }
      allSegs.push(...segs);
    }
    if (!fits) continue;
    if (allSegs[0].utcStart < now) continue;
    if (solve(allSegs, ctx)) slots.push({ time: minsToHHMM(S), iso: localToUtc(dateStr, S).toISOString() });
  }
  return { slots };
}

/** Create the reservation transactionally; re-checks availability to avoid races. */
export async function createReservationForRequest(input: {
  guests: GuestInput[];
  start: string; // ISO
  customer: { name: string; email: string; phone: string };
  guest2?: { name?: string; email?: string; phone?: string };
  notes?: string;
  promoCode?: string;
  locale?: string;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  referrer?: string | null;
  landingPage?: string | null;
  duet?: string | null;
}) {
  const startUtc = new Date(input.start);
  if (Number.isNaN(startUtc.getTime())) return { ok: false as const, code: 'unavailable' as const };
  if (startUtc < new Date()) return { ok: false as const, code: 'past' as const };

  const dateStr = formatInTimeZone(startUtc, TZ, 'yyyy-MM-dd');
  // Server-side opening-date guard (UI enforces it too, but never trust the client).
  if (dateStr < OPENING_DATE) return { ok: false as const, code: 'unavailable' as const };
  const startMin = Number(formatInTimeZone(startUtc, TZ, 'H')) * 60 + Number(formatInTimeZone(startUtc, TZ, 'm'));

  return runSerializable(runReservationTx(input, dateStr, startMin));
}

// Runs a transactional body as SERIALIZABLE, retrying on conflict. Two requests
// (or an admin + a guest) racing the same slot can't both read it as free —
// Postgres aborts the loser and we retry a few times with jittered backoff so
// non-colliding bookings still succeed up to real capacity.
function runSerializable<T extends { ok: boolean }>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T | { ok: false; code: 'unavailable' }> {
  const attempt = () => prisma.$transaction(fn, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  const MAX_ATTEMPTS = 8;
  return (async () => {
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
      try {
        return await attempt();
      } catch (e) {
        if (!isSerializationConflict(e)) throw e;
        if (i === MAX_ATTEMPTS - 1) return { ok: false as const, code: 'unavailable' as const };
        await new Promise((r) => setTimeout(r, 20 * (i + 1) + Math.random() * 40));
      }
    }
    return { ok: false as const, code: 'unavailable' as const };
  })();
}

// A serialization_failure (40001) / deadlock (40P01) means two bookings raced —
// retryable. It surfaces differently depending on the layer: classic Prisma as
// P2034, but through the @prisma/adapter-pg driver adapter as a DriverAdapterError
// with kind 'TransactionWriteConflict' / originalCode '40001'. Match them all.
function isSerializationConflict(e: unknown): boolean {
  const err = e as { code?: string; originalCode?: string; kind?: string; meta?: { code?: string }; message?: string; originalMessage?: string };
  const codes = [err?.code, err?.originalCode, err?.meta?.code];
  if (codes.includes('P2034') || codes.includes('40001') || codes.includes('40P01')) return true;
  if (err?.kind === 'TransactionWriteConflict') return true;
  const msg = `${err?.message || ''} ${err?.originalMessage || ''}`.toLowerCase();
  return /serializ|deadlock|write ?conflict/.test(msg);
}

// The transactional body, factored out so it can be retried under Serializable.
function runReservationTx(
  input: { guests: GuestInput[]; customer: { name: string; email: string; phone: string }; guest2?: { name?: string; email?: string; phone?: string }; notes?: string; promoCode?: string; locale?: string; utmSource?: string | null; utmMedium?: string | null; utmCampaign?: string | null; referrer?: string | null; landingPage?: string | null; duet?: string | null },
  dateStr: string,
  startMin: number,
) {
  return async (tx: Prisma.TransactionClient) => {
    // Reload context inside the transaction (fresh conflicts).
    const ctx = await loadContextTx(tx, dateStr);
    const { chains, error } = resolveChains(input.guests, ctx.serviceBySlug, input.duet);
    if (error) return { ok: false as const, code: 'invalid' as const };

    const allSegs: Segment[] = [];
    for (const chain of chains) {
      const segs = buildSegments(chain, startMin, dateStr);
      if (segs[segs.length - 1].endMin > 24 * 60) return { ok: false as const, code: 'unavailable' as const };
      allSegs.push(...segs);
    }
    const assignment = solve(allSegs, ctx);
    if (!assignment) return { ok: false as const, code: 'unavailable' as const };

    // Freeze the promo percentage for THIS reservation ONCE, from the code that
    // validated now. Stored per booking (below) so each row is self-contained and
    // never depends on the mutable PROMO.pct constant afterward.
    const promoPct = validatePromo(input.promoCode); // 0 if none/invalid, else PROMO.pct
    const reservation = await tx.reservation.create({
      data: {
        status: 'PENDING',
        customerName: input.customer.name,
        customerEmail: input.customer.email,
        customerPhone: input.customer.phone,
        guestCount: input.guests.length,
        notes: input.notes || null,
        promoCode: promoPct > 0 ? PROMO.code : null, // store the canonical code as a label
        locale: input.locale === 'gr' ? 'gr' : 'en',
        // First-touch marketing attribution (already trimmed/capped by the API zod).
        utmSource: input.utmSource ?? null,
        utmMedium: input.utmMedium ?? null,
        utmCampaign: input.utmCampaign ?? null,
        referrer: input.referrer ?? null,
        landingPage: input.landingPage ?? null,
      },
    });

    // Per booking, snapshot the full price record: gross list price, the cross-sell
    // %, the frozen promo %, and the final charged amount (both discounts stacked
    // multiplicatively — see finalPriceCents / Option A). Cross-sell: 10% on the
    // 2nd+ à-la-carte service per guest. Normal package components are excluded; a
    // DUET component is a fixed package price (never discounted) but COUNTS toward
    // the guest's base so their à-la-carte add-ons still earn the cross-sell.
    const alaCarteCount = new Map<number, number>();
    for (const a of assignment) {
      const seg = a.seg;
      let crossSellPct = 0;
      if (!seg.packageSlug) {
        const n = alaCarteCount.get(seg.guestIndex) || 0;
        if (n >= 1) crossSellPct = CROSS_SELL_DISCOUNT_PCT;
        alaCarteCount.set(seg.guestIndex, n + 1);
      } else if (seg.isDuet) {
        alaCarteCount.set(seg.guestIndex, (alaCarteCount.get(seg.guestIndex) || 0) + 1);
      }
      const gross = seg.priceOverrideCents ?? seg.priceCents; // duet split overrides the service price
      await tx.booking.create({
        data: {
          reservationId: reservation.id,
          serviceId: seg.id,
          staffId: a.staffId,
          roomId: a.roomId,
          guestIndex: seg.guestIndex,
          guestName: seg.guestIndex === 2 ? input.guest2?.name || null : null,
          sequenceIndex: seg.sequenceIndex,
          startsAt: seg.utcStart,
          endsAt: seg.utcEnd,
          priceCents: gross, // gross snapshot (duet: the split share)
          packageSlug: seg.packageSlug ?? null,
          crossSellPct,
          promoPct,
          // computed ONCE here and stored; null-safe when priceCents is null
          finalPriceCents: finalPriceCents(gross, crossSellPct, promoPct),
        },
      });
    }
    return { ok: true as const, reservationId: reservation.id };
  };
}

// transaction-scoped context loader (mirrors loadContext using the tx client)
async function loadContextTx(tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0], dateStr: string): Promise<Ctx> {
  const weekday = weekdayOf(dateStr);
  const dayStart = localToUtc(dateStr, 0);
  const dayEnd = localToUtc(nextDayStr(dateStr), 0);
  const [servicesRaw, staff, roomsRaw, bookings, timeOff] = await Promise.all([
    tx.service.findMany({ where: { active: true }, select: { id: true, slug: true, name: true, category: true, durationMin: true, priceCents: true } }),
    tx.staff.findMany({ where: { active: true }, select: { id: true, name: true, services: { select: { slug: true } }, workingHours: { where: { weekday }, select: { startMin: true, endMin: true } } } }),
    tx.room.findMany({ where: { active: true }, select: { id: true, name: true, categories: true, capacity: true } }),
    tx.booking.findMany({ where: { startsAt: { lt: dayEnd }, endsAt: { gt: dayStart }, reservation: { status: { not: 'CANCELLED' } } }, select: { staffId: true, roomId: true, startsAt: true, endsAt: true } }),
    tx.timeOff.findMany({ where: { startsAt: { lt: dayEnd }, endsAt: { gt: dayStart } }, select: { staffId: true, startsAt: true, endsAt: true } }),
  ]);
  return {
    weekday, dayStart, dayEnd,
    serviceBySlug: new Map(servicesRaw.map((s) => [s.slug, s])),
    staffList: staff.map((s) => ({ id: s.id, name: s.name, slugs: new Set(s.services.map((x) => x.slug)), hours: s.workingHours })),
    rooms: roomsRaw.map((r) => ({ id: r.id, name: r.name, categories: new Set(r.categories.split(',')), capacity: r.capacity })),
    bookings, timeOff,
  };
}

// ---------- admin manual (phone-in) booking ----------

/** Feasible :00/:30 start times for ONE staff member + ONE service on a day —
 * used by the admin "quick booking" form. Pinned to a single therapist, so no
 * backtracking is needed: just check that therapist + a hosting room are free. */
export async function availableStartTimesForStaff(dateStr: string, staffId: number, serviceSlug: string) {
  if (dateStr < OPENING_DATE) return { slots: [] as { time: string; iso: string }[] };
  const ctx = await loadContext(dateStr);
  const svc = ctx.serviceBySlug.get(serviceSlug);
  if (!svc) return { error: 'Invalid service', slots: [] as { time: string; iso: string }[] };
  const staff = ctx.staffList.find((s) => s.id === staffId);
  if (!staff) return { error: 'Invalid staff', slots: [] as { time: string; iso: string }[] };

  const now = new Date();
  const slots: { time: string; iso: string }[] = [];
  for (let S = 0; S + svc.durationMin <= 24 * 60; S += SLOT_GRID_MIN) {
    const endMin = S + svc.durationMin;
    const seg: Segment = { ...svc, guestIndex: 1, sequenceIndex: 0, packageSlug: null, startMin: S, endMin, utcStart: localToUtc(dateStr, S), utcEnd: localToUtc(dateStr, endMin) };
    if (seg.utcStart < now) continue;
    if (!staffCanWork(staff, seg, ctx)) continue;
    if (!ctx.rooms.some((r) => roomCanHost(r, seg) && roomBusyExisting(r, seg, ctx) < r.capacity)) continue;
    slots.push({ time: minsToHHMM(S), iso: seg.utcStart.toISOString() });
  }
  return { slots };
}

/** Create a single-guest, single-service reservation for a specific therapist —
 * the admin "quick booking" form for phone-in reservations. Reuses the same
 * staffCanWork/roomCanHost checks (and SERIALIZABLE retry) as the public
 * solver, so this booking blocks that therapist's time everywhere else too. */
export async function createManualBooking(input: {
  staffId: number;
  service: string; // slug
  start: string; // ISO
  customer: { name: string; phone?: string; email?: string };
  locale?: string;
  notes?: string;
}) {
  const startUtc = new Date(input.start);
  if (Number.isNaN(startUtc.getTime())) return { ok: false as const, code: 'unavailable' as const };
  if (startUtc < new Date()) return { ok: false as const, code: 'past' as const };

  const dateStr = formatInTimeZone(startUtc, TZ, 'yyyy-MM-dd');
  if (dateStr < OPENING_DATE) return { ok: false as const, code: 'unavailable' as const };
  const startMin = Number(formatInTimeZone(startUtc, TZ, 'H')) * 60 + Number(formatInTimeZone(startUtc, TZ, 'm'));

  return runSerializable(runManualBookingTx(input, dateStr, startMin));
}

function runManualBookingTx(
  input: { staffId: number; service: string; customer: { name: string; phone?: string; email?: string }; locale?: string; notes?: string },
  dateStr: string,
  startMin: number,
) {
  return async (tx: Prisma.TransactionClient) => {
    const ctx = await loadContextTx(tx, dateStr);
    const svc = ctx.serviceBySlug.get(input.service);
    if (!svc) return { ok: false as const, code: 'invalid' as const };
    const staff = ctx.staffList.find((s) => s.id === input.staffId);
    if (!staff) return { ok: false as const, code: 'invalid' as const };

    const endMin = startMin + svc.durationMin;
    if (endMin > 24 * 60) return { ok: false as const, code: 'unavailable' as const };
    const seg: Segment = { ...svc, guestIndex: 1, sequenceIndex: 0, packageSlug: null, startMin, endMin, utcStart: localToUtc(dateStr, startMin), utcEnd: localToUtc(dateStr, endMin) };

    if (!staffCanWork(staff, seg, ctx)) return { ok: false as const, code: 'unavailable' as const };
    const room = ctx.rooms.find((r) => roomCanHost(r, seg) && roomBusyExisting(r, seg, ctx) < r.capacity);
    if (!room) return { ok: false as const, code: 'unavailable' as const };

    // No real email from a phone customer is common — a fake-domain placeholder
    // keeps every downstream path that expects Reservation.customerEmail (schema,
    // reminder/cancel emails, which fail silently via .catch) working untouched.
    const phoneDigits = (input.customer.phone || '').replace(/[^0-9]/g, '');
    const email = input.customer.email?.trim() || `phone-${phoneDigits || 'guest'}@nommar.local`;

    const reservation = await tx.reservation.create({
      data: {
        status: 'CONFIRMED', // already accepted by phone — skip the PENDING step
        customerName: input.customer.name,
        customerEmail: email,
        customerPhone: input.customer.phone || '',
        guestCount: 1,
        notes: input.notes || null,
        locale: input.locale === 'gr' ? 'gr' : 'en',
        utmSource: 'phone',
        utmMedium: 'admin-manual',
      },
    });
    await tx.booking.create({
      data: {
        reservationId: reservation.id,
        serviceId: svc.id,
        staffId: staff.id,
        roomId: room.id,
        startsAt: seg.utcStart,
        endsAt: seg.utcEnd,
        priceCents: svc.priceCents,
        finalPriceCents: svc.priceCents,
      },
    });
    return { ok: true as const, reservationId: reservation.id };
  };
}
