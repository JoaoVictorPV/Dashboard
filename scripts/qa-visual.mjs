import { chromium } from 'playwright-core';
import { existsSync } from 'node:fs';
import { mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const baseUrl = process.env.QA_URL || 'http://127.0.0.1:4173/?preview=1';
const candidates = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].filter(Boolean);
const executablePath = candidates.find(existsSync);
if (!executablePath) throw new Error('Chrome não encontrado. Defina CHROME_PATH.');

const output = resolve('artifacts');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath });
const report = { baseUrl, desktop: {}, mobile: {}, consoleErrors: [] };

try {
  const desktop = await browser.newPage({ viewport: { width: 1440, height: 1000 }, acceptDownloads: true });
  desktop.on('console', (message) => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
  await desktop.goto(baseUrl, { waitUntil: 'networkidle' });
  report.desktop = await desktop.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, title: document.title }));
  await desktop.screenshot({ path: resolve(output, 'desktop-initial.png') });

  await desktop.getByLabel('Palavras-chave').fill('"deep learning"; |radiomics; -editorial');
  await desktop.getByLabel('Adicionar termo').click();
  await desktop.getByRole('button', { name: /Todas as revistas/ }).click();
  const dialog = desktop.getByRole('dialog', { name: /Selecionar revistas/ });
  await dialog.getByPlaceholder(/Buscar entre/).fill('Radiology');
  await dialog.locator('.journal-list label').first().click();
  await dialog.getByRole('button', { name: 'Aplicar seleção' }).click();
  await desktop.getByRole('button', { name: /Pesquisar no PubMed/ }).click();
  await desktop.getByRole('heading', { name: /artigos encontrados/ }).waitFor();
  await desktop.getByRole('button', { name: 'Ler resumo' }).first().click();
  await desktop.screenshot({ path: resolve(output, 'desktop-results.png') });
  const downloadPromise = desktop.waitForEvent('download');
  await desktop.getByRole('button', { name: /Exportar HTML/ }).click();
  const download = await downloadPromise;
  const exportedPath = resolve(output, 'atlas-export.html');
  await download.saveAs(exportedPath);
  const exported = await readFile(exportedPath, 'utf8');
  report.desktop.export = { bytes: exported.length, sortable: exported.includes('data-sort'), adjustableColumns: exported.includes('Ajustar colunas') };

  const mobile = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  mobile.on('console', (message) => { if (message.type() === 'error') report.consoleErrors.push(message.text()); });
  await mobile.goto(baseUrl, { waitUntil: 'networkidle' });
  report.mobile = await mobile.evaluate(() => ({ width: innerWidth, scrollWidth: document.documentElement.scrollWidth, bodyWidth: document.body.scrollWidth }));
  await mobile.screenshot({ path: resolve(output, 'mobile-initial.png') });
} finally {
  await browser.close();
}

const overflow = report.mobile.scrollWidth > report.mobile.width || report.mobile.bodyWidth > report.mobile.width;
if (overflow || report.consoleErrors.length || !report.desktop.export.sortable || !report.desktop.export.adjustableColumns) {
  console.error(JSON.stringify(report, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify(report, null, 2));
}
