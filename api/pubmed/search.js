import { createHmac, timingSafeEqual } from 'node:crypto';

const noStore = (res) => { res.setHeader('Cache-Control', 'no-store, max-age=0'); res.setHeader('X-Content-Type-Options', 'nosniff'); };
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
const params = (extra) => {
  const value = new URLSearchParams({ retmode: 'json', tool: process.env.NCBI_TOOL || 'atlas-medico', email: process.env.NCBI_EMAIL || 'joaovictorpv@hotmail.com', ...extra });
  if (process.env.NCBI_API_KEY) value.set('api_key', process.env.NCBI_API_KEY);
  return value;
};
const ncbi = async (path, body) => {
  const response = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': `${process.env.NCBI_TOOL || 'atlas-medico'}/2.0 (${process.env.NCBI_EMAIL || 'joaovictorpv@hotmail.com'})` }, body, signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`NCBI ${response.status}`);
  return response.json();
};
const clean = (value) => String(value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

export default async function handler(req, res) {
  noStore(res);
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });
  if (!authorized(req)) return res.status(401).json({ error: 'Sua sessão expirou. Entre novamente.' });
  try {
    const query = String(req.body?.query || '').trim();
    const page = Math.max(1, Math.min(400, Number(req.body?.page) || 1));
    const pageSize = Math.max(1, Math.min(50, Number(req.body?.pageSize) || 25));
    const sort = req.body?.sort === 'relevance' ? 'relevance' : 'pub date';
    if (!query || query.length > 5000) return res.status(400).json({ error: 'A consulta está vazia ou excede o limite permitido.' });
    const search = await ncbi('esearch.fcgi', params({ db: 'pubmed', term: query, retstart: String((page - 1) * pageSize), retmax: String(pageSize), sort, usehistory: 'y' }));
    const ids = search.esearchresult?.idlist || [];
    const total = Number(search.esearchresult?.count || 0);
    if (!ids.length) return res.status(200).json({ articles: [], total, page, pageSize, query });
    const summary = await ncbi('esummary.fcgi', params({ db: 'pubmed', id: ids.join(','), version: '2.0' }));
    const articles = ids.map((pmid) => summary.result?.[pmid]).filter(Boolean).map((item) => {
      const articleIds = item.articleids || [];
      const id = (type) => articleIds.find((entry) => entry.idtype === type)?.value || null;
      return { pmid: item.uid || id('pubmed') || '', title: clean(item.title) || 'Título não informado', journal: clean(item.fulljournalname) || clean(item.source) || 'Revista não informada', journalAbbreviation: clean(item.source), authors: (item.authors || []).map((author) => clean(author.name)).filter(Boolean), publicationDate: clean(item.pubdate || item.sortpubdate), doi: id('doi'), pmcId: id('pmc'), hasAbstract: (item.attributes || []).some((attribute) => attribute.toLowerCase().includes('abstract')) };
    });
    return res.status(200).json({ articles, total, page, pageSize, query });
  } catch (error) {
    console.error(error);
    return res.status(502).json({ error: 'O PubMed não respondeu como esperado. Tente novamente em instantes.' });
  }
}
