// Shared review-workflow helpers. Unlike lib/reservationStatus.ts, this
// doesn't need a full transition state machine — every Review status change
// is driven directly by one specific code path (app/api/cron/reviews-sync,
// app/api/admin/reviews/[id]/post, or the auto-post sweep in the same cron
// route), not by a rich set of admin actions that need validating against
// each other.

export const REVIEW_STATUSES = ['pending', 'approved', 'posted', 'auto_posted', 'edited'] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

// Simple bilingual (EN/GR) negative-sentiment heuristic for the auto-post
// rule. Keyword matching over full sentiment analysis is a deliberate
// trade-off — cheap, no external dependency, and errs toward "assume
// negative" (require a human) on anything ambiguous, which is the safe
// direction for something that posts public replies unattended.
const NEGATIVE_KEYWORDS = [
  // English
  'refund', 'terrible', 'worst', 'awful', 'disappointed', 'disappointing', 'rude',
  'dirty', 'unhygienic', 'unprofessional', 'never again', 'waste of money',
  'overpriced', 'scam', 'unacceptable', 'complain', 'complaint', 'poor service',
  'not recommend', "wouldn't recommend", 'horrible', 'disgusting',
  // Greek
  'απαράδεκτο', 'χάλια', 'απαισιόδοτο', 'αναξιόπιστο', 'αγενές', 'αγενής',
  'βρόμικο', 'ανεπάγγελτο', 'ποτέ ξανά', 'χρήματα πεταμένα', 'ακριβό',
  'απάτη', 'παράπονο', 'κακή εξυπηρέτηση', 'δεν το συνιστώ', 'απαράδεκτη',
];

export function hasNegativeSentiment(reviewText: string): boolean {
  const lower = reviewText.toLowerCase();
  return NEGATIVE_KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
}

// The hard rule: ratings of 3 or below NEVER auto-post, regardless of the
// auto-post setting or sentiment check — always require a human to approve.
export function isAutoPostEligible(review: { rating: number; reviewText: string }): boolean {
  if (review.rating <= 3) return false;
  return !hasNegativeSentiment(review.reviewText);
}
