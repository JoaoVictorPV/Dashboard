import type { PubMedArticle } from '../types';

const escapeHtml = (value: unknown) => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

export function createResultsHtml(articles: PubMedArticle[], query: string) {
  const created = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long', timeStyle: 'short' }).format(new Date());
  const rows = articles.map((article, index) => `
    <tr>
      <td data-value="${index + 1}">${index + 1}</td>
      <td data-value="${escapeHtml(article.title.toLowerCase())}"><a href="https://pubmed.ncbi.nlm.nih.gov/${encodeURIComponent(article.pmid)}/" target="_blank" rel="noreferrer">${escapeHtml(article.title)}</a>${article.abstract ? `<details><summary>Resumo</summary><p>${escapeHtml(article.abstract)}</p></details>` : ''}</td>
      <td data-value="${escapeHtml(article.authors.join(', ').toLowerCase())}">${escapeHtml(article.authors.join(', ') || '—')}</td>
      <td data-value="${escapeHtml(article.journal.toLowerCase())}">${escapeHtml(article.journal)}</td>
      <td data-value="${escapeHtml(article.publicationDate)}">${escapeHtml(article.publicationDate || '—')}</td>
      <td data-value="${escapeHtml(article.pmid)}">${escapeHtml(article.pmid)}</td>
      <td data-value="${escapeHtml(article.doi ?? '')}">${article.doi ? `<a href="https://doi.org/${encodeURIComponent(article.doi)}" target="_blank" rel="noreferrer">${escapeHtml(article.doi)}</a>` : '—'}</td>
    </tr>`).join('');

  return `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Resultados PubMed · Atlas Médico</title>
<style>
:root{color-scheme:light;--ink:#162321;--muted:#65736f;--line:#dce5e1;--paper:#f5f8f6;--card:#fff;--accent:#087f6c;--accent2:#d8f3ea;--row-pad:14px}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font:14px/1.55 Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}.shell{max-width:1480px;margin:auto;padding:38px}.mast{background:linear-gradient(125deg,#09211e,#0b4a40);color:white;padding:30px;border-radius:22px;box-shadow:0 18px 60px #093c3222}.eyebrow{letter-spacing:.14em;text-transform:uppercase;color:#8fdbc9;font-weight:750;font-size:11px}.mast h1{font-size:32px;margin:7px 0}.meta{color:#c8ded8}.query{margin-top:18px;padding:14px 16px;background:#ffffff12;border:1px solid #ffffff20;border-radius:12px;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;overflow-wrap:anywhere}.toolbar{position:sticky;top:0;z-index:3;margin:20px 0 12px;display:flex;gap:10px;flex-wrap:wrap;padding:12px;background:#f5f8f6e8;backdrop-filter:blur(10px)}input,button,select{border:1px solid var(--line);border-radius:10px;background:white;color:var(--ink);padding:10px 12px;font:inherit}input{min-width:240px;flex:1}button{cursor:pointer;font-weight:700}button:hover{border-color:var(--accent);color:var(--accent)}.table-wrap{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:auto;box-shadow:0 12px 35px #0e312a0a}table{width:100%;border-collapse:collapse;min-width:1020px}th{position:sticky;top:0;background:#edf5f1;text-align:left;font-size:12px;letter-spacing:.04em;text-transform:uppercase;cursor:pointer;user-select:none}th,td{padding:var(--row-pad);border-bottom:1px solid var(--line);vertical-align:top}tbody tr:hover{background:#f4fbf8}th[data-sort]::after{content:' ↕';color:#81948f}th.asc::after{content:' ↑';color:var(--accent)}th.desc::after{content:' ↓';color:var(--accent)}a{color:#087360;text-decoration:none;font-weight:680}a:hover{text-decoration:underline}details{margin-top:10px;color:var(--muted)}summary{cursor:pointer;color:var(--accent);font-weight:700}.hidden{display:none!important}.count{margin-left:auto;color:var(--muted);align-self:center}.compact{--row-pad:8px}.comfortable{--row-pad:18px}@media(max-width:720px){.shell{padding:16px}.mast{padding:22px}.mast h1{font-size:25px}.toolbar{top:0;margin-inline:-4px}.count{width:100%}}@media print{body{background:#fff}.shell{padding:0}.mast{box-shadow:none;border:1px solid #ccc;color:#111;background:white}.eyebrow,.meta{color:#555}.query{border-color:#ddd;background:#fafafa}.toolbar{display:none}.table-wrap{box-shadow:none}th{position:static}}
</style></head><body><main class="shell"><header class="mast"><div class="eyebrow">Atlas Médico · Exportação independente</div><h1>Resultados da pesquisa</h1><div class="meta">${articles.length} artigos exportados · ${escapeHtml(created)}</div><div class="query">${escapeHtml(query || 'Consulta não informada')}</div></header>
<section class="toolbar" aria-label="Ajustes da tabela"><input id="filter" type="search" placeholder="Filtrar estes resultados…"><select id="density" aria-label="Densidade"><option value="">Densidade padrão</option><option value="compact">Compacta</option><option value="comfortable">Confortável</option></select><button id="columns">Ajustar colunas</button><button onclick="window.print()">Imprimir / PDF</button><span class="count"><strong id="visibleCount">${articles.length}</strong> visíveis</span></section>
<div class="table-wrap"><table id="results"><thead><tr><th data-sort>#</th><th data-sort>Título</th><th data-sort>Autores</th><th data-sort>Revista</th><th data-sort>Data</th><th data-sort>PMID</th><th data-sort>DOI</th></tr></thead><tbody>${rows}</tbody></table></div></main>
<dialog id="columnDialog"><form method="dialog"><h2>Colunas visíveis</h2><div id="columnChecks"></div><p><button>Concluir</button></p></form></dialog>
<script>
const table=document.querySelector('#results'),body=table.tBodies[0],headers=[...table.tHead.rows[0].cells],rows=()=>[...body.rows];
headers.forEach((head,index)=>head.addEventListener('click',()=>{const direction=head.classList.contains('asc')?'desc':'asc';headers.forEach(h=>h.classList.remove('asc','desc'));head.classList.add(direction);rows().sort((a,b)=>{const av=a.cells[index].dataset.value||a.cells[index].innerText,bv=b.cells[index].dataset.value||b.cells[index].innerText;const result=av.localeCompare(bv,'pt-BR',{numeric:true,sensitivity:'base'});return direction==='asc'?result:-result}).forEach(row=>body.append(row))}));
document.querySelector('#filter').addEventListener('input',event=>{const term=event.target.value.toLocaleLowerCase('pt-BR');let count=0;rows().forEach(row=>{const show=row.innerText.toLocaleLowerCase('pt-BR').includes(term);row.classList.toggle('hidden',!show);if(show)count++});document.querySelector('#visibleCount').textContent=count});
document.querySelector('#density').addEventListener('change',event=>{document.body.classList.remove('compact','comfortable');if(event.target.value)document.body.classList.add(event.target.value)});
const dialog=document.querySelector('#columnDialog'),checks=document.querySelector('#columnChecks');headers.forEach((head,index)=>{const label=document.createElement('label');label.style.display='block';label.style.margin='10px';label.innerHTML='<input type="checkbox" checked> '+head.innerText;label.querySelector('input').addEventListener('change',event=>{[...table.rows].forEach(row=>row.cells[index].classList.toggle('hidden',!event.target.checked))});checks.append(label)});document.querySelector('#columns').addEventListener('click',()=>dialog.showModal());
</script></body></html>`;
}

export function downloadResultsHtml(articles: PubMedArticle[], query: string) {
  const blob = new Blob([createResultsHtml(articles, query)], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `atlas-medico-${new Date().toISOString().slice(0, 10)}.html`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
