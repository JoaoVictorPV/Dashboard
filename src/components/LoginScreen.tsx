import { useState, type FormEvent } from 'react';
import { Icon } from './Icon';

export function LoginScreen({ onLogin }: { onLogin: (username: string, password: string) => Promise<void> }) {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setError(''); setBusy(true);
    try { await onLogin(username, password); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível entrar.'); }
    finally { setBusy(false); }
  };
  return <main className="login-page notranslate" translate="no">
    <div className="login-visual" aria-hidden="true"><div className="orb orb-one"/><div className="orb orb-two"/><svg viewBox="0 0 600 600"><g className="scan-lines"><circle cx="300" cy="300" r="220"/><circle cx="300" cy="300" r="150"/><path d="M75 300h450M300 75v450"/><path d="M145 145l310 310M455 145 145 455"/></g><g className="pulse"><path d="M95 315h98l24-72 42 145 38-116 31 43h177"/><circle cx="259" cy="388" r="7"/></g></svg><div className="visual-index"><span>NCBI</span><span>MEDLINE</span><span>PUBMED</span></div></div>
    <section className="login-panel"><div className="brand"><span className="brand-mark"><Icon name="sparkle"/></span><span><b>ATLAS</b><small>MÉDICO</small></span></div><form onSubmit={submit}><span className="eyebrow">Acesso pessoal</span><h2>Entrar</h2><label>Usuário<input autoComplete="username" value={username} onChange={(event) => setUsername(event.target.value)} /></label><label>Senha<input autoComplete="current-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoFocus /></label>{error && <div className="form-error" role="alert">{error}</div>}<button className="button primary" disabled={busy}>{busy ? 'Verificando…' : 'Entrar'} <span>→</span></button><small className="session-note">Encerramento automático após 2 horas sem atividade.</small></form><footer>NCBI PubMed · acesso protegido</footer></section>
  </main>;
}
