// Google Business Profile API wrapper — OAuth2 refresh-token flow + review
// fetch/reply. See REVIEWS-SETUP.md for exactly how to obtain each env var
// below (Google Cloud Console steps) — that part can't be automated from here.
//
// Follows the same graceful-degradation pattern as lib/email.ts: with no
// credentials configured, calls log to console and no-op instead of
// throwing, so `npm run dev` / the sync cron keep working before the real
// Google credentials are wired in.

type GoogleReview = {
  googleReviewId: string;
  authorName: string;
  rating: number; // 1-5
  reviewText: string;
  reviewDate: string; // ISO
};

function credentialsConfigured(): boolean {
  return !!(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REFRESH_TOKEN &&
    process.env.GOOGLE_BUSINESS_ACCOUNT_ID &&
    process.env.GOOGLE_BUSINESS_LOCATION_ID
  );
}

// Exchanges the long-lived refresh token for a short-lived access token.
// Every call re-refreshes rather than caching — sync/post run at most a few
// times an hour, well under Google's token-refresh rate limits.
async function getAccessToken(): Promise<string> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN!,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) throw new Error(`Google OAuth token refresh failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.access_token as string;
}

const RATING_MAP: Record<string, number> = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 };

/** Fetch all reviews for the configured location from the Business Profile API. */
export async function fetchReviews(): Promise<GoogleReview[]> {
  if (!credentialsConfigured()) {
    console.log('[google-reviews:dev] Google credentials not configured — skipping sync. See REVIEWS-SETUP.md.');
    return [];
  }

  const accessToken = await getAccessToken();
  const accountId = process.env.GOOGLE_BUSINESS_ACCOUNT_ID;
  const locationId = process.env.GOOGLE_BUSINESS_LOCATION_ID;

  // Google My Business API v4 — this is where the reviews resource lives
  // (list + reply), distinct from the newer Business Information/Performance
  // APIs, which don't cover reviews. Google has reshuffled the Business
  // Profile API surface more than once — verify this path against current
  // Google docs before going live.
  const url = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
  if (!res.ok) throw new Error(`Google reviews fetch failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const reviews = (data.reviews || []) as Array<{
    reviewId: string;
    reviewer?: { displayName?: string };
    starRating: string;
    comment?: string;
    createTime: string;
  }>;

  return reviews.map((r) => ({
    googleReviewId: r.reviewId,
    authorName: r.reviewer?.displayName || 'Google user',
    rating: RATING_MAP[r.starRating] ?? 0,
    reviewText: r.comment || '',
    reviewDate: r.createTime,
  }));
}

/** Post (or replace) the owner reply on a specific review. */
export async function postReply(googleReviewId: string, comment: string): Promise<void> {
  if (!credentialsConfigured()) {
    console.log(`[google-reviews:dev] Would post reply to ${googleReviewId}: ${comment.slice(0, 80)}${comment.length > 80 ? '…' : ''}`);
    return;
  }

  const accessToken = await getAccessToken();
  const accountId = process.env.GOOGLE_BUSINESS_ACCOUNT_ID;
  const locationId = process.env.GOOGLE_BUSINESS_LOCATION_ID;

  const url = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/reviews/${googleReviewId}/reply`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ comment }),
  });
  if (!res.ok) throw new Error(`Google reply post failed: ${res.status} ${await res.text()}`);
}
