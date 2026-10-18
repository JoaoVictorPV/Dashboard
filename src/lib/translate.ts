const CACHE_KEY = 'atlas-medico-content-translations-v2';
const LEGACY_CACHE_KEY = 'atlas-medico-title-translations-v1';

type TranslationAvailability = 'available' | 'downloadable' | 'downloading' | 'unavailable';

interface TranslatorInstance {
  translate: (text: string) => Promise<string>;
  destroy?: () => void;
}

interface TranslatorFactory {
  availability: (options: { sourceLanguage: string; targetLanguage: string }) => Promise<TranslationAvailability>;
  create: (options: {
    sourceLanguage: string;
    targetLanguage: string;
    monitor?: (monitor: EventTarget) => void;
  }) => Promise<TranslatorInstance>;
}

function factory() {
  return (globalThis as typeof globalThis & { Translator?: TranslatorFactory }).Translator;
}

function readCache(): Record<string, string> {
  try {
    return {
      ...(JSON.parse(localStorage.getItem(LEGACY_CACHE_KEY) || '{}') as Record<string, string>),
      ...(JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') as Record<string, string>),
    };
  }
  catch { return {}; }
}

function writeCache(cache: Record<string, string>) {
  const entries = Object.entries(cache).slice(-1000);
  localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(entries)));
}

function splitLongText(text: string, limit = 2800) {
  if (text.length <= limit) return [text];
  const chunks: string[] = [];
  let current = '';
  const sections = text.split(/(?<=[.!?])\s+|\n{2,}/);
  for (const section of sections) {
    if (section.length > limit) {
      if (current) { chunks.push(current); current = ''; }
      for (let index = 0; index < section.length; index += limit) chunks.push(section.slice(index, index + limit));
    } else if (`${current} ${section}`.trim().length > limit) {
      chunks.push(current);
      current = section;
    } else {
      current = `${current} ${section}`.trim();
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

async function translateText(translator: TranslatorInstance, text: string) {
  const translated = [];
  for (const chunk of splitLongText(text)) translated.push((await translator.translate(chunk)).trim());
  return translated.join('\n\n');
}

export function translationIsSupported() {
  return Boolean(factory());
}

export async function translateArticleContent(
  articles: { pmid: string; title: string; abstract?: string; translatedTitle?: string; translatedAbstract?: string }[],
  onProgress: (completed: number, total: number) => void,
) {
  const Translator = factory();
  if (!Translator) throw new Error('A tradução integrada requer Chrome atualizado em um computador.');

  const options = { sourceLanguage: 'en', targetLanguage: 'pt' };
  const availability = await Translator.availability(options);
  if (availability === 'unavailable') throw new Error('O pacote de tradução inglês–português não está disponível neste navegador.');

  let translator: TranslatorInstance;
  try {
    translator = await Translator.create(options);
  } catch {
    throw new Error('O tradutor integrado não pôde ser iniciado. Abra o Atlas no Chrome atualizado em um computador e tente novamente.');
  }
  const cache = readCache();
  const translated: Record<string, { title: string; abstract?: string }> = {};
  const total = articles.length + articles.filter((article) => article.abstract).length;
  let completed = 0;

  try {
    for (const article of articles) {
      const cachedTitle = article.translatedTitle || cache[article.title];
      const title = cachedTitle || await translateText(translator, article.title);
      translated[article.pmid] = { title };
      cache[article.title] = title;
      completed += 1;
      onProgress(completed, total);

      if (article.abstract) {
        const cachedAbstract = article.translatedAbstract || cache[article.abstract];
        const abstract = cachedAbstract || await translateText(translator, article.abstract);
        translated[article.pmid].abstract = abstract;
        cache[article.abstract] = abstract;
        completed += 1;
        onProgress(completed, total);
      }
    }
  } finally {
    writeCache(cache);
    translator.destroy?.();
  }
  return translated;
}
