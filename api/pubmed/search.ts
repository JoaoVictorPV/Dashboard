import type { VercelRequest, VercelResponse } from '../_lib/types';
import { noStore, requireSession } from '../_lib/auth';
import { cleanText, ncbiFetch, ncbiParams } from '../_lib/ncbi';

interface SummaryRecord {
  uid?: string;
  title?: string;
  fulljournalname?: string;
  source?: string;
  pubdate?: string;
  sortpubdate?: string;
  authors?: { name?: string }[];
  attributes?: string[];
  articleids?: { idtype?: string; value?: string }[];
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  noStore(res);
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });
  if (!requireSession(req, res)) return;
  try {
    const query = String(req.body?.query ?? '').trim();
    const page = Math.max(1, Math.min(400, Number(req.body?.page) || 1));
    const pageSize = Math.max(1, Math.min(50, Number(req.body?.pageSize) || 25));
    const sort = req.body?.sort === 'relevance' ? 'relevance' : 'pub date';
    if (!query || query.length > 5000) return res.status(400).json({ error: 'A consulta está vazia ou excede o limite permitido.' });
    const search = await ncbiFetch('esearch.fcgi', ncbiParams({ db: 'pubmed', term: query, retstart: String((page - 1) * pageSize), retmax: String(pageSize), sort, usehistory: 'y' })) as { esearchresult?: { count?: string; idlist?: string[]; errorlist?: unknown } };
    const ids = search.esearchresult?.idlist ?? [];
    const total = Number(search.esearchresult?.count ?? 0);
    if (!ids.length) return res.status(200).json({ articles: [], total, page, pageSize, query });
    const summary = await ncbiFetch('esummary.fcgi', ncbiParams({ db: 'pubmed', id: ids.join(','), version: '2.0' })) as { result?: Record<string, SummaryRecord | string[]> };
    const articles = ids.map((pmid) => summary.result?.[pmid] as SummaryRecord | undefined).filter((item): item is SummaryRecord => Boolean(item)).map((item) => {
      const articleIds = item.articleids ?? [];
      const id = (type: string) => articleIds.find((entry) => entry.idtype === type)?.value ?? null;
      return {
        pmid: item.uid ?? id('pubmed') ?? '',
        title: cleanText(item.title) || 'Título não informado',
        journal: cleanText(item.fulljournalname) || cleanText(item.source) || 'Revista não informada',
        journalAbbreviation: cleanText(item.source),
        authors: (item.authors ?? []).map((author) => cleanText(author.name)).filter(Boolean),
        publicationDate: cleanText(item.pubdate || item.sortpubdate),
        doi: id('doi'),
        pmcId: id('pmc'),
        hasAbstract: (item.attributes ?? []).some((attribute) => attribute.toLowerCase().includes('abstract')),
      };
    });
    return res.status(200).json({ articles, total, page, pageSize, query });
  } catch (error) {
    console.error(error);
    return res.status(502).json({ error: 'O PubMed não respondeu como esperado. Tente novamente em instantes.' });
  }
}
