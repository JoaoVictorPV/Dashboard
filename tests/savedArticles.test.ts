import { beforeEach, describe, expect, it } from 'vitest';
import { persistSavedArticles, readSavedArticles, SAVED_ARTICLES_KEY, toggleSavedArticle, updateSavedArticle } from '../src/lib/savedArticles';
import type { PubMedArticle } from '../src/types';

const article: PubMedArticle = {
  pmid: '12345678',
  title: 'A useful clinical study',
  journal: 'Radiology',
  journalAbbreviation: 'Radiology',
  authors: ['Silva AJ'],
  publicationDate: '2026 Oct',
  doi: null,
  pmcId: null,
  hasAbstract: true,
};

describe('artigos salvos', () => {
  beforeEach(() => localStorage.clear());

  it('salva, persiste e remove um artigo pelo PMID', () => {
    const saved = toggleSavedArticle([], article, '2026-10-23T12:00:00.000Z');
    persistSavedArticles(saved);
    expect(readSavedArticles()).toEqual(saved);
    expect(toggleSavedArticle(saved, article)).toEqual([]);
  });

  it('preserva a data quando o conteúdo salvo recebe tradução', () => {
    const saved = toggleSavedArticle([], article, '2026-10-23T12:00:00.000Z');
    expect(updateSavedArticle(saved, { ...article, translatedTitle: 'Um estudo clínico útil' })[0]).toMatchObject({
      translatedTitle: 'Um estudo clínico útil',
      savedAt: '2026-10-23T12:00:00.000Z',
    });
  });

  it('ignora armazenamento corrompido e PMIDs duplicados', () => {
    localStorage.setItem(SAVED_ARTICLES_KEY, '{');
    expect(readSavedArticles()).toEqual([]);
    localStorage.setItem(SAVED_ARTICLES_KEY, JSON.stringify([{ ...article, savedAt: 'a' }, { ...article, savedAt: 'b' }, { title: 'inválido' }]));
    expect(readSavedArticles()).toHaveLength(1);
  });
});
