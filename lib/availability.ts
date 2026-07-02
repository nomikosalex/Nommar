import { fromZonedTime, formatInTimeZone } from 'date-fns-tz';
import { prisma } from './prisma';
import { packageBySlug } from './data';
import { SLOT_GRID_MIN, MAX_GUESTS, CROSS_SELL_DISCOUNT_PCT, ceilToGrid } from './booking.config';

export const TZ = process.env.NEXT_PUBLIC_TZ || 'Europe/Athens';

// ---------- timezone helpers ----------
function localToUtc(dateStr: string, minutes: number): Date {
  const hh = String(Math.floor(minutes / 60)).padStart(2, '0');
  const mm = String(minutes % 60).padStart(2, '0');
  return fromZonedTime(`${dateStr}T${hh}:${mm}:00`, TZ);
}
function weekdayOf(dateStr: string): number {
  return Number(formatInTimeZone(localToUtc(dateStr, 12 * 60), TZ, 'i')) % 7; // 0=Sun..6=Sat
}
function nextDayStr(dateStr: string): string {
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
type Component = SvcRow & { guestIndex: number; sequenceIndex: number; packageSlug: string | null };
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
    prisma.room.findMany({ where: { active: true }, select: { id: true, name: true, categories: true } }),
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
  const rooms = roomsRaw.map((r) => ({ id: r.id, name: r.name, categories: new Set(r.categories.split(',')) }));

  return { weekday, dayStart, dayEnd, serviceBySlug, staffList, rooms, bookings, timeOff };
}

type Ctx = Awaited<ReturnType<typeof loadContext>>;

// ---------- chain resolution ----------
// Expand each guest's selected slugs (services or packages) into ordered components.
function resolveChains(guests: GuestInput[], serviceBySlug: Map<string, SvcRow>): { chains: Component[][]; error?: string } {
  const chains: Component[][] = [];
  guests.forEach((g, gi) => {
    const comps: Component[] = [];
    let seq = 0;
    for (const slug of g.services) {
      const svc = serviceBySlug.get(slug);
      if (svc) {
        comps.push({ ...svc, guestIndex: gi + 1, sequenceIndex: seq++, packageSlug: null });
        continue;
      }
      const pkg = packageBySlug(slug);
      if (pkg && Array.isArray(pkg.serviceSlugs)) {
        for (const cs of pkg.serviceSlugs) {
          const csv = serviceBySlug.get(cs);
          if (!csv) return; // handled below via error
          comps.push({ ...csv, guestIndex: gi + 1, sequenceIndex: seq++, packageSlug: slug });
        }
      }
    }
    chains.push(comps);
  });
  const requested = guests.reduce((n, g) => n + g.services.length, 0);
  if (requested === 0 || chains.some((c) => c.length === 0)) return { chains: [], error: 'No services selected' };
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
function roomCanHost(room: Ctx['rooms'][number], seg: Segment, ctx: Ctx): boolean {
  if (!room.categories.has(seg.category)) return false;
  for (const b of ctx.bookings) {
    if (b.roomId === room.id && overlapsD(seg.utcStart, seg.utcEnd, b.startsAt, b.endsAt)) return false;
  }
  return true;
}

type Assigned = { seg: Segment; staffId: number; roomId: number };

// Try to assign (staff, room) to every segment. Prefers keeping one therapist per
// guest (continuity); switches only when forced. Returns assignment or null.
function solve(segments: Segment[], ctx: Ctx): Assigned[] | null {
  const ordered = [...segments].sort((a, b) => a.startMin - b.startMin || a.guestIndex - b.guestIndex);
  const assigned: Assigned[] = [];
  const guestTherapist = new Map<number, number>(); // guestIndex -> staffId used so far

  const free = (id: number, key: 'staffId' | 'roomId', seg: Segment) =>
    !assigned.some((a) => a[key] === id && overlaps(seg.startMin, seg.endMin, a.seg.startMin, a.seg.endMin));

  function place(i: number): boolean {
    if (i === ordered.length) return true;
    const seg = ordered[i];

    const eligibleStaff = ctx.staffList.filter((s) => staffCanWork(s, seg, ctx) && free(s.id, 'staffId', seg));
    // Continuity: try this guest's existing therapist first.
    const preferred = guestTherapist.get(seg.guestIndex);
    eligibleStaff.sort((a, b) => (b.id === preferred ? 1 : 0) - (a.id === preferred ? 1 : 0));

    const eligibleRooms = ctx.rooms.filter((r) => roomCanHost(r, seg, ctx) && free(r.id, 'roomId', seg));

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
export async function availableStartTimesForRequest(dateStr: string, guests: GuestInput[]) {
  if (guests.length < 1 || guests.length > MAX_GUESTS) return { error: 'Invalid guest count', slots: [] as { time: string; iso: string }[] };
  const ctx = await loadContext(dateStr);
  const { chains, error } = resolveChains(guests, ctx.serviceBySlug);
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
}) {
  const startUtc = new Date(input.start);
  if (Number.isNaN(startUtc.getTime())) return { ok: false as const, code: 'unavailable' as const };
  if (startUtc < new Date()) return { ok: false as const, code: 'past' as const };

  const dateStr = formatInTimeZone(startUtc, TZ, 'yyyy-MM-dd');
  const startMin = Number(formatInTimeZone(startUtc, TZ, 'H')) * 60 + Number(formatInTimeZone(startUtc, TZ, 'm'));

  return prisma.$transaction(async (tx) => {
    // Reload context inside the transaction (fresh conflicts).
    const ctx = await loadContextTx(tx, dateStr);
    const { chains, error } = resolveChains(input.guests, ctx.serviceBySlug);
    if (error) return { ok: false as const, code: 'invalid' as const };

    const allSegs: Segment[] = [];
    for (const chain of chains) {
      const segs = buildSegments(chain, startMin, dateStr);
      if (segs[segs.length - 1].endMin > 24 * 60) return { ok: false as const, code: 'unavailable' as const };
      allSegs.push(...segs);
    }
    const assignment = solve(allSegs, ctx);
    if (!assignment) return { ok: false as const, code: 'unavailable' as const };

    const reservation = await tx.reservation.create({
      data: { status: 'PENDING', customerName: input.customer.name, customerEmail: input.customer.email, customerPhone: input.customer.phone, guestCount: input.guests.length, notes: input.notes || null },
    });

    // discount: 10% on the 2nd+ à-la-carte service per guest (package components excluded)
    const alaCarteCount = new Map<number, number>();
    for (const a of assignment) {
      const seg = a.seg;
      let discountPct = 0;
      if (!seg.packageSlug) {
        const n = alaCarteCount.get(seg.guestIndex) || 0;
        if (n >= 1) discountPct = CROSS_SELL_DISCOUNT_PCT;
        alaCarteCount.set(seg.guestIndex, n + 1);
      }
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
          priceCents: seg.priceCents,
          discountPct,
        },
      });
    }
    return { ok: true as const, reservationId: reservation.id };
  });
}

// transaction-scoped context loader (mirrors loadContext using the tx client)
async function loadContextTx(tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0], dateStr: string): Promise<Ctx> {
  const weekday = weekdayOf(dateStr);
  const dayStart = localToUtc(dateStr, 0);
  const dayEnd = localToUtc(nextDayStr(dateStr), 0);
  const [servicesRaw, staff, roomsRaw, bookings, timeOff] = await Promise.all([
    tx.service.findMany({ where: { active: true }, select: { id: true, slug: true, name: true, category: true, durationMin: true, priceCents: true } }),
    tx.staff.findMany({ where: { active: true }, select: { id: true, name: true, services: { select: { slug: true } }, workingHours: { where: { weekday }, select: { startMin: true, endMin: true } } } }),
    tx.room.findMany({ where: { active: true }, select: { id: true, name: true, categories: true } }),
    tx.booking.findMany({ where: { startsAt: { lt: dayEnd }, endsAt: { gt: dayStart }, reservation: { status: { not: 'CANCELLED' } } }, select: { staffId: true, roomId: true, startsAt: true, endsAt: true } }),
    tx.timeOff.findMany({ where: { startsAt: { lt: dayEnd }, endsAt: { gt: dayStart } }, select: { staffId: true, startsAt: true, endsAt: true } }),
  ]);
  return {
    weekday, dayStart, dayEnd,
    serviceBySlug: new Map(servicesRaw.map((s) => [s.slug, s])),
    staffList: staff.map((s) => ({ id: s.id, name: s.name, slugs: new Set(s.services.map((x) => x.slug)), hours: s.workingHours })),
    rooms: roomsRaw.map((r) => ({ id: r.id, name: r.name, categories: new Set(r.categories.split(',')) })),
    bookings, timeOff,
  };
}
