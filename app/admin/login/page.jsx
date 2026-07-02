'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { css } from '@/lib/css';
import { FX } from '@/lib/fx';

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const r = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const d = await r.json();
      if (!r.ok) setError(d.error || 'Login failed');
      else {
        router.push('/admin');
        router.refresh();
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const input = "font-family:var(--font-jost),sans-serif;font-weight:300;font-size:15px;color:#3D2F25;background:#FAF5EC;border:1px solid rgba(194,165,107,0.4);border-radius:2px;padding:13px 15px;outline:none;width:100%;";
  const label = "font-family:var(--font-jost),sans-serif;font-size:10.5px;letter-spacing:0.22em;text-transform:uppercase;color:#C2A56B;margin-bottom:8px;display:block;";

  return (
    <div style={css('min-height:100dvh;display:flex;align-items:center;justify-content:center;padding:24px;')}>
      <div style={css('width:100%;max-width:400px;background:#FFFDF8;border:1px solid rgba(194,165,107,0.3);box-shadow:0 26px 56px -36px rgba(61,47,37,0.5);padding:clamp(30px,4vw,46px);')}>
        <div style={css('text-align:center;margin-bottom:28px;')}>
          <div style={css("font-family:var(--font-cinzel),serif;font-size:22px;letter-spacing:0.14em;font-weight:600;color:#3D2F25;")}>NOMMAR</div>
          <div style={css("font-family:var(--font-jost),sans-serif;font-size:10px;letter-spacing:0.34em;text-transform:uppercase;color:#C2A56B;margin-top:6px;")}>Admin Access</div>
        </div>
        {error && <div style={css("background:#FBEFEF;border:1px solid #E3B7B7;color:#9B4444;font-family:var(--font-jost),sans-serif;font-size:13px;padding:11px 14px;border-radius:2px;margin-bottom:18px;text-align:center;")}>{error}</div>}
        <form onSubmit={submit} style={css('display:flex;flex-direction:column;gap:18px;')}>
          <div>
            <label htmlFor="admin-email" style={css(label)}>Email</label>
            <FX as="input" id="admin-email" name="email" autoComplete="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} style={input} focus="border-color:#C2A56B;" />
          </div>
          <div>
            <label htmlFor="admin-password" style={css(label)}>Password</label>
            <FX as="input" id="admin-password" name="password" autoComplete="current-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} style={input} focus="border-color:#C2A56B;" />
          </div>
          <FX as="button" type="submit" style={"margin-top:4px;font-family:var(--font-jost),sans-serif;font-size:12px;letter-spacing:0.2em;text-transform:uppercase;color:#3D2F25;font-weight:500;background:linear-gradient(135deg,#E6CF95,#C2A56B);border:none;padding:15px 30px;cursor:pointer;border-radius:1px;" + (busy ? 'opacity:0.6;pointer-events:none;' : '')} hover="transform:translateY(-2px);">
            {busy ? 'Signing in…' : 'Sign in'}
          </FX>
        </form>
      </div>
    </div>
  );
}
