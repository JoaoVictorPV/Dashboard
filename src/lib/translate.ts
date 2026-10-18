const CACHE_KEY = 'atlas-medico-title-translations-v1';

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
  try { return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}') as Record<string, string>; }
  catch { return {}; }
}

function writeCache(cache: Record<string, string>) {
  const entries = Object.entries(cache).slice(-500);
  localStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(entries)));
}

export function translationIsSupported() {
  return Boolean(factory());
}

export async function translateArticleTitles(
  titles: { pmid: string; title: string; translatedTitle?: string }[],
  onProgress: (completed: number, total: number) => void,
) {
  const Translator = factory();
  if (!Translator) throw new Error('A tradução integrada requer Chrome atualizado em um computador.');

  const options = { sourceLanguage: 'en', targetLanguage: 'pt' };
  const availability = await Translator.availability(options);
  if (availability === 'unavailable') throw new Error('O pacote de tradução inglês–português não está disponível neste navegador.');

  const translator = await Translator.create(options);
  const cache = readCache();
  const translated: Record<string, string> = {};
  let completed = 0;

  for (const article of titles) {
    const cached = article.translatedTitle || cache[article.title];
    const value = cached || (await translator.translate(article.title)).trim();
    translated[article.pmid] = value;
    cache[article.title] = value;
    completed += 1;
    onProgress(completed, titles.length);
  }

  writeCache(cache);
  translator.destroy?.();
  return translated;
}
