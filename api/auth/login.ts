import type { VercelRequest, VercelResponse } from '../_lib/types';
import { createSession, noStore, setSessionCookie, verifyPassword } from '../_lib/auth';

const attempts = new Map<string, { count: number; reset: number }>();

export default function handler(req: VercelRequest, res: VercelResponse) {
  noStore(res);
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });
  const ip = String(req.headers['x-forwarded-for'] ?? req.socket.remoteAddress ?? 'unknown').split(',')[0];
  const now = Date.now();
  const entry = attempts.get(ip);
  if (entry && entry.reset > now && entry.count >= 7) return res.status(429).json({ error: 'Muitas tentativas. Aguarde alguns minutos.' });
  try {
    const username = String(req.body?.username ?? '');
    const password = String(req.body?.password ?? '');
    const validUser = username === (process.env.ADMIN_USERNAME ?? 'admin');
    const validPassword = password.length <= 256 && verifyPassword(password);
    if (!validUser || !validPassword) {
      attempts.set(ip, { count: entry && entry.reset > now ? entry.count + 1 : 1, reset: now + 15 * 60 * 1000 });
      return res.status(401).json({ error: 'Usuário ou senha incorretos.' });
    }
    attempts.delete(ip);
    const session = createSession(username);
    setSessionCookie(req, res, session.token);
    return res.status(200).json({ authenticated: true, expiresAt: session.expiresAt });
  } catch (error) {
    console.error(error);
    return res.status(503).json({ error: 'A autenticação ainda não foi configurada no servidor.' });
  }
}
