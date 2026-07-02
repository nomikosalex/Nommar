'use client';
import Link from 'next/link';
import { css } from '@/lib/css';
import { FX } from '@/lib/fx';
import { useLang } from '@/lib/lang';
import { Reveal } from '@/components/animations/Reveal';
import { CONTACT } from '@/lib/data';

export default function Contact() {
  const { t } = useLang();
  const waMessage = encodeURIComponent("Hello Nommar, I'd like to book a treatment.");
  const waHref = `https://wa.me/${CONTACT.whatsapp}?text=${waMessage}`;

  return (
    <div>
      <section style={css('text-align:center;padding:clamp(64px,8vw,112px) clamp(24px,6vw,40px) clamp(10px,2vw,30px);')}>
        <div style={css("font-family:var(--font-jost),sans-serif;font-size:12px;letter-spacing:0.34em;text-transform:uppercase;color:#C2A56B;margin-bottom:18px;")}>Visit Us</div>
        <h1 style={css("font-family:var(--font-cinzel),serif;font-weight:500;font-size:clamp(32px,5vw,58px);letter-spacing:0.05em;color:#3D2F25;margin:0;")}>Contact</h1>
        <p style={css("font-family:var(--font-cormorant),serif;font-style:italic;font-size:clamp(18px,2vw,24px);color:#8A7965;margin:18px auto 0;max-width:36ch;")}>Kamari, Santorini — Greece</p>
      </section>

      <section style={css('max-width:1200px;margin:0 auto;padding:clamp(36px,5vw,64px) clamp(24px,6vw,72px);display:grid;grid-template-columns:repeat(auto-fit,minmax(min(360px,100%),1fr));gap:clamp(36px,4vw,64px);')}>
        <Reveal direction="right">
          <h2 style={css("font-family:var(--font-cinzel),serif;font-weight:500;font-size:24px;letter-spacing:0.03em;color:#3D2F25;margin:0 0 26px;")}>Get in touch</h2>
          <div style={css('display:flex;flex-direction:column;gap:24px;')}>
            <div>
              <div style={css("font-family:var(--font-jost),sans-serif;font-size:10.5px;letter-spacing:0.24em;text-transform:uppercase;color:#C2A56B;margin-bottom:7px;")}>Location</div>
              <div style={css("font-family:var(--font-jost),sans-serif;font-weight:300;font-size:16px;color:#3D2F25;line-height:1.6;")}>{CONTACT.location[0]}<br />{CONTACT.location[1]}</div>
            </div>
            <div>
              <div style={css("font-family:var(--font-jost),sans-serif;font-size:10.5px;letter-spacing:0.24em;text-transform:uppercase;color:#C2A56B;margin-bottom:7px;")}>Telephone</div>
              <div style={css("font-family:var(--font-jost),sans-serif;font-weight:300;font-size:16px;color:#3D2F25;line-height:1.7;")}>{CONTACT.phones[0]}<br />{CONTACT.phones[1]}</div>
            </div>
            <div>
              <div style={css("font-family:var(--font-jost),sans-serif;font-size:10.5px;letter-spacing:0.24em;text-transform:uppercase;color:#C2A56B;margin-bottom:7px;")}>Email</div>
              <div style={css("font-family:var(--font-jost),sans-serif;font-weight:300;font-size:16px;color:#3D2F25;")}>{CONTACT.email} <span style={css('color:#A8967C;font-size:13px;')}>(placeholder)</span></div>
            </div>
            <div>
              <div style={css("font-family:var(--font-jost),sans-serif;font-size:10.5px;letter-spacing:0.24em;text-transform:uppercase;color:#C2A56B;margin-bottom:7px;")}>Instagram</div>
              <FX as="a" href={CONTACT.instagram.url} target="_blank" rel="noopener" style="font-family:var(--font-jost),sans-serif;font-weight:300;font-size:16px;color:#3D2F25;text-decoration:none;border-bottom:1px solid rgba(194,165,107,0.5);padding-bottom:2px;" hover="color:#C2A56B;">{CONTACT.instagram.handle}</FX>
            </div>
            <div>
              <div style={css("font-family:var(--font-jost),sans-serif;font-size:10.5px;letter-spacing:0.24em;text-transform:uppercase;color:#C2A56B;margin-bottom:7px;")}>Opening Hours</div>
              <div style={css("font-family:var(--font-jost),sans-serif;font-weight:300;font-size:16px;color:#3D2F25;line-height:1.7;")}>{CONTACT.hours} <span style={css('color:#A8967C;font-size:13px;')}>(placeholder)</span><br />By appointment</div>
            </div>
          </div>
          <div style={css('margin-top:32px;border:1px solid rgba(194,165,107,0.3);overflow:hidden;box-shadow:0 18px 40px -32px rgba(61,47,37,0.5);')}>
            <iframe title="Kamari, Santorini map" src={CONTACT.mapEmbed} style={css('width:100%;height:260px;border:0;display:block;filter:saturate(0.78) contrast(0.96);')} loading="lazy" />
          </div>
        </Reveal>

        <Reveal direction="left">
          <div style={css('background:#FFFDF8;border:1px solid rgba(194,165,107,0.3);padding:clamp(28px,3.4vw,46px);box-shadow:0 26px 56px -36px rgba(61,47,37,0.5);text-align:center;')}>
            <div style={css('width:54px;height:54px;border:1px solid rgba(194,165,107,0.7);border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 24px;')}>
              <div style={css('width:11px;height:11px;background:#C2A56B;transform:rotate(45deg);')} />
            </div>
            <h2 style={css("font-family:var(--font-cinzel),serif;font-weight:500;font-size:24px;letter-spacing:0.03em;color:#3D2F25;margin:0 0 12px;")}>Reserve your ritual</h2>
            <p style={css("font-family:var(--font-cormorant),serif;font-style:italic;font-size:20px;line-height:1.55;color:#6E5E50;margin:0 auto 30px;max-width:34ch;")}>Choose your treatment, pick a time that suits you, and we will confirm your appointment.</p>
            <FX as={Link} href="/book" style="display:inline-block;font-family:var(--font-jost),sans-serif;font-size:12px;letter-spacing:0.22em;text-transform:uppercase;color:#3D2F25;font-weight:500;background:linear-gradient(135deg,#E6CF95,#C2A56B);border:none;padding:16px 38px;cursor:pointer;border-radius:1px;box-shadow:0 10px 26px -10px rgba(194,165,107,0.6);transition:transform .35s ease;text-decoration:none;" hover="transform:translateY(-2px);">{t.bookAppointment}</FX>
            <div style={css("font-family:var(--font-jost),sans-serif;font-size:13px;letter-spacing:0.04em;color:#8A7965;margin:22px 0 0;")}>
              Prefer to message us?{' '}
              <FX as="a" href={waHref} target="_blank" rel="noopener" style="color:#C2A56B;text-decoration:none;border-bottom:1px solid rgba(194,165,107,0.5);padding-bottom:1px;" hover="color:#3D2F25;">{t.bookWhatsapp}</FX>
            </div>
          </div>
        </Reveal>
      </section>
      <div style={css('height:clamp(20px,4vw,50px);')} />
    </div>
  );
}
