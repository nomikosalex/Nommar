'use client';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { css } from '@/lib/css';
import { FX } from '@/lib/fx';

export default function AdminHeader() {
  const router = useRouter();
  const pathname = usePathname();

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  const link = (href, label) => {
    const active = pathname === href;
    return (
      <FX as={Link} href={href} style={"font-family:var(--font-jost),sans-serif;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;text-decoration:none;padding:6px 0;color:" + (active ? '#3D2F25;font-weight:500;border-bottom:1px solid #C2A56B;' : '#A8967C;')} hover="color:#C2A56B;">
        {label}
      </FX>
    );
  };

  return (
    <header style={css('position:sticky;top:0;z-index:40;background:#FFFDF8;border-bottom:1px solid rgba(194,165,107,0.3);')}>
      <div style={css('max-width:1180px;margin:0 auto;padding:16px clamp(18px,4vw,40px);display:flex;align-items:center;justify-content:space-between;gap:20px;')}>
        <div style={css('display:flex;align-items:center;gap:26px;')}>
          <span style={css("font-family:var(--font-cinzel),serif;font-size:18px;letter-spacing:0.12em;font-weight:600;color:#3D2F25;")}>NOMMAR <span style={css('color:#C2A56B;font-size:12px;letter-spacing:0.2em;')}>ADMIN</span></span>
          <nav style={css('display:flex;flex-wrap:wrap;gap:18px;')}>
            {link('/admin', 'Bookings')}
            {link('/admin/calendar', 'Calendar')}
            {link('/admin/schedule', 'Schedule')}
            {link('/admin/services', 'Services')}
          </nav>
        </div>
        <FX as="button" onClick={logout} style="font-family:var(--font-jost),sans-serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#8A7965;background:none;border:1px solid rgba(194,165,107,0.45);padding:9px 16px;cursor:pointer;border-radius:1px;" hover="border-color:#C2A56B;color:#3D2F25;">Log out</FX>
      </div>
    </header>
  );
}
