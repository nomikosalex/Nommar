'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { css } from '@/lib/css';
import { FX } from '@/lib/fx';
import { useLang } from '@/lib/lang';
import { CONFIG } from '@/lib/site.config';
import Placeholder from '@/components/Placeholder';
import { Reveal } from '@/components/animations/Reveal';
import { CATEGORIES, AROMAS, priceLabel, slugify } from '@/lib/data';

export default function Services() {
  const { t } = useLang();
  const router = useRouter();
  const [aroma, setAroma] = useState(0);
  const price = priceLabel(CONFIG.priceMode);
  const book = (name) => router.push('/book?service=' + slugify(name));

  return (
    <div>
      <section style={css('text-align:center;padding:clamp(64px,8vw,112px) clamp(24px,6vw,40px) clamp(20px,3vw,40px);')}>
        <div style={css("font-family:var(--font-jost),sans-serif;font-size:12px;letter-spacing:0.34em;text-transform:uppercase;color:#C2A56B;margin-bottom:18px;")}>The Menu</div>
        <h1 style={css("font-family:var(--font-cinzel),serif;font-weight:500;font-size:clamp(32px,5vw,58px);letter-spacing:0.05em;color:#3D2F25;margin:0;")}>Services</h1>
        <p style={css("font-family:var(--font-cormorant),serif;font-style:italic;font-size:clamp(18px,2vw,24px);color:#8A7965;margin:18px auto 0;max-width:40ch;")}>Every ritual is tailored to you. Prices are confirmed at booking.</p>
      </section>

      {CATEGORIES.map((cat) => (
        <section key={cat.index} style={css('max-width:1280px;margin:0 auto;padding:clamp(40px,5vw,72px) clamp(24px,6vw,72px);')}>
          <div style={css('display:flex;align-items:flex-end;gap:20px;margin-bottom:14px;')}>
            <div style={css("font-family:var(--font-cinzel),serif;font-size:clamp(34px,5vw,56px);color:rgba(194,165,107,0.42);line-height:0.8;font-weight:400;")}>{cat.index}</div>
            <h2 style={css("font-family:var(--font-cinzel),serif;font-weight:500;font-size:clamp(24px,3.2vw,38px);letter-spacing:0.04em;color:#3D2F25;margin:0;")}>{cat.name}</h2>
          </div>
          <p style={css("font-family:var(--font-jost),sans-serif;font-weight:300;font-size:clamp(14px,1.1vw,16px);color:#8A7965;margin:0 0 14px;max-width:54ch;")}>{cat.intro}</p>
          <div style={css('height:1px;background:linear-gradient(90deg,#C2A56B,rgba(194,165,107,0));transform-origin:left;animation:lineGrow 1.1s ease .15s both;margin-bottom:clamp(30px,4vw,48px);')} />

          {cat.badges && cat.badges.length > 0 && (
            <div style={css('display:flex;flex-wrap:wrap;gap:18px;margin-bottom:clamp(30px,4vw,46px);')}>
              {cat.badges.map((bd) => (
                <div key={bd.title} style={css('display:flex;align-items:flex-start;gap:14px;background:#FFFDF8;border:1px solid rgba(194,165,107,0.3);padding:18px 22px;max-width:380px;border-radius:2px;box-shadow:0 14px 34px -28px rgba(61,47,37,0.5);')}>
                  <div style={css('flex-shrink:0;width:30px;height:30px;border:1px solid rgba(194,165,107,0.7);border-radius:50%;display:flex;align-items:center;justify-content:center;margin-top:2px;')}>
                    <div style={css('width:7px;height:7px;background:#C2A56B;transform:rotate(45deg);')} />
                  </div>
                  <div>
                    <div style={css("font-family:var(--font-jost),sans-serif;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#3D2F25;font-weight:500;margin-bottom:6px;")}>{bd.title}</div>
                    <div style={css("font-family:var(--font-jost),sans-serif;font-weight:300;font-size:13px;line-height:1.6;color:#8A7965;")}>{bd.note}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={css('display:grid;grid-template-columns:repeat(auto-fit,minmax(min(330px,100%),1fr));gap:clamp(22px,2.5vw,34px);align-items:stretch;')}>
            {cat.services.map((svc, i) => (
              <Reveal key={svc.name} delay={i * 0.06} style="display:flex;">
                <FX style="display:flex;flex-direction:column;width:100%;background:#FFFDF8;border:1px solid rgba(194,165,107,0.25);overflow:hidden;box-shadow:0 18px 42px -30px rgba(61,47,37,0.5);transition:transform .4s ease,box-shadow .4s ease,border-color .4s ease;" hover="transform:translateY(-6px);box-shadow:0 32px 60px -32px rgba(61,47,37,0.45);border-color:rgba(194,165,107,0.55);">
                  <div style={css('position:relative;height:180px;')}>
                    <Placeholder label={svc.img} style="width:100%;height:100%;" />
                    {svc.badge && (
                      <div style={css("position:absolute;top:14px;left:14px;font-family:var(--font-jost),sans-serif;font-size:9.5px;letter-spacing:0.24em;text-transform:uppercase;color:#3D2F25;font-weight:500;background:linear-gradient(135deg,#E6CF95,#C2A56B);padding:6px 13px;border-radius:1px;")}>{svc.badge}</div>
                    )}
                  </div>
                  <div style={css('padding:26px 26px 28px;display:flex;flex-direction:column;flex:1;')}>
                    <div style={css('display:flex;justify-content:space-between;align-items:baseline;gap:14px;')}>
                      <h3 style={css("font-family:var(--font-cinzel),serif;font-weight:500;font-size:19px;letter-spacing:0.02em;color:#3D2F25;margin:0;line-height:1.3;")}>{svc.name}</h3>
                    </div>
                    <div style={css("font-family:var(--font-jost),sans-serif;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#C2A56B;margin:10px 0 16px;")}>{svc.duration}</div>
                    <p style={css("font-family:var(--font-jost),sans-serif;font-weight:300;font-size:14px;line-height:1.75;color:#6E5E50;margin:0 0 18px;")}>{svc.desc}</p>

                    {svc.list && (
                      <div style={css('display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px 18px;margin-bottom:20px;')}>
                        {svc.list.map((b) => (
                          <div key={b} style={css("display:flex;align-items:center;gap:9px;font-family:var(--font-jost),sans-serif;font-weight:300;font-size:12.5px;color:#8A7965;line-height:1.3;")}>
                            <span style={css('flex-shrink:0;width:5px;height:5px;background:#C2A56B;transform:rotate(45deg);')} />
                            {b}
                          </div>
                        ))}
                      </div>
                    )}

                    {svc.isAroma && (
                      <div style={css('margin-bottom:20px;')}>
                        <div style={css("font-family:var(--font-jost),sans-serif;font-size:10.5px;letter-spacing:0.24em;text-transform:uppercase;color:#3D2F25;font-weight:500;margin-bottom:12px;")}>Choose Your Aroma</div>
                        <div style={css('display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px;')}>
                          {AROMAS.map((a, idx) =>
                            idx === aroma ? (
                              <button key={a.name} onClick={() => setAroma(idx)} style={css("font-family:var(--font-jost),sans-serif;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#3D2F25;font-weight:500;background:linear-gradient(135deg,#E6CF95,#C2A56B);border:1px solid #C2A56B;padding:9px 15px;cursor:pointer;border-radius:2px;")}>{a.name}</button>
                            ) : (
                              <FX key={a.name} as="button" onClick={() => setAroma(idx)} style="font-family:var(--font-jost),sans-serif;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#8A7965;font-weight:400;background:transparent;border:1px solid rgba(194,165,107,0.45);padding:9px 15px;cursor:pointer;border-radius:2px;transition:border-color .3s ease,color .3s ease;" hover="border-color:#C2A56B;color:#3D2F25;">{a.name}</FX>
                            )
                          )}
                        </div>
                        <p style={css("font-family:var(--font-cormorant),serif;font-style:italic;font-size:16px;line-height:1.5;color:#6E5E50;margin:0;")}>{AROMAS[aroma].note}</p>
                      </div>
                    )}

                    {svc.options && (
                      <div style={css('margin-bottom:20px;')}>
                        <div style={css("font-family:var(--font-jost),sans-serif;font-size:10.5px;letter-spacing:0.24em;text-transform:uppercase;color:#3D2F25;font-weight:500;margin-bottom:12px;")}>Choose Your Ritual</div>
                        <div style={css('display:flex;flex-wrap:wrap;gap:8px;')}>
                          {svc.options.map((o) => (
                            <span key={o} style={css("font-family:var(--font-jost),sans-serif;font-size:11px;letter-spacing:0.08em;color:#6E5E50;background:#F3EADA;border:1px solid rgba(194,165,107,0.35);padding:9px 16px;border-radius:2px;")}>{o}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {svc.solutions && (
                      <div style={css('margin-bottom:20px;')}>
                        <div style={css("font-family:var(--font-jost),sans-serif;font-size:10.5px;letter-spacing:0.24em;text-transform:uppercase;color:#3D2F25;font-weight:500;margin-bottom:12px;")}>Personalized Solutions</div>
                        <div style={css('display:flex;flex-wrap:wrap;gap:8px;')}>
                          {svc.solutions.map((s) => (
                            <span key={s} style={css("font-family:var(--font-jost),sans-serif;font-size:11px;letter-spacing:0.08em;color:#6E5E50;background:#F3EADA;border:1px solid rgba(194,165,107,0.35);padding:9px 16px;border-radius:2px;")}>{s}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={css('flex:1;')} />
                    <div style={css('height:1px;background:rgba(194,165,107,0.3);margin-bottom:18px;')} />
                    <div style={css('display:flex;align-items:center;justify-content:space-between;gap:14px;')}>
                      <div style={css('display:flex;flex-direction:column;')}>
                        <span style={css("font-family:var(--font-jost),sans-serif;font-size:9px;letter-spacing:0.2em;text-transform:uppercase;color:#A8967C;margin-bottom:3px;")}>Investment</span>
                        <span style={css("font-family:var(--font-cormorant),serif;font-size:24px;font-weight:600;color:#C2A56B;line-height:1;")}>{price}</span>
                      </div>
                      <FX as="button" onClick={() => book(svc.name)} style="font-family:var(--font-jost),sans-serif;font-size:10.5px;letter-spacing:0.18em;text-transform:uppercase;color:#3D2F25;font-weight:500;background:transparent;border:1px solid #C2A56B;padding:11px 20px;cursor:pointer;border-radius:1px;transition:background .35s ease,color .35s ease;" hover="background:#C2A56B;color:#FAF5EC;">{t.book}</FX>
                    </div>
                  </div>
                </FX>
              </Reveal>
            ))}
          </div>
        </section>
      ))}
      <div style={css('height:clamp(30px,5vw,60px);')} />
    </div>
  );
}
