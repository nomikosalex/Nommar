'use client';
import { css } from '@/lib/css';
import Placeholder from '@/components/Placeholder';
import { Reveal } from '@/components/animations/Reveal';

export default function About() {
  return (
    <div>
      <section style={css('text-align:center;padding:clamp(64px,8vw,112px) clamp(24px,6vw,40px) clamp(10px,2vw,30px);')}>
        <div style={css("font-family:var(--font-jost),sans-serif;font-size:12px;letter-spacing:0.34em;text-transform:uppercase;color:#C2A56B;margin-bottom:18px;")}>Our Story</div>
        <h1 style={css("font-family:var(--font-cinzel),serif;font-weight:500;font-size:clamp(32px,5vw,58px);letter-spacing:0.05em;color:#3D2F25;margin:0;")}>About Nommar</h1>
      </section>
      <section style={css('max-width:1180px;margin:0 auto;padding:clamp(40px,5vw,72px) clamp(24px,6vw,72px);display:grid;grid-template-columns:repeat(auto-fit,minmax(min(380px,100%),1fr));gap:clamp(40px,5vw,80px);align-items:center;')}>
        <Reveal direction="right" style="position:relative;overflow:hidden;box-shadow:0 30px 64px -34px rgba(61,47,37,0.5);">
          <div style={css('aspect-ratio:4/5;')}>
            <Placeholder label="margarita · portrait" style="width:100%;height:100%;" />
          </div>
        </Reveal>
        <Reveal direction="left">
          <div style={css("font-family:var(--font-pinyon),cursive;font-size:clamp(38px,5vw,56px);color:#C2A56B;line-height:1;margin-bottom:8px;")}>by Margarita</div>
          <h2 style={css("font-family:var(--font-cinzel),serif;font-weight:500;font-size:clamp(24px,2.8vw,34px);letter-spacing:0.03em;color:#3D2F25;margin:0 0 24px;line-height:1.25;")}>A vision of mindful wellness</h2>
          <p style={css("font-family:var(--font-jost),sans-serif;font-weight:300;font-size:clamp(15px,1.2vw,17px);line-height:1.95;color:#6E5E50;margin:0 0 18px;")}>Nommar was born from a simple belief — that true care begins with slowing down. After years devoted to wellness and beauty, Margarita envisioned a sanctuary in Kamari where the rhythm of Santorini meets the quiet discipline of Japanese head-spa rituals.</p>
          <p style={css("font-family:var(--font-jost),sans-serif;font-weight:300;font-size:clamp(15px,1.2vw,17px);line-height:1.95;color:#6E5E50;margin:0 0 18px;")}>Here, every treatment is personal. No two guests are the same, and no two rituals should be either. From the first conversation to the final breath of relaxation, each experience is shaped around you — your body, your senses, your need for stillness.</p>
          <p style={css("font-family:var(--font-jost),sans-serif;font-weight:300;font-size:clamp(15px,1.2vw,17px);line-height:1.95;color:#6E5E50;margin:0 0 28px;")}>This is wellness as a necessity, not a luxury. A place to disconnect from the noise of the everyday, and reconnect — gently, completely — with yourself.</p>
          <div style={css("font-family:var(--font-pinyon),cursive;font-size:34px;color:#3D2F25;")}>Margarita</div>
        </Reveal>
      </section>
      <section style={css('background:#F3EADA;margin-top:clamp(40px,5vw,72px);')}>
        <Reveal style="max-width:980px;margin:0 auto;padding:clamp(56px,7vw,100px) clamp(24px,6vw,40px);text-align:center;">
          <div style={css('display:flex;align-items:center;justify-content:center;gap:16px;margin-bottom:28px;')}>
            <div style={css('height:1px;width:54px;background:linear-gradient(90deg,transparent,#C2A56B);')} />
            <div style={css('width:6px;height:6px;background:#C2A56B;transform:rotate(45deg);')} />
            <div style={css('height:1px;width:54px;background:linear-gradient(90deg,#C2A56B,transparent);')} />
          </div>
          <div style={css("font-family:var(--font-jost),sans-serif;font-size:12px;letter-spacing:0.34em;text-transform:uppercase;color:#C2A56B;margin-bottom:18px;")}>Our Philosophy</div>
          <p style={css("font-family:var(--font-cormorant),serif;font-style:italic;font-size:clamp(22px,2.8vw,34px);line-height:1.55;color:#3D2F25;max-width:26ch;margin:0 auto;")}>&ldquo;Wellness begins the moment you allow yourself to slow down.&rdquo;</p>
        </Reveal>
      </section>
    </div>
  );
}
