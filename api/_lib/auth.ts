import { createHmac, scryptSync, timingSafeEqual } from 'node:crypto';
import type { VercelRequest, VercelResponse } from './types';

const COOKIE_NAME = 'atlas_session';
const SESSION_SECONDS = 2 * 60 * 60;

interface SessionPayload { sub: string; iat: number; exp: number }

function secret() {
  const value = process.env.SESSION_SECRET;
  if (!value || value.length < 32) throw new Error('SESSION_SECRET não configurado com segurança.');
  return value;
}

function encode(value: string) { return Buffer.from(value).toString('base64url'); }
function sign(value: string) { return createHmac('sha256', secret()).update(value).digest('base64url'); }

function parseCookies(req: VercelRequest) {
  return Object.fromEntries((req.headers.cookie ?? '').split(';').map((part) => {
    const index = part.indexOf('=');
    return index < 0 ? null : [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1))];
  }).filter(Boolean) as [string, string][]);
}

export function verifyPassword(password: string) {
  const configured = process.env.ADMIN_PASSWORD_HASH ?? '';
  const [scheme, nRaw, rRaw, pRaw, saltHex, hashHex] = configured.split(':');
  if (scheme !== 'scrypt' || !saltHex || !hashHex) throw new Error('ADMIN_PASSWORD_HASH não configurado.');
  const expected = Buffer.from(hashHex, 'hex');
  const actual = scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length, { N: Number(nRaw), r: Number(rRaw), p: Number(pRaw), maxmem: 64 * 1024 * 1024 });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function createSession(username: string) {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = { sub: username, iat: now, exp: now + SESSION_SECONDS };
  const encoded = encode(JSON.stringify(payload));
  return { token: `${encoded}.${sign(encoded)}`, expiresAt: payload.exp * 1000 };
}

export function readSession(req: VercelRequest): SessionPayload | null {
  try {
    const token = parseCookies(req)[COOKIE_NAME];
    if (!token) return null;
    const [encoded, signature] = token.split('.');
    if (!encoded || !signature) return null;
    const expected = Buffer.from(sign(encoded));
    const provided = Buffer.from(signature);
    if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) return null;
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionPayload;
    return payload.exp > Math.floor(Date.now() / 1000) ? payload : null;
  } catch { return null; }
}

export function setSessionCookie(req: VercelRequest, res: VercelResponse, token: string) {
  const secure = req.headers['x-forwarded-proto'] === 'https' || process.env.VERCEL === '1';
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_SECONDS}${secure ? '; Secure' : ''}`);
}

export function clearSessionCookie(req: VercelRequest, res: VercelResponse) {
  const secure = req.headers['x-forwarded-proto'] === 'https' || process.env.VERCEL === '1';
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure ? '; Secure' : ''}`);
}

export function requireSession(req: VercelRequest, res: VercelResponse) {
  const session = readSession(req);
  if (!session) { res.status(401).json({ error: 'Sua sessão expirou. Entre novamente.' }); return null; }
  return session;
}

export function noStore(res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
}
