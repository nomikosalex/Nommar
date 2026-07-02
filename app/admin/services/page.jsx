'use client';
import { useEffect, useState } from 'react';
import { css } from '@/lib/css';
import { FX } from '@/lib/fx';
import AdminHeader from '@/components/admin/AdminHeader';
import { CATEGORY_LIST } from '@/lib/booking.config';

const card = 'background:#FFFDF8;border:1px solid rgba(194,165,107,0.28);border-radius:2px;';
const input = "font-family:var(--font-jost),sans-serif;font-size:13px;color:#3D2F25;background:#FAF5EC;border:1px solid rgba(194,165,107,0.4);border-radius:2px;padding:9px 11px;outline:none;";
const label = "font-family:var(--font-jost),sans-serif;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#C2A56B;margin-bottom:5px;display:block;";
const addBtn = "font-family:var(--font-jost),sans-serif;font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:#3D2F25;background:linear-gradient(135deg,#E6CF95,#C2A56B);border:none;padding:9px 16px;cursor:pointer;border-radius:1px;";
const ghost = "font-family:var(--font-jost),sans-serif;font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:#8A7965;background:none;border:1px solid rgba(194,165,107,0.45);padding:9px 14px;cursor:pointer;border-radius:1px;";

const blank = { name: '', category: CATEGORY_LIST[0], durationMin: 60, euros: '', description: '', imageUrl: '' };

export default function Services() {
  const [services, setServices] = useState(null);
  const [creating, setCreating] = useState(false);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState('');

  const load = () => fetch('/api/admin/services').then((r) => r.json()).then((d) => setServices(d.services || []));
  useEffect(() => { load(); }, []);

  const save = async (method, payload) => {
    setError('');
    const r = await fetch('/api/admin/services', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const d = await r.json();
    if (!r.ok) { setError(d.error || 'Could not save'); return false; }
    setCreating(false); setEditId(null);
    load();
    return true;
  };
  const toggleActive = (s) => save('PATCH', { id: s.id, active: !s.active });
  const remove = async (s) => {
    await fetch(`/api/admin/services?id=${s.id}`, { method: 'DELETE' });
    load();
  };

  return (
    <>
      <AdminHeader />
      <main style={css('max-width:1000px;margin:0 auto;padding:clamp(28px,4vw,48px) clamp(18px,4vw,40px);')}>
        <div style={css('display:flex;justify-content:space-between;align-items:center;gap:14px;margin-bottom:8px;')}>
          <h1 style={css("font-family:var(--font-cinzel),serif;font-weight:500;font-size:clamp(24px,3vw,34px);margin:0;")}>Services</h1>
          {!creating && <FX as="button" onClick={() => { setCreating(true); setEditId(null); }} style={addBtn} hover="transform:translateY(-1px);">+ New service</FX>}
        </div>
        <p style={css("font-family:var(--font-jost),sans-serif;font-size:13px;color:#8A7965;margin:0 0 26px;")}>Prices are optional — leave blank to show “Price on request”. Category sets which room a treatment uses.</p>
        {error && <div style={css("color:#9B4444;font-family:var(--font-jost),sans-serif;font-size:13px;margin-bottom:14px;")}>{error}</div>}

        {creating && <Editor initial={blank} onCancel={() => setCreating(false)} onSave={(p) => save('POST', p)} />}

        {services === null ? (
          <p style={css("font-family:var(--font-cormorant),serif;font-style:italic;font-size:18px;color:#8A7965;")}>Loading…</p>
        ) : (
          <div style={css('display:flex;flex-direction:column;gap:10px;margin-top:16px;')}>
            {services.map((s) =>
              editId === s.id ? (
                <Editor key={s.id} initial={{ name: s.name, category: s.category, durationMin: s.durationMin, euros: s.priceCents != null ? s.priceCents / 100 : '', description: s.description, imageUrl: s.imageUrl || '' }} onCancel={() => setEditId(null)} onSave={(p) => save('PATCH', { id: s.id, ...p })} />
              ) : (
                <div key={s.id} style={css(card + 'padding:14px 18px;display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;' + (s.active ? '' : 'opacity:0.55;'))}>
                  <div>
                    <div style={css("font-family:var(--font-cinzel),serif;font-size:16px;color:#3D2F25;")}>{s.name}{!s.active && <span style={css("font-family:var(--font-jost),sans-serif;font-size:10px;letter-spacing:0.16em;text-transform:uppercase;color:#9B4444;margin-left:8px;")}>inactive</span>}</div>
                    <div style={css("font-family:var(--font-jost),sans-serif;font-size:12px;color:#8A7965;margin-top:2px;")}>{s.category} · {s.durationMin}′ · {s.priceCents != null ? '€' + (s.priceCents / 100).toFixed(0) : '— price'} · {s._count.staff} therapist{s._count.staff === 1 ? '' : 's'}</div>
                  </div>
                  <div style={css('display:flex;gap:8px;')}>
                    <FX as="button" onClick={() => { setEditId(s.id); setCreating(false); }} style={ghost} hover="border-color:#C2A56B;color:#3D2F25;">Edit</FX>
                    <FX as="button" onClick={() => toggleActive(s)} style={ghost} hover="border-color:#C2A56B;color:#3D2F25;">{s.active ? 'Deactivate' : 'Activate'}</FX>
                    <FX as="button" onClick={() => remove(s)} style="font-family:var(--font-jost),sans-serif;font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:#9B4444;background:none;border:1px solid rgba(155,68,68,0.4);padding:9px 14px;cursor:pointer;border-radius:1px;" hover="border-color:#9B4444;">Delete</FX>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </main>
    </>
  );
}

function Editor({ initial, onCancel, onSave }) {
  const [f, setF] = useState(initial);
  const [uploading, setUploading] = useState(false);
  const [upErr, setUpErr] = useState('');

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUpErr('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      const r = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const d = await r.json();
      if (!r.ok) setUpErr(d.error || 'Upload failed');
      else setF((prev) => ({ ...prev, imageUrl: d.url }));
    } catch {
      setUpErr('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const submit = () => {
    const payload = {
      name: f.name,
      category: f.category,
      durationMin: Number(f.durationMin),
      description: f.description,
      imageUrl: f.imageUrl || null,
      priceCents: f.euros === '' || f.euros == null ? null : Math.round(Number(f.euros) * 100),
    };
    onSave(payload);
  };
  return (
    <div style={css(card + 'padding:18px 20px;')}>
      <div style={css('display:grid;grid-template-columns:repeat(auto-fit,minmax(min(160px,100%),1fr));gap:12px;')}>
        <div style={css('grid-column:1 / -1;')}><label style={css(label)}>Name</label><input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} style={css(input + 'width:100%;')} /></div>
        <div><label style={css(label)}>Category</label>
          <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} style={css(input + 'width:100%;cursor:pointer;')}>
            {CATEGORY_LIST.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div><label style={css(label)}>Duration (min)</label><input type="number" value={f.durationMin} onChange={(e) => setF({ ...f, durationMin: e.target.value })} style={css(input + 'width:100%;')} /></div>
        <div><label style={css(label)}>Price (€, optional)</label><input type="number" value={f.euros} onChange={(e) => setF({ ...f, euros: e.target.value })} style={css(input + 'width:100%;')} /></div>
        <div style={css('grid-column:1 / -1;')}><label style={css(label)}>Description</label><input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} style={css(input + 'width:100%;')} /></div>
        <div style={css('grid-column:1 / -1;')}>
          <label style={css(label)}>Image</label>
          <div style={css('display:flex;align-items:center;gap:12px;flex-wrap:wrap;')}>
            {f.imageUrl ? <img src={f.imageUrl} alt="" width="64" height="48" style={css('width:64px;height:48px;object-fit:cover;border-radius:2px;border:1px solid rgba(194,165,107,0.4);')} /> : null}
            <input type="file" accept="image/*" onChange={onFile} style={css("font-family:var(--font-jost),sans-serif;font-size:12px;color:#8A7965;")} />
            {uploading && <span style={css("font-family:var(--font-jost),sans-serif;font-size:12px;color:#8A7965;")}>Uploading…</span>}
            {f.imageUrl && <button onClick={() => setF({ ...f, imageUrl: '' })} style={css('background:none;border:none;color:#9B4444;cursor:pointer;font-size:12px;')}>remove</button>}
          </div>
          {upErr && <div style={css("color:#9B4444;font-family:var(--font-jost),sans-serif;font-size:12px;margin-top:6px;")}>{upErr}</div>}
        </div>
      </div>
      <div style={css('display:flex;gap:10px;margin-top:14px;')}>
        <FX as="button" onClick={submit} style={addBtn} hover="transform:translateY(-1px);">Save</FX>
        <FX as="button" onClick={onCancel} style={ghost} hover="border-color:#C2A56B;color:#3D2F25;">Cancel</FX>
      </div>
    </div>
  );
}
