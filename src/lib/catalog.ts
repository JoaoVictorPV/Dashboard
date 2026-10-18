import type { Journal } from '../types';

let catalogPromise: Promise<Journal[]> | null = null;

export function loadJournalCatalog() {
  catalogPromise ??= import('../data/journals.generated').then((module) => module.journals);
  return catalogPromise;
}
