import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LoginScreen } from './components/LoginScreen';
import { SearchBuilder } from './components/SearchBuilder';
import { Results } from './components/Results';
import { Icon } from './components/Icon';
import { authApi, searchPubMed } from './lib/api';
import { buildPubMedQuery, emptyFilters, uid } from './lib/query';
import { mockSearch } from './data/mock';
import { journals } from './data/journals.generated';
import type { PubMedArticle, SavedSearch, SearchFilters, SearchResponse, SortMode } from './types';

const previewMode = import.meta.env.DEV && new URLSearchParams(location.search).has('preview');
const SAVED_KEY = 'atlas-medico-saved-searches-v2';

function readSaved(): SavedSearch[] {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY) || '[]'); }
  catch { return []; }
}

export default function App() {
  const [auth, setAuth] = useState<'loading' | 'in' | 'out'>(previewMode ? 'in' : 'loading');
  const [filters, setFilters] = useState<SearchFilters>(emptyFilters);
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState<SavedSearch[]>(readSaved);
  const [savedOpen, setSavedOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const lastActivity = useRef(Date.now());
  const lastRefresh = useRef(Date.now());
  const query = useMemo(() => buildPubMedQuery(filters, journals), [filters]);

  useEffect(() => {
    if (previewMode) return;
    authApi.session().then((session) => setAuth(session.authenticated ? 'in' : 'out')).catch(() => setAuth('out'));
  }, []);

  useEffect(() => {
    if (auth !== 'in' || previewMode) return;
    const activity = () => { lastActivity.current = Date.now(); };
    const events = ['pointerdown', 'keydown', 'scroll', 'touchstart'];
    events.forEach((event) => window.addEventListener(event, activity, { passive: true }));
    const timer = window.setInterval(async () => {
      const now = Date.now();
      if (now - lastActivity.current >= 2 * 60 * 60 * 1000) { await authApi.logout().catch(() => undefined); setAuth('out'); return; }
      if (now - lastRefresh.current >= 5 * 60 * 1000 && now - lastActivity.current < 10 * 60 * 1000) {
        authApi.refresh().then(() => { lastRefresh.current = Date.now(); }).catch(() => setAuth('out'));
      }
    }, 60_000);
    return () => { events.forEach((event) => window.removeEventListener(event, activity)); window.clearInterval(timer); };
  }, [auth]);

  const login = async (username: string, password: string) => { await authApi.login(username, password); lastActivity.current = Date.now(); lastRefresh.current = Date.now(); setAuth('in'); };
  const logout = async () => { if (!previewMode) await authApi.logout().catch(() => undefined); setResult(null); setAuth('out'); };

  const performSearch = async (page = 1, sortOverride?: SortMode) => {
    if (!query) return;
    setBusy(true); setError('');
    try {
      const response = previewMode ? mockSearch(query, page) : await searchPubMed(query, page, sortOverride ?? filters.sort);
      setResult(response);
      requestAnimationFrame(() => document.querySelector('.results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'A busca falhou. Tente novamente.'); }
    finally { setBusy(false); }
  };

  const changeSortMode = (sort: SortMode) => { setFilters((current) => ({ ...current, sort })); performSearch(1, sort); };
  const updateArticle = (updated: PubMedArticle) => setResult((current) => current ? { ...current, articles: current.articles.map((article) => article.pmid === updated.pmid ? updated : article) } : current);
  const openSave = () => { setSaveName(`Busca ${new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date())}`); setSaveOpen(true); };
  const saveCurrent = () => {
    const next = [{ id: uid('saved'), name: saveName.trim() || 'Busca sem título', filters, createdAt: new Date().toISOString() }, ...saved].slice(0, 30);
    setSaved(next); localStorage.setItem(SAVED_KEY, JSON.stringify(next)); setSaveOpen(false);
  };
  const removeSaved = (id: string) => { const next = saved.filter((item) => item.id !== id); setSaved(next); localStorage.setItem(SAVED_KEY, JSON.stringify(next)); };
  const loadSaved = (item: SavedSearch) => { setFilters(item.filters); setSavedOpen(false); setResult(null); };

  if (auth === 'loading') return <div className="app-loader"><span className="brand-mark"><Icon name="sparkle"/></span><p>Preparando o Atlas Médico…</p></div>;
  if (auth === 'out') return <LoginScreen onLogin={login} />;

  return <div className="app-shell notranslate" translate="no">
    <header className="topbar"><a className="brand" href="#top"><span className="brand-mark"><Icon name="sparkle"/></span><span><b>ATLAS</b><small>MÉDICO</small></span></a><nav><span className="source-status"><i/> PubMed conectado</span><button onClick={() => setSavedOpen(!savedOpen)}><Icon name="bookmark"/> Buscas salvas <em>{saved.length}</em></button><button aria-label="Sair" title="Encerrar sessão" onClick={logout}><Icon name="logout"/></button></nav></header>
    {savedOpen && <aside className="saved-drawer"><div><span className="eyebrow">Sua biblioteca</span><button aria-label="Fechar" onClick={() => setSavedOpen(false)}><Icon name="close"/></button></div><h2>Buscas salvas</h2>{saved.length ? <ul>{saved.map((item) => <li key={item.id}><button onClick={() => loadSaved(item)}><b>{item.name}</b><small>{new Date(item.createdAt).toLocaleString('pt-BR')} · {item.filters.keywords.length} termos · {item.filters.journalIds.length || 'todas'} revistas</small></button><button aria-label={`Excluir ${item.name}`} onClick={() => removeSaved(item.id)}><Icon name="close"/></button></li>)}</ul> : <div className="drawer-empty"><Icon name="bookmark"/><p>As estratégias que você salvar aparecerão aqui.</p></div>}</aside>}
    <main id="top">
      <section className="hero"><div className="hero-copy"><h1>Pesquisa PubMed</h1><div className="hero-status"><span><i/> PubMed conectado</span><span>{journals.length} revistas</span></div></div><div className="hero-art" aria-hidden="true"><div className="radar"><span/><span/><span/><i/><b/></div><div className="data-trace trace-a"/><div className="data-trace trace-b"/></div></section>
      <SearchBuilder filters={filters} query={query} busy={busy} onChange={setFilters} onSearch={() => performSearch()} onSave={openSave}/>
      {error && <div className="search-error" role="alert"><Icon name="info"/><span><b>Não foi possível concluir a pesquisa.</b>{error}</span><button onClick={() => setError('')}><Icon name="close"/></button></div>}
      {result ? <Results result={result} sortMode={filters.sort} onSortMode={changeSortMode} onPage={(page) => performSearch(page)} onArticleUpdate={updateArticle}/> : <section className="empty-guide"><div className="guide-orbit"><Icon name="search"/></div><div><h2>Defina os filtros e pesquise.</h2><p>A consulta PubMed permanece visível antes do envio.</p></div></section>}
    </main>
    <footer className="app-footer"><span>Atlas Médico v2</span><span>Dados bibliográficos fornecidos pela NCBI · não substitui avaliação clínica</span></footer>
    {saveOpen && createPortal(<div className="modal-layer notranslate" translate="no" onMouseDown={(event) => { if (event.target === event.currentTarget) setSaveOpen(false); }}><section className="save-dialog" role="dialog" aria-modal="true" aria-labelledby="save-title"><div className="dialog-head"><div><h2 id="save-title">Salvar busca</h2></div><button className="dialog-close" aria-label="Fechar" onClick={() => setSaveOpen(false)}><Icon name="close"/></button></div><label>Nome<input autoFocus value={saveName} onChange={(event) => setSaveName(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') saveCurrent(); }}/></label><div className="save-summary">{filters.keywords.length} termos · {filters.authors.length} autores · {filters.journalIds.length || 'todas as'} revistas</div><div className="dialog-footer"><button className="button ghost" onClick={() => setSaveOpen(false)}>Cancelar</button><button className="button primary" onClick={saveCurrent}>Salvar</button></div></section></div>, document.body)}
  </div>;
}
