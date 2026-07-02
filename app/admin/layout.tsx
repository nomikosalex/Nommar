import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: '100dvh', background: '#FAF5EC', fontFamily: "var(--font-jost),sans-serif", color: '#3D2F25' }}>
      {children}
    </div>
  );
}
