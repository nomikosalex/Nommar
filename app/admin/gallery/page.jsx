'use client';
import { useEffect, useState } from 'react';
import { css } from '@/lib/css';
import { FX } from '@/lib/fx';
import AdminHeader from '@/components/admin/AdminHeader';
import { useAdminLocale } from '@/lib/useAdminLocale';

const cardS = 'background:#FFFDF8;border:1px solid rgba(194,165,107,0.28);border-radius:2px;';
const input = "font-family:var(--font-jost),sans-serif;font-size:13px;color:#3D2F25;background:#FAF5EC;border:1px solid rgba(194,165,107,0.4);border-radius:2px;padding:9px 11px;outline:none;width:100%;";
const label = "font-family:var(--font-jost),sans-serif;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#C2A56B;margin-bottom:5px;display:block;";
const addBtn = "font-family:var(--font-jost),sans-serif;font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:#3D2F25;background:linear-gradient(135deg,#E6CF95,#C2A56B);border:none;padding:9px 16px;cursor:pointer;border-radius:1px;";
const ghost = "font-family:var(--font-jost),sans-serif;font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:#8A7965;background:none;border:1px solid rgba(194,165,107,0.45);padding:9px 14px;cursor:pointer;border-radius:1px;";
const arrowBtn = "font-family:var(--font-jost),sans-serif;font-size:14px;color:#8A7965;background:#FAF5EC;border:1px solid rgba(194,165,107,0.4);border-radius:2px;width:30px;height:30px;cursor:pointer;line-height:1;";

const COPY = {
  en: {
    title: 'Gallery', subtitle: 'Upload photos, edit captions, reorder and toggle visibility, then Save all changes.',
    concurrentNote: 'Changes save on top of the latest data — if another admin edits at the same time, the most recent save wins.',
    addPhoto: '+ Add photo', uploading: 'Uploading…', uploadFailed: 'Upload failed',
    fCaptionEn: 'Caption (EN)', fCaptionGr: 'Caption (GR)',
    activeOn: 'Active', activeOff: 'Inactive',
    revert: 'Revert', del: 'Delete', deleteConfirm: 'Delete this photo? This cannot be undone.',
    saveAll: 'Save all changes', discard: 'Discard changes', saving: 'Saving…', saved: 'Saved.', saveError: 'Could not save — no changes were applied.',
    unsaved: (n) => `${n} unsaved change${n === 1 ? '' : 's'}`,
    loading: 'Loading…', empty: 'No photos yet — add your first one above.',
    moveUp: 'Move up', moveDown: 'Move down',
  },
  gr: {
    title: 'Γκαλερί', subtitle: 'Ανεβάστε φωτογραφίες, επεξεργαστείτε λεζάντες, αλλάξτε σειρά και ορατότητα, μετά Αποθήκευση όλων.',
    concurrentNote: 'Οι αλλαγές αποθηκεύονται πάνω στα πιο πρόσφατα δεδομένα — αν επεξεργάζεται ταυτόχρονα άλλος διαχειριστής, υπερισχύει η πιο πρόσφατη αποθήκευση.',
    addPhoto: '+ Προσθήκη φωτογραφίας', uploading: 'Μεταφόρτωση…', uploadFailed: 'Η μεταφόρτωση απέτυχε',
    fCaptionEn: 'Λεζάντα (Αγγλικά)', fCaptionGr: 'Λεζάντα (Ελληνικά)',
    activeOn: 'Ενεργή', activeOff: 'Ανενεργή',
    revert: 'Επαναφορά', del: 'Διαγραφή', deleteConfirm: 'Διαγραφή αυτής της φωτογραφίας; Δεν αναιρείται.',
    saveAll: 'Αποθήκευση όλων', discard: 'Απόρριψη αλλαγών', saving: 'Αποθήκευση…', saved: 'Αποθηκεύτηκε.', saveError: 'Δεν ήταν δυνατή η αποθήκευση — καμία αλλαγή δεν εφαρμόστηκε.',
    unsaved: (n) => `${n} μη αποθηκευμένες αλλαγές`,
    loading: 'Φόρτωση…', empty: 'Δεν υπάρχουν φωτογραφίες ακόμη — προσθέστε την πρώτη παραπάνω.',
    moveUp: 'Μετακίνηση πάνω', moveDown: 'Μετακίνηση κάτω',
  },
};

export default function Gallery() {
  const locale = useAdminLocale();
  const t = COPY[locale];
  const [images, setImages] = useState(null); // committed baseline from server, displayOrder asc
  const [order, setOrder] = useState([]); // local id sequence — arrows mutate this only
  const [drafts, setDrafts] = useState({}); // { [id]: { captionEn?, captionGr?, active? } }
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [upErr, setUpErr] = useState('');

  const load = () =>
    fetch('/api/admin/gallery').then((r) => r.json()).then((d) => {
      const imgs = d.images || [];
      setImages(imgs);
      setOrder(imgs.map((i) => i.id));
    });
  useEffect(() => { load(); }, []);

  const byId = (id) => (images || []).find((i) => i.id === id);
  const toEditable = (i) => ({ captionEn: i.captionEn || '', captionGr: i.captionGr || '', active: i.active });
  const editableOf = (i) => ({ ...toEditable(i), ...(drafts[i.id] || {}) });
  const fieldEq = (a, b) => (typeof a === 'boolean' || typeof b === 'boolean' ? a === b : String(a ?? '') === String(b ?? ''));
  const dirtyFields = (i) => { const base = toEditable(i); const d = drafts[i.id] || {}; return Object.keys(d).filter((f) => !fieldEq(d[f], base[f])); };
  const orderChanged = (id) => order.indexOf(id) !== byId(id)?.displayOrder;
  const isDirty = (i) => dirtyFields(i).length > 0 || orderChanged(i.id);

  const setField = (id, field, value) => setDrafts((p) => ({ ...p, [id]: { ...(p[id] || {}), [field]: value } }));
  const revertRow = (id) => setDrafts((p) => { const n = { ...p }; delete n[id]; return n; });

  const move = (id, dir) => setOrder((p) => {
    const i = p.indexOf(id);
    const j = i + dir;
    if (j < 0 || j >= p.length) return p;
    const next = [...p];
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  });

  const changedCount = (images || []).filter(isDirty).length;
  const hasPending = changedCount > 0;

  useEffect(() => {
    if (!hasPending) return;
    const h = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [hasPending]);

  const onFile = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    e.target.value = '';
    setUploading(true); setUpErr('');
    try {
      const fd = new FormData(); fd.append('file', file); fd.append('target', 'gallery');
      const r = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const d = await r.json();
      if (!r.ok) setUpErr(d.error || t.uploadFailed);
      else { setImages((p) => [...(p || []), d.image]); setOrder((p) => [...p, d.image.id]); }
    } catch { setUpErr(t.uploadFailed); }
    finally { setUploading(false); }
  };

  const saveAll = async () => {
    setSaving(true); setMsg(null);
    const updates = (images || []).filter(isDirty).map((i) => {
      const api = { id: i.id };
      for (const f of dirtyFields(i)) api[f] = drafts[i.id][f];
      const newOrder = order.indexOf(i.id);
      if (newOrder !== i.displayOrder) api.displayOrder = newOrder;
      return api;
    });
    try {
      const r = await fetch('/api/admin/gallery', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ updates }) });
      const d = await r.json();
      if (!r.ok) { setMsg({ type: 'err', text: d.error || t.saveError }); return; }
      setDrafts({});
      await load();
      setMsg({ type: 'ok', text: t.saved });
    } catch { setMsg({ type: 'err', text: t.saveError }); }
    finally { setSaving(false); }
  };

  const discardAll = () => { setDrafts({}); setOrder((images || []).map((i) => i.id)); setMsg(null); };

  const del = async (i) => {
    if (!window.confirm(t.deleteConfirm)) return;
    const r = await fetch(`/api/admin/gallery?id=${i.id}`, { method: 'DELETE' });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setMsg({ type: 'err', text: d.error || t.saveError }); return; }
    setDrafts((p) => { const n = { ...p }; delete n[i.id]; return n; });
    setImages((p) => p.filter((x) => x.id !== i.id));
    setOrder((p) => p.filter((id) => id !== i.id));
  };

  const ordered = order.map((id) => byId(id)).filter(Boolean);

  return (
    <>
      <AdminHeader />
      <main style={css('max-width:1100px;margin:0 auto;padding:clamp(28px,4vw,48px) clamp(18px,4vw,40px) 120px;')}>
        <div style={css('display:flex;justify-content:space-between;align-items:center;gap:14px;margin-bottom:6px;flex-wrap:wrap;')}>
          <h1 style={css("font-family:var(--font-cinzel),serif;font-weight:500;font-size:clamp(24px,3vw,34px);margin:0;")}>{t.title}</h1>
          <label style={css(addBtn + 'display:inline-flex;align-items:center;gap:8px;')}>
            {uploading && <span aria-hidden="true" style={css('width:12px;height:12px;border:2px solid rgba(61,47,37,0.35);border-top-color:#3D2F25;border-radius:50%;animation:spin 0.7s linear infinite;display:inline-block;')} />}
            {uploading ? t.uploading : t.addPhoto}
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} disabled={uploading} style={css('display:none;')} />
          </label>
        </div>
        <p style={css("font-family:var(--font-jost),sans-serif;font-size:13px;color:#8A7965;margin:0 0 6px;")}>{t.subtitle}</p>
        <p style={css("font-family:var(--font-jost),sans-serif;font-size:11.5px;color:#A8967C;margin:0 0 22px;")}>{t.concurrentNote}</p>

        {upErr && <div style={css("color:#9B4444;font-family:var(--font-jost),sans-serif;font-size:13px;margin:0 0 16px;")}>{upErr}</div>}
        {msg && <div style={css('font-family:var(--font-jost),sans-serif;font-size:13px;padding:11px 15px;border-radius:2px;margin-bottom:16px;' + (msg.type === 'ok' ? 'background:#E7F1E7;color:#3E7A4E;border:1px solid #B8D8BE;' : 'background:#FBEFEF;color:#9B4444;border:1px solid #E3B7B7;'))}>{msg.text}</div>}

        {images === null ? (
          <p style={css("font-family:var(--font-cormorant),serif;font-style:italic;font-size:18px;color:#8A7965;")}>{t.loading}</p>
        ) : ordered.length === 0 ? (
          <p style={css("font-family:var(--font-cormorant),serif;font-style:italic;font-size:16px;color:#A8967C;")}>{t.empty}</p>
        ) : (
          <div style={css('display:grid;grid-template-columns:repeat(auto-fit,minmax(min(280px,100%),1fr));gap:16px;')}>
            {ordered.map((i, idx) => {
              const v = editableOf(i); const dirty = isDirty(i);
              return (
                <div key={i.id} style={css(cardS + 'padding:14px;' + (dirty ? 'border-left:3px solid #C2A56B;' : '') + (v.active ? '' : 'opacity:0.6;'))}>
                  <img src={i.imageUrl} alt="" style={css('width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:2px;border:1px solid rgba(194,165,107,0.25);margin-bottom:10px;')} />
                  <div style={css('display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:10px;')}>
                    <div style={css('display:flex;align-items:center;gap:6px;')}>
                      <button aria-label={t.moveUp} onClick={() => move(i.id, -1)} disabled={idx === 0} style={css(arrowBtn + (idx === 0 ? 'opacity:0.35;cursor:default;' : ''))}>↑</button>
                      <button aria-label={t.moveDown} onClick={() => move(i.id, 1)} disabled={idx === ordered.length - 1} style={css(arrowBtn + (idx === ordered.length - 1 ? 'opacity:0.35;cursor:default;' : ''))}>↓</button>
                    </div>
                    <FX as="button" onClick={() => setField(i.id, 'active', !v.active)} style={'font-family:var(--font-jost),sans-serif;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;padding:4px 10px;border-radius:2px;cursor:pointer;border:1px solid ' + (v.active ? '#B8D8BE;background:#E7F1E7;color:#3E7A4E;' : 'rgba(155,68,68,0.4);background:#F1E4E4;color:#9B5B5B;')} hover="opacity:0.85;">{v.active ? t.activeOn : t.activeOff}</FX>
                  </div>
                  <div style={css('display:flex;flex-direction:column;gap:10px;')}>
                    <div><label style={css(label)}>{t.fCaptionEn}</label><input value={v.captionEn} onChange={(e) => setField(i.id, 'captionEn', e.target.value)} style={css(input)} /></div>
                    <div><label style={css(label)}>{t.fCaptionGr}</label><input value={v.captionGr} onChange={(e) => setField(i.id, 'captionGr', e.target.value)} style={css(input)} /></div>
                  </div>
                  <div style={css('display:flex;justify-content:space-between;align-items:center;margin-top:12px;')}>
                    {dirtyFields(i).length > 0 ? <button onClick={() => revertRow(i.id)} style={css('background:none;border:none;color:#8A7965;cursor:pointer;font-size:11.5px;font-family:var(--font-jost),sans-serif;text-decoration:underline;')}>↺ {t.revert}</button> : <span />}
                    <button onClick={() => del(i)} style={css('background:none;border:none;color:#9B4444;cursor:pointer;font-size:11.5px;font-family:var(--font-jost),sans-serif;')}>{t.del}</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {hasPending && (
        <div style={css('position:fixed;left:0;right:0;bottom:0;z-index:55;background:rgba(250,245,236,0.94);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-top:1px solid rgba(194,165,107,0.3);padding:12px clamp(16px,5vw,40px) calc(12px + env(safe-area-inset-bottom));')}>
          <div style={css('max-width:1100px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;')}>
            <span style={css("font-family:var(--font-jost),sans-serif;font-size:13px;color:#3D2F25;")}><strong style={css('color:#C2A56B;')}>{changedCount}</strong> · {t.unsaved(changedCount)}</span>
            <div style={css('display:flex;align-items:center;gap:10px;')}>
              <FX as="button" onClick={discardAll} disabled={saving || undefined} style={ghost + 'min-height:44px;' + (saving ? 'opacity:0.5;pointer-events:none;' : '')} hover="border-color:#9B4444;color:#9B4444;">{t.discard}</FX>
              <FX as="button" onClick={saveAll} aria-disabled={saving || undefined} style={addBtn + 'min-height:44px;padding:12px 24px;display:inline-flex;align-items:center;gap:8px;' + (saving ? 'opacity:0.7;pointer-events:none;' : '')} hover="transform:translateY(-1px);">
                {saving && <span aria-hidden="true" style={css('width:13px;height:13px;border:2px solid rgba(61,47,37,0.35);border-top-color:#3D2F25;border-radius:50%;animation:spin 0.7s linear infinite;display:inline-block;')} />}
                {saving ? t.saving : t.saveAll}
              </FX>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
