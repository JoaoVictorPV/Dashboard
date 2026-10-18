import type { VercelRequest, VercelResponse } from '../_lib/types';
import { noStore, requireSession } from '../_lib/auth';
import { ncbiFetch, ncbiParams } from '../_lib/ncbi';

function decodeXml(value: string) {
  const entities: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
  return value.replace(/<[^>]+>/g, ' ').replace(/&(#x?[0-9a-f]+|amp|lt|gt|quot|apos);/gi, (_, entity: string) => {
    if (entities[entity]) return entities[entity];
    const hex = entity.toLowerCase().startsWith('#x');
    const numeric = Number.parseInt(entity.replace(/^#x?/i, ''), hex ? 16 : 10);
    return Number.isFinite(numeric) ? String.fromCodePoint(numeric) : '';
  }).replace(/\s+/g, ' ').trim();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  noStore(res);
  if (req.method !== 'GET') return res.status(405).json({ error: 'Método não permitido.' });
  if (!requireSession(req, res)) return;
  const pmid = String(req.query.pmid ?? '');
  if (!/^\d{1,12}$/.test(pmid)) return res.status(400).json({ error: 'PMID inválido.' });
  try {
    const xml = await ncbiFetch('efetch.fcgi', ncbiParams({ db: 'pubmed', id: pmid, rettype: 'abstract' }), 'xml') as string;
    const parts = [...xml.matchAll(/<AbstractText(?:\s+Label="([^"]*)")?[^>]*>([\s\S]*?)<\/AbstractText>/gi)].map((match) => `${match[1] ? `${decodeXml(match[1])}: ` : ''}${decodeXml(match[2])}`);
    return res.status(200).json({ pmid, abstract: parts.join('\n\n') || 'O PubMed não forneceu um resumo para este registro.' });
  } catch (error) {
    console.error(error);
    return res.status(502).json({ error: 'Não foi possível obter o resumo no PubMed.' });
  }
}
