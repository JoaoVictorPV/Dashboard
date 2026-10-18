import { createHmac, timingSafeEqual } from 'node:crypto';

const noStore = (res) => res.setHeader('Cache-Control', 'no-store, max-age=0');
const readSession = (req) => {
  try {
    const cookie = (req.headers.cookie || '').split(';').map((part) => part.trim()).find((part) => part.startsWith('atlas_session='));
    const token = cookie ? decodeURIComponent(cookie.slice('atlas_session='.length)) : '';
    const secret = process.env.SESSION_SECRET;
    const [encoded, signature] = token.split('.');
    if (!secret || !encoded || !signature) return null;
    const expected = Buffer.from(createHmac('sha256', secret).update(encoded).digest('base64url'));
    const provided = Buffer.from(signature);
    if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) return null;
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    return payload.exp > Math.floor(Date.now() / 1000) ? payload : null;
  } catch { return null; }
};

export default function handler(req, res) {
  noStore(res);
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });
  const current = readSession(req);
  if (!current) return res.status(401).json({ error: 'Sessão expirada.' });
  const now = Math.floor(Date.now() / 1000);
  const payload = { sub: current.sub, iat: now, exp: now + 7200 };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const token = `${encoded}.${createHmac('sha256', process.env.SESSION_SECRET).update(encoded).digest('base64url')}`;
  res.setHeader('Set-Cookie', `atlas_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=7200; Secure`);
  return res.status(200).json({ authenticated: true, expiresAt: payload.exp * 1000 });
}
