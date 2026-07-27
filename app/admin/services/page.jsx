'use client';
import { useEffect, useState } from 'react';
import { css } from '@/lib/css';
import { FX } from '@/lib/fx';
import AdminHeader from '@/components/admin/AdminHeader';
import { useAdminLocale } from '@/lib/useAdminLocale';
import { CATEGORY_LIST } from '@/lib/booking.config';
import { categoryLabel } from '@/lib/data';

const cardS = 'background:#FFFDF8;border:1px solid rgba(194,165,107,0.28);border-radius:2px;';
const input = "font-family:var(--font-jost),sans-serif;font-size:13px;color:#3D2F25;background:#FAF5EC;border:1px solid rgba(194,165,107,0.4);border-radius:2px;padding:9px 11px;outline:none;width:100%;";
const label = "font-family:var(--font-jost),sans-serif;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#C2A56B;margin-bottom:5px;display:block;";
const addBtn = "font-family:var(--font-jost),sans-serif;font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:#3D2F25;background:linear-gradient(135deg,#E6CF95,#C2A56B);border:none;padding:9px 16px;cursor:pointer;border-radius:1px;";
const ghost = "font-family:var(--font-jost),sans-serif;font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:#8A7965;background:none;border:1px solid rgba(194,165,107,0.45);padding:9px 14px;cursor:pointer;border-radius:1px;";

const COPY = {
  en: {
    title: 'Services', subtitle: 'Edit any number of services, then Save all changes. Prices are optional (blank = “Price on request”).',
    concurrentNote: 'Changes save on top of the latest data — if another admin edits at the same time, the most recent save wins.',
    newService: '+ New service', fName: 'Name', fCategory: 'Category', fDuration: 'Duration (min)', fPrice: 'Price (€)', fDescription: 'Description', fImage: 'Image',
    activeOn: 'Active', activeOff: 'Inactive', saveFirst: 'Save the service first, then edit it to add an image.',
    revert: 'Revert', removeRow: 'Remove', removeImg: 'remove', uploading: 'Uploading…', uploadFailed: 'Upload failed',
    saveAll: 'Save all changes', discard: 'Discard changes', saving: 'Saving…', saved: 'Saved.', saveError: 'Could not save — no changes were applied.',
    unsaved: (n) => `${n} unsaved change${n === 1 ? '' : 's'}`, del: 'Delete',
    deleteConfirm: 'Delete this service? This cannot be undone (a service with bookings is deactivated instead).',
    loading: 'Loading…', therapists: (n) => `${n} therapist${n === 1 ? '' : 's'}`,
  },
  gr: {
    title: 'Υπηρεσίες', subtitle: 'Επεξεργαστείτε όσες υπηρεσίες θέλετε και μετά Αποθήκευση όλων. Οι τιμές είναι προαιρετικές (κενό = «Τιμή κατόπιν αιτήματος»).',
    concurrentNote: 'Οι αλλαγές αποθηκεύονται πάνω στα πιο πρόσφατα δεδομένα — αν επεξεργάζεται ταυτόχρονα άλλος διαχειριστής, υπερισχύει η πιο πρόσφατη αποθήκευση.',
    newService: '+ Νέα υπηρεσία', fName: 'Όνομα', fCategory: 'Κατηγορία', fDuration: 'Διάρκεια (λεπτά)', fPrice: 'Τιμή (€)', fDescription: 'Περιγραφή', fImage: 'Εικόνα',
    activeOn: 'Ενεργή', activeOff: 'Ανενεργή', saveFirst: 'Αποθηκεύστε πρώτα την υπηρεσία, μετά προσθέστε εικόνα.',
    revert: 'Επαναφορά', removeRow: 'Αφαίρεση', removeImg: 'αφαίρεση', uploading: 'Μεταφόρτωση…', uploadFailed: 'Η μεταφόρτωση απέτυχε',
    saveAll: 'Αποθήκευση όλων', discard: 'Απόρριψη αλλαγών', saving: 'Αποθήκευση…', saved: 'Αποθηκεύτηκε.', saveError: 'Δεν ήταν δυνατή η αποθήκευση — καμία αλλαγή δεν εφαρμόστηκε.',
    unsaved: (n) => `${n} μη αποθηκευμένες αλλαγές`, del: 'Διαγραφή',
    deleteConfirm: 'Διαγραφή αυτής της υπηρεσίας; Δεν αναιρείται (υπηρεσία με κρατήσεις απενεργοποιείται αντ’ αυτού).',
    loading: 'Φόρτωση…', therapists: (n) => `${n} θεραπευτ${n === 1 ? 'ής' : 'ές'}`,
  },
};

let tempCounter = 0;

export default function Services() {
  const locale = useAdminLocale();
  const t = COPY[locale];
  const [services, setServices] = useState(null); // committed baseline from server
  const [drafts, setDrafts] = useState({}); // { [id]: { field: pendingValue } }
  const [newRows, setNewRows] = useState([]); // unsaved creates
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null); // { type:'ok'|'err', text }
  const [uploadingId, setUploadingId] = useState(null);
  const [upErr, setUpErr] = useState({});

  const load = () => fetch('/api/admin/services').then((r) => r.json()).then((d) => setServices(d.services || []));
  useEffect(() => { load(); }, []);

  const toEditable = (s) => ({ name: s.name, category: s.category, durationMin: String(s.durationMin), euros: s.priceCents != null ? String(s.priceCents / 100) : '', description: s.description || '', active: s.active, imageUrl: s.imageUrl || '' });
  const editableOf = (s) => ({ ...toEditable(s), ...(drafts[s.id] || {}) });
  const fieldEq = (a, b) => (typeof a === 'boolean' || typeof b === 'boolean' ? a === b : String(a ?? '') === String(b ?? ''));
  const dirtyFields = (s) => { const base = toEditable(s); const d = drafts[s.id] || {}; return Object.keys(d).filter((f) => !fieldEq(d[f], base[f])); };
  const isDirty = (s) => dirtyFields(s).length > 0;

  const setField = (id, field, value) => setDrafts((p) => ({ ...p, [id]: { ...(p[id] || {}), [field]: value } }));
  const revertRow = (id) => setDrafts((p) => { const n = { ...p }; delete n[id]; return n; });
  const setNewField = (tid, field, value) => setNewRows((p) => p.map((r) => (r.tempId === tid ? { ...r, [field]: value } : r)));
  const addNew = () => setNewRows((p) => [...p, { tempId: ++tempCounter, name: '', category: CATEGORY_LIST[0], durationMin: '60', euros: '', description: '' }]);
  const removeNew = (tid) => setNewRows((p) => p.filter((r) => r.tempId !== tid));

  const changedCount = (services || []).filter(isDirty).length + newRows.length;
  const hasPending = changedCount > 0;

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    if (!hasPending) return;
    const h = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [hasPending]);

  const onFile = async (id, e) => {
    const file = e.target.files?.[0]; if (!file) return;
    setUploadingId(id); setUpErr((p) => ({ ...p, [id]: '' }));
    try {
      const fd = new FormData(); fd.append('file', file); fd.append('serviceId', String(id));
      const r = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const d = await r.json();
      if (!r.ok) setUpErr((p) => ({ ...p, [id]: d.error || t.uploadFailed }));
      else setField(id, 'imageUrl', d.url); // becomes a pending edit, saved with the batch
    } catch { setUpErr((p) => ({ ...p, [id]: t.uploadFailed })); }
    finally { setUploadingId(null); }
  };

  const saveAll = async () => {
    setSaving(true); setMsg(null);
    const updates = (services || []).filter(isDirty).map((s) => {
      const d = drafts[s.id]; const api = { id: s.id };
      for (const f of dirtyFields(s)) {
        if (f === 'euros') api.priceCents = d.euros === '' ? null : Math.round(Number(d.euros) * 100);
        else if (f === 'durationMin') api.durationMin = Number(d.durationMin);
        else if (f === 'imageUrl') api.imageUrl = d.imageUrl || null;
        else api[f] = d[f];
      }
      return api;
    });
    const creates = newRows.map((n) => ({ name: n.name, category: n.category, durationMin: Number(n.durationMin), priceCents: n.euros === '' ? null : Math.round(Number(n.euros) * 100), description: n.description }));
    try {
      const r = await fetch('/api/admin/services', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ creates, updates }) });
      const d = await r.json();
      if (!r.ok) { setMsg({ type: 'err', text: d.error || t.saveError }); return; } // keep pending for retry
      setDrafts({}); setNewRows([]);
      await load();
      setMsg({ type: 'ok', text: t.saved });
    } catch { setMsg({ type: 'err', text: t.saveError }); }
    finally { setSaving(false); }
  };

  const discardAll = () => { setDrafts({}); setNewRows([]); setMsg(null); };

  // Immediate + atomic delete. Surgically updates the baseline for this row only —
  // pending edits on every OTHER service stay untouched.
  const del = async (s) => {
    if (!window.confirm(t.deleteConfirm)) return;
    const r = await fetch(`/api/admin/services?id=${s.id}`, { method: 'DELETE' });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { setMsg({ type: 'err', text: d.error || t.saveError }); return; }
    setDrafts((p) => { const n = { ...p }; delete n[s.id]; return n; });
    if (d.deactivated) setServices((p) => p.map((x) => (x.id === s.id ? { ...x, active: false } : x)));
    else setServices((p) => p.filter((x) => x.id !== s.id));
  };

  return (
    <>
      <AdminHeader />
      <main style={css('max-width:1000px;margin:0 auto;padding:clamp(28px,4vw,48px) clamp(18px,4vw,40px) 120px;')}>
        <div style={css('display:flex;justify-content:space-between;align-items:center;gap:14px;margin-bottom:6px;')}>
          <h1 style={css("font-family:var(--font-cinzel),serif;font-weight:500;font-size:clamp(24px,3vw,34px);margin:0;")}>{t.title}</h1>
          <FX as="button" onClick={addNew} style={ghost} hover="border-color:#C2A56B;color:#3D2F25;">{t.newService}</FX>
        </div>
        <p style={css("font-family:var(--font-jost),sans-serif;font-size:13px;color:#8A7965;margin:0 0 6px;")}>{t.subtitle}</p>
        <p style={css("font-family:var(--font-jost),sans-serif;font-size:11.5px;color:#A8967C;margin:0 0 22px;")}>{t.concurrentNote}</p>

        {msg && <div style={css('font-family:var(--font-jost),sans-serif;font-size:13px;padding:11px 15px;border-radius:2px;margin-bottom:16px;' + (msg.type === 'ok' ? 'background:#E7F1E7;color:#3E7A4E;border:1px solid #B8D8BE;' : 'background:#FBEFEF;color:#9B4444;border:1px solid #E3B7B7;'))}>{msg.text}</div>}

        {services === null ? (
          <p style={css("font-family:var(--font-cormorant),serif;font-style:italic;font-size:18px;color:#8A7965;")}>{t.loading}</p>
        ) : (
          <div style={css('display:flex;flex-direction:column;gap:12px;')}>
            {newRows.map((n) => (
              <div key={'new' + n.tempId} style={css(cardS + 'padding:16px 18px;border-left:3px solid #C2A56B;')}>
                <div style={css('display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;')}>
                  <span style={css("font-family:var(--font-jost),sans-serif;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#C2A56B;")}>{t.newService.replace('+ ', '')}</span>
                  <button onClick={() => removeNew(n.tempId)} style={css('background:none;border:none;color:#9B4444;cursor:pointer;font-size:12px;font-family:var(--font-jost),sans-serif;')}>{t.removeRow}</button>
                </div>
                <Fields t={t} locale={locale} v={n} on={(f, val) => setNewField(n.tempId, f, val)} isNew />
              </div>
            ))}

            {services.map((s) => {
              const v = editableOf(s); const dirty = isDirty(s);
              return (
                <div key={s.id} style={css(cardS + 'padding:16px 18px;' + (dirty ? 'border-left:3px solid #C2A56B;' : '') + (v.active ? '' : 'opacity:0.6;'))}>
                  <div style={css('display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap;')}>
                    <div style={css('display:flex;align-items:center;gap:10px;')}>
                      <FX as="button" onClick={() => setField(s.id, 'active', !v.active)} style={'font-family:var(--font-jost),sans-serif;font-size:10px;letter-spacing:0.14em;text-transform:uppercase;padding:4px 10px;border-radius:2px;cursor:pointer;border:1px solid ' + (v.active ? '#B8D8BE;background:#E7F1E7;color:#3E7A4E;' : 'rgba(155,68,68,0.4);background:#F1E4E4;color:#9B5B5B;')} hover="opacity:0.85;">{v.active ? t.activeOn : t.activeOff}</FX>
                      <span style={css("font-family:var(--font-jost),sans-serif;font-size:11px;color:#A8967C;")}>{t.therapists(s._count.staff)}</span>
                    </div>
                    <div style={css('display:flex;align-items:center;gap:10px;')}>
                      {dirty && <button onClick={() => revertRow(s.id)} style={css('background:none;border:none;color:#8A7965;cursor:pointer;font-size:11.5px;font-family:var(--font-jost),sans-serif;text-decoration:underline;')}>↺ {t.revert}</button>}
                      <button onClick={() => del(s)} style={css('background:none;border:none;color:#9B4444;cursor:pointer;font-size:11.5px;font-family:var(--font-jost),sans-serif;')}>{t.del}</button>
                    </div>
                  </div>
                  <Fields t={t} locale={locale} v={v} on={(f, val) => setField(s.id, f, val)} />
                  <div style={css('margin-top:12px;')}>
                    <label style={css(label)}>{t.fImage}</label>
                    <div style={css('display:flex;align-items:center;gap:12px;flex-wrap:wrap;')}>
                      {v.imageUrl ? <img src={v.imageUrl} alt="" width="64" height="48" style={css('width:64px;height:48px;object-fit:cover;border-radius:2px;border:1px solid rgba(194,165,107,0.4);')} /> : null}
                      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => onFile(s.id, e)} style={css("font-family:var(--font-jost),sans-serif;font-size:12px;color:#8A7965;")} />
                      {uploadingId === s.id && <span style={css("font-family:var(--font-jost),sans-serif;font-size:12px;color:#8A7965;")}>{t.uploading}</span>}
                      {v.imageUrl && <button onClick={() => setField(s.id, 'imageUrl', '')} style={css('background:none;border:none;color:#9B4444;cursor:pointer;font-size:12px;')}>{t.removeImg}</button>}
                    </div>
                    {upErr[s.id] && <div style={css("color:#9B4444;font-family:var(--font-jost),sans-serif;font-size:12px;margin-top:6px;")}>{upErr[s.id]}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Persistent action bar — only while there are pending changes */}
      {hasPending && (
        <div style={css('position:fixed;left:0;right:0;bottom:0;z-index:55;background:rgba(250,245,236,0.94);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-top:1px solid rgba(194,165,107,0.3);padding:12px clamp(16px,5vw,40px) calc(12px + env(safe-area-inset-bottom));')}>
          <div style={css('max-width:1000px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:14px;flex-wrap:wrap;')}>
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

// Shared editable fields (used by both new and existing rows).
function Fields({ t, locale, v, on, isNew }) {
  return (
    <div style={css('display:grid;grid-template-columns:repeat(auto-fit,minmax(min(150px,100%),1fr));gap:12px;')}>
      <div style={css('grid-column:1 / -1;')}><label style={css(label)}>{t.fName}</label><input value={v.name} onChange={(e) => on('name', e.target.value)} style={css(input)} /></div>
      <div><label style={css(label)}>{t.fCategory}</label>
        <select value={v.category} onChange={(e) => on('category', e.target.value)} style={css(input + 'cursor:pointer;')}>
          {CATEGORY_LIST.map((c) => <option key={c} value={c}>{categoryLabel(c, locale)}</option>)}
        </select>
      </div>
      <div><label style={css(label)}>{t.fDuration}</label><input type="number" value={v.durationMin} onChange={(e) => on('durationMin', e.target.value)} style={css(input)} /></div>
      <div><label style={css(label)}>{t.fPrice}</label><input type="number" value={v.euros} onChange={(e) => on('euros', e.target.value)} style={css(input)} /></div>
      <div style={css('grid-column:1 / -1;')}><label style={css(label)}>{t.fDescription}</label><input value={v.description} onChange={(e) => on('description', e.target.value)} style={css(input)} /></div>
      {isNew && <div style={css('grid-column:1 / -1;font-family:var(--font-cormorant),serif;font-style:italic;font-size:13px;color:#A8967C;')}>{t.saveFirst}</div>}
    </div>
  );
}
