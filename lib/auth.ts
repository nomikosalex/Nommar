import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { COOKIE, verifyToken } from './jwt';

export const hashPassword = (pw: string) => bcrypt.hash(pw, 10);
export const verifyPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);

// Read + verify the admin session from the request cookies (route handlers / RSC).
export async function getSession() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}
