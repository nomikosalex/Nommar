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

## Going to production — checklist
- **Secrets:** strong `JWT_SECRET`, real `ADMIN_PASSWORD` (then re-run `db:seed`).
- **Email:** with `RESEND_API_KEY` set + a verified sender domain, confirmation/
  notification emails send for real; without it they log to the server console.
- **Images:** upload via the admin (Supabase Storage) or drop public URLs in.

## Still placeholder (supply when ready)

- **Photography** — the `<Placeholder>` blocks (`components/Placeholder.jsx`) are ready to swap for real `<img>`.
- **Prices** — `priceCents` is nullable; the UI shows duration until prices are added (and `site.config.js` `priceMode`).
- **Testimonials** — `TESTIMONIALS` in `lib/data.js` are sample quotes.
