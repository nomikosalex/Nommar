// Central booking configuration — all the "magic numbers" live here.

export const SLOT_GRID_MIN = 30; // services may start only on :00 / :30
export const MAX_GUESTS = 2; // spa capacity (2 therapists + 2 rooms)
export const CROSS_SELL_DISCOUNT_PCT = 10; // % off the 2nd+ service per guest

// Service categories (must match Service.category values seeded from data.js).
export const CATEGORIES = {
  HEAD_SPA: 'Head Spa',
  MASSAGE: 'Massage',
  BODY: 'Body Treatments',
  FACIAL: 'Facial Treatments',
};

// All bookable service categories (room eligibility is derived from these).
export const CATEGORY_LIST = [CATEGORIES.HEAD_SPA, CATEGORIES.MASSAGE, CATEGORIES.BODY, CATEGORIES.FACIAL];

// The two treatment rooms and which service categories each can host.
// Head Spa → Suite One only; Massage → Suite Two only; Facial/Body → both.
export const ROOMS = [
  { name: 'Suite One', categories: [CATEGORIES.HEAD_SPA, CATEGORIES.FACIAL, CATEGORIES.BODY] },
  { name: 'Suite Two', categories: [CATEGORIES.MASSAGE, CATEGORIES.FACIAL, CATEGORIES.BODY] },
];

// Short complementary treatments suggested as "Complete your ritual" add-ons.
export const CROSS_SELL_SLUGS = ['nommar-quick-escape', 'nommar-back-relief', 'nommar-body-ritual'];

// Round a minute-of-day up to the next :00 / :30 grid mark.
export const ceilToGrid = (min) => Math.ceil(min / SLOT_GRID_MIN) * SLOT_GRID_MIN;
