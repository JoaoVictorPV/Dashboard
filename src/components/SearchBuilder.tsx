import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  DEFAULT_FOLDER_ID,
  favoriteJournalIds as collectFavoriteJournalIds,
  persistJournalFolders,
  readJournalFolders,
  setJournalFolderMembership,
  type JournalFolder,
} from '../lib/journalFavorites';
import { daysAgoIso, uid } from '../lib/query';
import type { AuthorTerm, Journal, KeywordField, KeywordTerm, Operator, SearchFilters } from '../types';
import { Icon } from './Icon';

interface Props {
  journals: Journal[];
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

const JOURNAL_PAGE_SIZE = 200;
type FolderEditor = { mode: 'create' | 'rename'; value: string; journalId?: string };

function normalizeSearch(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();
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

export function SearchBuilder({ journals, filters, query, busy, onChange, onSearch, onSave }: Props) {
  const [keywordInput, setKeywordInput] = useState('');
  const [authorInput, setAuthorInput] = useState('');
  const [journalSearch, setJournalSearch] = useState('');
  const [queryOpen, setQueryOpen] = useState(false);
  const [journalOpen, setJournalOpen] = useState(false);
  const [journalLimit, setJournalLimit] = useState(JOURNAL_PAGE_SIZE);
  const [favoriteFolders, setFavoriteFolders] = useState<JournalFolder[]>(readJournalFolders);
  const [journalScope, setJournalScope] = useState('catalog');
  const [folderEditor, setFolderEditor] = useState<FolderEditor | null>(null);
  const [folderMenuJournalId, setFolderMenuJournalId] = useState<string | null>(null);

  useEffect(() => {
    if (!journalOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setJournalOpen(false); };
    window.addEventListener('keydown', closeOnEscape);
    return () => { document.body.style.overflow = previous; window.removeEventListener('keydown', closeOnEscape); };
  }, [journalOpen]);

  useEffect(() => { setJournalLimit(JOURNAL_PAGE_SIZE); }, [journalSearch, journalScope]);

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

  const favoriteJournalIds = useMemo(() => collectFavoriteJournalIds(favoriteFolders), [favoriteFolders]);
  const activeFolder = favoriteFolders.find((folder) => folder.id === journalScope);
  const scopedJournals = useMemo(() => {
    if (journalScope === 'catalog') return journals;
    const ids = new Set(journalScope === 'favorites' ? favoriteJournalIds : favoriteFolders.find((folder) => folder.id === journalScope)?.journalIds ?? []);
    return journals.filter((journal) => ids.has(journal.id));
  }, [favoriteFolders, favoriteJournalIds, journalScope, journals]);

  const filteredJournals = useMemo(() => {
    const term = normalizeSearch(journalSearch);
    if (!term) return scopedJournals;
    const score = (journal: Journal) => {
      const name = normalizeSearch(journal.name);
      const abbreviation = normalizeSearch(journal.abbreviation);
      const aliases = (journal.aliases ?? []).map(normalizeSearch);
      if ([name, abbreviation, journal.issnPrint, journal.issnOnline, ...aliases].some((value) => normalizeSearch(value ?? '') === term)) return 0;
      if (name.startsWith(term) || abbreviation.startsWith(term)) return 1;
      if (aliases.some((value) => value.startsWith(term))) return 2;
      return 3;
    };
    return scopedJournals
      .filter((journal) => normalizeSearch(`${journal.name} ${journal.abbreviation} ${journal.issnPrint ?? ''} ${journal.issnOnline ?? ''} ${(journal.aliases ?? []).join(' ')}`).includes(term))
      .map((journal) => ({ journal, score: score(journal) }))
      .sort((a, b) => a.score - b.score || a.journal.name.localeCompare(b.journal.name, 'en'))
      .map(({ journal }) => journal);
  }, [journalSearch, scopedJournals]);

  const favoriteJournals = journalScope === 'catalog' ? filteredJournals.filter((journal) => favoriteJournalIds.includes(journal.id)) : [];
  const allOtherJournals = journalScope === 'catalog' ? filteredJournals.filter((journal) => !favoriteJournalIds.includes(journal.id)) : filteredJournals;
  const otherJournals = allOtherJournals.slice(0, journalLimit);
  const listedJournalIds = [...favoriteJournals, ...otherJournals].map((journal) => journal.id);
  const allListedJournalsSelected = listedJournalIds.length > 0 && listedJournalIds.every((id) => filters.journalIds.includes(id));

  const applyPreset = (days: number | null) => {
    onChange({ ...filters, dateFrom: days ? daysAgoIso(days) : '', dateTo: days ? new Date().toISOString().slice(0, 10) : '' });
  };

  const canSearch = Boolean(query);
  const toggleJournal = (id: string) => update('journalIds', filters.journalIds.includes(id) ? filters.journalIds.filter((item) => item !== id) : [...filters.journalIds, id]);
  const saveFavoriteFolders = (next: JournalFolder[]) => {
    setFavoriteFolders(next);
    persistJournalFolders(next);
  };
  const setFolderMembership = (folderId: string, journalId: string, included: boolean) => saveFavoriteFolders(setJournalFolderMembership(favoriteFolders, folderId, journalId, included));
  const saveFolderEditor = () => {
    if (!folderEditor) return;
    const name = folderEditor.value.trim();
    if (!name || favoriteFolders.some((folder) => normalizeSearch(folder.name) === normalizeSearch(name) && (folderEditor.mode === 'create' || folder.id !== journalScope))) return;
    if (folderEditor.mode === 'create') {
      const folder: JournalFolder = { id: uid('folder'), name, journalIds: folderEditor.journalId ? [folderEditor.journalId] : [] };
      saveFavoriteFolders([...favoriteFolders, folder]);
      setJournalScope(folder.id);
      setFolderMenuJournalId(null);
    } else if (activeFolder) {
      saveFavoriteFolders(favoriteFolders.map((folder) => folder.id === activeFolder.id ? { ...folder, name } : folder));
    }
    setFolderEditor(null);
  };
  const deleteActiveFolder = () => {
    if (!activeFolder || activeFolder.id === DEFAULT_FOLDER_ID) return;
    const fallback = favoriteFolders.find((folder) => folder.id === DEFAULT_FOLDER_ID);
    const next = favoriteFolders
      .filter((folder) => folder.id !== activeFolder.id)
      .map((folder) => folder.id === fallback?.id ? { ...folder, journalIds: [...new Set([...folder.journalIds, ...activeFolder.journalIds])] } : folder);
    saveFavoriteFolders(next);
    setJournalScope(DEFAULT_FOLDER_ID);
    setFolderEditor(null);
  };
  const toggleAllListedJournals = () => {
    const listed = new Set(listedJournalIds);
    update('journalIds', allListedJournalsSelected
      ? filters.journalIds.filter((id) => !listed.has(id))
      : [...new Set([...filters.journalIds, ...listedJournalIds])]);
  };
  const closeJournals = () => { setJournalOpen(false); setJournalSearch(''); setFolderMenuJournalId(null); setFolderEditor(null); };

  const journalRow = (journal: Journal) => <div className={`journal-row ${filters.journalIds.includes(journal.id) ? 'selected' : ''}`} key={journal.id}>
    <label>
      <input type="checkbox" checked={filters.journalIds.includes(journal.id)} onChange={() => toggleJournal(journal.id)} />
      <span className="custom-check">✓</span>
      <span className="journal-copy"><b>{journal.name}</b><small>{journal.abbreviation} · {[journal.issnPrint, journal.issnOnline].filter(Boolean).join(' / ') || 'ISSN não informado'}</small></span>
    </label>
    <div className="journal-star-wrap">
      <button type="button" className={`journal-star ${favoriteJournalIds.includes(journal.id) ? 'active' : ''}`} aria-expanded={folderMenuJournalId === journal.id} aria-label={`Organizar ${journal.name} em pastas`} onClick={() => setFolderMenuJournalId(folderMenuJournalId === journal.id ? null : journal.id)}><Icon name="star" /></button>
      {folderMenuJournalId === journal.id && <div className="journal-folder-menu" role="group" aria-label={`Pastas de ${journal.name}`}>
        <strong>Áreas de interesse</strong>
        {favoriteFolders.map((folder) => <label key={folder.id}><input type="checkbox" checked={folder.journalIds.includes(journal.id)} onChange={(event) => setFolderMembership(folder.id, journal.id, event.target.checked)} /><span>{folder.name}</span><small>{folder.journalIds.length}</small></label>)}
        <button type="button" onClick={() => setFolderEditor({ mode: 'create', value: '', journalId: journal.id })}><Icon name="plus" /> Nova pasta</button>
      </div>}
    </div>
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
        <button className="selector-button" disabled={!journals.length} onClick={() => setJournalOpen(true)}><span>{!journals.length ? 'Carregando catálogo…' : filters.journalIds.length ? <><b>{filters.journalIds.length}</b> revistas selecionadas</> : 'Todas as revistas'}</span><Icon name="chevron" /></button>
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
      <div className="filter-switches"><label className="switch-control"><input type="checkbox" checked={filters.freeFullText} onChange={(event) => update('freeFullText', event.target.checked)} /><span className="switch-track"/><span><b>Texto gratuito agora</b><small>Filtro “free full text”</small></span></label><label className="switch-control"><input type="checkbox" checked={filters.excludeCorrections !== false} onChange={(event) => update('excludeCorrections', event.target.checked)} /><span className="switch-track"/><span><b>Ocultar correções</b><small>Erratas e avisos editoriais</small></span></label></div>
      <div className="search-actions"><button className="query-toggle" onClick={() => setQueryOpen(!queryOpen)}><Icon name="info" /> Ver consulta {queryOpen ? '−' : '+'}</button><button className="button primary search-button" disabled={!canSearch || busy} onClick={onSearch}><Icon name="search" />{busy ? 'Pesquisando…' : 'Pesquisar no PubMed'}</button></div>
    </div>
    {queryOpen && <div className="query-preview"><div><b>Consulta PubMed</b><span>Você pode revisar exatamente o que será enviado.</span></div><code>{query || 'Adicione pelo menos um critério de busca.'}</code></div>}

    {journalOpen && createPortal(<div className="modal-layer notranslate" translate="no" onMouseDown={(event) => { if (event.target === event.currentTarget) closeJournals(); }}>
      <section className="journal-dialog" role="dialog" aria-modal="true" aria-labelledby="journal-dialog-title">
        <div className="dialog-head"><div><h2 id="journal-dialog-title">Revistas</h2><p>Busque por título, abreviação ou ISSN.</p></div><button className="dialog-close" aria-label="Fechar" onClick={closeJournals}><Icon name="close" /></button></div>
        <div className="journal-workspace">
          <aside className="journal-folders" aria-label="Áreas de interesse">
            <div className="folder-heading"><span>Áreas de interesse</span><button aria-label="Criar pasta" title="Criar pasta" onClick={() => setFolderEditor({ mode: 'create', value: '' })}><Icon name="plus"/></button></div>
            <div className="folder-list">
              <button className={journalScope === 'catalog' ? 'active' : ''} onClick={() => { setJournalScope('catalog'); setFolderMenuJournalId(null); }}><Icon name="journal"/><span><b>Catálogo</b><small>{journals.length.toLocaleString('pt-BR')}</small></span></button>
              <button className={journalScope === 'favorites' ? 'active' : ''} onClick={() => { setJournalScope('favorites'); setFolderMenuJournalId(null); }}><Icon name="star"/><span><b>Todos os favoritos</b><small>{favoriteJournalIds.length.toLocaleString('pt-BR')}</small></span></button>
              {favoriteFolders.map((folder) => <div className="folder-entry" key={folder.id}><button className={journalScope === folder.id ? 'active' : ''} onClick={() => { setJournalScope(folder.id); setFolderMenuJournalId(null); }}><Icon name="folder"/><span><b>{folder.name}</b><small>{folder.journalIds.length.toLocaleString('pt-BR')}</small></span></button>{journalScope === folder.id && <div className="folder-actions"><button aria-label={`Renomear ${folder.name}`} title="Renomear" onClick={() => setFolderEditor({ mode: 'rename', value: folder.name })}><Icon name="edit"/></button>{folder.id !== DEFAULT_FOLDER_ID && <button aria-label={`Excluir ${folder.name}`} title="Excluir" onClick={() => { if (window.confirm(`Excluir a pasta “${folder.name}”? As revistas serão movidas para Favoritas.`)) deleteActiveFolder(); }}><Icon name="trash"/></button>}</div>}</div>)}
            </div>
            {folderEditor && <form className="folder-editor" onSubmit={(event) => { event.preventDefault(); saveFolderEditor(); }}><label>{folderEditor.mode === 'create' ? 'Nova pasta' : 'Renomear pasta'}<input autoFocus aria-label="Nome da pasta" value={folderEditor.value} onChange={(event) => setFolderEditor({ ...folderEditor, value: event.target.value })} placeholder="Ex.: Neurorradiologia"/></label><div><button type="button" onClick={() => setFolderEditor(null)}>Cancelar</button><button type="submit" disabled={!folderEditor.value.trim()}>Salvar</button></div></form>}
          </aside>
          <div className="journal-browser">
            <div className="dialog-search"><Icon name="search"/><input autoFocus={!folderEditor} value={journalSearch} onChange={(event) => setJournalSearch(event.target.value)} placeholder="Buscar revistas…"/><button disabled={!listedJournalIds.length} aria-pressed={allListedJournalsSelected} title="Aplica às revistas exibidas na lista" onClick={toggleAllListedJournals}>{allListedJournalsSelected ? 'Desmarcar todas' : 'Selecionar todas'}</button><button disabled={!(activeFolder?.journalIds.length || favoriteJournalIds.length)} onClick={() => update('journalIds', activeFolder?.journalIds ?? favoriteJournalIds)}>{activeFolder ? 'Selecionar pasta' : 'Selecionar favoritas'}</button><button onClick={() => update('journalIds', [])}>Limpar</button></div>
            <div className="dialog-status"><span><b>{filters.journalIds.length}</b> selecionadas</span><span>{filteredJournals.length.toLocaleString('pt-BR')} encontradas · <Icon name="star"/> {favoriteJournalIds.length} favoritas</span></div>
            <div className="journal-list">
              {favoriteJournals.length > 0 && <><div className="journal-section-label"><span>Favoritas</span></div>{favoriteJournals.map(journalRow)}{otherJournals.length > 0 && <div className="journal-divider" />}</>}
              {otherJournals.map(journalRow)}
              {!filteredJournals.length && <div className="journal-empty">{journalScope === 'catalog' ? 'Nenhuma revista encontrada.' : 'Nenhuma revista nesta área.'}</div>}
              {allOtherJournals.length > otherJournals.length && <button className="journal-more" onClick={() => setJournalLimit((current) => current + JOURNAL_PAGE_SIZE)}>Mostrar mais {Math.min(JOURNAL_PAGE_SIZE, allOtherJournals.length - otherJournals.length).toLocaleString('pt-BR')}</button>}
            </div>
          </div>
        </div>
        <div className="dialog-footer"><span>{journals.length.toLocaleString('pt-BR')} títulos do catálogo PubMed/NLM</span><button className="button primary" onClick={closeJournals}>Concluir</button></div>
      </section>
    </div>, document.body)}
  </section>;
}
