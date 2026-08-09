'use client';
import { css } from '@/lib/css';
import { useLang } from '@/lib/lang';
import { Reveal } from '@/components/animations/Reveal';
import { localizedFaqs } from '@/lib/data';

export default function FAQ() {
  const { t, lang } = useLang();
  const faqs = localizedFaqs(lang);

  return (
    <div>
      <section style={css('text-align:center;padding:clamp(64px,8vw,112px) clamp(24px,6vw,40px) clamp(10px,2vw,30px);')}>
        <div style={css("font-family:var(--font-jost),sans-serif;font-size:12px;letter-spacing:0.34em;text-transform:uppercase;color:#C2A56B;margin-bottom:18px;")}>{t.faqEyebrow}</div>
        <h1 style={css("font-family:var(--font-cinzel),serif;font-weight:500;font-size:clamp(32px,5vw,58px);letter-spacing:0.05em;color:#3D2F25;margin:0 0 20px;")}>{t.faqTitle}</h1>
        <p style={css("font-family:var(--font-jost),sans-serif;font-weight:300;font-size:clamp(15px,1.2vw,17px);line-height:1.8;color:#8A7965;max-width:56ch;margin:0 auto;")}>{t.faqSubtitle}</p>
      </section>

      <section style={css('max-width:820px;margin:0 auto;padding:clamp(20px,4vw,40px) clamp(24px,6vw,40px) clamp(80px,9vw,128px);')}>
        <div style={css('display:flex;flex-direction:column;gap:14px;')}>
          {faqs.map((f, i) => (
            <Reveal key={f.q} delay={Math.min(i * 0.05, 0.3)}>
              <details style={css('background:#FFFDF8;border:1px solid rgba(194,165,107,0.28);border-radius:2px;')}>
                <summary style={css("cursor:pointer;padding:22px 26px;display:flex;align-items:center;justify-content:space-between;gap:16px;")}>
                  <h2 style={css("margin:0;font-family:var(--font-cinzel),serif;font-weight:500;font-size:clamp(16px,1.8vw,19px);letter-spacing:0.01em;color:#3D2F25;line-height:1.4;")}>{f.q}</h2>
                  <span aria-hidden="true" style={css('flex-shrink:0;width:22px;height:22px;border:1px solid rgba(194,165,107,0.5);border-radius:50%;color:#C2A56B;font-size:14px;line-height:20px;text-align:center;')}>+</span>
                </summary>
                <p style={css("font-family:var(--font-jost),sans-serif;font-weight:300;font-size:15px;line-height:1.85;color:#6E5E50;margin:0;padding:0 26px 24px;")}>{f.a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </section>
    </div>
  );
}
