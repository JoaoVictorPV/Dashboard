import { createHmac, scryptSync, timingSafeEqual } from 'node:crypto';

const attempts = new Map();
const noStore = (res) => { res.setHeader('Cache-Control', 'no-store, max-age=0'); res.setHeader('X-Content-Type-Options', 'nosniff'); };
const verifyPassword = (password) => {
  const [scheme, nRaw, rRaw, pRaw, saltHex, hashHex] = (process.env.ADMIN_PASSWORD_HASH || '').split(':');
  if (scheme !== 'scrypt' || !saltHex || !hashHex) throw new Error('ADMIN_PASSWORD_HASH ausente');
  const expected = Buffer.from(hashHex, 'hex');
  const actual = scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length, { N: Number(nRaw), r: Number(rRaw), p: Number(pRaw), maxmem: 64 * 1024 * 1024 });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
};
const createSession = (username) => {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error('SESSION_SECRET ausente');
  const now = Math.floor(Date.now() / 1000);
  const payload = { sub: username, iat: now, exp: now + 7200 };
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return { token: `${encoded}.${createHmac('sha256', secret).update(encoded).digest('base64url')}`, expiresAt: payload.exp * 1000 };
};
const setCookie = (req, res, token) => {
  const secure = req.headers['x-forwarded-proto'] === 'https' || process.env.VERCEL === '1';
  res.setHeader('Set-Cookie', `atlas_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=7200${secure ? '; Secure' : ''}`);
};

export default function handler(req, res) {
  noStore(res);
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });
  const ip = String(req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown').split(',')[0];
  const now = Date.now();
  const entry = attempts.get(ip);
  if (entry && entry.reset > now && entry.count >= 7) return res.status(429).json({ error: 'Muitas tentativas. Aguarde alguns minutos.' });
  try {
    const username = String(req.body?.username || '');
    const password = String(req.body?.password || '');
    const valid = username === (process.env.ADMIN_USERNAME || 'admin') && password.length <= 256 && verifyPassword(password);
    if (!valid) {
      attempts.set(ip, { count: entry && entry.reset > now ? entry.count + 1 : 1, reset: now + 900000 });
      return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
    }
    attempts.delete(ip);
    const session = createSession(username);
    setCookie(req, res, session.token);
    return res.status(200).json({ authenticated: true, expiresAt: session.expiresAt });
  } catch (error) {
    console.error(error);
    return res.status(503).json({ error: 'A autenticação ainda não foi configurada no servidor.' });
  }
}
