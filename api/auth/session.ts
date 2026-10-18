import type { VercelRequest, VercelResponse } from '../_lib/types';
import { noStore, readSession } from '../_lib/auth';

export default function handler(req: VercelRequest, res: VercelResponse) {
  noStore(res);
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido.' });
  const session = readSession(req);
  return res.status(200).json(session ? { authenticated: true, expiresAt: session.exp * 1000 } : { authenticated: false });
}
