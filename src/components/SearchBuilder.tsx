import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { journals } from '../data/journals.generated';
import { daysAgoIso, uid } from '../lib/query';
import type { AuthorTerm, KeywordField, KeywordTerm, Operator, SearchFilters } from '../types';
import { Icon } from './Icon';

interface Props {
  filters: SearchFilters;
  query: string;
  busy: boolean;
  onChange: (filters: SearchFilters) => void;
  onSearch: () => void;
  onSave: () => void;
}

const fieldOptions: { value: KeywordField; label: string }[] = [
  { value: 'title-abstract', label: 'Título / resumo' },
  { value: 'mesh', label: 'Termo MeSH' },
  { value: 'title', label: 'Somente título' },
  { value: 'all', label: 'Todos os campos' },
];

const FAVORITES_KEY = 'atlas-medico-favorite-journals-v1';

function readFavorites(): string[] {
  try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]') as string[]; }
  catch { return []; }
}

function parsedKeyword(raw: string): Omit<KeywordTerm, 'id'> | null {
  let value = raw.trim();
  if (!value) return null;
  let operator: Operator = 'AND';
  if (value.startsWith('|')) { operator = 'OR'; value = value.slice(1).trim(); }
  if (value.startsWith('-')) { operator = 'NOT'; value = value.slice(1).trim(); }
  const phrase = /^".*"$/.test(value);
  value = value.replace(/^"|"$/g, '');
  return value ? { value, operator, field: 'title-abstract', phrase } : null;
}

export function SearchBuilder({ filters, query, busy, onChange, onSearch, onSave }: Props) {
  const [keywordInput, setKeywordInput] = useState('');
  const [authorInput, setAuthorInput] = useState('');
  const [journalSearch, setJournalSearch] = useState('');
  const [queryOpen, setQueryOpen] = useState(false);
  const [journalOpen, setJournalOpen] = useState(false);
  const [favoriteJournalIds, setFavoriteJournalIds] = useState<string[]>(readFavorites);

  useEffect(() => {
    if (!journalOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setJournalOpen(false); };
    window.addEventListener('keydown', closeOnEscape);
    return () => { document.body.style.overflow = previous; window.removeEventListener('keydown', closeOnEscape); };
  }, [journalOpen]);

  const update = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => onChange({ ...filters, [key]: value });
  const addKeywords = (raw: string) => {
    const additions = raw.split(/[;\n]+/).map(parsedKeyword).filter(Boolean) as Omit<KeywordTerm, 'id'>[];
    if (!additions.length) return;
    update('keywords', [...filters.keywords, ...additions.map((term) => ({ ...term, id: uid('kw') }))]);
    setKeywordInput('');
  };
  const addAuthor = () => {
    const value = authorInput.trim();
    if (!value) return;
    const term: AuthorTerm = { id: uid('author'), value: value.replace(/^"|"$/g, ''), operator: value.startsWith('-') ? 'NOT' : 'AND' };
    if (value.startsWith('-')) term.value = term.value.slice(1).trim();
    update('authors', [...filters.authors, term]);
    setAuthorInput('');
  };
  const updateKeyword = (id: string, patch: Partial<KeywordTerm>) => update('keywords', filters.keywords.map((item) => item.id === id ? { ...item, ...patch } : item));
  const updateAuthor = (id: string, patch: Partial<AuthorTerm>) => update('authors', filters.authors.map((item) => item.id === id ? { ...item, ...patch } : item));

  const filteredJournals = useMemo(() => {
    const term = journalSearch.toLocaleLowerCase('pt-BR');
    return journals.filter((journal) => `${journal.name} ${journal.abbreviation} ${journal.issnPrint ?? ''} ${journal.issnOnline ?? ''}`.toLocaleLowerCase('pt-BR').includes(term));
  }, [journalSearch]);

  const favoriteJournals = filteredJournals.filter((journal) => favoriteJournalIds.includes(journal.id));
  const otherJournals = filteredJournals.filter((journal) => !favoriteJournalIds.includes(journal.id));

  const applyPreset = (days: number | null) => {
    onChange({ ...filters, dateFrom: days ? daysAgoIso(days) : '', dateTo: days ? new Date().toISOString().slice(0, 10) : '' });
  };

  const canSearch = Boolean(query);
  const toggleJournal = (id: string) => update('journalIds', filters.journalIds.includes(id) ? filters.journalIds.filter((item) => item !== id) : [...filters.journalIds, id]);
  const toggleFavorite = (id: string) => {
    const next = favoriteJournalIds.includes(id) ? favoriteJournalIds.filter((item) => item !== id) : [...favoriteJournalIds, id];
    setFavoriteJournalIds(next);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  };
  const closeJournals = () => { setJournalOpen(false); setJournalSearch(''); };

  const journalRow = (journal: (typeof journals)[number]) => <div className={`journal-row ${filters.journalIds.includes(journal.id) ? 'selected' : ''}`} key={journal.id}>
    <label>
      <input type="checkbox" checked={filters.journalIds.includes(journal.id)} onChange={() => toggleJournal(journal.id)} />
      <span className="custom-check">✓</span>
      <span className="journal-copy"><b>{journal.name}</b><small>{journal.abbreviation} · {[journal.issnPrint, journal.issnOnline].filter(Boolean).join(' / ') || 'ISSN não informado'}</small></span>
    </label>
    <button type="button" className={`journal-star ${favoriteJournalIds.includes(journal.id) ? 'active' : ''}`} aria-pressed={favoriteJournalIds.includes(journal.id)} aria-label={`${favoriteJournalIds.includes(journal.id) ? 'Remover' : 'Adicionar'} ${journal.name} ${favoriteJournalIds.includes(journal.id) ? 'dos' : 'aos'} favoritos`} onClick={() => toggleFavorite(journal.id)}><Icon name="star" /></button>
  </div>;

  return <section className="builder" aria-labelledby="builder-title">
    <div className="builder-heading">
      <div><span className="eyebrow">Estratégia de pesquisa</span><h2 id="builder-title">Construa uma busca precisa</h2></div>
      <button className="button ghost" onClick={onSave} disabled={!canSearch}><Icon name="bookmark" /> Salvar busca</button>
    </div>

    <div className="builder-grid">
      <div className="field-card field-keywords">
        <div className="field-title"><span className="field-icon coral"><Icon name="sparkle" /></span><div><label htmlFor="keyword-input">Palavras-chave</label><small>Combine conceitos com lógica PubMed explícita</small></div></div>
        <div className="token-input">
          <input id="keyword-input" value={keywordInput} onChange={(event) => setKeywordInput(event.target.value)} onKeyDown={(event) => {
            if (event.key === 'Enter') { event.preventDefault(); addKeywords(keywordInput); }
          }} onPaste={(event) => {
            if (/[;\n]/.test(event.clipboardData.getData('text'))) { event.preventDefault(); addKeywords(event.clipboardData.getData('text')); }
          }} placeholder={'Ex.: "deep learning"; |radiomics; -editorial'} />
          <button className="icon-button" aria-label="Adicionar termo" onClick={() => addKeywords(keywordInput)}><Icon name="plus" /></button>
        </div>
        <p className="input-hint"><b>Atalhos:</b> separe com ponto e vírgula; use <kbd>|</kbd> para OU, <kbd>-</kbd> para NÃO e aspas para frase exata.</p>
        {filters.keywords.length > 0 && <div className="logic-list" aria-label="Termos da busca">
          {filters.keywords.map((term, index) => <div className={`logic-row op-${term.operator.toLowerCase()}`} key={term.id}>
            <span className="logic-index">{index + 1}</span>
            <select aria-label={`Operador de ${term.value}`} value={term.operator} onChange={(event) => updateKeyword(term.id, { operator: event.target.value as Operator })}>
              <option>AND</option><option>OR</option><option>NOT</option>
            </select>
            <input aria-label="Termo" value={term.value} onChange={(event) => updateKeyword(term.id, { value: event.target.value })} />
            <select aria-label={`Campo de ${term.value}`} value={term.field} onChange={(event) => updateKeyword(term.id, { field: event.target.value as KeywordField })}>
              {fieldOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <label className="mini-toggle" title="Buscar como frase exata"><input type="checkbox" checked={term.phrase} onChange={(event) => updateKeyword(term.id, { phrase: event.target.checked })} /><span>“ ”</span></label>
            <button className="remove-button" aria-label={`Remover ${term.value}`} onClick={() => update('keywords', filters.keywords.filter((item) => item.id !== term.id))}><Icon name="close" /></button>
          </div>)}
        </div>}
      </div>

      <div className="field-card">
        <div className="field-title"><span className="field-icon green"><Icon name="journal" /></span><div><span className="label-like">Revistas</span><small>Catálogo validado pela NLM</small></div></div>
        <button className="selector-button" onClick={() => setJournalOpen(true)}><span>{filters.journalIds.length ? <><b>{filters.journalIds.length}</b> revistas selecionadas</> : 'Todas as revistas'}</span><Icon name="chevron" /></button>
        {filters.journalIds.length > 0 && <div className="selection-preview">{filters.journalIds.slice(0, 3).map((id) => <span key={id}>{journals.find((journal) => journal.id === id)?.abbreviation}</span>)}{filters.journalIds.length > 3 && <span>+{filters.journalIds.length - 3}</span>}</div>}
      </div>

      <div className="field-card">
        <div className="field-title"><span className="field-icon blue"><Icon name="user" /></span><div><label htmlFor="author-input">Autores</label><small>Sobrenome e iniciais, um por vez</small></div></div>
        <div className="token-input"><input id="author-input" value={authorInput} onChange={(event) => setAuthorInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addAuthor(); } }} placeholder="Ex.: Silva AJ" /><button className="icon-button" aria-label="Adicionar autor" onClick={addAuthor}><Icon name="plus" /></button></div>
        {filters.authors.length > 0 && <div className="simple-tokens">{filters.authors.map((author, index) => <span key={author.id} className={author.operator === 'NOT' ? 'excluded' : ''}>{index > 0 && <select aria-label="Operador do autor" value={author.operator} onChange={(event) => updateAuthor(author.id, { operator: event.target.value as Operator })}><option>AND</option><option>OR</option><option>NOT</option></select>}<b>{author.value}</b><button aria-label={`Remover ${author.value}`} onClick={() => update('authors', filters.authors.filter((item) => item.id !== author.id))}><Icon name="close" /></button></span>)}</div>}
      </div>

      <div className="field-card date-card">
        <div className="field-title"><span className="field-icon amber"><Icon name="calendar" /></span><div><span className="label-like">Intervalo de publicação</span><small>Atalhos ou datas exatas</small></div></div>
        <div className="date-presets"><button onClick={() => applyPreset(30)}>30 dias</button><button onClick={() => applyPreset(180)}>6 meses</button><button onClick={() => applyPreset(365)}>1 ano</button><button onClick={() => applyPreset(1825)}>5 anos</button><button onClick={() => applyPreset(null)}>Tudo</button></div>
        <div className="date-range"><label>De<input type="date" value={filters.dateFrom} max={filters.dateTo || undefined} onChange={(event) => update('dateFrom', event.target.value)} /></label><span>→</span><label>Até<input type="date" value={filters.dateTo} min={filters.dateFrom || undefined} onChange={(event) => update('dateTo', event.target.value)} /></label></div>
      </div>
    </div>

    <div className="builder-footer">
      <label className="switch-control"><input type="checkbox" checked={filters.freeFullText} onChange={(event) => update('freeFullText', event.target.checked)} /><span className="switch-track"/><span><b>Texto gratuito agora</b><small>Aplica o filtro “free full text” do PubMed</small></span></label>
      <div className="search-actions"><button className="query-toggle" onClick={() => setQueryOpen(!queryOpen)}><Icon name="info" /> Ver consulta {queryOpen ? '−' : '+'}</button><button className="button primary search-button" disabled={!canSearch || busy} onClick={onSearch}><Icon name="search" />{busy ? 'Pesquisando…' : 'Pesquisar no PubMed'}</button></div>
    </div>
    {queryOpen && <div className="query-preview"><div><b>Consulta PubMed</b><span>Você pode revisar exatamente o que será enviado.</span></div><code>{query || 'Adicione pelo menos um critério de busca.'}</code></div>}

    {journalOpen && createPortal(<div className="modal-layer notranslate" translate="no" onMouseDown={(event) => { if (event.target === event.currentTarget) closeJournals(); }}>
      <section className="journal-dialog" role="dialog" aria-modal="true" aria-labelledby="journal-dialog-title">
        <div className="dialog-head"><div><h2 id="journal-dialog-title">Revistas</h2><p>Busque por título, abreviação ou ISSN.</p></div><button className="dialog-close" aria-label="Fechar" onClick={closeJournals}><Icon name="close" /></button></div>
        <div className="dialog-search"><Icon name="search"/><input autoFocus value={journalSearch} onChange={(event) => setJournalSearch(event.target.value)} placeholder="Buscar revistas…"/><button disabled={!favoriteJournalIds.length} onClick={() => update('journalIds', favoriteJournalIds)}>Selecionar favoritas</button><button onClick={() => update('journalIds', [])}>Limpar</button></div>
        <div className="dialog-status"><span><b>{filters.journalIds.length}</b> selecionadas</span><span><Icon name="star"/> {favoriteJournalIds.length} favoritas</span></div>
        <div className="journal-list">
          {favoriteJournals.length > 0 && <><div className="journal-section-label"><span>Favoritas</span></div>{favoriteJournals.map(journalRow)}{otherJournals.length > 0 && <div className="journal-divider" />}</>}
          {otherJournals.map(journalRow)}
          {!filteredJournals.length && <div className="journal-empty">Nenhuma revista encontrada.</div>}
        </div>
        <div className="dialog-footer"><span>{journals.length} revistas no catálogo</span><button className="button primary" onClick={closeJournals}>Concluir</button></div>
      </section>
    </div>, document.body)}
  </section>;
}
