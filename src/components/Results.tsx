import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { fetchAbstract, fetchAbstracts, fetchAuthorAffiliations } from '../lib/api';
import { downloadResultsHtml } from '../lib/exportHtml';
import { hasFreeFullTextFilter } from '../lib/query';
import { translateArticleContent } from '../lib/translate';
import type { AuthorAffiliation, PubMedArticle, SearchResponse, SortMode } from '../types';
import { Icon } from './Icon';

type Column = 'title' | 'authors' | 'journal' | 'publicationDate' | 'pmid';
type Direction = 'asc' | 'desc';

interface Props {
  result: SearchResponse;
  searchRevision: number;
  sortMode: SortMode;
  onSortMode: (sort: SortMode) => void;
  onPage: (page: number) => void;
  onArticleUpdate: (article: PubMedArticle) => void;
}

const collator = new Intl.Collator('pt-BR', { numeric: true, sensitivity: 'base' });
const columnOrder: Column[] = ['title', 'authors', 'journal', 'publicationDate', 'pmid'];
const columnWeight: Record<Column, number> = { title: 42, authors: 22, journal: 16, publicationDate: 9, pmid: 11 };
const columnMinimum: Record<Column, number> = { title: 390, authors: 220, journal: 170, publicationDate: 110, pmid: 130 };

function normalizedAuthorName(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function AffiliationHint({ author, affiliations }: { author: string; affiliations: string[] }) {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const show = () => {
    const rect = trigger.current?.getBoundingClientRect();
    if (!rect) return;
    setPosition({ top: rect.bottom + 7, left: Math.max(12, Math.min(rect.left - 8, window.innerWidth - 342)) });
  };
  return <span className="affiliation-hint">
    <button ref={trigger} type="button" title={`Ver afiliações de ${author}`} aria-label={`Afiliações de ${author}`} aria-describedby={position ? id : undefined} onMouseEnter={show} onMouseLeave={() => setPosition(null)} onFocus={show} onBlur={() => setPosition(null)}><span>{author}</span><Icon name="info" /></button>
    {position && createPortal(<span id={id} role="tooltip" className="affiliation-tooltip" style={{ top: position.top, left: position.left }}><b>{author}</b>{affiliations.map((affiliation) => <span key={affiliation}>{affiliation}</span>)}</span>, document.body)}
  </span>;
}

export function Results({ result, searchRevision, sortMode, onSortMode, onPage, onArticleUpdate }: Props) {
  const [sort, setSort] = useState<{ column: Column; direction: Direction }>({ column: 'publicationDate', direction: 'desc' });
  const [density, setDensity] = useState<'compact' | 'normal' | 'comfortable'>('normal');
  const [columns, setColumns] = useState<Column[]>(['title', 'authors', 'journal', 'publicationDate', 'pmid']);
  const [openAbstracts, setOpenAbstracts] = useState<string[]>([]);
  const [loadingAbstracts, setLoadingAbstracts] = useState<string[]>([]);
  const [affiliations, setAffiliations] = useState<Record<string, AuthorAffiliation[]>>({});
  const [columnMenu, setColumnMenu] = useState(false);
  const [translation, setTranslation] = useState<{
    running: boolean;
    completed: number;
    total: number;
    error: string;
    phase: 'idle' | 'fetching' | 'translating' | 'done';
  }>({ running: false, completed: 0, total: 0, error: '', phase: 'idle' });
  const latestSearchRevision = useRef(searchRevision);
  latestSearchRevision.current = searchRevision;

  useEffect(() => {
    setTranslation({ running: false, completed: 0, total: 0, error: '', phase: 'idle' });
    setOpenAbstracts([]);
    setLoadingAbstracts([]);
  }, [searchRevision]);

  const pmidKey = result.articles.map((article) => article.pmid).join(',');
  useEffect(() => {
    let active = true;
    setAffiliations({});
    fetchAuthorAffiliations(pmidKey.split(',').filter(Boolean))
      .then((values) => { if (active) setAffiliations(values); })
      .catch(() => undefined);
    return () => { active = false; };
  }, [pmidKey]);

  const articles = useMemo(() => result.articles.map((article, index) => ({ article, index })).sort((a, b) => {
    const left = sort.column === 'title' ? (a.article.translatedTitle || a.article.title) : a.article[sort.column];
    const right = sort.column === 'title' ? (b.article.translatedTitle || b.article.title) : b.article[sort.column];
    const aValue = Array.isArray(left) ? left.join(' ') : String(left ?? '');
    const bValue = Array.isArray(right) ? right.join(' ') : String(right ?? '');
    const compared = collator.compare(aValue, bValue);
    return (sort.direction === 'asc' ? compared : -compared) || a.index - b.index;
  }).map(({ article }) => article), [result.articles, sort]);

  const changeSort = (column: Column) => setSort((current) => ({ column, direction: current.column === column && current.direction === 'asc' ? 'desc' : 'asc' }));
  const ariaSort = (column: Column) => sort.column === column ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none';
  const toggleColumn = (column: Column) => setColumns((current) => current.includes(column) ? (current.length > 1 ? current.filter((item) => item !== column) : current) : [...current, column]);
  const toggleAbstract = async (article: PubMedArticle) => {
    if (openAbstracts.includes(article.pmid)) { setOpenAbstracts((current) => current.filter((id) => id !== article.pmid)); return; }
    setOpenAbstracts((current) => [...current, article.pmid]);
    if (article.abstract || !article.hasAbstract) return;
    setLoadingAbstracts((current) => [...current, article.pmid]);
    try {
      const details = await fetchAbstract(article.pmid);
      onArticleUpdate({ ...article, abstract: details.abstract || 'O PubMed não forneceu um resumo para este registro.' });
    } catch {
      onArticleUpdate({ ...article, abstract: 'Não foi possível carregar o resumo agora.' });
    } finally {
      setLoadingAbstracts((current) => current.filter((id) => id !== article.pmid));
    }
  };

  const translateContent = async () => {
    const targetRevision = searchRevision;
    const isStale = () => latestSearchRevision.current !== targetRevision;
    const missingAbstracts = articles.filter((article) => article.hasAbstract && !article.abstract).map((article) => article.pmid);
    setTranslation({ running: true, completed: 0, total: articles.length + articles.filter((article) => article.hasAbstract).length, error: '', phase: 'fetching' });
    let abstracts: Record<string, string> = {};
    let abstractWarning = '';
    try {
      if (missingAbstracts.length) {
        try { abstracts = await fetchAbstracts(missingAbstracts); }
        catch { abstractWarning = 'Os títulos foram traduzidos, mas alguns resumos não puderam ser carregados pelo PubMed.'; }
      }
      if (isStale()) return;
      const enrichedArticles = articles.map((article) => ({ ...article, abstract: article.abstract || abstracts[article.pmid] }));
      const total = enrichedArticles.length + enrichedArticles.filter((article) => article.abstract).length;
      setTranslation({ running: true, completed: 0, total, error: '', phase: 'translating' });
      const values = await translateArticleContent(enrichedArticles, (completed, progressTotal) => { if (!isStale()) setTranslation({ running: true, completed, total: progressTotal, error: '', phase: 'translating' }); });
      if (isStale()) return;
      enrichedArticles.forEach((article) => onArticleUpdate({
        ...article,
        translatedTitle: values[article.pmid].title,
        translatedAbstract: values[article.pmid].abstract,
      }));
      setTranslation({ running: false, completed: total, total, error: abstractWarning, phase: abstractWarning ? 'idle' : 'done' });
    } catch (reason) {
      if (isStale()) return;
      setTranslation({ running: false, completed: 0, total: articles.length, error: reason instanceof Error ? reason.message : 'Não foi possível traduzir os títulos e resumos.', phase: 'idle' });
    }
  };

  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));
  const first = (result.page - 1) * result.pageSize + 1;
  const last = Math.min(result.page * result.pageSize, result.total);
  const visibleColumns = columnOrder.filter((column) => columns.includes(column));
  const totalColumnWeight = visibleColumns.reduce((total, column) => total + columnWeight[column], 0);
  const tableMinimum = Math.max(660, visibleColumns.reduce((total, column) => total + columnMinimum[column], 0));
  const freeFullTextOnly = hasFreeFullTextFilter(result.query);
  const authorAffiliations = (pmid: string, author: string) => affiliations[pmid]?.find((item) => normalizedAuthorName(item.name) === normalizedAuthorName(author))?.affiliations ?? [];

  return <section className="results" aria-labelledby="results-title">
    <div className="results-heading">
      <div><span className="eyebrow">Resultados</span><h2 id="results-title">{result.total.toLocaleString('pt-BR')} artigos</h2><p>{first.toLocaleString('pt-BR')}–{last.toLocaleString('pt-BR')} · página {result.page} de {totalPages.toLocaleString('pt-BR')}</p></div>
      <div className="results-actions"><button className="button ghost translate-button" disabled={translation.running || translation.phase === 'done'} onClick={translateContent}><Icon name="translate"/> {translation.running ? (translation.phase === 'fetching' ? 'Preparando resumos…' : `${translation.completed}/${translation.total}`) : translation.phase === 'done' ? 'Conteúdo traduzido' : 'Traduzir títulos e resumos'}</button><button className="button secondary" onClick={() => downloadResultsHtml(articles, result.query)}><Icon name="download"/> Exportar HTML</button></div>
    </div>
    {translation.error && <div className="translation-status error" role="alert">{translation.error}</div>}
    {translation.running && <div className="translation-status"><span style={{ width: `${Math.max(6, (translation.completed / Math.max(1, translation.total)) * 100)}%` }}/><b>{translation.phase === 'fetching' ? 'Carregando resumos disponíveis…' : 'Traduzindo títulos e resumos no navegador…'}</b></div>}

    <div className="table-toolbar">
      <div className="segmented" aria-label="Ordem global"><button className={sortMode === 'newest' ? 'active' : ''} onClick={() => onSortMode('newest')}>Mais recentes</button><button className={sortMode === 'relevance' ? 'active' : ''} onClick={() => onSortMode('relevance')}>Mais relevantes</button></div>
      <div className="toolbar-spacer" />
      <label className="toolbar-select">Densidade<select value={density} onChange={(event) => setDensity(event.target.value as typeof density)}><option value="compact">Compacta</option><option value="normal">Padrão</option><option value="comfortable">Confortável</option></select></label>
      <div className="column-control"><button className="button ghost" onClick={() => setColumnMenu(!columnMenu)}><Icon name="columns"/> Colunas</button>{columnMenu && <div className="column-menu">{columnOrder.map((column) => <label key={column}><input type="checkbox" checked={columns.includes(column)} disabled={columns.length === 1 && columns.includes(column)} onChange={() => toggleColumn(column)} />{{ title: 'Título', authors: 'Autores', journal: 'Revista', publicationDate: 'Data', pmid: 'Identificadores' }[column]}</label>)}</div>}</div>
    </div>

    <div className={`results-table-wrap density-${density}`}>
      <table className="results-table smart-table" style={{ '--table-min-width': `${tableMinimum}px` } as CSSProperties}><colgroup>{visibleColumns.map((column) => <col key={column} style={{ width: `${(columnWeight[column] / totalColumnWeight) * 100}%` }} />)}</colgroup><thead><tr>
        {columns.includes('title') && <th aria-sort={ariaSort('title')}><button onClick={() => changeSort('title')}>Artigo <span>↕</span></button></th>}
        {columns.includes('authors') && <th aria-sort={ariaSort('authors')}><button onClick={() => changeSort('authors')}>Autores <span>↕</span></button></th>}
        {columns.includes('journal') && <th aria-sort={ariaSort('journal')}><button onClick={() => changeSort('journal')}>Revista <span>↕</span></button></th>}
        {columns.includes('publicationDate') && <th aria-sort={ariaSort('publicationDate')}><button onClick={() => changeSort('publicationDate')}>Publicação <span>↕</span></button></th>}
        {columns.includes('pmid') && <th aria-sort={ariaSort('pmid')}><button onClick={() => changeSort('pmid')}>Acesso <span>↕</span></button></th>}
      </tr></thead><tbody>{articles.map((article) => <tr key={article.pmid}>
        {columns.includes('title') && <td data-label="Artigo" className="title-cell"><div className="result-badges">{(freeFullTextOnly || article.pmcId) && <span className="badge open" title={freeFullTextOnly && !article.pmcId ? 'Texto gratuito segundo o índice do PubMed' : 'Texto gratuito no PubMed Central'}>Open access</span>}{article.hasAbstract && <span className="badge">Com resumo</span>}{article.translatedTitle && <span className="badge translated">PT</span>}</div><a href={`https://pubmed.ncbi.nlm.nih.gov/${article.pmid}/`} target="_blank" rel="noreferrer">{article.translatedTitle || article.title}<Icon name="external"/></a>{article.translatedTitle && <span className="original-title">Original: {article.title}</span>}{article.hasAbstract && <><button className="abstract-toggle" onClick={() => toggleAbstract(article)}>{openAbstracts.includes(article.pmid) ? 'Ocultar resumo' : 'Ler resumo'}</button>{openAbstracts.includes(article.pmid) && <div className="abstract-panel">{loadingAbstracts.includes(article.pmid) ? <span className="loading-line">Carregando resumo…</span> : article.translatedAbstract ? <><p>{article.translatedAbstract}</p><details className="abstract-original"><summary>Ver resumo original</summary><p>{article.abstract}</p></details></> : (article.abstract ?? 'Use “Ler resumo” para carregar o texto.')}</div>}</>}</td>}
        {columns.includes('authors') && <td data-label="Autores"><span className="authors-text">{article.authors.length ? article.authors.slice(0, 3).map((author, index) => { const authorDetails = authorAffiliations(article.pmid, author); return <span className="author-entry" key={`${article.pmid}-${author}`}>{index > 0 && <span className="author-separator">, </span>}{authorDetails.length > 0 ? <AffiliationHint author={author} affiliations={authorDetails} /> : <span>{author}</span>}</span>; }) : '—'}{article.authors.length > 3 && <small> +{article.authors.length - 3}</small>}</span></td>}
        {columns.includes('journal') && <td data-label="Revista"><b className="journal-name">{article.journal}</b><small>{article.journalAbbreviation}</small></td>}
        {columns.includes('publicationDate') && <td data-label="Publicação"><time>{article.publicationDate || '—'}</time></td>}
        {columns.includes('pmid') && <td data-label="Acesso"><a className="id-link" href={`https://pubmed.ncbi.nlm.nih.gov/${article.pmid}/`} target="_blank" rel="noreferrer">PMID {article.pmid}</a>{article.doi && <a className="id-link subtle" href={`https://doi.org/${article.doi}`} target="_blank" rel="noreferrer">DOI</a>}</td>}
      </tr>)}</tbody></table>
    </div>

    <nav className="pagination" aria-label="Paginação"><button disabled={result.page <= 1} onClick={() => onPage(result.page - 1)}>← Anterior</button><span>Página <b>{result.page}</b> de {totalPages.toLocaleString('pt-BR')}</span><button disabled={result.page >= totalPages} onClick={() => onPage(result.page + 1)}>Próxima →</button></nav>
  </section>;
}
