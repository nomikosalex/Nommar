'use client';
import { useRouter } from 'next/navigation';
import { css } from '@/lib/css';
import { FX } from '@/lib/fx';
import { useLang } from '@/lib/lang';
import { CONFIG } from '@/lib/site.config';
import Placeholder from '@/components/Placeholder';
import Testimonials from '@/components/Testimonials';
import { Reveal } from '@/components/animations/Reveal';
import { Parallax } from '@/components/animations/Parallax';
import { HOME_CATS } from '@/lib/data';

export default function Home() {
  const { t } = useLang();
  const router = useRouter();
  const heroStyle = CONFIG.heroStyle;

  return (
    <div>
      {/* HERO: centered over image */}
      {heroStyle === 'centered' && (
        <section style={css('position:relative;min-height:90dvh;display:flex;align-items:center;justify-content:center;overflow:hidden;')}>
          <Parallax style="position:absolute;inset:0;">
            <Placeholder label="santorini wellness · sea light" style="width:100%;height:100%;" />
          </Parallax>
          <div style={css('position:absolute;inset:0;background:radial-gradient(120% 90% at 50% 45%,rgba(250,245,236,0.62),rgba(250,245,236,0.93) 78%);')} />
          <Reveal style="position:relative;text-align:center;padding:90px clamp(20px,5vw,40px);display:flex;flex-direction:column;align-items:center;">
            <div style={css("font-family:var(--font-jost),sans-serif;font-size:12px;letter-spacing:0.4em;text-transform:uppercase;color:#C2A56B;margin-bottom:26px;")}>Kamari · Santorini</div>
            <img src="/assets/logo-medallion.png" alt="Nommar — Beauty &amp; Spa by Margarita" style={css('width:clamp(250px,30vw,360px);height:auto;display:block;filter:drop-shadow(0 20px 40px rgba(194,165,107,0.25));')} />
            <p style={css("font-family:var(--font-cormorant),serif;font-style:italic;font-weight:400;font-size:clamp(23px,3.2vw,38px);line-height:1.4;color:#3D2F25;max-width:18ch;margin:34px 0 0;")}>&ldquo;{t.tagline}&rdquo;</p>
            <FX as="button" onClick={() => router.push('/book')} style="margin-top:40px;font-family:var(--font-jost),sans-serif;font-size:12px;letter-spacing:0.24em;text-transform:uppercase;color:#3D2F25;font-weight:500;background:linear-gradient(135deg,#E6CF95,#C2A56B);border:none;padding:16px 38px;cursor:pointer;border-radius:1px;box-shadow:0 12px 30px -10px rgba(194,165,107,0.6);transition:transform .4s ease,box-shadow .4s ease;" hover="transform:translateY(-3px);box-shadow:0 18px 38px -12px rgba(194,165,107,0.7);">{t.bookRitual}</FX>
          </Reveal>
        </section>
      )}

      {/* HERO: split */}
      {heroStyle === 'split' && (
        <section style={css('display:grid;grid-template-columns:repeat(auto-fit,minmax(min(430px,100%),1fr));min-height:86dvh;')}>
          <div style={css('display:flex;flex-direction:column;justify-content:center;padding:clamp(48px,7vw,110px) clamp(24px,6vw,90px);')}>
            <div style={css("font-family:var(--font-jost),sans-serif;font-size:12px;letter-spacing:0.4em;text-transform:uppercase;color:#C2A56B;margin-bottom:24px;")}>Kamari · Santorini</div>
            <div style={css("font-family:var(--font-cinzel),serif;font-size:clamp(44px,7vw,86px);font-weight:600;letter-spacing:0.08em;line-height:1;background:linear-gradient(180deg,#BFA15F,#E6CF95 50%,#BFA15F);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;")}>NOMMAR</div>
            <div style={css("font-family:var(--font-jost),sans-serif;font-size:12px;letter-spacing:0.36em;text-transform:uppercase;color:#A8967C;margin-top:14px;")}>Beauty &amp; Spa</div>
            <div style={css("font-family:var(--font-pinyon),cursive;font-size:38px;color:#C2A56B;margin-top:2px;line-height:1.1;")}>by Margarita</div>
            <p style={css("font-family:var(--font-cormorant),serif;font-style:italic;font-size:clamp(21px,2.4vw,30px);line-height:1.45;color:#3D2F25;max-width:22ch;margin:32px 0 0;")}>&ldquo;{t.tagline}&rdquo;</p>
            <div>
              <FX as="button" onClick={() => router.push('/book')} style="margin-top:38px;font-family:var(--font-jost),sans-serif;font-size:12px;letter-spacing:0.24em;text-transform:uppercase;color:#3D2F25;font-weight:500;background:linear-gradient(135deg,#E6CF95,#C2A56B);border:none;padding:16px 38px;cursor:pointer;border-radius:1px;box-shadow:0 12px 30px -10px rgba(194,165,107,0.6);transition:transform .4s ease;" hover="transform:translateY(-3px);">{t.bookRitual}</FX>
            </div>
          </div>
          <Parallax style="min-height:46vh;">
            <Placeholder label="japanese head spa · water & light" style="width:100%;height:100%;" />
          </Parallax>
        </section>
      )}

      {/* HERO: band */}
      {heroStyle === 'band' && (
        <section>
          <Reveal style="text-align:center;padding:clamp(56px,8vw,104px) clamp(20px,5vw,40px) clamp(40px,5vw,60px);display:flex;flex-direction:column;align-items:center;">
            <div style={css("font-family:var(--font-jost),sans-serif;font-size:12px;letter-spacing:0.4em;text-transform:uppercase;color:#C2A56B;margin-bottom:24px;")}>Kamari · Santorini</div>
            <img src="/assets/logo-medallion.png" alt="Nommar" style={css('width:clamp(240px,28vw,330px);height:auto;filter:drop-shadow(0 18px 36px rgba(194,165,107,0.22));')} />
            <p style={css("font-family:var(--font-cormorant),serif;font-style:italic;font-size:clamp(22px,3vw,36px);line-height:1.4;color:#3D2F25;max-width:18ch;margin:30px 0 0;")}>&ldquo;{t.tagline}&rdquo;</p>
            <FX as="button" onClick={() => router.push('/book')} style="margin-top:36px;font-family:var(--font-jost),sans-serif;font-size:12px;letter-spacing:0.24em;text-transform:uppercase;color:#3D2F25;font-weight:500;background:linear-gradient(135deg,#E6CF95,#C2A56B);border:none;padding:16px 38px;cursor:pointer;border-radius:1px;box-shadow:0 12px 30px -10px rgba(194,165,107,0.6);transition:transform .4s ease;" hover="transform:translateY(-3px);">{t.bookRitual}</FX>
          </Reveal>
          <Parallax style="height:clamp(280px,46vh,520px);">
            <Placeholder label="santorini calm · linen & light" style="width:100%;height:100%;" />
          </Parallax>
        </section>
      )}

      {/* INTRO */}
      <section style={css('max-width:880px;margin:0 auto;padding:clamp(70px,9vw,128px) clamp(24px,6vw,40px);text-align:center;')}>
        <Reveal>
          <div style={css('display:flex;align-items:center;justify-content:center;gap:16px;margin-bottom:30px;')}>
            <div style={css('height:1px;width:54px;background:linear-gradient(90deg,transparent,#C2A56B);')} />
            <div style={css('width:6px;height:6px;background:#C2A56B;transform:rotate(45deg);')} />
            <div style={css('height:1px;width:54px;background:linear-gradient(90deg,#C2A56B,transparent);')} />
          </div>
          <p style={css("font-family:var(--font-cormorant),serif;font-size:clamp(22px,2.7vw,32px);line-height:1.6;color:#3D2F25;font-weight:400;margin:0;")}>At Nommar, we believe wellness is not a luxury but a necessity. Our treatments are designed to create moments of deep relaxation, helping you disconnect from daily stress and reconnect with yourself.</p>
          <p style={css("font-family:var(--font-jost),sans-serif;font-weight:300;font-size:clamp(15px,1.2vw,17px);line-height:1.95;color:#8A7965;max-width:60ch;margin:28px auto 0;")}>Inspired by mindful rituals and personalized care, every experience is tailored to restore balance to body and mind.</p>
        </Reveal>
      </section>

      {/* SIGNATURE EXPERIENCE */}
      <section style={css('background:#F3EADA;')}>
        <div style={css('max-width:1240px;margin:0 auto;padding:clamp(64px,8vw,120px) clamp(24px,6vw,72px);display:grid;grid-template-columns:repeat(auto-fit,minmax(min(420px,100%),1fr));gap:clamp(36px,5vw,72px);align-items:center;')}>
          <Reveal direction="right" style="position:relative;overflow:hidden;box-shadow:0 30px 60px -34px rgba(61,47,37,0.5);">
            <div style={css('aspect-ratio:4/5;')}>
              <Placeholder label="warm water · scalp ritual" style="width:100%;height:100%;" />
            </div>
          </Reveal>
          <Reveal direction="left">
            <div style={css("font-family:var(--font-jost),sans-serif;font-size:12px;letter-spacing:0.34em;text-transform:uppercase;color:#C2A56B;margin-bottom:18px;")}>Signature Experience</div>
            <h2 style={css("font-family:var(--font-cinzel),serif;font-weight:500;font-size:clamp(28px,3.6vw,44px);letter-spacing:0.03em;color:#3D2F25;margin:0 0 8px;line-height:1.18;")}>The Japanese Head Spa</h2>
            <div style={css("font-family:var(--font-pinyon),cursive;font-size:30px;color:#C2A56B;margin-bottom:22px;")}>a ritual for the senses</div>
            <p style={css("font-family:var(--font-jost),sans-serif;font-weight:300;font-size:clamp(15px,1.2vw,17px);line-height:1.95;color:#6E5E50;max-width:52ch;margin:0 0 24px;")}>Drawing on the quiet discipline of Japanese head-spa care, our signature ritual moves slowly through scalp cleansing, therapeutic massage and restorative facial work — closing with a warm mineral-salt foot soak. A complete journey from head to toe, designed to still the mind.</p>
            <FX as="button" onClick={() => router.push('/services')} style="font-family:var(--font-jost),sans-serif;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:#3D2F25;font-weight:500;background:transparent;border:1px solid #C2A56B;padding:14px 30px;cursor:pointer;border-radius:1px;transition:background .35s ease,color .35s ease;" hover="background:#C2A56B;color:#FAF5EC;">{t.exploreHeadSpa}</FX>
          </Reveal>
        </div>
      </section>

      {/* CATEGORY PREVIEWS */}
      <section style={css('max-width:1280px;margin:0 auto;padding:clamp(70px,9vw,128px) clamp(24px,6vw,72px);')}>
        <Reveal style="text-align:center;margin-bottom:clamp(42px,5vw,68px);">
          <div style={css("font-family:var(--font-jost),sans-serif;font-size:12px;letter-spacing:0.34em;text-transform:uppercase;color:#C2A56B;margin-bottom:16px;")}>Our Rituals</div>
          <h2 style={css("font-family:var(--font-cinzel),serif;font-weight:500;font-size:clamp(28px,3.6vw,42px);letter-spacing:0.04em;color:#3D2F25;margin:0;")}>A World of Wellness</h2>
        </Reveal>
        <div style={css('display:grid;grid-template-columns:repeat(auto-fit,minmax(min(240px,100%),1fr));gap:clamp(20px,2.4vw,32px);')}>
          {HOME_CATS.map((cat, i) => (
            <Reveal key={cat.name} delay={i * 0.08}>
              <FX as="button" onClick={() => router.push('/services')} style="display:block;width:100%;text-align:left;background:#FFFDF8;border:1px solid rgba(194,165,107,0.25);cursor:pointer;padding:0;overflow:hidden;box-shadow:0 18px 40px -30px rgba(61,47,37,0.5);transition:transform .4s ease,box-shadow .4s ease,border-color .4s ease;" hover="transform:translateY(-6px);box-shadow:0 30px 56px -30px rgba(61,47,37,0.45);border-color:rgba(194,165,107,0.55);">
                <div style={css('height:200px;')}>
                  <Placeholder label={cat.img} style="width:100%;height:100%;" />
                </div>
                <div style={css('padding:24px 24px 28px;')}>
                  <h3 style={css("font-family:var(--font-cinzel),serif;font-weight:500;font-size:21px;letter-spacing:0.04em;color:#3D2F25;margin:0 0 8px;")}>{cat.name}</h3>
                  <p style={css("font-family:var(--font-jost),sans-serif;font-weight:300;font-size:14px;line-height:1.6;color:#8A7965;margin:0 0 16px;")}>{cat.line}</p>
                  <span style={css("font-family:var(--font-jost),sans-serif;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#C2A56B;")}>{t.view} &rarr;</span>
                </div>
              </FX>
            </Reveal>
          ))}
        </div>
      </section>

      {/* MARGARITA TEASER */}
      <section style={css('background:#F3EADA;')}>
        <Reveal style="max-width:880px;margin:0 auto;padding:clamp(64px,8vw,120px) clamp(24px,6vw,40px);text-align:center;">
          <div style={css("font-family:var(--font-pinyon),cursive;font-size:clamp(40px,6vw,64px);color:#C2A56B;line-height:1;margin-bottom:18px;")}>by Margarita</div>
          <p style={css("font-family:var(--font-cormorant),serif;font-style:italic;font-size:clamp(21px,2.6vw,30px);line-height:1.6;color:#3D2F25;max-width:30ch;margin:0 auto 30px;")}>&ldquo;Wellness, to me, is care made personal — a moment that belongs entirely to you.&rdquo;</p>
          <FX as="button" onClick={() => router.push('/about')} style="font-family:var(--font-jost),sans-serif;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:#3D2F25;font-weight:500;background:transparent;border:1px solid #C2A56B;padding:14px 30px;cursor:pointer;border-radius:1px;transition:background .35s ease,color .35s ease;" hover="background:#C2A56B;color:#FAF5EC;">{t.ourStory}</FX>
        </Reveal>
      </section>

      {/* TESTIMONIALS */}
      <Testimonials />
    </div>
  );
}
