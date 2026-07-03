// Canonical origin + link builders, shared by emails and the promo banner.
// NEXT_PUBLIC_ so it's available on both server and client.

export function getBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_BASE_URL || 'https://nommar.vercel.app';
  return raw.replace(/\/+$/, ''); // no trailing slash
}

// Public self-service page for a reservation (verify email + cancel).
export function reservationUrl(token: string): string {
  return `${getBaseUrl()}/r/${token}`;
}
