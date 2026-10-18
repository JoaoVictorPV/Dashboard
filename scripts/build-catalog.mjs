import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const sourcePath = process.argv[2];
const nlmText = sourcePath
  ? await readFile(resolve(sourcePath), 'utf8')
  : await fetch('https://ftp.ncbi.nih.gov/pubmed/J_Entrez.txt').then((response) => {
      if (!response.ok) throw new Error(`NLM respondeu ${response.status}`);
      return response.text();
    });
const seed = JSON.parse(await readFile(resolve('data/journal-seed.json'), 'utf8'));

const normalize = (value = '') => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/gi, ' ')
  .trim()
  .toLowerCase();

const aliases = new Map(Object.entries({
  'am j roentgenol': 'ajr am j roentgenol',
  'jbr btr': 'j belg soc radiol',
  'neuroradiol j': 'neuroradiol j',
  'radiographics': 'radiographics',
}));

const records = nlmText
  .split(/-{20,}/)
  .map((block) => Object.fromEntries(
    block.split(/\r?\n/).map((line) => {
      const index = line.indexOf(':');
      return index < 0 ? null : [line.slice(0, index).trim(), line.slice(index + 1).trim()];
    }).filter(Boolean),
  ))
  .filter((record) => record.NlmId);

const byAbbreviation = new Map();
const byTitle = new Map();
for (const record of records) {
  for (const key of [record.MedAbbr, record.IsoAbbr]) {
    if (key) byAbbreviation.set(normalize(key), record);
  }
  byTitle.set(normalize(record.JournalTitle), record);
}

const catalog = [];
const unmatched = [];
const seen = new Set();

for (const entry of seed) {
  const abbreviation = aliases.get(normalize(entry.abbr)) ?? normalize(entry.abbr);
  const record = byAbbreviation.get(abbreviation) ?? byTitle.get(normalize(entry.name.replace(/\s*\([^)]*\)\s*/g, ' ')));
  if (!record) {
    unmatched.push(entry);
    continue;
  }
  if (seen.has(record.NlmId)) continue;
  seen.add(record.NlmId);
  catalog.push({
    id: record.NlmId,
    name: record.JournalTitle,
    abbreviation: record.MedAbbr || record.IsoAbbr,
    issnPrint: record['ISSN (Print)'] || null,
    issnOnline: record['ISSN (Online)'] || null,
  });
}

catalog.sort((a, b) => a.name.localeCompare(b.name, 'en'));
const output = `// Gerado a partir do catálogo oficial NLM J_Entrez. Não editar manualmente.\n` +
  `import type { Journal } from '../types';\n\n` +
  `export const journals: Journal[] = ${JSON.stringify(catalog, null, 2)};\n`;

await writeFile(resolve('src/data/journals.generated.ts'), output, 'utf8');
await writeFile(resolve('data/unmatched-journals.json'), `${JSON.stringify(unmatched, null, 2)}\n`, 'utf8');
console.log(`Catálogo: ${catalog.length} revistas validadas; ${unmatched.length} entradas não encontradas.`);
