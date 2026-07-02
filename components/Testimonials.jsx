'use client';
import { css } from '@/lib/css';
import { Reveal } from './animations/Reveal';
import { TESTIMONIALS } from '@/lib/data';

export default function Testimonials() {
  return (
    <section style={css('max-width:1240px;margin:0 auto;padding:clamp(70px,9vw,128px) clamp(24px,6vw,72px);')}>
      <Reveal style="text-align:center;margin-bottom:clamp(42px,5vw,68px);">
        <div style={css('display:flex;align-items:center;justify-content:center;gap:16px;margin-bottom:22px;')}>
          <div style={css('height:1px;width:54px;background:linear-gradient(90deg,transparent,#C2A56B);')} />
          <div style={css('width:6px;height:6px;background:#C2A56B;transform:rotate(45deg);')} />
          <div style={css('height:1px;width:54px;background:linear-gradient(90deg,#C2A56B,transparent);')} />
        </div>
        <div style={css("font-family:var(--font-jost),sans-serif;font-size:12px;letter-spacing:0.34em;text-transform:uppercase;color:#C2A56B;margin-bottom:16px;")}>Kind Words</div>
        <h2 style={css("font-family:var(--font-cinzel),serif;font-weight:500;font-size:clamp(28px,3.6vw,42px);letter-spacing:0.04em;color:#3D2F25;margin:0;")}>Guest Reflections</h2>
      </Reveal>

      <div style={css('display:grid;grid-template-columns:repeat(auto-fit,minmax(min(300px,100%),1fr));gap:clamp(20px,2.4vw,32px);')}>
        {TESTIMONIALS.map((tst, i) => (
          <Reveal key={tst.name} delay={i * 0.1} style="display:flex;">
            <figure style={css('display:flex;flex-direction:column;width:100%;margin:0;background:#FFFDF8;border:1px solid rgba(194,165,107,0.25);padding:clamp(28px,3vw,40px);box-shadow:0 18px 42px -30px rgba(61,47,37,0.5);')}>
              <div style={css("font-family:var(--font-cormorant),serif;font-size:60px;line-height:0.6;color:rgba(194,165,107,0.5);height:28px;")}>&ldquo;</div>
              <blockquote style={css("font-family:var(--font-cormorant),serif;font-style:italic;font-size:clamp(18px,1.5vw,21px);line-height:1.6;color:#3D2F25;margin:0 0 24px;flex:1;")}>
                {tst.quote}
              </blockquote>
              <div style={css('height:1px;background:linear-gradient(90deg,#C2A56B,rgba(194,165,107,0));margin-bottom:18px;')} />
              <figcaption>
                <div style={css("font-family:var(--font-cinzel),serif;font-weight:500;font-size:15px;letter-spacing:0.04em;color:#3D2F25;margin-bottom:5px;")}>{tst.name}</div>
                <div style={css("font-family:var(--font-jost),sans-serif;font-size:10.5px;letter-spacing:0.2em;text-transform:uppercase;color:#C2A56B;")}>{tst.detail}</div>
              </figcaption>
            </figure>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
