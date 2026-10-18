import type { AuthorTerm, Journal, KeywordField, KeywordTerm, SearchFilters } from '../types';

const fieldLabels: Record<KeywordField, string> = {
  'title-abstract': 'Title/Abstract',
  mesh: 'MeSH Terms',
  title: 'Title',
  all: 'All Fields',
};

function sanitize(value: string) {
  return value.replace(/[\u0000-\u001f]/g, ' ').replace(/"/g, '\\"').trim();
}

function foldTerms<T extends { operator: 'AND' | 'OR' | 'NOT' }>(terms: T[], render: (term: T) => string) {
  return terms.reduce((expression, term, index) => {
    const rendered = `(${render(term)})`;
    if (index === 0) return term.operator === 'NOT' ? `(NOT ${rendered})` : rendered;
    return `(${expression} ${term.operator} ${rendered})`;
  }, '');
}

export function keywordExpression(terms: KeywordTerm[]) {
  const valid = terms.filter((term) => term.value.trim());
  return foldTerms(valid, (term) => {
    const value = sanitize(term.value);
    const formatted = term.phrase && !value.includes('*') ? `"${value}"` : value;
    return `${formatted}[${fieldLabels[term.field]}]`;
  });
}

export function authorExpression(terms: AuthorTerm[]) {
  return foldTerms(terms.filter((term) => term.value.trim()), (term) => `"${sanitize(term.value)}"[Author]`);
}

export function buildPubMedQuery(filters: SearchFilters, journals: Journal[]) {
  const clauses: string[] = [];
  const keywords = keywordExpression(filters.keywords);
  const authors = authorExpression(filters.authors);
  if (keywords) clauses.push(keywords);
  if (authors) clauses.push(authors);

  const selected = journals.filter((journal) => filters.journalIds.includes(journal.id));
  if (selected.length) {
    clauses.push(`(${selected.map((journal) => `"${sanitize(journal.abbreviation)}"[Journal]`).join(' OR ')})`);
  }

  if (filters.dateFrom || filters.dateTo) {
    const from = filters.dateFrom ? filters.dateFrom.replaceAll('-', '/') : '1900/01/01';
    const to = filters.dateTo ? filters.dateTo.replaceAll('-', '/') : '3000/12/31';
    clauses.push(`("${from}"[Date - Publication] : "${to}"[Date - Publication])`);
  }
  if (filters.freeFullText) clauses.push('"free full text"[sb]');
  if (filters.excludeCorrections !== false) {
    clauses.push('NOT ("Published Erratum"[Publication Type] OR "Retraction Notice"[Publication Type] OR "Expression of Concern"[Publication Type])');
  }
  return clauses.join(' AND ');
}

export const emptyFilters = (): SearchFilters => ({
  keywords: [],
  authors: [],
  journalIds: [],
  dateFrom: '',
  dateTo: '',
  freeFullText: true,
  excludeCorrections: true,
  sort: 'newest',
});

export function daysAgoIso(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

export function uid(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}
