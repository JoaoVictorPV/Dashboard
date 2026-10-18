import { createHmac, timingSafeEqual } from 'node:crypto';

const authorized = (req) => {
  try {
    const cookie = (req.headers.cookie || '').split(';').map((part) => part.trim()).find((part) => part.startsWith('atlas_session='));
    const token = cookie ? decodeURIComponent(cookie.slice('atlas_session='.length)) : '';
    const secret = process.env.SESSION_SECRET;
    const [encoded, signature] = token.split('.');
    if (!secret || !encoded || !signature) return false;
    const expected = Buffer.from(createHmac('sha256', secret).update(encoded).digest('base64url'));
    const provided = Buffer.from(signature);
    if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) return false;
    return JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')).exp > Math.floor(Date.now() / 1000);
  } catch { return false; }
};
const decodeXml = (value) => {
  const entities = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
  return value.replace(/<[^>]+>/g, ' ').replace(/&(#x?[0-9a-f]+|amp|lt|gt|quot|apos);/gi, (_, entity) => {
    if (entities[entity]) return entities[entity];
    const hex = entity.toLowerCase().startsWith('#x');
    const numeric = Number.parseInt(entity.replace(/^#x?/i, ''), hex ? 16 : 10);
    return Number.isFinite(numeric) ? String.fromCodePoint(numeric) : '';
  }).replace(/\s+/g, ' ').trim();
};

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido.' });
  if (!authorized(req)) return res.status(401).json({ error: 'Sua sessão expirou. Entre novamente.' });
  const pmid = String(req.query.pmid || '');
  if (!/^\d{1,12}$/.test(pmid)) return res.status(400).json({ error: 'PMID inválido.' });
  try {
    const body = new URLSearchParams({ db: 'pubmed', id: pmid, rettype: 'abstract', retmode: 'xml', tool: process.env.NCBI_TOOL || 'atlas-medico', email: process.env.NCBI_EMAIL || 'joaovictorpv@hotmail.com' });
    if (process.env.NCBI_API_KEY) body.set('api_key', process.env.NCBI_API_KEY);
    const response = await fetch('https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body, signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error(`NCBI ${response.status}`);
    const xml = await response.text();
    const parts = [...xml.matchAll(/<AbstractText(?:\s+Label="([^"]*)")?[^>]*>([\s\S]*?)<\/AbstractText>/gi)].map((match) => `${match[1] ? `${decodeXml(match[1])}: ` : ''}${decodeXml(match[2])}`);
    return res.status(200).json({ pmid, abstract: parts.join('\n\n') || 'O PubMed não forneceu um resumo para este registro.' });
  } catch (error) {
    console.error(error);
    return res.status(502).json({ error: 'Não foi possível obter o resumo no PubMed.' });
  }
}
