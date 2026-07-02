# Nommar — Launch checklist (Vercel + Supabase)

Follow top to bottom. ⏱️ ~30–45 min to a live site.

---

## 0. Push the code to GitHub (5 min)
All work is currently in one local commit with no remote. Commit everything and push:

```bash
cd nommar-next
git add -A
git commit -m "Nommar booking platform"
# create an EMPTY repo at https://github.com/new  (e.g. "nommar"), then:
git remote add origin https://github.com/<you>/nommar.git
git branch -M main
git push -u origin main
```
✅ Safe: `.env`, `dev.db`, and the generated Prisma client are git-ignored — no secrets leave your machine. `.env.example` and `prisma/migrations/` ARE included (needed).

---

## 1. Supabase — database (8 min)
1. Create a project at https://supabase.com → **New project**. Pick region **Frankfurt / eu-central** (closest to Greece). Set a strong DB password and save it.
2. **Settings → Database → Connection string**:
   - **"Transaction" (pooler, port 6543)** → this is `DATABASE_URL`. Append `?pgbouncer=true`.
   - **"Direct connection" (port 5432)** → this is `DIRECT_URL`.
   - (Put your DB password into both where it shows `[YOUR-PASSWORD]`.)
3. **Settings → API**: copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`, and the **`service_role`** secret → `SUPABASE_SERVICE_ROLE_KEY`.

## 2. Supabase — storage bucket (3 min)
1. **Storage → Create bucket** → name it **`images`** → toggle **Public bucket = ON** → Create.
2. **That's it — no RLS policies needed.** Uploads go through our server with the
   `service_role` key (which bypasses RLS), and a public bucket serves files at a
   public URL (what the app stores in `Service.imageUrl`).

> Optional hardening (only if you want a PRIVATE bucket instead): keep it private and
> add a public read policy, but then the app must use signed URLs (small code change —
> ask me). For a spa's marketing photos, **public is the right, simple choice.**
>
> ```sql
> -- (only for the private-bucket route; not needed for a public bucket)
> create policy "Public read images"
>   on storage.objects for select
>   to public
>   using ( bucket_id = 'images' );
> ```

## 3. Generate secrets (2 min)
```bash
openssl rand -base64 32     # → JWT_SECRET
```
Pick a real `ADMIN_PASSWORD` (not the default). Decide `ADMIN_EMAIL`.

## 4. Email — Resend (5 min, optional for first deploy)
1. Sign up at https://resend.com → **API Keys** → create → `RESEND_API_KEY`.
2. Verify a sending domain (or use their onboarding domain to test) → set
   `EMAIL_FROM="Nommar <hello@yourdomain>"` and `SPA_EMAIL` (where booking alerts go).
3. Skip for now? Leave `RESEND_API_KEY` blank → emails log to the server console.

## 5. Fill `.env` locally, then create + seed the database (5 min)
Put all values from steps 1–4 into `.env` (mirror `.env.example`), then:
```bash
npm run db:deploy   # creates all tables in Supabase
npm run db:seed     # admin user + 3 staff + 2 rooms + 10 services
npm run db:studio   # (optional) browse the data
npm run dev         # http://localhost:3000 — test a booking + /admin login
```

## 6. Vercel — deploy (8 min)
1. https://vercel.com → **Add New → Project** → import your GitHub repo.
2. Framework auto-detects **Next.js**. No build settings needed (the `postinstall`
   runs `prisma generate`).
3. **Environment Variables** — add every one below (Production + Preview):

   | Variable | From |
   |---|---|
   | `DATABASE_URL` | Supabase pooler (6543) + `?pgbouncer=true` |
   | `DIRECT_URL` | Supabase direct (5432) |
   | `JWT_SECRET` | `openssl rand -base64 32` |
   | `ADMIN_EMAIL` / `ADMIN_PASSWORD` | your choice |
   | `RESEND_API_KEY` / `EMAIL_FROM` / `SPA_EMAIL` | Resend (or blank) |
   | `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Supabase API |
   | `SUPABASE_STORAGE_BUCKET` | `images` |
   | `NEXT_PUBLIC_TZ` | `Europe/Athens` |

4. **Deploy.** (The DB is already migrated from step 5 — same Supabase DB.)
5. **Upgrade to Vercel Pro** before taking real bookings (Hobby is non-commercial).

## 7. Verify live (5 min)
- [ ] Marketing pages load; `/sitemap.xml` and `/robots.txt` resolve.
- [ ] Book a real appointment end-to-end → confirmation screen shows.
- [ ] Booking appears in **/admin** (login with your `ADMIN_EMAIL`/`ADMIN_PASSWORD`).
- [ ] Confirm/cancel works; **/admin/calendar** shows it.
- [ ] Email arrived (if Resend configured) — else check Vercel function logs.
- [ ] Upload a photo on a service in **/admin/services** → it appears.

## 8. Custom domain (optional, later)
Add the domain in Vercel → update DNS. The base URL `https://nommar.gr` is already
set in `sitemap.ts`, `robots.ts`, `metadataBase`, and the JSON-LD — change those four
spots if you use a different domain.

---

# After launch — plan to "finish" (in order)

**A. Real content (no code — do it in the admin / data file)**
- Photos: upload per service in `/admin/services`; for hero/about imagery, send me the
  files and I'll swap the `<Placeholder>` blocks for the uploaded URLs.
- Prices: enter per service in `/admin/services`, then flip `priceMode` to `'from'` in
  `lib/site.config.js` so amounts show.
- Testimonials + final copy: `lib/data.js`.

**B. Remaining features (I build these)**
1. **Cancel/reschedule links** — secure token in the confirmation email so guests self-serve.
2. **Email reminders** — Vercel Cron hitting a `/api/cron/reminders` route the day before.

**C. Optional hardening / nice-to-haves**
- Upstash Redis so rate-limiting holds across serverless instances.
- Full Greek translation of the marketing prose (currently EN; buttons already bilingual).
- Deposits/prepayment via Stripe (cuts no-shows).
