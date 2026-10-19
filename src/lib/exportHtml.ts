import type { PubMedArticle } from '../types';

const escapeHtml = (value: unknown) => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

export function createResultsHtml(articles: PubMedArticle[], query: string) {
  const created = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date());
  const rows = articles.map((article, index) => {
    return `
    <tr>
      <td data-value="${index + 1}">${index + 1}</td>
      <td data-value="${escapeHtml((article.translatedTitle || article.title).toLowerCase())}"><a href="https://pubmed.ncbi.nlm.nih.gov/${encodeURIComponent(article.pmid)}/" target="_blank" rel="noreferrer">${escapeHtml(article.translatedTitle || article.title)}</a>${article.translatedTitle ? `<span class="original">Original: ${escapeHtml(article.title)}</span>` : ''}</td>
      <td data-value="${escapeHtml(article.authors.join(', ').toLowerCase())}">${escapeHtml(article.authors.join(', ') || '—')}</td>
      <td data-value="${escapeHtml(article.journal.toLowerCase())}">${escapeHtml(article.journal)}</td>
      <td data-value="${escapeHtml(article.publicationDate)}">${escapeHtml(article.publicationDate || '—')}</td>
      <td data-value="${escapeHtml(article.pmid)}">${escapeHtml(article.pmid)}</td>
      <td data-value="${escapeHtml(article.doi ?? '')}">${article.doi ? `<a href="https://doi.org/${encodeURIComponent(article.doi)}" target="_blank" rel="noreferrer">${escapeHtml(article.doi)}</a>` : '—'}</td>
    </tr>`;
  }).join('');

  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Resultados PubMed · Atlas Médico</title>
<style>
:root{color-scheme:dark;--ink:#e9f1ee;--muted:#8ea19c;--line:#263b36;--paper:#081310;--card:#0d1d19;--accent:#55d6b5;--accent2:#173a31;--row-pad:14px}*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 15% 0,#12382f 0,transparent 32%),var(--paper);color:var(--ink);font:14px/1.55 Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}.shell{max-width:1480px;margin:auto;padding:38px}.mast{position:relative;overflow:hidden;background:linear-gradient(125deg,#0a1b17,#123d33);color:white;padding:30px;border:1px solid #284d44;border-radius:22px;box-shadow:0 20px 70px #0008}.mast:after{content:"";position:absolute;width:260px;height:260px;border:1px solid #55d6b533;border-radius:50%;right:-70px;top:-120px;box-shadow:0 0 0 45px #55d6b508,0 0 0 90px #55d6b505}.eyebrow{letter-spacing:.14em;text-transform:uppercase;color:#79d7be;font-weight:750;font-size:10px}.mast h1{font-size:30px;margin:7px 0}.meta{color:#a9c2ba}.query{position:relative;z-index:1;margin-top:18px;padding:14px 16px;background:#0003;border:1px solid #ffffff18;border-radius:12px;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;overflow-wrap:anywhere}.toolbar{position:sticky;top:0;z-index:3;margin:20px 0 12px;display:flex;gap:10px;flex-wrap:wrap;padding:12px;background:#081310e8;backdrop-filter:blur(12px)}input,button,select{border:1px solid var(--line);border-radius:10px;background:#10231e;color:var(--ink);padding:10px 12px;font:inherit}input{min-width:240px;flex:1}button{cursor:pointer;font-weight:700}button:hover{border-color:var(--accent);color:var(--accent)}.table-wrap{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:auto;box-shadow:0 18px 60px #0006}table{width:100%;border-collapse:collapse;min-width:1020px}th{position:sticky;top:0;background:#142a24;text-align:left;font-size:11px;letter-spacing:.06em;text-transform:uppercase;cursor:pointer;user-select:none}th,td{padding:var(--row-pad);border-bottom:1px solid var(--line);vertical-align:top}tbody tr:hover{background:#112923}th[data-sort]::after{content:' ↕';color:#657d76}th.asc::after{content:' ↑';color:var(--accent)}th.desc::after{content:' ↓';color:var(--accent)}a{color:#6ee3c4;text-decoration:none;font-weight:680}a:hover{text-decoration:underline}.original{display:block;margin-top:6px;color:var(--muted);font-size:11px;font-weight:400}details{margin-top:10px;color:var(--muted)}summary{cursor:pointer;color:var(--accent);font-weight:700}.hidden{display:none!important}.count{margin-left:auto;color:var(--muted);align-self:center}.compact{--row-pad:8px}.comfortable{--row-pad:18px}.column-popover{position:fixed;inset:0;background:#020806b8;display:grid;place-items:center;z-index:10}.column-card{min-width:280px;background:#10231e;border:1px solid #36564d;border-radius:16px;padding:22px;box-shadow:0 25px 80px #000}.column-card h2{margin-top:0}.column-card label{display:block;margin:10px}.column-card>button{width:100%;margin-top:12px}@media(max-width:720px){.shell{padding:16px}.mast{padding:22px}.mast h1{font-size:25px}.toolbar{top:0;margin-inline:-4px}.count{width:100%}}@media print{:root{color-scheme:light;--ink:#111;--muted:#555;--line:#ddd;--paper:#fff;--card:#fff}body{background:#fff}.shell{padding:0}.mast{box-shadow:none;border:1px solid #ccc;color:#111;background:white}.eyebrow,.meta{color:#555}.query{border-color:#ddd;background:#fafafa}.toolbar{display:none}.table-wrap{box-shadow:none}th{position:static;background:#eee}.original{color:#555}}
</style></head><body><main class="shell"><header class="mast"><div class="eyebrow">Atlas Médico · Exportação independente</div><h1>Resultados da pesquisa</h1><div class="meta">${articles.length} artigos exportados · ${escapeHtml(created)}</div><div class="query">${escapeHtml(query || 'Consulta não informada')}</div></header>
<section class="toolbar" aria-label="Ajustes da tabela"><input id="filter" type="search" placeholder="Filtrar estes resultados…"><select id="density" aria-label="Densidade"><option value="">Densidade padrão</option><option value="compact">Compacta</option><option value="comfortable">Confortável</option></select><button id="columns">Ajustar colunas</button><button onclick="window.print()">Imprimir / PDF</button><span class="count"><strong id="visibleCount">${articles.length}</strong> visíveis</span></section>
<div class="table-wrap"><table id="results"><thead><tr><th data-sort>#</th><th data-sort>Título</th><th data-sort>Autores</th><th data-sort>Revista</th><th data-sort>Data</th><th data-sort>PMID</th><th data-sort>DOI</th></tr></thead><tbody>${rows}</tbody></table></div></main>
<div id="columnDialog" class="column-popover hidden" role="dialog" aria-modal="true" aria-labelledby="columnTitle"><div class="column-card"><h2 id="columnTitle">Colunas visíveis</h2><div id="columnChecks"></div><button id="closeColumns">Concluir</button></div></div>
<script>
const table=document.querySelector('#results'),body=table.tBodies[0],headers=[...table.tHead.rows[0].cells],rows=()=>[...body.rows];
headers.forEach((head,index)=>head.addEventListener('click',()=>{const direction=head.classList.contains('asc')?'desc':'asc';headers.forEach(h=>h.classList.remove('asc','desc'));head.classList.add(direction);rows().sort((a,b)=>{const av=a.cells[index].dataset.value||a.cells[index].innerText,bv=b.cells[index].dataset.value||b.cells[index].innerText;const result=av.localeCompare(bv,'pt-BR',{numeric:true,sensitivity:'base'});return direction==='asc'?result:-result}).forEach(row=>body.append(row))}));
document.querySelector('#filter').addEventListener('input',event=>{const term=event.target.value.toLocaleLowerCase('pt-BR');let count=0;rows().forEach(row=>{const show=row.innerText.toLocaleLowerCase('pt-BR').includes(term);row.classList.toggle('hidden',!show);if(show)count++});document.querySelector('#visibleCount').textContent=count});
document.querySelector('#density').addEventListener('change',event=>{document.body.classList.remove('compact','comfortable');if(event.target.value)document.body.classList.add(event.target.value)});
const dialog=document.querySelector('#columnDialog'),checks=document.querySelector('#columnChecks');headers.forEach((head,index)=>{const label=document.createElement('label');label.innerHTML='<input type="checkbox" checked> '+head.innerText;label.querySelector('input').addEventListener('change',event=>{[...table.rows].forEach(row=>row.cells[index].classList.toggle('hidden',!event.target.checked))});checks.append(label)});document.querySelector('#columns').addEventListener('click',()=>dialog.classList.remove('hidden'));document.querySelector('#closeColumns').addEventListener('click',()=>dialog.classList.add('hidden'));dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.classList.add('hidden')});
</script></body></html>`;
}

export function downloadResultsHtml(articles: PubMedArticle[], query: string) {
  const blob = new Blob([createResultsHtml(articles, query)], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `atlas-medico-${new Date().toISOString().slice(0, 10)}.html`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
