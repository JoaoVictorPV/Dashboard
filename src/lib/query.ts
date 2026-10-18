import type { AuthorTerm, DatePreset, Journal, KeywordField, KeywordTerm, SearchFilters } from '../types';

export const datePresetLabels: Record<DatePreset, string> = {
  '30d': 'Últimos 30 dias',
  '90d': 'Últimos 90 dias',
  '6m': 'Últimos 6 meses',
  '1y': 'Último ano',
  '2y': 'Últimos 2 anos',
  '5y': 'Últimos 5 anos',
};

function localDateIso(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function subtractCalendarMonths(date: Date, months: number) {
  const result = new Date(date);
  const desiredDay = result.getDate();
  result.setDate(1);
  result.setMonth(result.getMonth() - months);
  result.setDate(Math.min(desiredDay, new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate()));
  return result;
}

function subtractCalendarYears(date: Date, years: number) {
  const result = new Date(date);
  const desiredMonth = result.getMonth();
  result.setFullYear(result.getFullYear() - years, desiredMonth, 1);
  result.setDate(Math.min(date.getDate(), new Date(result.getFullYear(), desiredMonth + 1, 0).getDate()));
  return result;
}

export function relativeDateRange(preset: DatePreset, now = new Date()) {
  const end = new Date(now);
  let start: Date;
  if (preset === '30d' || preset === '90d') {
    start = new Date(end);
    start.setDate(start.getDate() - (preset === '30d' ? 30 : 90));
  } else if (preset === '6m') {
    start = subtractCalendarMonths(end, 6);
  } else {
    start = subtractCalendarYears(end, Number.parseInt(preset, 10));
  }
  return { dateFrom: localDateIso(start), dateTo: localDateIso(end) };
}

export function materializeRelativeDates(filters: SearchFilters, now = new Date()): SearchFilters {
  return filters.datePreset ? { ...filters, ...relativeDateRange(filters.datePreset, now) } : filters;
}

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

export function buildPubMedQuery(filters: SearchFilters, journals: Journal[], now = new Date()) {
  const resolvedFilters = materializeRelativeDates(filters, now);
  const clauses: string[] = [];
  const keywords = keywordExpression(resolvedFilters.keywords);
  const authors = authorExpression(resolvedFilters.authors);
  if (keywords) clauses.push(keywords);
  if (authors) clauses.push(authors);

  const selected = journals.filter((journal) => resolvedFilters.journalIds.includes(journal.id));
  if (selected.length) {
    clauses.push(`(${selected.map((journal) => `"${sanitize(journal.abbreviation)}"[Journal]`).join(' OR ')})`);
  }

  if (resolvedFilters.dateFrom || resolvedFilters.dateTo) {
    const from = resolvedFilters.dateFrom ? resolvedFilters.dateFrom.replaceAll('-', '/') : '1900/01/01';
    const to = resolvedFilters.dateTo ? resolvedFilters.dateTo.replaceAll('-', '/') : '3000/12/31';
    clauses.push(`("${from}"[Date - Publication] : "${to}"[Date - Publication])`);
  }
  if (resolvedFilters.freeFullText) clauses.push('"free full text"[sb]');
  if (resolvedFilters.excludeCorrections !== false) {
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
  datePreset: null,
  freeFullText: true,
  excludeCorrections: true,
  sort: 'newest',
});

export function uid(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}
