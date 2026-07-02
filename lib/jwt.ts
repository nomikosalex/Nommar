import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

// JWT helpers with no Node-only deps (safe to import from proxy.ts).
export const COOKIE = 'nommar_admin';

function secret() {
  const s = process.env.JWT_SECRET;
  // Never fall back to a known value in production — that would make admin
  // sessions forgeable. Dev keeps a fallback so the app boots without setup.
  if (!s || s.length < 32) {
    if (process.env.NODE_ENV === 'production') throw new Error('JWT_SECRET must be set (32+ chars) in production');
    return new TextEncoder().encode(s || 'dev-secret-change-me');
  }
  return new TextEncoder().encode(s);
}

export async function createToken(email: string): Promise<string> {
  return new SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(email)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret());
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload;
  } catch {
    return null;
  }
}
