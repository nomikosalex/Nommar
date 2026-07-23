# Nommar — Beauty & Spa (Next.js full‑stack)

Luxury spa website **and** custom booking system for Nommar in Kamari, Santorini.
Marketing site + customer booking flow + admin dashboard, in one Next.js app.

- **Frontend/SSR:** Next.js 16 (App Router), React 19
- **Database:** Prisma 7 + SQLite (dev) → Postgres (prod)
- **Auth:** JWT in an httpOnly cookie (admin only)
- **Email:** Resend (falls back to console logging in dev)
- **Motion:** Framer Motion + Lenis (respects `prefers-reduced-motion`)

## Quick start

```bash
npm install
cp .env.example .env          # then edit values
npm run db:migrate            # create the SQLite db + tables
npm run db:seed               # admin user + sample staff/hours + services
npm run dev                   # http://localhost:3000
```

Useful scripts: `npm run db:studio` (browse data), `npm run db:reset` (wipe + re‑migrate + re‑seed), `npm run build`.

## Routes

| Path | What |
| --- | --- |
| `/`, `/services`, `/packages`, `/about`, `/contact` | Marketing site (SSR + per‑page SEO + LocalBusiness JSON‑LD) |
| `/book` | Customer booking flow: service → date → time → therapist → details |
| `/admin/login` | Admin sign‑in |
| `/admin` | Bookings dashboard (confirm / cancel) |
| `/admin/schedule` | Staff working hours + time‑off editor |
| `/api/services`, `/api/availability`, `/api/availability/staff`, `/api/bookings` | Public booking API |
| `/api/admin/*` | Admin API (guarded by `proxy.ts`) |

Default admin login comes from `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env` (seeded).

## How booking works

- **Capacity:** 2 therapists + 2 rooms. **Suite One** hosts Head Spa · Facial · Body; **Suite Two** hosts Massage · Facial · Body (so two guests can't both get a head spa at once — there's one head-spa room).
- **Multi-guest:** 1 or 2 guests booked into the same start slot in parallel (each gets their own therapist + room).
- **Multi-service chains:** a guest can stack treatments back-to-back. Services start only on **:00 / :30**; the next service starts at the next grid mark after the previous ends (the small gap is cleaning time).
- **Cross-sell:** after one treatment, short complements are offered at −10% (config in `lib/booking.config.js`); if a selection equals a Journey package, it offers a one-click switch instead of undercutting it.
- Staff have weekly **working hours**; admins add one-off **time-off** blocks (per-therapist or whole-spa).
- `POST /api/availability` returns the `:00/:30` starts where the whole request (all guests' chains) fits; `POST /api/bookings` re-runs the assignment **inside a transaction** (distinct therapists/rooms) so slots can't be double-booked (`409` if taken).
- All times stored in **UTC**, computed/displayed in **Europe/Athens** (DST-aware). A confirmation email goes to the guest + a notification to the spa.
- Tunable constants (slot grid, discount %, room rules, cross-sell list) live in **`lib/booking.config.js`**.

## Project layout

```
app/            routes (pages + /api route handlers)
components/     UI: sections/, booking/, admin/, animations/, Nav/Footer/etc.
lib/            css/fx helpers, data.js (content), prisma, auth/jwt,
                availability (slot logic), email, lang context
prisma/         schema.prisma, migrations, seed.ts
proxy.ts        Next 16 middleware — guards /admin and /api/admin
```

Editable content (copy, services, prices, testimonials, contact details) lives in **`lib/data.js`**; presentation flags (hero style, motion, price mode) in **`lib/site.config.js`**.

## Deploying to Vercel + Supabase

The stack is **Postgres (Supabase)** + **app on Vercel**. The driver adapter is
`@prisma/adapter-pg`; the runtime uses the **pooled** connection and migrations
use the **direct** one.

**1. Supabase**
- Create a project. Under *Project Settings → Database → Connection string*, copy:
  - **Transaction / pooler** (port `6543`) → `DATABASE_URL` (append `?pgbouncer=true`)
  - **Direct** (port `5432`) → `DIRECT_URL`
- Under *Project Settings → API*, copy the project URL → `NEXT_PUBLIC_SUPABASE_URL`
  and the **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`.
- *Storage*: create a **public** bucket named `images` (or set `SUPABASE_STORAGE_BUCKET`).

**2. Apply schema + seed** (locally, with the two URLs in `.env`):
```bash
npm run db:deploy   # prisma migrate deploy  → creates tables
npm run db:seed     # admin + staff + rooms + services
```

**3. Vercel**
- Import the repo. No `vercel.json` needed — `next build` + the `postinstall`
  (`prisma generate`) handle the Prisma client.
- Add all env vars from `.env.example` (strong `JWT_SECRET`, real `ADMIN_PASSWORD`,
  `RESEND_API_KEY` + verified `EMAIL_FROM`, both DB URLs, the Supabase keys).
- Deploy. Re-run `npm run db:deploy` whenever you add a migration.

> Note: Vercel's free Hobby tier is non-commercial — use **Pro** for a live business.
> The in-memory rate limiter (`lib/rateLimit.ts`) is per-instance; back it with
> Upstash Redis for serverless if you need hard guarantees.

## Database backups

Supabase's free tier has **no automated backups**, so a daily GitHub Actions
workflow (`.github/workflows/db-backup.yml`) takes a full logical dump (schema +
data) with `pg_dump` and stores it as a **workflow artifact**. It runs at
**03:00 Europe/Athens** (`00:00 UTC`, i.e. 03:00 during summer EEST; 02:00 in
winter EET — GitHub cron is UTC with no DST) and can also be run on demand.

> ⚠️ **Dumps contain customer personal data** (names, emails, phones). The
> repository **must stay private**, and downloaded dump files must be treated as
> sensitive — store them securely and delete scratch copies when done.

### One-time setup — create the secret
Add a repository secret named **`SUPABASE_DB_URL`** under
**Settings → Secrets and variables → Actions → New repository secret**. Its value
is the **Session pooler** connection string from Supabase:
*Dashboard → Connect → Session pooler* (or *Project Settings → Database →
Connection pooling → Session mode*):

```
postgresql://postgres.<project-ref>:[YOUR-DB-PASSWORD]@aws-0-<region>.pooler.supabase.com:5432/postgres
```

- Use the **Session pooler (port 5432)** — session mode works with `pg_dump`.
- **Do not** use the *Transaction* pooler (`6543`, pgbouncer) — it breaks `pg_dump`.
- **Do not** use the *Direct* connection (`db.<ref>.supabase.co:5432`) — on the
  free tier it is **IPv6-only**, and GitHub runners are IPv4-only, so it times out.

### Run a manual backup (before risky operations)
GitHub → **Actions** tab → **DB Backup** workflow → **Run workflow** → *Run*.
Use this before any migration, bulk edit, or other risky change.

### Download a backup
Open the workflow run → scroll to **Artifacts** → download
`nommar-db-YYYY-MM-DD`. GitHub delivers artifacts as a **`.zip`** wrapping the
`.sql` file, so unzip it first:

```bash
unzip nommar-db-2026-08-01.zip     # → nommar-db-2026-08-01.sql
```

### Failure notifications — make sure you actually hear about a broken backup
A backup silently failing for weeks is exactly what this guards against, so
confirm notifications are on:

- **Who gets emailed:** for **scheduled** workflows, GitHub emails **the user who
  last modified the workflow's `cron` schedule** (i.e. whoever most recently
  committed a change to that line) when a run fails — *not* every repo watcher.
  Keep yourself as the last committer of the cron line to remain the recipient.
- **Enable it:** GitHub → your avatar → **Settings → Notifications →
  Actions**. Enable **Email**, and tick **"Send notifications for failed workflows
  only"** so you're alerted on failures without daily success noise.
- **Verify it works:** temporarily point the secret at a bad URL (or rename the
  secret) and run the workflow manually once — the run should go **red** and you
  should receive the failure email. Then restore the correct secret. Also glance
  at the Actions tab periodically; a missing daily run is itself a signal.

### Restore a dump
Restore into a **fresh / empty** database (restoring over an existing populated
DB can conflict). Example into a local Postgres:

```bash
createdb nommar_restore
psql "nommar_restore" < nommar-db-2026-08-01.sql
```

Into another Postgres/Supabase target, pass its connection string (use the
session-pooler or direct URL of the *target*):

```bash
psql "postgresql://postgres.<ref>:[PASSWORD]@aws-0-<region>.pooler.supabase.com:5432/postgres" \
  < nommar-db-2026-08-01.sql
```

### Verify a backup actually works (don't assume — prove it)
Periodically prove a dump is restorable and complete by loading it into a scratch
database and checking row counts:

```bash
# 1) restore into a throwaway local DB
createdb nommar_verify
psql "nommar_verify" < nommar-db-2026-08-01.sql

# 2) confirm the core tables have rows (compare against what you expect)
psql "nommar_verify" -c '
  SELECT ''Reservation'' AS table, count(*) FROM "Reservation"
  UNION ALL SELECT ''Booking'',     count(*) FROM "Booking"
  UNION ALL SELECT ''Service'',     count(*) FROM "Service"
  UNION ALL SELECT ''Staff'',       count(*) FROM "Staff"
  UNION ALL SELECT ''AdminUser'',   count(*) FROM "AdminUser";'

# 3) clean up
dropdb nommar_verify
```

Non-zero counts that match production (and a clean `psql` exit with no errors)
mean the backup is genuinely restorable — not just present.

### Retention
Artifacts are kept **90 days** (`retention-days: 90`), the free-plan default
maximum. Private repos *can* extend to **400 days**, but only after raising the
repo cap under **Settings → Actions → General → Artifact and log retention**;
otherwise a larger `retention-days` value is silently clamped to the cap. Note the
**500 MB** free Actions storage quota — fine for these small dumps, but the oldest
artifacts are evicted if it's ever exceeded.

## Going to production — checklist
- **Secrets:** strong `JWT_SECRET`, real `ADMIN_PASSWORD` (then re-run `db:seed`).
- **Email:** with `RESEND_API_KEY` set + a verified sender domain, confirmation/
  notification emails send for real; without it they log to the server console.
- **Images:** upload via the admin (Supabase Storage) or drop public URLs in.

## Still placeholder (supply when ready)

- **Photography** — the `<Placeholder>` blocks (`components/Placeholder.jsx`) are ready to swap for real `<img>`.
- **Prices** — `priceCents` is nullable; the UI shows duration until prices are added (and `site.config.js` `priceMode`).
- **Testimonials** — `TESTIMONIALS` in `lib/data.js` are sample quotes.
