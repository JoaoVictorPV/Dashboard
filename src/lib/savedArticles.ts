import type { PubMedArticle, SavedArticle } from '../types';

export const SAVED_ARTICLES_KEY = 'atlas-medico-saved-articles-v1';

function isSavedArticle(value: unknown): value is SavedArticle {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<SavedArticle>;
  return typeof item.pmid === 'string'
    && typeof item.title === 'string'
    && typeof item.journal === 'string'
    && Array.isArray(item.authors)
    && typeof item.savedAt === 'string';
}

export function readSavedArticles(): SavedArticle[] {
  try {
    const stored = JSON.parse(localStorage.getItem(SAVED_ARTICLES_KEY) || '[]') as unknown;
    if (!Array.isArray(stored)) return [];
    const unique = new Map<string, SavedArticle>();
    stored.filter(isSavedArticle).forEach((article) => {
      if (!unique.has(article.pmid)) unique.set(article.pmid, article);
    });
    return [...unique.values()];
  } catch {
    return [];
  }
}

export function persistSavedArticles(articles: SavedArticle[]) {
  localStorage.setItem(SAVED_ARTICLES_KEY, JSON.stringify(articles));
}

export function toggleSavedArticle(articles: SavedArticle[], article: PubMedArticle, savedAt = new Date().toISOString()) {
  if (articles.some((item) => item.pmid === article.pmid)) return articles.filter((item) => item.pmid !== article.pmid);
  return [{ ...article, savedAt }, ...articles];
}

export function updateSavedArticle(articles: SavedArticle[], article: PubMedArticle) {
  return articles.map((item) => item.pmid === article.pmid ? { ...article, savedAt: item.savedAt } : item);
}
