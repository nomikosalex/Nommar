'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { css } from '@/lib/css';
import { FX } from '@/lib/fx';
import { useLang } from '@/lib/lang';
import { PACKAGES, slugify, categoryLabel } from '@/lib/data';
import { CROSS_SELL_SLUGS, CROSS_SELL_DISCOUNT_PCT, MAX_GUESTS, PROMO, validatePromo, OPENING_DATE, visitDurationMin } from '@/lib/booking.config';
import { getAttribution } from '@/lib/attribution';

const CATEGORY_ORDER = ['Head Spa', 'Massage', 'Body Treatments', 'Facial Treatments'];

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
// Earliest bookable day: today, or the spa's opening date if that's later.
const minBookableStr = () => (OPENING_DATE > todayStr() ? OPENING_DATE : todayStr());
const fmtDate = (d) => {
  if (!d) return '';
  const [y, m, day] = d.split('-').map(Number);
  return new Date(y, m - 1, day).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
};
const sameSet = (a, b) => a.length === b.length && [...a].sort().join('|') === [...b].sort().join('|');

// shared styles
const eyebrow = "font-family:var(--font-jost),sans-serif;font-size:12px;letter-spacing:0.34em;text-transform:uppercase;color:#C2A56B;";
const heading = "font-family:var(--font-cinzel),serif;font-weight:500;letter-spacing:0.03em;color:#3D2F25;";
const card = 'background:#FFFDF8;border:1px solid rgba(194,165,107,0.3);box-shadow:0 18px 42px -30px rgba(61,47,37,0.5);';
const primaryBtn = "font-family:var(--font-jost),sans-serif;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:#3D2F25;font-weight:500;background:linear-gradient(135deg,#E6CF95,#C2A56B);border:none;padding:15px 30px;cursor:pointer;border-radius:1px;box-shadow:0 10px 26px -10px rgba(194,165,107,0.6);transition:transform .35s ease;";
const ghostBtn = "font-family:var(--font-jost),sans-serif;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#8A7965;font-weight:400;background:transparent;border:1px solid rgba(194,165,107,0.45);padding:12px 20px;cursor:pointer;border-radius:1px;";
const inputStyle = "font-family:var(--font-jost),sans-serif;font-weight:300;font-size:15px;color:#3D2F25;background:#FAF5EC;border:1px solid rgba(194,165,107,0.4);border-radius:2px;padding:13px 15px;outline:none;width:100%;";
const labelStyle = "font-family:var(--font-jost),sans-serif;font-size:10.5px;letter-spacing:0.22em;text-transform:uppercase;color:#C2A56B;margin-bottom:8px;display:block;";

export default function BookFlow() {
  const { t, lang } = useLang();
  const params = useSearchParams();
  const preselect = params.get('service');

  const [services, setServices] = useState([]);
  const [step, setStep] = useState(1);
  const [guestCount, setGuestCount] = useState(1);
  const [carts, setCarts] = useState([[], []]); // slugs per guest
  const [activeGuest, setActiveGuest] = useState(0);
  const [date, setDate] = useState('');
  const [slots, setSlots] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [iso, setIso] = useState('');
  const [time, setTime] = useState('');
  const [primary, setPrimary] = useState({ name: '', email: '', phone: '' });
  const [g2, setG2] = useState({ name: '', email: '', phone: '' });
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [promo, setPromo] = useState(''); // code the customer typed
  const [promoPct, setPromoPct] = useState(0); // 0 until a valid code is applied
  const [promoMsg, setPromoMsg] = useState(''); // '', 'ok', or 'bad'
  const errorRef = useRef(null);
  const dateInputRef = useRef(null);
  const focusDate = () => {
    const el = dateInputRef.current;
    if (!el) return;
    el.focus();
    try { el.showPicker?.(); } catch { /* not supported */ }
  };

  // Move focus to the error banner when one appears (screen readers + visibility).
  useEffect(() => {
    if (error && errorRef.current) errorRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [error]);

  // Start each step (and the confirmation screen) from the top — on mobile the
  // next step would otherwise open at the previous scroll height.
  useEffect(() => {
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step, done]);

  const applyPromo = () => {
    const pct = validatePromo(promo);
    setPromoPct(pct);
    setPromoMsg(pct > 0 ? 'ok' : 'bad');
  };

  const STEPS = [t.stepGuests, t.stepServices, t.stepWhen, t.stepDetails, t.stepReview];

  const svcBySlug = useMemo(() => new Map(services.map((s) => [s.slug, s])), [services]);
  const pkgBySlug = useMemo(() => new Map(PACKAGES.map((p) => [slugify(p.name), p])), []);

  const info = (slug) => {
    const s = svcBySlug.get(slug);
    if (s) return { slug, name: s.name, durationMin: s.durationMin, kind: 'service' };
    const p = pkgBySlug.get(slug);
    if (p) return { slug, name: p.name, durationMin: p.durationMin, kind: 'package' };
    return { slug, name: slug, durationMin: 0, kind: 'service' };
  };

  useEffect(() => {
    fetch('/api/services')
      .then((r) => r.json())
      .then((d) => {
        setServices(d.services || []);
        if (preselect && d.services?.some((s) => s.slug === preselect)) {
          setCarts([[preselect], []]);
          setStep(2);
        }
      })
      .catch(() => setError('Could not load treatments. Please refresh.'));
  }, [preselect]);

  const grouped = useMemo(() => {
    const by = {};
    for (const s of services) (by[s.category] ||= []).push(s);
    return CATEGORY_ORDER.filter((c) => by[c]).map((c) => ({ category: c, label: categoryLabel(c, lang), items: by[c] }));
  }, [services, lang]);

  const guestsPayload = () => Array.from({ length: guestCount }, (_, g) => ({ services: carts[g] }));

  const toggle = (g, slug) => {
    setCarts((cs) => {
      const next = cs.map((c) => [...c]);
      const i = next[g].indexOf(slug);
      if (i >= 0) next[g].splice(i, 1);
      else next[g].push(slug);
      return next;
    });
    setSlots(null);
    setIso('');
  };

  const setPackage = (g, pkgSlug) => {
    setCarts((cs) => cs.map((c, gi) => (gi === g ? [pkgSlug] : c)));
    setSlots(null);
    setIso('');
  };

  // cross-sell suggestions for a guest (short complements, never forming a package)
  const suggestionsFor = (g) => {
    const cart = carts[g];
    if (cart.length === 0 || cart.some((s) => pkgBySlug.has(s))) return [];
    return CROSS_SELL_SLUGS.filter((slug) => svcBySlug.has(slug) && !cart.includes(slug)).filter((slug) => {
      const resulting = [...cart, slug];
      return !PACKAGES.some((p) => sameSet(resulting, p.serviceSlugs || []));
    }).slice(0, 3);
  };
  // package match: guest's à-la-carte set equals a package's components
  const matchedPackage = (g) => {
    const cart = carts[g];
    if (cart.length < 2 || cart.some((s) => pkgBySlug.has(s))) return null;
    return PACKAGES.find((p) => sameSet(cart, p.serviceSlugs || [])) || null;
  };

  const loadSlots = (d = date) => {
    if (!d) return;
    setLoadingSlots(true);
    setSlots(null);
    setIso('');
    fetch('/api/availability', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ date: d, guests: guestsPayload() }) })
      .then((r) => r.json())
      .then((res) => setSlots(res.slots || []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  };

  const cartsReady = () => Array.from({ length: guestCount }, (_, g) => carts[g]).every((c) => c.length > 0);

  const goServices = () => { setActiveGuest(0); setStep(2); };
  const goWhen = () => {
    if (!cartsReady()) { setError(t.addAtLeastOne); return; }
    setError(''); setStep(3);
  };

  const submit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const body = { start: iso, guests: guestsPayload(), customer: primary, notes, locale: lang, ...getAttribution() };
      if (guestCount === 2) body.guest2 = g2;
      if (promoPct > 0) body.promoCode = promo.trim().toUpperCase();
      const r = await fetch('/api/bookings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error || 'Something went wrong.');
        if (r.status === 409) { setStep(3); setSlots(null); loadSlots(); }
      } else setDone(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <Shell t={t}>
        <div style={css(card + 'padding:clamp(36px,5vw,60px);text-align:center;max-width:560px;margin:0 auto;')}>
          <div style={css('width:54px;height:54px;border:1px solid rgba(194,165,107,0.7);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 24px;')}>
            <div style={css('width:11px;height:11px;background:#C2A56B;transform:rotate(45deg);')} />
          </div>
          <h2 style={css(heading + 'font-size:26px;margin:0 0 14px;')}>{t.thankYou}, {primary.name.split(' ')[0]}</h2>
          <p style={css("font-family:var(--font-cormorant),serif;font-style:italic;font-size:20px;line-height:1.55;color:#6E5E50;margin:0 auto 8px;max-width:38ch;")}>{t.confirmationMsg}</p>
          <p style={css("font-family:var(--font-jost),sans-serif;font-size:13px;color:#8A7965;margin:18px 0 14px;")}>{t.emailOnWay}</p>
          <p style={css("font-family:var(--font-cormorant),serif;font-style:italic;font-size:17px;color:#6E5E50;margin:0 auto 28px;max-width:34ch;")}>{t.arriveEarly}</p>
          <FX as={Link} href="/" style={primaryBtn + 'display:inline-block;text-decoration:none;'} hover="transform:translateY(-2px);">{t.backHome}</FX>
        </div>
      </Shell>
    );
  }

  const withCart = step >= 2;

  // Persistent action bar: keep the primary action reachable without scrolling.
  const allItems = [];
  for (let g = 0; g < guestCount; g++) (carts[g] || []).forEach((s) => allItems.push(info(s)));
  // Visit duration = longest guest chain (guests run in parallel), incl. grid gaps.
  const totalMin = visitDurationMin(
    Array.from({ length: guestCount }, (_, g) => (carts[g] || []).map((s) => info(s).durationMin || 0)),
  );
  const validateDetails = () => {
    if (!primary.name || !primary.email || !primary.phone || (guestCount === 2 && !g2.name)) { setError(t.completeFields); return false; }
    setError('');
    return true;
  };
  const barPrimary =
    step === 2 ? { label: t.continueBtn, onClick: goWhen }
    : step === 4 ? { label: t.continueBtn, onClick: () => { if (validateDetails()) setStep(5); } }
    : step === 5 ? { label: submitting ? t.requesting : t.confirmBooking, onClick: submit, disabled: submitting }
    : null;

  return (
    <Shell t={t}>
      <Stepper steps={STEPS} step={step} />
      {error && <div ref={errorRef} role="alert" aria-live="assertive" tabIndex={-1} style={css("max-width:820px;margin:0 auto 22px;background:#FBEFEF;border:1px solid #E3B7B7;color:#9B4444;font-family:var(--font-jost),sans-serif;font-size:13.5px;padding:13px 18px;border-radius:2px;text-align:center;")}>{error}</div>}

      <div style={css('display:grid;gap:clamp(20px,3vw,40px);' + (withCart ? 'grid-template-columns:repeat(auto-fit,minmax(min(300px,100%),1fr));align-items:start;' : ''))}>
        <div>
          {/* STEP 1 — guests */}
          {step === 1 && (
            <div style={css('max-width:680px;margin:0 auto;text-align:center;')}>
              <h2 style={css(heading + 'font-size:clamp(22px,2.6vw,30px);margin:0 0 26px;')}>{t.howManyGuests}</h2>
              <div style={css('display:grid;grid-template-columns:1fr 1fr;gap:16px;max-width:460px;margin:0 auto;')}>
                {[1, 2].map((n) => (
                  <FX key={n} as="button" onClick={() => { setGuestCount(n); setCarts((c) => [c[0] || [], n === 2 ? c[1] || [] : []]); goServices(); }} style={card + 'cursor:pointer;padding:34px 18px;display:flex;flex-direction:column;align-items:center;gap:10px;transition:transform .35s ease,border-color .35s ease;'} hover="transform:translateY(-4px);border-color:rgba(194,165,107,0.6);">
                    <span style={css("font-family:var(--font-cormorant),serif;font-size:44px;color:#C2A56B;line-height:1;")}>{n}</span>
                    <span style={css("font-family:var(--font-jost),sans-serif;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;color:#3D2F25;")}>{n === 1 ? t.onePerson : t.twoPeople}</span>
                  </FX>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2 — treatments */}
          {step === 2 && (
            <div>
              {guestCount === 2 && (
                <div style={css('display:flex;gap:10px;margin-bottom:22px;')}>
                  {[0, 1].map((g) => (
                    <FX key={g} as="button" onClick={() => setActiveGuest(g)} style={'flex:1;font-family:var(--font-jost),sans-serif;font-size:12px;letter-spacing:0.14em;text-transform:uppercase;padding:12px;cursor:pointer;border-radius:2px;' + (activeGuest === g ? 'background:linear-gradient(135deg,#E6CF95,#C2A56B);color:#3D2F25;border:1px solid #C2A56B;' : 'background:#FFFDF8;color:#8A7965;border:1px solid rgba(194,165,107,0.4);')} hover="border-color:#C2A56B;">
                      {t.guest} {g + 1}{carts[g].length ? ` · ${carts[g].length}` : ''}
                    </FX>
                  ))}
                </div>
              )}

              <ServicePicker t={t} grouped={grouped} packages={PACKAGES} cart={carts[activeGuest]} pkgBySlug={pkgBySlug} onToggle={(slug) => toggle(activeGuest, slug)} onPackage={(slug) => setPackage(activeGuest, slug)} suggestions={suggestionsFor(activeGuest)} svcBySlug={svcBySlug} matched={matchedPackage(activeGuest)} />
            </div>
          )}

          {/* STEP 3 — date & time */}
          {step === 3 && (
            <div>
              <label style={css(labelStyle)}>{t.chooseDate}</label>
              <input ref={dateInputRef} type="date" min={minBookableStr()} value={date} onChange={(e) => { setDate(e.target.value); loadSlots(e.target.value); }} style={css(inputStyle + 'max-width:clamp(240px,90vw,320px);cursor:pointer;')} />
              {date && (
                <div style={css('margin-top:26px;')}>
                  <label style={css(labelStyle)}>{t.availableTimes}</label>
                  {loadingSlots && (
                    <div style={css('display:flex;align-items:center;gap:10px;')}>
                      <span aria-hidden="true" style={css('width:15px;height:15px;border:2px solid rgba(194,165,107,0.35);border-top-color:#C2A56B;border-radius:50%;animation:spin 0.7s linear infinite;display:inline-block;')} />
                      <Italic>{t.findingTimes}</Italic>
                    </div>
                  )}
                  {!loadingSlots && slots && slots.length === 0 && (
                    <div>
                      <Italic>{t.noTimes}</Italic>
                      {guestCount === 2 && (
                        <p style={css('font-family:var(--font-jost),sans-serif;font-size:12.5px;color:#8A7965;line-height:1.6;max-width:52ch;margin:8px 0 0;')}>{t.twoGuestNote}</p>
                      )}
                      <div style={css('margin-top:10px;')}>
                        <FX as="button" type="button" onClick={focusDate} style={ghostBtn} hover="border-color:#C2A56B;color:#3D2F25;">{t.tryAnotherDate}</FX>
                      </div>
                    </div>
                  )}
                  {!loadingSlots && slots && slots.length > 0 && (
                    <div style={css('display:flex;flex-wrap:wrap;gap:10px;')}>
                      {slots.map((s) => (
                        <FX key={s.iso} as="button" onClick={() => { setIso(s.iso); setTime(s.time); setStep(4); }} style="font-family:var(--font-jost),sans-serif;font-size:14px;color:#3D2F25;background:#FFFDF8;border:1px solid rgba(194,165,107,0.45);padding:13px 20px;min-height:46px;cursor:pointer;border-radius:2px;transition:background .3s ease,color .3s ease;" hover="background:#C2A56B;color:#FAF5EC;border-color:#C2A56B;">{s.time}</FX>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 4 — details */}
          {step === 4 && (
            <div>
              <div style={css('font-family:var(--font-jost),sans-serif;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#C2A56B;margin-bottom:14px;')}>{guestCount === 2 ? t.primaryGuest : ''}</div>
              <div style={css('display:flex;flex-direction:column;gap:16px;max-width:520px;')}>
                <Field id="cust-name" autoComplete="name" label={t.fieldName} value={primary.name} onChange={(v) => setPrimary({ ...primary, name: v })} />
                <div style={css('display:grid;grid-template-columns:repeat(auto-fit,minmax(min(200px,100%),1fr));gap:16px;')}>
                  <Field id="cust-email" autoComplete="email" label={t.fieldEmail} type="email" value={primary.email} onChange={(v) => setPrimary({ ...primary, email: v })} />
                  <Field id="cust-phone" autoComplete="tel" label={t.fieldPhone} type="tel" value={primary.phone} onChange={(v) => setPrimary({ ...primary, phone: v })} />
                </div>
                {guestCount === 2 && (
                  <>
                    <div style={css('font-family:var(--font-jost),sans-serif;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#C2A56B;margin-top:8px;')}>{t.secondGuest}</div>
                    <Field id="g2-name" autoComplete="given-name" label={t.fieldFirstName} value={g2.name} onChange={(v) => setG2({ ...g2, name: v })} />
                    <div style={css('display:grid;grid-template-columns:repeat(auto-fit,minmax(min(200px,100%),1fr));gap:16px;')}>
                      <Field id="g2-email" autoComplete="email" label={`${t.fieldEmail} (${t.optional})`} type="email" value={g2.email} onChange={(v) => setG2({ ...g2, email: v })} />
                      <Field id="g2-phone" autoComplete="tel" label={`${t.fieldPhone} (${t.optional})`} type="tel" value={g2.phone} onChange={(v) => setG2({ ...g2, phone: v })} />
                    </div>
                  </>
                )}
                <div>
                  <label style={css(labelStyle)}>{t.notesLabel}</label>
                  <FX as="textarea" rows="3" value={notes} onChange={(e) => setNotes(e.target.value)} style={inputStyle + 'resize:vertical;'} focus="border-color:#C2A56B;" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 5 — review */}
          {step === 5 && (
            <div>
              <h2 style={css(heading + 'font-size:22px;margin:0 0 8px;')}>{t.reviewTitle}</h2>
              <p style={css("font-family:var(--font-jost),sans-serif;font-size:14px;color:#8A7965;margin:0 0 22px;")}>{fmtDate(date)} · {time}</p>
              <div style={css('margin-bottom:8px;font-family:var(--font-jost),sans-serif;font-size:14px;color:#3D2F25;line-height:1.7;')}>
                {primary.name} · {primary.email} · {primary.phone}
              </div>

              {/* Promo code */}
              {PROMO.active && (
                <div style={css('margin:22px 0 6px;max-width:360px;')}>
                  <label style={css(labelStyle)}>{t.promoLabel}</label>
                  <div style={css('display:flex;gap:8px;')}>
                    <input
                      value={promo}
                      onChange={(e) => { setPromo(e.target.value); setPromoMsg(''); setPromoPct(0); }}
                      placeholder={t.promoPlaceholder}
                      style={css(inputStyle + 'text-transform:uppercase;letter-spacing:0.1em;')}
                    />
                    <FX as="button" type="button" onClick={applyPromo} style={ghostBtn + 'white-space:nowrap;'} hover="border-color:#C2A56B;">{t.promoApply}</FX>
                  </div>
                  {promoMsg === 'ok' && <p style={css('font-family:var(--font-jost),sans-serif;font-size:13px;color:#3E7C58;margin:8px 0 0;')}>✓ {t.promoApplied.replace('{pct}', String(promoPct))}</p>}
                  {promoMsg === 'bad' && <p style={css('font-family:var(--font-jost),sans-serif;font-size:13px;color:#9B4444;margin:8px 0 0;')}>{t.promoInvalid}</p>}
                </div>
              )}

              {/* Arrive-early notice */}
              <div style={css('margin-top:22px;background:#FAF5EC;border:1px solid #E6CF95;border-radius:2px;padding:12px 16px;font-family:var(--font-cormorant),serif;font-style:italic;font-size:16px;color:#6E5E50;')}>
                {t.arriveEarly}
              </div>
            </div>
          )}
        </div>

        {withCart && <CartPanel t={t} guestCount={guestCount} carts={carts} info={info} />}
      </div>

      {step >= 2 && (
        <>
          <div style={css('height:88px;')} aria-hidden="true" />
          <ActionBar t={t} count={allItems.length} minutes={totalMin} onBack={() => setStep(step - 1)} primary={barPrimary} />
        </>
      )}
    </Shell>
  );
}

function fmtDur(min) {
  if (!min) return '';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h ? h + 'h ' : ''}${m ? m + 'm' : ''}`.trim();
}

function ActionBar({ t, count, minutes, onBack, primary }) {
  return (
    <div style={css('position:fixed;left:0;right:0;bottom:0;z-index:55;background:rgba(250,245,236,0.94);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-top:1px solid rgba(194,165,107,0.3);padding:12px clamp(16px,5vw,40px) calc(12px + env(safe-area-inset-bottom));')}>
      <div style={css('max-width:1100px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:14px;')}>
        <div style={css("font-family:var(--font-jost),sans-serif;font-size:12.5px;color:#8A7965;display:flex;align-items:center;gap:8px;")}>
          <span style={css('width:6px;height:6px;background:#C2A56B;transform:rotate(45deg);flex-shrink:0;')} />
          {count > 0 ? <span><strong style={css('color:#3D2F25;font-weight:500;')}>{count}</strong> · {fmtDur(minutes)}</span> : <span>—</span>}
        </div>
        <div style={css('display:flex;align-items:center;gap:10px;')}>
          <FX as="button" onClick={onBack} style="font-family:var(--font-jost),sans-serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#8A7965;background:transparent;border:1px solid rgba(194,165,107,0.45);padding:13px 18px;cursor:pointer;border-radius:1px;min-height:46px;" hover="border-color:#C2A56B;color:#3D2F25;">← {t.backBtn}</FX>
          {primary && (
            <FX as="button" onClick={primary.onClick} aria-disabled={primary.disabled || undefined} style={"font-family:var(--font-jost),sans-serif;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:#3D2F25;font-weight:500;background:linear-gradient(135deg,#E6CF95,#C2A56B);border:none;padding:14px 30px;cursor:pointer;border-radius:1px;box-shadow:0 10px 26px -10px rgba(194,165,107,0.6);min-height:46px;" + (primary.disabled ? 'opacity:0.6;cursor:wait;pointer-events:none;' : '')} hover="transform:translateY(-2px);">{primary.label}</FX>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- subcomponents ----------
function Shell({ t, children }) {
  return (
    <section style={css('max-width:1100px;margin:0 auto;padding:clamp(40px,6vw,84px) clamp(20px,5vw,44px) clamp(60px,8vw,110px);min-height:60dvh;')}>
      <div style={css('text-align:center;margin-bottom:clamp(30px,4vw,48px);')}>
        <div style={css(eyebrow + 'margin-bottom:14px;')}>{t.reserveEyebrow}</div>
        <h1 style={css(heading + 'font-size:clamp(28px,5vw,50px);')}>{t.bookTitle}</h1>
      </div>
      {children}
    </section>
  );
}

function Stepper({ steps, step }) {
  return (
    <div style={css('display:flex;flex-wrap:wrap;justify-content:center;gap:8px 18px;margin-bottom:clamp(28px,4vw,44px);')}>
      {steps.map((label, i) => {
        const n = i + 1;
        const on = n <= step;
        return (
          <div key={label} style={css('display:flex;align-items:center;gap:8px;')}>
            <span style={css('width:23px;height:23px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--font-jost),sans-serif;font-size:11px;' + (on ? 'background:linear-gradient(135deg,#E6CF95,#C2A56B);color:#3D2F25;' : 'border:1px solid rgba(194,165,107,0.5);color:#A8967C;'))}>{n}</span>
            <span style={css("font-family:var(--font-jost),sans-serif;font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;" + (n === step ? 'color:#3D2F25;font-weight:500;' : 'color:#A8967C;'))}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

function ServicePicker({ t, grouped, packages, cart, pkgBySlug, onToggle, onPackage, suggestions, svcBySlug, matched }) {
  const inCart = (slug) => cart.includes(slug);
  const hasPackage = cart.some((s) => pkgBySlug.has(s));
  return (
    <div>
      {matched && (
        <div style={css('background:#F3EADA;border:1px solid rgba(194,165,107,0.4);border-radius:2px;padding:14px 18px;margin-bottom:20px;display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;')}>
          <span style={css("font-family:var(--font-cormorant),serif;font-style:italic;font-size:16px;color:#6E5E50;")}>{t.packageNotice.replace('{name}', matched.name)}</span>
          <FX as="button" onClick={() => onPackage(slugify(matched.name))} style="font-family:var(--font-jost),sans-serif;font-size:10.5px;letter-spacing:0.16em;text-transform:uppercase;color:#3D2F25;background:linear-gradient(135deg,#E6CF95,#C2A56B);border:none;padding:9px 15px;cursor:pointer;border-radius:1px;" hover="transform:translateY(-1px);">{t.switchToPackage}</FX>
        </div>
      )}

      {grouped.map((g) => (
        <div key={g.category} style={css('margin-bottom:26px;')}>
          <div style={css(eyebrow + 'margin-bottom:14px;')}>{g.label}</div>
          <div style={css('display:grid;grid-template-columns:repeat(auto-fit,minmax(min(260px,100%),1fr));gap:12px;')}>
            {g.items.map((s) => (
              <Row key={s.slug} t={t} name={s.name} duration={s.durationMin} selected={inCart(s.slug)} disabled={hasPackage} onClick={() => onToggle(s.slug)} />
            ))}
          </div>
        </div>
      ))}

      <div style={css('margin-bottom:8px;')}>
        <div style={css(eyebrow + 'margin-bottom:14px;')}>{t.journeys}</div>
        <div style={css('display:grid;grid-template-columns:repeat(auto-fit,minmax(min(260px,100%),1fr));gap:12px;')}>
          {packages.map((p) => (
            <Row key={p.name} t={t} name={p.name} duration={p.durationMin} selected={inCart(slugify(p.name))} onClick={() => (inCart(slugify(p.name)) ? onToggle(slugify(p.name)) : onPackage(slugify(p.name)))} />
          ))}
        </div>
      </div>

      {suggestions.length > 0 && (
        <div style={css('margin-top:24px;background:#FFFDF8;border:1px dashed rgba(194,165,107,0.5);border-radius:2px;padding:18px 20px;')}>
          <div style={css("font-family:var(--font-pinyon),cursive;font-size:26px;color:#C2A56B;line-height:1;margin-bottom:10px;")}>{t.completeRitual}</div>
          <div style={css('display:flex;flex-wrap:wrap;gap:10px;')}>
            {suggestions.map((slug) => {
              const s = svcBySlug.get(slug);
              return (
                <FX key={slug} as="button" onClick={() => onToggle(slug)} style="display:flex;align-items:center;gap:8px;font-family:var(--font-jost),sans-serif;font-size:12.5px;color:#3D2F25;background:#F3EADA;border:1px solid rgba(194,165,107,0.4);padding:9px 14px;cursor:pointer;border-radius:2px;" hover="border-color:#C2A56B;">
                  {s?.name} · {s?.durationMin}′
                  <span style={css("font-family:var(--font-jost),sans-serif;font-size:10px;letter-spacing:0.1em;color:#C2A56B;")}>−{CROSS_SELL_DISCOUNT_PCT}%</span>
                </FX>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ t, name, duration, selected, disabled, onClick }) {
  return (
    <FX as="button" onClick={disabled && !selected ? undefined : onClick} style={'display:flex;align-items:center;justify-content:space-between;gap:12px;text-align:left;cursor:' + (disabled && !selected ? 'not-allowed' : 'pointer') + ';padding:15px 16px;border-radius:2px;background:#FFFDF8;transition:border-color .3s ease;' + (selected ? 'border:1px solid #C2A56B;' : 'border:1px solid rgba(194,165,107,0.3);') + (disabled && !selected ? 'opacity:0.4;' : '')} hover={disabled && !selected ? '' : 'border-color:#C2A56B;'}>
      <span>
        <span style={css("display:block;font-family:var(--font-cinzel),serif;font-size:15px;color:#3D2F25;")}>{name}</span>
        <span style={css("font-family:var(--font-jost),sans-serif;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#C2A56B;")}>{duration} {t.minShort}</span>
      </span>
      <span style={css('flex-shrink:0;font-family:var(--font-jost),sans-serif;font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:' + (selected ? '#C2A56B' : '#A8967C') + ';')}>{selected ? '✓ ' + t.added : '+ ' + t.add}</span>
    </FX>
  );
}

function Field({ label, value, onChange, type = 'text', id, autoComplete }) {
  return (
    <div>
      <label htmlFor={id} style={css(labelStyle)}>{label}</label>
      <FX as="input" id={id} name={id} type={type} autoComplete={autoComplete} value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle} focus="border-color:#C2A56B;" />
    </div>
  );
}

function CartPanel({ t, guestCount, carts, info }) {
  return (
    <aside style={css(card + 'padding:24px 24px 26px;position:sticky;top:calc(90px + env(safe-area-inset-top));max-height:calc(100dvh - 110px);overflow-y:auto;')}>
      <div style={css(eyebrow + 'margin-bottom:16px;')}>{t.yourBooking}</div>
      {Array.from({ length: guestCount }, (_, g) => {
        const items = carts[g].map(info);
        return (
          <div key={g} style={css('margin-bottom:18px;')}>
            {guestCount === 2 && <div style={css("font-family:var(--font-jost),sans-serif;font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:#3D2F25;font-weight:500;margin-bottom:8px;")}>{t.guest} {g + 1}</div>}
            {items.length === 0 && <div style={css("font-family:var(--font-cormorant),serif;font-style:italic;font-size:15px;color:#A8967C;")}>—</div>}
            {items.map((it, idx) => (
              <div key={it.slug} style={css('display:flex;justify-content:space-between;gap:10px;font-family:var(--font-jost),sans-serif;font-size:13px;color:#3D2F25;line-height:1.9;')}>
                <span>{it.name} <span style={css('color:#A8967C;')}>· {it.durationMin}{t.minShort}</span>{it.kind === 'service' && idx > 0 ? <span style={css('color:#C2A56B;')}> −{CROSS_SELL_DISCOUNT_PCT}%</span> : null}</span>
              </div>
            ))}
          </div>
        );
      })}
      <div style={css('height:1px;background:rgba(194,165,107,0.3);margin:6px 0 14px;')} />
      <div style={css('display:flex;justify-content:space-between;align-items:baseline;')}>
        <span style={css("font-family:var(--font-jost),sans-serif;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#A8967C;")}>{t.total}</span>
        <span style={css("font-family:var(--font-cormorant),serif;font-size:18px;font-style:italic;color:#C2A56B;")}>{t.priceTbd}</span>
      </div>
    </aside>
  );
}

function Italic({ children }) {
  return <p style={css("font-family:var(--font-cormorant),serif;font-style:italic;font-size:18px;color:#8A7965;margin:6px 0;")}>{children}</p>;
}
