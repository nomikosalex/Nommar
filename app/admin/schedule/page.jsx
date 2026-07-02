'use client';
import { useEffect, useState } from 'react';
import { css } from '@/lib/css';
import { FX } from '@/lib/fx';
import AdminHeader from '@/components/admin/AdminHeader';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TZ = 'Europe/Athens';
const fmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: TZ });

const minToTime = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const timeToMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

const card = 'background:#FFFDF8;border:1px solid rgba(194,165,107,0.28);border-radius:2px;';
const eyebrow = "font-family:var(--font-jost),sans-serif;font-size:11px;letter-spacing:0.24em;text-transform:uppercase;color:#C2A56B;";
const inp = "font-family:var(--font-jost),sans-serif;font-size:13px;color:#3D2F25;background:#FAF5EC;border:1px solid rgba(194,165,107,0.4);border-radius:2px;padding:9px 11px;outline:none;";
const addBtn = "font-family:var(--font-jost),sans-serif;font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:#3D2F25;background:linear-gradient(135deg,#E6CF95,#C2A56B);border:none;padding:9px 14px;cursor:pointer;border-radius:1px;";
const ghost = "font-family:var(--font-jost),sans-serif;font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:#8A7965;background:none;border:1px solid rgba(194,165,107,0.45);padding:8px 12px;cursor:pointer;border-radius:1px;";
const delBtn = "font-family:var(--font-jost),sans-serif;font-size:11px;color:#9B4444;background:none;border:none;cursor:pointer;";

export default function Schedule() {
  const [staff, setStaff] = useState(null);
  const [services, setServices] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [newName, setNewName] = useState('');

  const load = () => {
    fetch('/api/admin/staff').then((r) => r.json()).then((d) => setStaff(d.staff || []));
    fetch('/api/admin/services').then((r) => r.json()).then((d) => setServices((d.services || []).filter((s) => s.active)));
    fetch('/api/admin/blocks').then((r) => r.json()).then((d) => setBlocks(d.blocks || []));
  };
  useEffect(load, []);

  const patchStaff = async (payload) => { await fetch('/api/admin/staff', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); load(); };
  const addStaff = async () => { if (!newName.trim()) return; await fetch('/api/admin/staff', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newName }) }); setNewName(''); load(); };
  const delStaff = async (id) => { await fetch(`/api/admin/staff?id=${id}`, { method: 'DELETE' }); load(); };

  return (
    <>
      <AdminHeader />
      <main style={css('max-width:1100px;margin:0 auto;padding:clamp(28px,4vw,48px) clamp(18px,4vw,40px);')}>
        <h1 style={css("font-family:var(--font-cinzel),serif;font-weight:500;font-size:clamp(24px,3vw,34px);margin:0 0 6px;")}>Schedule</h1>
        <p style={css("font-family:var(--font-jost),sans-serif;font-size:13px;color:#8A7965;margin:0 0 28px;")}>Therapists, the treatments they perform, working hours and time off — all feed availability. Athens time.</p>

        <div style={css(eyebrow + 'margin-bottom:14px;')}>Therapists</div>
        {staff === null ? (
          <p style={css("font-family:var(--font-cormorant),serif;font-style:italic;font-size:18px;color:#8A7965;")}>Loading…</p>
        ) : (
          <div style={css('display:flex;flex-direction:column;gap:16px;')}>
            {staff.map((s) => <StaffCard key={s.id} staff={s} services={services} onPatch={patchStaff} onDelete={delStaff} reload={load} />)}
          </div>
        )}
        <div style={css('display:flex;gap:8px;align-items:center;margin-top:16px;')}>
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New therapist name" style={css(inp + 'min-width:200px;')} />
          <FX as="button" onClick={addStaff} style={addBtn} hover="transform:translateY(-1px);">+ Add therapist</FX>
        </div>

        <div style={css(eyebrow + 'margin:44px 0 14px;')}>Time Off / Closures</div>
        <BlocksPanel staff={staff || []} blocks={blocks} onChange={load} />
      </main>
    </>
  );
}

function StaffCard({ staff, services, onPatch, onDelete, reload }) {
  const [name, setName] = useState(staff.name);
  const [weekday, setWeekday] = useState('1');
  const [start, setStart] = useState('10:00');
  const [end, setEnd] = useState('18:00');
  const serviceIds = new Set(staff.services.map((x) => x.id));

  const toggleService = (id) => {
    const next = new Set(serviceIds);
    next.has(id) ? next.delete(id) : next.add(id);
    onPatch({ id: staff.id, serviceIds: [...next] });
  };
  const addHours = async () => {
    await fetch('/api/admin/hours', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ staffId: staff.id, weekday: Number(weekday), startMin: timeToMin(start), endMin: timeToMin(end) }) });
    reload();
  };
  const removeHours = async (id) => { await fetch(`/api/admin/hours?id=${id}`, { method: 'DELETE' }); reload(); };

  return (
    <div style={css(card + 'padding:18px 20px;' + (staff.active ? '' : 'opacity:0.6;'))}>
      <div style={css('display:flex;flex-wrap:wrap;gap:12px;align-items:center;justify-content:space-between;margin-bottom:14px;')}>
        <input value={name} onChange={(e) => setName(e.target.value)} onBlur={() => name !== staff.name && onPatch({ id: staff.id, name })} style={css("font-family:var(--font-cinzel),serif;font-size:18px;color:#3D2F25;background:transparent;border:none;border-bottom:1px solid rgba(194,165,107,0.4);outline:none;padding:2px 0;")} />
        <div style={css('display:flex;gap:8px;')}>
          <FX as="button" onClick={() => onPatch({ id: staff.id, active: !staff.active })} style={ghost} hover="border-color:#C2A56B;color:#3D2F25;">{staff.active ? 'Deactivate' : 'Activate'}</FX>
          <FX as="button" onClick={() => onDelete(staff.id)} style="font-family:var(--font-jost),sans-serif;font-size:10.5px;letter-spacing:0.14em;text-transform:uppercase;color:#9B4444;background:none;border:1px solid rgba(155,68,68,0.4);padding:8px 12px;cursor:pointer;border-radius:1px;" hover="border-color:#9B4444;">Delete</FX>
        </div>
      </div>

      <div style={css("font-family:var(--font-jost),sans-serif;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#A8967C;margin-bottom:8px;")}>Performs</div>
      <div style={css('display:flex;flex-wrap:wrap;gap:7px;margin-bottom:16px;')}>
        {services.map((sv) => {
          const on = serviceIds.has(sv.id);
          return (
            <button key={sv.id} onClick={() => toggleService(sv.id)} style={css('font-family:var(--font-jost),sans-serif;font-size:11.5px;cursor:pointer;padding:6px 11px;border-radius:2px;' + (on ? 'background:linear-gradient(135deg,#E6CF95,#C2A56B);color:#3D2F25;border:1px solid #C2A56B;' : 'background:transparent;color:#8A7965;border:1px solid rgba(194,165,107,0.4);'))}>{sv.name}</button>
          );
        })}
      </div>

      <div style={css("font-family:var(--font-jost),sans-serif;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:#A8967C;margin-bottom:8px;")}>Working hours</div>
      <div style={css('display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;')}>
        {staff.workingHours.length === 0 && <span style={css("font-family:var(--font-jost),sans-serif;font-size:13px;color:#8A7965;")}>None set.</span>}
        {staff.workingHours.map((w) => (
          <span key={w.id} style={css("display:inline-flex;align-items:center;gap:8px;font-family:var(--font-jost),sans-serif;font-size:12.5px;color:#3D2F25;background:#F3EADA;border:1px solid rgba(194,165,107,0.35);padding:7px 12px;border-radius:2px;")}>
            {WEEKDAYS[w.weekday].slice(0, 3)} {minToTime(w.startMin)}–{minToTime(w.endMin)}
            <button onClick={() => removeHours(w.id)} style={css('background:none;border:none;color:#9B4444;cursor:pointer;font-size:14px;line-height:1;padding:0;')}>×</button>
          </span>
        ))}
      </div>
      <div style={css('display:flex;flex-wrap:wrap;gap:8px;align-items:center;')}>
        <select value={weekday} onChange={(e) => setWeekday(e.target.value)} style={css(inp + 'cursor:pointer;')}>{WEEKDAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}</select>
        <input type="time" value={start} onChange={(e) => setStart(e.target.value)} style={css(inp)} />
        <span style={css('color:#8A7965;')}>–</span>
        <input type="time" value={end} onChange={(e) => setEnd(e.target.value)} style={css(inp)} />
        <FX as="button" onClick={addHours} style={addBtn} hover="transform:translateY(-1px);">Add hours</FX>
      </div>
    </div>
  );
}

function BlocksPanel({ staff, blocks, onChange }) {
  const [staffId, setStaffId] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [endsAt, setEndsAt] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const add = async () => {
    setError('');
    if (!startsAt || !endsAt) return setError('Pick a start and end.');
    const r = await fetch('/api/admin/blocks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ staffId: staffId ? Number(staffId) : null, startsAt: new Date(startsAt).toISOString(), endsAt: new Date(endsAt).toISOString(), reason }) });
    if (!r.ok) { const d = await r.json(); setError(d.error || 'Could not add.'); return; }
    setStartsAt(''); setEndsAt(''); setReason(''); setStaffId(''); onChange();
  };
  const remove = async (id) => { await fetch(`/api/admin/blocks?id=${id}`, { method: 'DELETE' }); onChange(); };

  return (
    <div style={css(card + 'padding:20px 22px;')}>
      <div style={css('display:flex;flex-direction:column;gap:10px;margin-bottom:18px;')}>
        {blocks.length === 0 && <span style={css("font-family:var(--font-jost),sans-serif;font-size:13px;color:#8A7965;")}>No upcoming time off.</span>}
        {blocks.map((b) => (
          <div key={b.id} style={css('display:flex;align-items:center;justify-content:space-between;gap:12px;background:#F3EADA;border:1px solid rgba(194,165,107,0.3);padding:10px 14px;border-radius:2px;')}>
            <span style={css("font-family:var(--font-jost),sans-serif;font-size:13px;color:#3D2F25;")}><strong>{b.staff ? b.staff.name : 'Whole spa'}</strong> · {fmt.format(new Date(b.startsAt))} → {fmt.format(new Date(b.endsAt))}{b.reason ? ` · ${b.reason}` : ''}</span>
            <button onClick={() => remove(b.id)} style={css(delBtn)}>Remove</button>
          </div>
        ))}
      </div>
      {error && <div style={css("color:#9B4444;font-family:var(--font-jost),sans-serif;font-size:13px;margin-bottom:10px;")}>{error}</div>}
      <div style={css('display:flex;flex-wrap:wrap;gap:8px;align-items:center;')}>
        <select value={staffId} onChange={(e) => setStaffId(e.target.value)} style={css(inp + 'cursor:pointer;')}>
          <option value="">Whole spa</option>
          {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} style={css(inp)} />
        <span style={css('color:#8A7965;')}>→</span>
        <input type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} style={css(inp)} />
        <input type="text" placeholder="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} style={css(inp + 'min-width:150px;')} />
        <FX as="button" onClick={add} style={addBtn} hover="transform:translateY(-1px);">Add time off</FX>
      </div>
    </div>
  );
}
