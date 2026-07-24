'use client';
import { useEffect, useState } from 'react';
import { css } from '@/lib/css';
import { FX } from '@/lib/fx';
import AdminHeader from '@/components/admin/AdminHeader';
import { useAdminLocale } from '@/lib/useAdminLocale';
import { VBars, HBars, SplitBar, GOLD, TEAL } from '@/components/admin/charts';

const PRESETS = ['last7', 'last30', 'month', 'season', 'custom'];

const COPY = {
  en: {
    heading: 'Dashboard', subtitle: 'Analytics in Athens time. Revenue counts completed bookings only.',
    loading: 'Loading…', loadError: 'Could not load analytics.',
    ranges: { last7: 'Last 7 days', last30: 'Last 30 days', month: 'This month', season: 'Season to date', custom: 'Custom' },
    from: 'From', to: 'To',
    missingPrices: (n) => `${n} completed booking${n === 1 ? '' : 's'} ha${n === 1 ? 's' : 've'} no price set — revenue is understated.`,
    emptyRange: 'No completed bookings in this period.',
    cards: {
      revenue: 'Realized revenue', completed: 'Completed appointments', aov: 'Avg per reservation',
      noShow: 'No-show rate', cancel: 'Cancellation rate', upcoming: 'Upcoming confirmed',
    },
    ofDue: (a, b) => `${a} of ${b} due`, ofTotal: (a, b) => `${a} of ${b} reservations`, upcomingSub: (n) => `${n} appointment${n === 1 ? '' : 's'} ahead`, perRes: (n) => `over ${n} reservation${n === 1 ? '' : 's'}`,
    revenueOverTime: 'Revenue over time', utilisation: 'Capacity utilisation', utilSub: (b, a) => `${b} / ${a} therapist-hours (elapsed days)`, utilEmpty: 'No working hours in the elapsed range yet.',
    topByRevenue: 'Top services — revenue', topByBookings: 'Top services — bookings',
    demandHour: 'Bookings by hour', demandWeekday: 'Bookings by weekday', demandNote: 'Confirmed + completed',
    leadTime: 'Booking lead time', leadMedian: (n) => `Median ${n} day${n === 1 ? '' : 's'} ahead`, leadNA: 'Not enough data',
    leadBuckets: { same: 'Same day', '1-3': '1–3 days', '4-7': '4–7 days', '8+': '8+ days' },
    discounts: 'Discounts', promoUsed: (n) => `${n} reservation${n === 1 ? '' : 's'} used a promo code`, discountGiven: 'Total discount given', guestMix: 'Guest mix', oneGuest: '1 guest', twoGuests: '2 guests', noData: 'No data yet.',
    weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  },
  gr: {
    heading: 'Στατιστικά', subtitle: 'Ανάλυση σε ώρα Αθήνας. Τα έσοδα μετρούν μόνο ολοκληρωμένες κρατήσεις.',
    loading: 'Φόρτωση…', loadError: 'Δεν ήταν δυνατή η φόρτωση.',
    ranges: { last7: 'Τελευταίες 7 ημέρες', last30: 'Τελευταίες 30 ημέρες', month: 'Αυτόν τον μήνα', season: 'Σεζόν έως σήμερα', custom: 'Προσαρμογή' },
    from: 'Από', to: 'Έως',
    missingPrices: (n) => `${n} ολοκληρωμένη${n === 1 ? '' : 'ς'} κράτηση χωρίς τιμή — τα έσοδα υποεκτιμώνται.`,
    emptyRange: 'Καμία ολοκληρωμένη κράτηση σε αυτή την περίοδο.',
    cards: {
      revenue: 'Πραγματοποιημένα έσοδα', completed: 'Ολοκληρωμένα ραντεβού', aov: 'Μ.Ο. ανά κράτηση',
      noShow: 'Ποσοστό μη προσέλευσης', cancel: 'Ποσοστό ακυρώσεων', upcoming: 'Επερχόμενα επιβεβαιωμένα',
    },
    ofDue: (a, b) => `${a} από ${b} αναμενόμενα`, ofTotal: (a, b) => `${a} από ${b} κρατήσεις`, upcomingSub: (n) => `${n} επερχόμενα ραντεβού`, perRes: (n) => `σε ${n} κρατήσεις`,
    revenueOverTime: 'Έσοδα ανά ημέρα', utilisation: 'Αξιοποίηση δυναμικότητας', utilSub: (b, a) => `${b} / ${a} ώρες θεραπευτών (παρελθούσες ημέρες)`, utilEmpty: 'Δεν υπάρχουν ακόμη ώρες εργασίας στο διάστημα.',
    topByRevenue: 'Κορυφαίες υπηρεσίες — έσοδα', topByBookings: 'Κορυφαίες υπηρεσίες — κρατήσεις',
    demandHour: 'Κρατήσεις ανά ώρα', demandWeekday: 'Κρατήσεις ανά ημέρα', demandNote: 'Επιβεβαιωμένες + ολοκληρωμένες',
    leadTime: 'Χρόνος προκράτησης', leadMedian: (n) => `Διάμεσος ${n} ημέρ${n === 1 ? 'α' : 'ες'} πριν`, leadNA: 'Ανεπαρκή δεδομένα',
    leadBuckets: { same: 'Ίδια ημέρα', '1-3': '1–3 ημέρες', '4-7': '4–7 ημέρες', '8+': '8+ ημέρες' },
    discounts: 'Εκπτώσεις', promoUsed: (n) => `${n} κρατήσεις με κωδικό προσφοράς`, discountGiven: 'Συνολική έκπτωση', guestMix: 'Σύνθεση ατόμων', oneGuest: '1 άτομο', twoGuests: '2 άτομα', noData: 'Δεν υπάρχουν δεδομένα.',
    weekdays: ['Κυρ', 'Δευ', 'Τρι', 'Τετ', 'Πεμ', 'Παρ', 'Σαβ'],
  },
};

export default function DashboardPage() {
  const locale = useAdminLocale();
  const t = COPY[locale];
  const loc = locale === 'gr' ? 'el-GR' : 'en-GB';
  const eur0 = new Intl.NumberFormat(loc, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
  const eur = (c) => (c == null ? '—' : eur0.format(c / 100));
  const compactEur = (c) => { const v = c / 100; return v >= 1000 ? '€' + (v / 1000).toFixed(1) + 'k' : '€' + Math.round(v); };
  const pct = (r) => (r == null ? '—' : (r * 100).toFixed(1) + '%');

  const [preset, setPreset] = useState('last30');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (preset === 'custom' && (!from || !to)) return; // wait for both custom dates
    setLoading(true); setError('');
    const qs = new URLSearchParams({ preset });
    if (preset === 'custom') { qs.set('from', from); qs.set('to', to); }
    fetch('/api/admin/dashboard?' + qs.toString())
      .then((r) => r.ok ? r.json() : Promise.reject())
      .then((d) => setData(d))
      .catch(() => setError(t.loadError))
      .finally(() => setLoading(false));
  }, [preset, from, to]);

  const d = data;
  const empty = d && d.headline.completedAppointments === 0;

  return (
    <>
      <AdminHeader />
      <main style={css('max-width:1180px;margin:0 auto;padding:clamp(28px,4vw,48px) clamp(18px,4vw,40px);')}>
        <h1 style={css("font-family:var(--font-cinzel),serif;font-weight:500;font-size:clamp(24px,3vw,34px);letter-spacing:0.03em;margin:0 0 6px;")}>{t.heading}</h1>
        <p style={css("font-family:var(--font-jost),sans-serif;font-size:13px;color:#8A7965;margin:0 0 22px;")}>{t.subtitle}</p>

        {/* range selector */}
        <div style={css('display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:22px;')}>
          {PRESETS.map((p) => (
            <FX as="button" key={p} onClick={() => setPreset(p)}
              style={'font-family:var(--font-jost),sans-serif;font-size:11px;letter-spacing:0.08em;padding:7px 13px;cursor:pointer;border-radius:2px;border:1px solid ' + (preset === p ? '#C2A56B;background:#F6ECD6;color:#3D2F25;' : 'rgba(194,165,107,0.35);background:none;color:#8A7965;')}
              hover="border-color:#C2A56B;">{t.ranges[p]}</FX>
          ))}
          {preset === 'custom' && (
            <span style={css('display:flex;flex-wrap:wrap;gap:8px;align-items:center;')}>
              <label style={css('font-size:11px;color:#8A7965;')}>{t.from} <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={css('font-family:var(--font-jost),sans-serif;font-size:12px;padding:5px 7px;border:1px solid rgba(194,165,107,0.4);border-radius:2px;')} /></label>
              <label style={css('font-size:11px;color:#8A7965;')}>{t.to} <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={css('font-family:var(--font-jost),sans-serif;font-size:12px;padding:5px 7px;border:1px solid rgba(194,165,107,0.4);border-radius:2px;')} /></label>
            </span>
          )}
        </div>

        {error && <p style={css('color:#9B4444;')}>{error}</p>}
        {loading && !d && <p style={css("font-family:var(--font-cormorant),serif;font-style:italic;font-size:18px;color:#8A7965;")}>{t.loading}</p>}

        {d && (
          <div style={css(loading ? 'opacity:0.55;transition:opacity 0.2s;' : '')}>
            {d.dataQuality.missingPriceCount > 0 && (
              <div style={css('font-family:var(--font-jost),sans-serif;font-size:12.5px;color:#9A7B2E;background:#FBF3DF;border:1px solid #E6CF95;border-radius:2px;padding:10px 14px;margin-bottom:18px;')}>{t.missingPrices(d.dataQuality.missingPriceCount)}</div>
            )}

            {/* headline cards */}
            <div style={css('display:grid;grid-template-columns:repeat(auto-fit,minmax(158px,1fr));gap:12px;margin-bottom:26px;')}>
              <Stat label={t.cards.revenue} value={empty ? '—' : eur(d.headline.realizedRevenueCents)} />
              <Stat label={t.cards.completed} value={d.headline.completedAppointments} />
              <Stat label={t.cards.aov} value={eur(d.headline.aovCents)} sub={d.headline.completedReservations ? t.perRes(d.headline.completedReservations) : ''} />
              <Stat label={t.cards.noShow} value={pct(d.headline.noShow.rate)} sub={t.ofDue(d.headline.noShow.count, d.headline.noShow.denom)} accent="#9B5B5B" />
              <Stat label={t.cards.cancel} value={pct(d.headline.cancellation.rate)} sub={t.ofTotal(d.headline.cancellation.count, d.headline.cancellation.denom)} accent="#A8967C" />
              <Stat label={t.cards.upcoming} value={eur(d.headline.upcomingRevenueCents)} sub={t.upcomingSub(d.headline.upcomingCount)} accent="#3E7A4E" />
            </div>

            {empty && <p style={css("font-family:var(--font-cormorant),serif;font-style:italic;font-size:18px;color:#8A7965;margin:0 0 26px;")}>{t.emptyRange}</p>}

            {/* revenue over time */}
            <Panel title={t.revenueOverTime}>
              {d.revenueByDay.some((x) => x.cents > 0)
                ? <VBars data={d.revenueByDay.map((x) => ({ label: x.day.slice(8), value: x.cents, short: compactEur(x.cents) }))} valueFmt={eur} />
                : <Muted>{t.emptyRange}</Muted>}
            </Panel>

            {/* utilisation */}
            <Panel title={t.utilisation}>
              {d.utilisation.availableMinutes > 0 ? (
                <div>
                  <div style={css('font-family:var(--font-cinzel),serif;font-size:30px;color:#3D2F25;')}>{pct(d.utilisation.pct)}</div>
                  <div style={css('height:12px;background:#EFE7D6;border-radius:3px;overflow:hidden;margin:8px 0 6px;max-width:420px;')}>
                    <div style={css(`height:100%;width:${Math.min(100, Math.round((d.utilisation.pct || 0) * 100))}%;background:${GOLD};`)} />
                  </div>
                  <div style={css('font-family:var(--font-jost),sans-serif;font-size:12px;color:#8A7965;')}>{t.utilSub(d.utilisation.bookedHours, d.utilisation.availableHours)}</div>
                </div>
              ) : <Muted>{t.utilEmpty}</Muted>}
            </Panel>

            {/* top services */}
            <div style={css('display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;')}>
              <Panel title={t.topByRevenue}>
                {d.topServices.byRevenue.length ? <HBars data={d.topServices.byRevenue.map((s) => ({ label: s.name, value: s.cents }))} valueFmt={eur} /> : <Muted>{t.noData}</Muted>}
              </Panel>
              <Panel title={t.topByBookings}>
                {d.topServices.byBookings.length ? <HBars data={d.topServices.byBookings.map((s) => ({ label: s.name, value: s.count }))} /> : <Muted>{t.noData}</Muted>}
              </Panel>
            </div>

            {/* demand */}
            <div style={css('display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;')}>
              <Panel title={t.demandHour} note={t.demandNote}>
                {d.demand.byHour.some((x) => x.count > 0) ? <VBars data={d.demand.byHour.map((x) => ({ label: String(x.hour), value: x.count }))} valueFmt={(v) => String(v)} /> : <Muted>{t.noData}</Muted>}
              </Panel>
              <Panel title={t.demandWeekday} note={t.demandNote}>
                {d.demand.byWeekday.some((x) => x.count > 0) ? <VBars data={d.demand.byWeekday.map((x) => ({ label: t.weekdays[x.weekday], value: x.count }))} valueFmt={(v) => String(v)} minColWidth={40} /> : <Muted>{t.noData}</Muted>}
              </Panel>
            </div>

            {/* lead time */}
            <Panel title={t.leadTime} note={d.leadTime.medianDays != null ? t.leadMedian(d.leadTime.medianDays) : t.leadNA}>
              {d.leadTime.sampleSize > 0 ? <HBars data={d.leadTime.buckets.map((b) => ({ label: t.leadBuckets[b.key], value: b.count }))} /> : <Muted>{t.noData}</Muted>}
            </Panel>

            {/* discounts + guest mix */}
            <div style={css('display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px;')}>
              <Panel title={t.discounts}>
                <div style={css('font-family:var(--font-cinzel),serif;font-size:26px;color:#3D2F25;')}>{eur(d.discounts.totalDiscountCents)}</div>
                <div style={css('font-family:var(--font-jost),sans-serif;font-size:12px;color:#8A7965;margin-top:4px;')}>{t.discountGiven}</div>
                <div style={css('font-family:var(--font-jost),sans-serif;font-size:12.5px;color:#3D2F25;margin-top:10px;')}>{t.promoUsed(d.discounts.promoReservations)}</div>
              </Panel>
              <Panel title={t.guestMix}>
                {(d.guestMix.one + d.guestMix.two) > 0
                  ? <SplitBar segments={[{ label: t.oneGuest, value: d.guestMix.one, color: GOLD }, { label: t.twoGuests, value: d.guestMix.two, color: TEAL }]} />
                  : <Muted>{t.noData}</Muted>}
              </Panel>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

function Stat({ label, value, sub, accent }) {
  return (
    <div style={css('background:#FFFDF8;border:1px solid rgba(194,165,107,0.28);border-radius:3px;padding:16px 18px;')}>
      <div style={css('font-family:var(--font-jost),sans-serif;font-size:10.5px;letter-spacing:0.12em;text-transform:uppercase;color:#8A7965;margin-bottom:8px;')}>{label}</div>
      <div style={css(`font-family:var(--font-cinzel),serif;font-size:26px;line-height:1.1;color:${accent || '#3D2F25'};`)}>{value}</div>
      {sub ? <div style={css('font-family:var(--font-jost),sans-serif;font-size:11px;color:#A8967C;margin-top:6px;')}>{sub}</div> : null}
    </div>
  );
}

function Panel({ title, note, children }) {
  return (
    <section style={css('background:#FFFDF8;border:1px solid rgba(194,165,107,0.28);border-radius:3px;padding:18px 20px;margin-bottom:16px;')}>
      <div style={css('display:flex;flex-wrap:wrap;align-items:baseline;justify-content:space-between;gap:8px;margin-bottom:14px;')}>
        <h2 style={css('font-family:var(--font-jost),sans-serif;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#C2A56B;margin:0;')}>{title}</h2>
        {note ? <span style={css('font-family:var(--font-jost),sans-serif;font-size:11px;color:#A8967C;')}>{note}</span> : null}
      </div>
      {children}
    </section>
  );
}

function Muted({ children }) {
  return <p style={css("font-family:var(--font-cormorant),serif;font-style:italic;font-size:16px;color:#8A7965;margin:0;")}>{children}</p>;
}
