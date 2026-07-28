'use client';
import { css } from '@/lib/css';
import { FX } from '@/lib/fx';
import { useLang } from '@/lib/lang';
import { Reveal } from '@/components/animations/Reveal';
import { CONTACT, localizedHairRemoval } from '@/lib/data';
import { formatEur } from '@/lib/money';

const telHref = (p) => 'tel:' + p.replace(/[^\d+]/g, '');

function Section({ title, items, lang, delay }) {
  return (
    <Reveal delay={delay}>
      <div style={css('margin-bottom:clamp(28px,4vw,44px);')}>
        <h2 style={css("font-family:var(--font-cinzel),serif;font-weight:500;font-size:20px;letter-spacing:0.05em;color:#3D2F25;margin:0 0 4px;")}>{title}</h2>
        <div style={css('height:1px;background:linear-gradient(90deg,#C2A56B,rgba(194,165,107,0));margin-bottom:14px;')} />
        <div style={css('background:#FFFDF8;border:1px solid rgba(194,165,107,0.28);border-radius:2px;overflow:hidden;')}>
          {items.map((it, i) => (
            <div
              key={it.name}
              style={css(
                'display:flex;align-items:center;justify-content:space-between;gap:14px;padding:16px 20px;' +
                  (i < items.length - 1 ? 'border-bottom:1px solid rgba(194,165,107,0.18);' : '') +
                  (it.highlight ? 'background:linear-gradient(90deg,rgba(230,207,149,0.22),rgba(230,207,149,0.06));' : '')
              )}
            >
              <div style={css('display:flex;align-items:center;gap:10px;flex-wrap:wrap;')}>
                <span style={css("font-family:var(--font-jost),sans-serif;font-size:15px;line-height:1.5;color:#3D2F25;" + (it.highlight ? 'font-weight:500;' : 'font-weight:300;'))}>{it.name}</span>
                {it.highlight && !it.note && (
                  <span style={css("font-family:var(--font-jost),sans-serif;font-size:9px;letter-spacing:0.16em;text-transform:uppercase;color:#3D2F25;font-weight:500;background:linear-gradient(135deg,#E6CF95,#C2A56B);padding:4px 10px;border-radius:1px;")}>
                    {it.badge}
                  </span>
                )}
                {it.note && (
                  <span style={css("font-family:var(--font-jost),sans-serif;font-size:9px;letter-spacing:0.16em;text-transform:uppercase;color:#3E7A4E;font-weight:500;background:#E7F1E7;border:1px solid #B8D8BE;padding:4px 10px;border-radius:1px;")}>
                    {it.note}
                  </span>
                )}
              </div>
              <span style={css("font-family:var(--font-cormorant),serif;font-size:19px;font-weight:600;color:#C2A56B;white-space:nowrap;" + (it.highlight ? 'font-size:21px;' : ''))}>{formatEur(it.priceCents, lang)}</span>
            </div>
          ))}
        </div>
      </div>
    </Reveal>
  );
}

export default function HairRemoval() {
  const { t, lang } = useLang();
  const data = localizedHairRemoval(lang);
  const waMessage = encodeURIComponent("Hello Nommar, I'd like to ask about a hair-removal treatment.");
  const waHref = `https://wa.me/${CONTACT.whatsapp}?text=${waMessage}`;

  // Attach the localized "Best Value" badge only to the Face section's highlight
  // (the Brows section's highlight already carries its own "Save €15" note).
  const face = data.face.map((it) => (it.highlight ? { ...it, badge: t.bestValue } : it));

  return (
    <div>
      <section style={css('text-align:center;padding:clamp(64px,8vw,112px) clamp(24px,6vw,40px) clamp(20px,3vw,36px);')}>
        <div style={css("font-family:var(--font-jost),sans-serif;font-size:12px;letter-spacing:0.34em;text-transform:uppercase;color:#C2A56B;margin-bottom:18px;")}>{t.hairRemovalEyebrow}</div>
        <h1 style={css("font-family:var(--font-cinzel),serif;font-weight:500;font-size:clamp(32px,5vw,58px);letter-spacing:0.05em;color:#3D2F25;margin:0;")}>{t.navHairRemoval}</h1>
        <p style={css("font-family:var(--font-cormorant),serif;font-style:italic;font-size:clamp(18px,2vw,24px);color:#8A7965;margin:18px auto 0;max-width:42ch;")}>{t.hairRemovalSub}</p>
      </section>

      <div style={css('max-width:720px;margin:0 auto;padding:0 clamp(20px,5vw,40px);')}>
        <Section title={t.sectionFace} items={face} lang={lang} delay={0.05} />
        <Section title={t.sectionBody} items={data.body} lang={lang} delay={0.1} />
        <Section title={t.sectionBrows} items={data.brows.map((it) => (it.highlight && !it.note ? { ...it, badge: t.bestValue } : it))} lang={lang} delay={0.15} />

        <Reveal delay={0.2}>
          <div style={css('background:#F3EADA;border:1px solid rgba(194,165,107,0.35);border-radius:2px;padding:18px 22px;margin-top:clamp(10px,2vw,18px);text-align:center;')}>
            <p style={css("font-family:var(--font-jost),sans-serif;font-weight:300;font-size:14px;line-height:1.65;color:#3D2F25;margin:0 0 14px;")}>{t.hairRemovalNotice}</p>
            <div style={css('display:flex;flex-wrap:wrap;gap:10px;justify-content:center;')}>
              <FX as="a" href={waHref} target="_blank" rel="noopener" style="font-family:var(--font-jost),sans-serif;font-size:11.5px;letter-spacing:0.14em;text-transform:uppercase;color:#3D2F25;font-weight:500;background:linear-gradient(135deg,#E6CF95,#C2A56B);border:none;padding:12px 22px;cursor:pointer;border-radius:1px;text-decoration:none;" hover="transform:translateY(-1px);">
                {t.hairRemovalMessage}
              </FX>
              <FX as="a" href={telHref(CONTACT.phones[0])} style="font-family:var(--font-jost),sans-serif;font-size:11.5px;letter-spacing:0.14em;text-transform:uppercase;color:#3D2F25;font-weight:500;background:none;border:1px solid rgba(194,165,107,0.5);padding:12px 22px;cursor:pointer;border-radius:1px;text-decoration:none;" hover="border-color:#C2A56B;">
                {t.hairRemovalCall} — {CONTACT.phones[0]}
              </FX>
            </div>
          </div>
        </Reveal>
      </div>
      <div style={css('height:clamp(30px,5vw,60px);')} />
    </div>
  );
}
