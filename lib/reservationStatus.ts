// Single source of truth for the reservation lifecycle state machine.
// Used server-side (admin PATCH validation, guest cancel guard) and client-side
// (admin button gating). Status is a plain String column — no DB enum — so these
// values are enforced purely here.

export const RESERVATION_STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

// Allowed target statuses from each state. Terminal states have none.
//   PENDING   → CONFIRMED | CANCELLED
//   CONFIRMED → COMPLETED | NO_SHOW | CANCELLED
//   CANCELLED / COMPLETED / NO_SHOW → terminal
export const STATUS_TRANSITIONS: Record<ReservationStatus, ReservationStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['COMPLETED', 'NO_SHOW', 'CANCELLED'],
  CANCELLED: [],
  COMPLETED: [],
  NO_SHOW: [],
};

// Statuses that can never transition out (set-once outcomes).
export const isTerminal = (s: string): boolean =>
  s === 'CANCELLED' || s === 'COMPLETED' || s === 'NO_SHOW';

// Outcomes that may only be set once the visit is actually over.
export const REQUIRES_PAST_VISIT: ReservationStatus[] = ['COMPLETED', 'NO_SHOW'];

export const isValidStatus = (s: unknown): s is ReservationStatus =>
  typeof s === 'string' && (RESERVATION_STATUSES as readonly string[]).includes(s);

// Is `to` a legal next state from `from`? (self-transitions are handled by the
// caller as idempotent no-ops, not via this map.)
export function canTransition(from: string, to: string): boolean {
  const allowed = STATUS_TRANSITIONS[from as ReservationStatus];
  return Array.isArray(allowed) && allowed.includes(to as ReservationStatus);
}

// The whole visit is over iff every appointment has ended.
export function visitIsOver(bookings: { endsAt: Date }[], now: Date = new Date()): boolean {
  return bookings.length > 0 && bookings.every((b) => new Date(b.endsAt) < now);
}
