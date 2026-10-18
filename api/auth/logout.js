export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });
  res.setHeader('Set-Cookie', 'atlas_session=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0; Secure');
  return res.status(200).json({ ok: true });
}
