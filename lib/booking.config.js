// Central booking configuration — all the "magic numbers" live here.

export const SLOT_GRID_MIN = 30; // services may start only on :00 / :30
export const MAX_GUESTS = 2; // spa capacity (2 therapists + 2 rooms)
export const CROSS_SELL_DISCOUNT_PCT = 10; // % off the 2nd+ service per guest

// The spa opens on this date (Athens time) — no bookings may start before it.
// Enforced server-side (availability + create) and as the UI date-picker minimum.
export const OPENING_DATE = '2026-07-29';

// Sale promo: a marketing code the customer enters at checkout. Advertised by the
// site-wide AnnouncementBanner (which also hides itself until OPENING_DATE).
// Set active:false to retire it.
export const PROMO = { code: 'NOMMAR10', pct: 10, active: true };

// Returns the promo discount % if the code is valid + active, else 0.
export function validatePromo(code) {
  if (!PROMO.active || typeof code !== 'string') return 0;
  return code.trim().toUpperCase() === PROMO.code ? PROMO.pct : 0;
}

// Final price after stacking the cross-sell and promo discounts MULTIPLICATIVELY
// (decision: Option A — both may apply; e.g. 0.9 × 0.9 → 19% off). cents may be null.
export function finalPriceCents(cents, crossSellPct = 0, promoPct = 0) {
  if (cents == null) return null;
  return Math.round(cents * (1 - crossSellPct / 100) * (1 - promoPct / 100));
}

// Service categories (must match Service.category values seeded from data.js).
export const CATEGORIES = {
  HEAD_SPA: 'Head Spa',
  MASSAGE: 'Massage',
  BODY: 'Body Treatments',
  FACIAL: 'Facial Treatments',
};

// All bookable service categories (room eligibility is derived from these).
export const CATEGORY_LIST = [CATEGORIES.HEAD_SPA, CATEGORIES.MASSAGE, CATEGORIES.BODY, CATEGORIES.FACIAL];

// The two treatment rooms, each with 2 beds (capacity = concurrent treatments).
// Head Spa → Suite One only (but on both its beds); Massage/Facial/Body → both rooms.
export const ROOMS = [
  { name: 'Suite One', capacity: 2, categories: [CATEGORIES.HEAD_SPA, CATEGORIES.MASSAGE, CATEGORIES.FACIAL, CATEGORIES.BODY] },
  { name: 'Suite Two', capacity: 2, categories: [CATEGORIES.MASSAGE, CATEGORIES.FACIAL, CATEGORIES.BODY] },
];

// Short complementary treatments suggested as "Complete your ritual" add-ons.
export const CROSS_SELL_SLUGS = ['nommar-quick-escape', 'nommar-back-relief', 'nommar-body-ritual'];

// Round a minute-of-day up to the next :00 / :30 grid mark.
export const ceilToGrid = (min) => Math.ceil(min / SLOT_GRID_MIN) * SLOT_GRID_MIN;

// Span of ONE guest's consecutive services, first start → last end, including
// the :00/:30 alignment gaps between services (mirrors buildSegments' math in
// lib/availability.ts — keep the two in sync).
export function chainSpanMin(durations) {
  let cur = 0;
  let end = 0;
  for (const d of durations) {
    end = cur + d;
    cur = ceilToGrid(end);
  }
  return end;
}

// Total VISIT duration for the whole party: guests are treated in PARALLEL
// (own therapist each, same start slot), so the longest chain wins — never the sum.
export function visitDurationMin(perGuestDurations) {
  if (!perGuestDurations.length) return 0;
  return Math.max(...perGuestDurations.map(chainSpanMin));
}
