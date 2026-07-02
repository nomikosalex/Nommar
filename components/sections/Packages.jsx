'use client';
import { useRouter } from 'next/navigation';
import { css } from '@/lib/css';
import { FX } from '@/lib/fx';
import { useLang } from '@/lib/lang';
import { CONFIG } from '@/lib/site.config';
import Placeholder from '@/components/Placeholder';
import { Reveal } from '@/components/animations/Reveal';
import { PACKAGES, priceLabel, slugify } from '@/lib/data';

export default function Packages() {
  const { t } = useLang();
  const router = useRouter();
  const price = priceLabel(CONFIG.priceMode);

  return (
    <div style={css('background:#F3EADA;')}>
      <section style={css('text-align:center;padding:clamp(64px,8vw,112px) clamp(24px,6vw,40px) clamp(24px,3vw,44px);')}>
        <div style={css("font-family:var(--font-jost),sans-serif;font-size:12px;letter-spacing:0.34em;text-transform:uppercase;color:#C2A56B;margin-bottom:18px;")}>Curated Journeys</div>
        <h1 style={css("font-family:var(--font-cinzel),serif;font-weight:500;font-size:clamp(30px,4.6vw,54px);letter-spacing:0.04em;color:#3D2F25;margin:0;line-height:1.15;")}>Nommar Wellness Journeys</h1>
        <p style={css("font-family:var(--font-cormorant),serif;font-style:italic;font-size:clamp(18px,2vw,24px);color:#8A7965;margin:18px auto 0;max-width:42ch;")}>Thoughtfully combined rituals, for those who wish to surrender to the experience entirely.</p>
      </section>
      <section style={css('max-width:1180px;margin:0 auto;padding:0 clamp(24px,6vw,72px) clamp(64px,8vw,120px);display:grid;grid-template-columns:repeat(auto-fit,minmax(min(420px,100%),1fr));gap:clamp(24px,3vw,40px);')}>
        {PACKAGES.map((pkg, i) => (
          <Reveal key={pkg.n} delay={i * 0.06} style="display:flex;">
            <FX style="display:flex;flex-direction:column;width:100%;background:#FAF6EE;border:1px solid rgba(194,165,107,0.3);overflow:hidden;box-shadow:0 24px 50px -34px rgba(61,47,37,0.5);transition:transform .4s ease,box-shadow .4s ease;" hover="transform:translateY(-6px);box-shadow:0 38px 70px -36px rgba(61,47,37,0.45);">
              <div style={css('position:relative;height:200px;')}>
                <Placeholder label={pkg.img} style="width:100%;height:100%;" />
                {pkg.badge && (
                  <div style={css("position:absolute;top:16px;right:16px;font-family:var(--font-jost),sans-serif;font-size:9.5px;letter-spacing:0.2em;text-transform:uppercase;color:#3D2F25;font-weight:500;background:linear-gradient(135deg,#E6CF95,#C2A56B);padding:7px 14px;border-radius:1px;")}>{pkg.badge}</div>
                )}
              </div>
              <div style={css('padding:clamp(28px,3vw,40px);display:flex;flex-direction:column;flex:1;')}>
                <div style={css('display:flex;align-items:baseline;gap:14px;margin-bottom:6px;')}>
                  <span style={css("font-family:var(--font-cinzel),serif;font-size:15px;color:rgba(194,165,107,0.6);letter-spacing:0.1em;")}>{pkg.n}</span>
                  <span style={css("font-family:var(--font-jost),sans-serif;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#C2A56B;")}>{pkg.duration}</span>
                </div>
                <h2 style={css("font-family:var(--font-cinzel),serif;font-weight:500;font-size:clamp(22px,2.4vw,28px);letter-spacing:0.03em;color:#3D2F25;margin:0 0 12px;line-height:1.2;")}>{pkg.name}</h2>
                <p style={css("font-family:var(--font-cormorant),serif;font-style:italic;font-size:18px;line-height:1.5;color:#6E5E50;margin:0 0 22px;")}>{pkg.desc}</p>
                <div style={css('display:flex;flex-direction:column;gap:11px;margin-bottom:26px;')}>
                  {pkg.includes.map((inc) => (
                    <div key={inc} style={css("display:flex;align-items:center;gap:11px;font-family:var(--font-jost),sans-serif;font-weight:300;font-size:14px;color:#3D2F25;")}>
                      <span style={css('flex-shrink:0;width:6px;height:6px;background:#C2A56B;transform:rotate(45deg);')} />
                      {inc}
                    </div>
                  ))}
                </div>
                <div style={css('flex:1;')} />
                <div style={css('height:1px;background:rgba(194,165,107,0.3);margin-bottom:20px;')} />
                <div style={css('display:flex;align-items:center;justify-content:space-between;gap:14px;')}>
                  <div style={css('display:flex;flex-direction:column;')}>
                    <span style={css("font-family:var(--font-jost),sans-serif;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#A8967C;margin-bottom:3px;")}>Journey from</span>
                    <span style={css("font-family:var(--font-cormorant),serif;font-size:27px;font-weight:600;color:#C2A56B;line-height:1;")}>{price}</span>
                  </div>
                  <FX as="button" onClick={() => router.push('/book?service=' + slugify(pkg.name))} style="font-family:var(--font-jost),sans-serif;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#3D2F25;font-weight:500;background:linear-gradient(135deg,#E6CF95,#C2A56B);border:none;padding:13px 26px;cursor:pointer;border-radius:1px;box-shadow:0 8px 22px -8px rgba(194,165,107,0.6);transition:transform .35s ease;" hover="transform:translateY(-2px);">{t.reserve}</FX>
                </div>
              </div>
            </FX>
          </Reveal>
        ))}
      </section>
    </div>
  );
}
