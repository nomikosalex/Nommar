'use client';
import { useEffect, useState, useCallback } from 'react';
import { css } from '@/lib/css';
import { FX } from '@/lib/fx';
import { useLang } from '@/lib/lang';
import { useReducedMotion } from '@/lib/useReducedMotion';
import Placeholder from '@/components/Placeholder';
import { Reveal } from '@/components/animations/Reveal';

function captionOf(img, lang) {
  return lang === 'gr' ? img.captionGr || img.captionEn : img.captionEn || img.captionGr;
}

export default function Gallery() {
  const { t, lang } = useLang();
  const [images, setImages] = useState(null); // null = loading
  const [openIndex, setOpenIndex] = useState(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    fetch('/api/gallery').then((r) => r.json()).then((d) => setImages(d.images || [])).catch(() => setImages([]));
  }, []);

  const close = useCallback(() => setOpenIndex(null), []);
  const prev = useCallback(() => setOpenIndex((i) => (i === null ? i : (i - 1 + images.length) % images.length)), [images]);
  const next = useCallback(() => setOpenIndex((i) => (i === null ? i : (i + 1) % images.length)), [images]);

  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openIndex, close, prev, next]);

  return (
    <div>
      <section style={css('text-align:center;padding:clamp(64px,8vw,112px) clamp(24px,6vw,40px) clamp(20px,3vw,40px);')}>
        <div style={css("font-family:var(--font-jost),sans-serif;font-size:12px;letter-spacing:0.34em;text-transform:uppercase;color:#C2A56B;margin-bottom:18px;")}>{t.galleryEyebrow}</div>
        <h1 style={css("font-family:var(--font-cinzel),serif;font-weight:500;font-size:clamp(32px,5vw,58px);letter-spacing:0.05em;color:#3D2F25;margin:0;")}>{t.galleryTitle}</h1>
        <p style={css("font-family:var(--font-cormorant),serif;font-style:italic;font-size:clamp(18px,2vw,24px);color:#8A7965;margin:18px auto 0;max-width:46ch;")}>{t.galleryIntro}</p>
      </section>

      <section style={css('max-width:1280px;margin:0 auto;padding:0 clamp(24px,6vw,72px) clamp(64px,8vw,112px);')}>
        {images === null ? (
          <div style={css('display:grid;grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr));gap:clamp(16px,2vw,24px);')}>
            {[0, 1, 2].map((i) => <Placeholder key={i} label="" style="aspect-ratio:4/3;" />)}
          </div>
        ) : images.length === 0 ? (
          <Placeholder label={t.galleryEmpty} style="aspect-ratio:16/9;" />
        ) : (
          <div style={css('display:grid;grid-template-columns:repeat(auto-fit,minmax(min(220px,100%),1fr));gap:clamp(16px,2vw,24px);')}>
            {images.map((img, i) => (
              <Reveal key={img.id} delay={i * 0.05}>
                <FX
                  as="button"
                  onClick={() => setOpenIndex(i)}
                  style="display:block;width:100%;padding:0;border:1px solid rgba(194,165,107,0.25);background:#FFFDF8;cursor:pointer;overflow:hidden;aspect-ratio:4/3;box-shadow:0 18px 40px -30px rgba(61,47,37,0.5);transition:transform .4s ease,box-shadow .4s ease,border-color .4s ease;"
                  hover="transform:translateY(-4px);box-shadow:0 30px 56px -30px rgba(61,47,37,0.45);border-color:rgba(194,165,107,0.55);"
                >
                  <img src={img.imageUrl} alt={captionOf(img, lang) || ''} loading="lazy" style={css('width:100%;height:100%;object-fit:cover;display:block;')} />
                </FX>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {images && openIndex !== null && (
        <div
          role="dialog"
          aria-modal="true"
          style={css('position:fixed;inset:0;z-index:80;background:rgba(30,22,17,0.94);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:clamp(16px,4vw,40px);' + (reduced ? '' : 'animation:revealFade .25s ease both;'))}
          onClick={close}
        >
          <button
            aria-label={t.galleryClose}
            onClick={close}
            style={css('position:absolute;top:clamp(14px,3vw,28px);right:clamp(14px,3vw,28px);width:40px;height:40px;border-radius:50%;background:rgba(255,253,248,0.12);border:1px solid rgba(255,253,248,0.3);color:#FFFDF8;font-size:18px;cursor:pointer;line-height:1;')}
          >
            &times;
          </button>

          {images.length > 1 && (
            <>
              <button
                aria-label={t.galleryPrev}
                onClick={(e) => { e.stopPropagation(); prev(); }}
                style={css('position:absolute;left:clamp(8px,2vw,24px);top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;background:rgba(255,253,248,0.12);border:1px solid rgba(255,253,248,0.3);color:#FFFDF8;font-size:20px;cursor:pointer;line-height:1;')}
              >
                &larr;
              </button>
              <button
                aria-label={t.galleryNext}
                onClick={(e) => { e.stopPropagation(); next(); }}
                style={css('position:absolute;right:clamp(8px,2vw,24px);top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;background:rgba(255,253,248,0.12);border:1px solid rgba(255,253,248,0.3);color:#FFFDF8;font-size:20px;cursor:pointer;line-height:1;')}
              >
                &rarr;
              </button>
            </>
          )}

          <img
            src={images[openIndex].imageUrl}
            alt={captionOf(images[openIndex], lang) || ''}
            onClick={(e) => e.stopPropagation()}
            style={css('max-width:min(1100px,92vw);max-height:76vh;object-fit:contain;box-shadow:0 30px 80px -20px rgba(0,0,0,0.6);')}
          />
          {captionOf(images[openIndex], lang) && (
            <p onClick={(e) => e.stopPropagation()} style={css("font-family:var(--font-cormorant),serif;font-style:italic;font-size:17px;color:#F1E6D3;margin:20px 0 0;text-align:center;max-width:64ch;padding:0 16px;")}>
              {captionOf(images[openIndex], lang)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
