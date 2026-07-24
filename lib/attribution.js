// Marketing attribution — first-touch, stored in localStorage for 30 days.
// No cookies, no cross-site tracking, no personal data. Tourists often arrive via
// an Instagram/Google link, close the tab, and return days later to book direct;
// a 30-day first-touch window credits the channel that actually brought them in.

const KEY = 'nommar_attribution';
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

const EMPTY = { utmSource: null, utmMedium: null, utmCampaign: null, referrer: null, landingPage: null };

// Trim, cap length, and collapse empties to null. Keeps stored strings bounded
// (the server re-validates too) — these values are never trusted as anything but text.
function clip(v) {
  if (v == null) return null;
  const s = String(v).trim().slice(0, 200);
  return s.length ? s : null;
}

// PURE: derive the attribution object from raw inputs (no browser globals) so it
// can be unit-tested directly.
//   search    — location.search (e.g. "?utm_source=instagram&utm_medium=social")
//   referrer  — document.referrer (full URL or "")
//   pathname  — location.pathname (e.g. "/services")
//   host      — location.host (to drop same-site referrers)
export function parseAttribution({ search = '', referrer = '', pathname = '/', host = '' } = {}) {
  const params = new URLSearchParams(search || '');

  let refHost = null;
  if (referrer) {
    try {
      const h = new URL(referrer).hostname; // HOSTNAME ONLY — never the path/query
      if (h && h !== host && !host.endsWith(h) && !h.endsWith(host)) refHost = h;
    } catch {
      refHost = null;
    }
  }

  return {
    utmSource: clip(params.get('utm_source')),
    utmMedium: clip(params.get('utm_medium')),
    utmCampaign: clip(params.get('utm_campaign')),
    referrer: clip(refHost),
    landingPage: clip(pathname) || '/',
  };
}

const hasWindow = () => typeof window !== 'undefined' && typeof localStorage !== 'undefined';

function readStored() {
  if (!hasWindow()) return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed.ts !== 'number') return null;
    if (Date.now() - parsed.ts > TTL_MS) return null; // expired → treat as absent
    return parsed.data || null;
  } catch {
    return null;
  }
}

// First-touch capture: only writes if there is no still-valid stored entry.
// An entry older than 30 days is discarded and replaced by this new first touch.
export function captureFirstTouch() {
  if (!hasWindow()) return;
  try {
    if (readStored()) return; // valid entry exists → never overwrite (first-touch)
    const data = parseAttribution({
      search: window.location.search,
      referrer: document.referrer,
      pathname: window.location.pathname,
      host: window.location.host,
    });
    localStorage.setItem(KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch {
    /* private-mode / storage disabled — attribution is best-effort, never fatal */
  }
}

// Read the stored first-touch attribution for the booking payload. Returns all
// nulls (a direct booking) when nothing valid is stored.
export function getAttribution() {
  return readStored() || { ...EMPTY };
}
