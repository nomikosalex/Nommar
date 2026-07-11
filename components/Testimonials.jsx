'use client';
import { css } from '@/lib/css';
import { FX } from '@/lib/fx';
import { useLang } from '@/lib/lang';
import { Reveal } from './animations/Reveal';
import { GOOGLE_REVIEWS, CONTACT } from '@/lib/data';

// Real Google Business reviews, curated in lib/data.js (quotes stay verbatim in
// their original language). Links out to the Google listing for the full set.

function Stars({ rating }) {
  return (
    <div aria-label={`${rating} out of 5 stars`} style={css('color:#C2A56B;font-size:15px;letter-spacing:3px;line-height:1;')}>
      {'★'.repeat(rating)}
      <span style={css('color:rgba(194,165,107,0.3);')}>{'★'.repeat(5 - rating)}</span>
    </div>
  );
}

const ghostBtn =
  "display:inline-block;font-family:var(--font-jost),sans-serif;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:#3D2F25;font-weight:500;background:transparent;border:1px solid #C2A56B;padding:14px 30px;cursor:pointer;border-radius:1px;text-decoration:none;transition:background .35s ease,color .35s ease;";

export default function Testimonials() {
  const { t } = useLang();

  return (
    <section style={css('max-width:1240px;margin:0 auto;padding:clamp(70px,9vw,128px) clamp(24px,6vw,72px);')}>
      <Reveal style="text-align:center;margin-bottom:clamp(42px,5vw,68px);">
        <div style={css('display:flex;align-items:center;justify-content:center;gap:16px;margin-bottom:22px;')}>
          <div style={css('height:1px;width:54px;background:linear-gradient(90deg,transparent,#C2A56B);')} />
          <div style={css('width:6px;height:6px;background:#C2A56B;transform:rotate(45deg);')} />
          <div style={css('height:1px;width:54px;background:linear-gradient(90deg,#C2A56B,transparent);')} />
        </div>
        <div style={css("font-family:var(--font-jost),sans-serif;font-size:12px;letter-spacing:0.34em;text-transform:uppercase;color:#C2A56B;margin-bottom:16px;")}>{t.kindWords}</div>
        <h2 style={css("font-family:var(--font-cinzel),serif;font-weight:500;font-size:clamp(28px,3.6vw,42px);letter-spacing:0.04em;color:#3D2F25;margin:0;")}>{t.guestReflections}</h2>
      </Reveal>

      {GOOGLE_REVIEWS.length === 0 ? (
        /* No reviews curated yet — invite guests to leave the first ones. */
        <Reveal style="text-align:center;">
          <p style={css("font-family:var(--font-cormorant),serif;font-style:italic;font-size:clamp(19px,2vw,24px);line-height:1.6;color:#6E5E50;max-width:38ch;margin:0 auto 28px;")}>{t.reviewInvite}</p>
          <FX as="a" href={CONTACT.googleBusiness} target="_blank" rel="noopener" style={ghostBtn} hover="background:#C2A56B;color:#FAF5EC;">
            {t.writeReview} &rarr;
          </FX>
        </Reveal>
      ) : (
        <>
          <div style={css('display:grid;grid-template-columns:repeat(auto-fit,minmax(min(300px,100%),1fr));gap:clamp(20px,2.4vw,32px);')}>
            {GOOGLE_REVIEWS.map((rv, i) => (
              <Reveal key={rv.name + i} delay={i * 0.1} style="display:flex;">
                <figure style={css('display:flex;flex-direction:column;width:100%;margin:0;background:#FFFDF8;border:1px solid rgba(194,165,107,0.25);padding:clamp(28px,3vw,40px);box-shadow:0 18px 42px -30px rgba(61,47,37,0.5);')}>
                  <div style={css('display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:16px;')}>
                    <Stars rating={rv.rating} />
                    <span style={css("font-family:var(--font-jost),sans-serif;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#A8967C;")}>{t.viaGoogle}</span>
                  </div>
                  <blockquote style={css("font-family:var(--font-cormorant),serif;font-style:italic;font-size:clamp(18px,1.5vw,21px);line-height:1.6;color:#3D2F25;margin:0 0 24px;flex:1;")}>
                    &ldquo;{rv.quote}&rdquo;
                  </blockquote>
                  <div style={css('height:1px;background:linear-gradient(90deg,#C2A56B,rgba(194,165,107,0));margin-bottom:18px;')} />
                  <figcaption>
                    <div style={css("font-family:var(--font-cinzel),serif;font-weight:500;font-size:15px;letter-spacing:0.04em;color:#3D2F25;margin-bottom:5px;")}>{rv.name}</div>
                    {rv.detail && <div style={css("font-family:var(--font-jost),sans-serif;font-size:10.5px;letter-spacing:0.2em;text-transform:uppercase;color:#C2A56B;")}>{rv.detail}</div>}
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
          <Reveal style="text-align:center;margin-top:clamp(34px,4vw,52px);">
            <FX as="a" href={CONTACT.googleBusiness} target="_blank" rel="noopener" style={ghostBtn} hover="background:#C2A56B;color:#FAF5EC;">
              {t.seeAllReviews} &rarr;
            </FX>
          </Reveal>
        </>
      )}
    </section>
  );
}
