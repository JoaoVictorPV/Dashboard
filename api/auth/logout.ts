import type { VercelRequest, VercelResponse } from '../_lib/types';
import { clearSessionCookie, noStore } from '../_lib/auth';

export default function handler(req: VercelRequest, res: VercelResponse) {
  noStore(res);
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });
  clearSessionCookie(req, res);
  return res.status(200).json({ ok: true });
}
