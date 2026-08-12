# Reviews setup

The `/admin/reviews` feature (Google review sync, AI-drafted replies, approve/edit/post) needs two sets of credentials before it's live. Until they're filled in, the app degrades gracefully — no reviews sync, no drafts get generated — rather than erroring, so the rest of the site is unaffected.

## 1. Anthropic API key (AI-drafted replies)

1. Go to [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys) and sign in (create an account if you don't have one).
2. Create a new API key.
3. Set it as `ANTHROPIC_API_KEY` in your environment (`.env` locally, Vercel project env vars in production).

That's it — no other setup needed. With no key set, `lib/generate-reply.ts` logs a note and leaves `aiDraftReply` empty; you can still write replies by hand in `/admin/reviews`.

## 2. Google Business Profile API credentials

This is the more involved one — Google gates the review-reply API behind OAuth2 and a manual API-access request. Budget 15-30 minutes, and note that Google's own approval step (below) can take a few days.

1. **Create/select a Google Cloud project** at [console.cloud.google.com](https://console.cloud.google.com).
2. **Enable the API.** In "APIs & Services" → "Library", enable the **Google My Business API** (the reviews endpoints this integration uses live here — not the newer Business Profile Performance/Information APIs, which don't cover reviews).
3. **Request API access**, if prompted. Google restricts this API to approved businesses/developers — there's a request form linked from the API page in Cloud Console. This step is manual on Google's side and isn't something either of us can skip.
4. **Create OAuth2 credentials.** In "APIs & Services" → "Credentials" → "Create Credentials" → "OAuth client ID" → type "Web application". Add an authorized redirect URI (can be `http://localhost` for a one-time manual token exchange, or a real callback route if you build one later).
   - Copy the **Client ID** → `GOOGLE_CLIENT_ID`
   - Copy the **Client Secret** → `GOOGLE_CLIENT_SECRET`
5. **Get a refresh token.** This is the one genuinely fiddly step — you need to complete the OAuth consent flow once, as the Google account that manages the Nommar Business Profile, with scope `https://www.googleapis.com/auth/business.manage`. The simplest path is [Google's OAuth 2.0 Playground](https://developers.google.com/oauthplayground):
   - Gear icon → check "Use your own OAuth credentials" → paste your Client ID/Secret.
   - Step 1: enter `https://www.googleapis.com/auth/business.manage` as the scope, authorize, sign in as the account that owns the listing.
   - Step 2: click "Exchange authorization code for tokens".
   - Copy the resulting **Refresh token** → `GOOGLE_REFRESH_TOKEN`.
6. **Find your account and location IDs.** With a valid access token (the Playground gives you one in the same step above), call:
   ```
   GET https://mybusinessaccountmanagement.googleapis.com/v1/accounts
   ```
   Take the numeric ID from the returned `name` field (`accounts/1234567890`) → `GOOGLE_BUSINESS_ACCOUNT_ID`. Then:
   ```
   GET https://mybusinessbusinessinformation.googleapis.com/v1/accounts/{GOOGLE_BUSINESS_ACCOUNT_ID}/locations
   ```
   Take the numeric ID from the Nommar location's `name` field (`locations/9876543210`) → `GOOGLE_BUSINESS_LOCATION_ID`.
7. Set all five values (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GOOGLE_BUSINESS_ACCOUNT_ID`, `GOOGLE_BUSINESS_LOCATION_ID`) in your environment.

**A heads-up on the API itself:** Google has reshuffled its Business Profile APIs more than once, and the reviews endpoints (`mybusiness.googleapis.com/v4/...`) used in `lib/google-reviews.ts` are on the older "Google My Business API v4" surface, which is where review list/reply still lives as of this writing. If Google has since migrated or deprecated it, `fetchReviews()`/`postReply()` in `lib/google-reviews.ts` are the two functions to update — the rest of the app (sync cron, admin UI, AI drafting) doesn't need to change.

## 3. Auto-post rule (optional, off by default)

`REVIEWS_AUTO_POST_ENABLED` controls whether eligible reviews post automatically without an admin clicking a button. It defaults to `false` — every review requires manual approval in `/admin/reviews` until you explicitly set it to `"true"`.

When enabled, a review auto-posts its AI draft if **all** of these hold:
- Rating is 4 or 5 stars.
- The review text doesn't match any of the negative-sentiment keywords in `lib/reviews.ts` (a bilingual EN/GR keyword list, not full sentiment analysis — deliberately conservative, since a false "not negative" auto-posts unattended).
- It's been sitting untouched (still `pending`) for at least 24 hours.
- No admin has already acted on it.

**Reviews rated 3 stars or below never auto-post, no matter what** — that rule is enforced directly in `lib/reviews.ts`'s `isAutoPostEligible()`, not just by the query in the cron job, so it holds even if the sweep logic changes later.

The sweep runs as part of `/api/cron/reviews-sync` (registered in `vercel.json`, every 2 hours) — it doesn't have its own separate cron entry, since it's cheap and operates on the same table as the review sync itself.
