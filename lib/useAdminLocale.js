'use client';
// Lightweight EN/GR preference for the admin panel, shared across components
// (AdminHeader toggle ↔ Bookings page) via localStorage + a custom event.
// Starts 'en' on both server and first client render to avoid hydration
// mismatch, then syncs to the stored value after mount.
import { useState, useEffect } from 'react';

const KEY = 'nommar_admin_locale';
const EVT = 'nommar-admin-locale';

export function getAdminLocale() {
  if (typeof window === 'undefined') return 'en';
  return localStorage.getItem(KEY) === 'gr' ? 'gr' : 'en';
}

export function setAdminLocale(loc) {
  const v = loc === 'gr' ? 'gr' : 'en';
  localStorage.setItem(KEY, v);
  window.dispatchEvent(new CustomEvent(EVT, { detail: v }));
}

export function useAdminLocale() {
  const [loc, setLoc] = useState('en');
  useEffect(() => {
    setLoc(getAdminLocale());
    const onEvt = (e) => setLoc(e.detail === 'gr' ? 'gr' : 'en');
    const onStorage = () => setLoc(getAdminLocale());
    window.addEventListener(EVT, onEvt);
    window.addEventListener('storage', onStorage); // sync across tabs
    return () => {
      window.removeEventListener(EVT, onEvt);
      window.removeEventListener('storage', onStorage);
    };
  }, []);
  return loc;
}
