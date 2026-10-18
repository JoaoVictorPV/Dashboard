import { createHmac, timingSafeEqual } from 'node:crypto';

const noStore = (res) => { res.setHeader('Cache-Control', 'no-store, max-age=0'); res.setHeader('X-Content-Type-Options', 'nosniff'); };
const cookies = (req) => Object.fromEntries((req.headers.cookie || '').split(';').map((part) => { const index = part.indexOf('='); return index < 0 ? null : [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1))]; }).filter(Boolean));
const readSession = (req) => {
  try {
    const token = cookies(req).atlas_session;
    const secret = process.env.SESSION_SECRET;
    if (!token || !secret || secret.length < 32) return null;
    const [encoded, signature] = token.split('.');
    const expected = Buffer.from(createHmac('sha256', secret).update(encoded).digest('base64url'));
    const provided = Buffer.from(signature || '');
    if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) return null;
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    return payload.exp > Math.floor(Date.now() / 1000) ? payload : null;
  } catch { return null; }
};

export default function handler(req, res) {
  noStore(res);
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido.' });
  const session = readSession(req);
  return res.status(200).json(session ? { authenticated: true, expiresAt: session.exp * 1000 } : { authenticated: false });
}
