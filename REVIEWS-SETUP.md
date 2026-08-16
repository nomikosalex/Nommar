# Reviews setup

The `/admin/reviews` feature (Google review sync, AI-drafted replies, approve/edit/post) needs two sets of credentials before it's live. Until they're filled in, the app degrades gracefully — no reviews sync, no drafts get generated — rather than erroring, so the rest of the site is unaffected.

## 1. Anthropic API key (AI-drafted replies)

1. Go to [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys) and sign in (create an account if you don't have one).
2. Create a new API key.
3. Set it as `ANTHROPIC_API_KEY` in your environment (`.env` locally, Vercel project env vars in production).

That's it — no other setup needed. With no key set, `lib/generate-reply.ts` logs a note and leaves `aiDraftReply` empty; you can still write replies by hand in `/admin/reviews`.

## 2. Google Business Profile API credentials

**Confirmed against Google's current documentation (checked 2026-08-13).** Short answers to the questions this raised:

- Reviews are still **not** covered by any of the newer split Business Profile APIs (Account Management, Business Information, Notifications, Performance, Q&A, etc.). Google's own docs say plainly: *"For all other functionality related to Business Profile, use the Google My Business API"* — reviews (list + reply) fall under that umbrella.
- It's **not** the Merchant API's Reviews sub-API either — that one manages *product/Shopping reviews* for sellers advertising on Google Shopping (seller ratings, product review feeds). It has nothing to do with the star reviews customers leave on a Business Profile / Google Maps listing. Ruled out.
- So it's still the **Google My Business API**, and the endpoints already in `lib/google-reviews.ts` are correct as-is — `GET .../v4/accounts/{account}/locations/{location}/reviews` to list, `PUT .../v4/accounts/{account}/locations/{location}/reviews/{review}/reply` to reply. No code changes were needed, only this setup doc.

**Why it didn't show up when searching the API Library — this is what actually happened:** per Google's own setup docs, *"The Google My Business API is only visible in the Google API Console to users who submit and receive approval for their Google Account through the access request form."* It's not deprecated or hidden by mistake — it's invisible in Library search until your account/project is approved. That's why step 1 below now comes **before** "enable the API," not after (the original version of this doc had that backwards, which is exactly what led to the confusion).

1. **Request API access first**, before touching Cloud Console. Fill out [Google's access request form](https://developers.google.com/my-business/content/prereqs) using the Google account that manages the Nommar Business Profile. This is Google's own manual approval step and can take a few days — do it first so the rest doesn't stall.
2. **Create/select a Google Cloud project** at [console.cloud.google.com](https://console.cloud.google.com), once approved.
3. **Enable the API.** In "APIs & Services" → "Library", search for **"Google My Business API"** — now that your account is approved, it should be visible and searchable. Enable it (along with My Business Account Management API and My Business Business Information API, needed for step 6 below).
4. **Create OAuth2 credentials.** In "APIs & Services" → "Credentials" → "Create Credentials" → "OAuth client ID" → type "Web application". Add an authorized redirect URI (can be `http://localhost` for a one-time manual token exchange, or a real callback route if you build one later).
   - Copy the **Client ID** → `GOOGLE_CLIENT_ID`
   - Copy the **Client Secret** → `GOOGLE_CLIENT_SECRET`
5. **Get a refresh token.** This is the one genuinely fiddly step — you need to complete the OAuth consent flow once, as the Google account that manages the Nommar Business Profile, with scope `https://www.googleapis.com/auth/business.manage` (confirmed current and correct). The simplest path is [Google's OAuth 2.0 Playground](https://developers.google.com/oauthplayground):
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

Google has genuinely reshuffled the Business Profile API surface more than once, and could again — if `fetchReviews()`/`postReply()` in `lib/google-reviews.ts` ever start failing with 404s, that's the pair of functions to check against Google's docs at that point; the rest of the app (sync cron, admin UI, AI drafting) wouldn't need to change.

## 3. Auto-post rule (optional, off by default)

`REVIEWS_AUTO_POST_ENABLED` controls whether eligible reviews post automatically without an admin clicking a button. It defaults to `false` — every review requires manual approval in `/admin/reviews` until you explicitly set it to `"true"`.

When enabled, a review auto-posts its AI draft if **all** of these hold:
- Rating is 4 or 5 stars.
- The review text doesn't match any of the negative-sentiment keywords in `lib/reviews.ts` (a bilingual EN/GR keyword list, not full sentiment analysis — deliberately conservative, since a false "not negative" auto-posts unattended).
- It's been sitting untouched (still `pending`) for at least 24 hours.
- No admin has already acted on it.

**Reviews rated 3 stars or below never auto-post, no matter what** — that rule is enforced directly in `lib/reviews.ts`'s `isAutoPostEligible()`, not just by the query in the cron job, so it holds even if the sweep logic changes later.

The sweep runs as part of `/api/cron/reviews-sync` (registered in `vercel.json`, once daily — Hobby-plan Vercel projects cap cron jobs at once/day, and a more frequent schedule fails the whole deployment) — it doesn't have its own separate cron entry, since it's cheap and operates on the same table as the review sync itself.
