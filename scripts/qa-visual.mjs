import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const baseUrl = process.env.QA_URL || 'http://127.0.0.1:4173/?preview=1';
const candidates = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].filter(Boolean);
const executablePath = candidates.find(existsSync);
if (!executablePath) throw new Error('Chrome não encontrado. Defina CHROME_PATH.');

const output = resolve('artifacts');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath });
const report = { baseUrl, login: {}, desktop: {}, mobile: {}, consoleErrors: [] };

try {
  const login = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await login.route('**/api/auth/session', (route) => route.fulfill({ status: 401, contentType: 'application/json', body: '{"authenticated":false}' }));
  await login.goto(baseUrl.replace('?preview=1', ''), { waitUntil: 'networkidle' });
  report.login = { button: await login.getByRole('button', { name: /^Entrar/ }).innerText(), protectedFromBrowserTranslation: await login.locator('main[translate="no"]').count() === 1 };
  await login.screenshot({ path: resolve(output, 'desktop-login.png') });
  await login.close();

  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  await desktop.addInitScript(() => {
    window.Translator = { availability: async () => 'available', create: async () => ({ translate: async (text) => `PT: ${text}` }) };
    const createObjectURL = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (blob) => { window.__atlasDownloadBlob = blob; return createObjectURL(blob); };
  });
  desktop.on('console', (message) => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
  await desktop.route('**/api/pubmed/details?pmids=*', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ abstracts: { '39277194': 'This review evaluates opportunistic CT screening for osteoporosis.' } }) }));
  await desktop.goto(baseUrl, { waitUntil: 'networkidle' });
  report.desktop = await desktop.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, title: document.title }));
  await desktop.screenshot({ path: resolve(output, 'desktop-initial.png') });

  await desktop.getByLabel('Palavras-chave').fill('"deep learning"; |radiomics; -editorial');
  await desktop.getByLabel('Adicionar termo').click();
  await desktop.getByRole('button', { name: /Todas as revistas/ }).click();
  const dialog = desktop.getByRole('dialog', { name: /Revistas/ });
  await dialog.getByPlaceholder(/Buscar revistas/).fill('Radiology');
  const selectAllJournals = dialog.getByRole('button', { name: 'Selecionar todas', exact: true });
  await selectAllJournals.click();
  report.desktop.selectAllJournals = await dialog.getByRole('button', { name: 'Desmarcar todas', exact: true }).count() === 1;
  await dialog.getByRole('button', { name: 'Limpar', exact: true }).click();
  const radiologyStar = dialog.getByRole('button', { name: 'Adicionar Radiology aos favoritos', exact: true });
  await radiologyStar.click();
  await dialog.getByText('Radiology', { exact: true }).first().click();
  await desktop.screenshot({ path: resolve(output, 'desktop-journals.png') });
  await dialog.getByRole('button', { name: 'Concluir' }).click();
  report.desktop.favoritePersisted = await desktop.evaluate(() => JSON.parse(localStorage.getItem('atlas-medico-favorite-journals-v1') || '[]').length > 0);
  await desktop.getByRole('button', { name: /Pesquisar no PubMed/ }).click();
  await desktop.getByRole('heading', { name: /artigos/ }).waitFor();
  report.desktop.hasNoGlobalAbstractButton = await desktop.getByRole('button', { name: /Abrir resumos|Recolher resumos/ }).count() === 0;
  await desktop.getByRole('button', { name: /Traduzir títulos e resumos/ }).click();
  await desktop.getByRole('button', { name: /Conteúdo traduzido/ }).waitFor();
  await desktop.getByRole('button', { name: 'Ler resumo' }).first().click();
  await desktop.locator('.abstract-panel').first().getByText(/^PT:/).waitFor();
  await desktop.screenshot({ path: resolve(output, 'desktop-results.png') });
  const downloadPromise = desktop.waitForEvent('download');
  await desktop.getByRole('button', { name: /Exportar HTML/ }).click();
  const download = await downloadPromise;
  const exported = await desktop.evaluate(async () => window.__atlasDownloadBlob ? await window.__atlasDownloadBlob.text() : '');
  report.desktop.export = { filename: download.suggestedFilename(), bytes: exported.length, sortable: exported.includes('data-sort'), adjustableColumns: exported.includes('Ajustar colunas'), translatedTitle: exported.includes('PT: Foundation models'), translatedAbstract: exported.includes('PT: Foundation models have the potential') };

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  mobile.on('console', (message) => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
  await mobile.goto(baseUrl, { waitUntil: 'networkidle' });
  report.mobile = await mobile.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth }));
  await mobile.screenshot({ path: resolve(output, 'mobile-initial.png') });
  await mobile.getByRole('button', { name: /Todas as revistas/ }).click();
  const mobileDialog = mobile.getByRole('dialog', { name: /Revistas/ });
  await mobileDialog.getByPlaceholder(/Buscar revistas/).fill('Radiology');
  report.mobile.selectAllVisible = await mobileDialog.getByRole('button', { name: 'Selecionar todas', exact: true }).isVisible();
  report.mobile.modalScrollWidth = await mobile.evaluate(() => document.documentElement.scrollWidth);
  await mobile.screenshot({ path: resolve(output, 'mobile-journals.png') });
} finally {
  await browser.close();
}

const overflow = report.mobile.scrollWidth > report.mobile.width || report.mobile.bodyWidth > report.mobile.width;
if (overflow || report.mobile.modalScrollWidth > report.mobile.width || !report.mobile.selectAllVisible || report.consoleErrors.length || !report.login.protectedFromBrowserTranslation || report.login.button.replace(/\s+/g, ' ') !== 'Entrar →' || !report.desktop.favoritePersisted || !report.desktop.selectAllJournals || !report.desktop.hasNoGlobalAbstractButton || !report.desktop.export.sortable || !report.desktop.export.adjustableColumns || !report.desktop.export.translatedTitle || !report.desktop.export.translatedAbstract) {
  console.error(JSON.stringify(report, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify(report, null, 2));
}
