import type { VercelRequest, VercelResponse } from '../_lib/types';
import { createSession, noStore, readSession, setSessionCookie } from '../_lib/auth';

export default function handler(req: VercelRequest, res: VercelResponse) {
  noStore(res);
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });
  const current = readSession(req);
  if (!current) return res.status(401).json({ error: 'Sessão expirada.' });
  const session = createSession(current.sub);
  setSessionCookie(req, res, session.token);
  return res.status(200).json({ authenticated: true, expiresAt: session.expiresAt });
}
