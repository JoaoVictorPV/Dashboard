export type Operator = 'AND' | 'OR' | 'NOT';
export type KeywordField = 'title-abstract' | 'mesh' | 'title' | 'all';
export type SortMode = 'relevance' | 'newest';
export type DatePreset = '30d' | '90d' | '6m' | '1y' | '2y' | '5y';

export interface Journal {
  id: string;
  name: string;
  abbreviation: string;
  issnPrint: string | null;
  issnOnline: string | null;
  aliases?: string[];
}

export interface KeywordTerm {
  id: string;
  value: string;
  operator: Operator;
  field: KeywordField;
  phrase: boolean;
}

export interface AuthorTerm {
  id: string;
  value: string;
  operator: Operator;
}

export interface SearchFilters {
  keywords: KeywordTerm[];
  authors: AuthorTerm[];
  journalIds: string[];
  dateFrom: string;
  dateTo: string;
  datePreset: DatePreset | null;
  freeFullText: boolean;
  excludeCorrections: boolean;
  sort: SortMode;
}

export interface PubMedArticle {
  pmid: string;
  title: string;
  translatedTitle?: string;
  journal: string;
  journalAbbreviation: string;
  authors: string[];
  publicationDate: string;
  doi: string | null;
  pmcId: string | null;
  hasAbstract: boolean;
  abstract?: string;
  translatedAbstract?: string;
}

export interface SearchResponse {
  articles: PubMedArticle[];
  total: number;
  page: number;
  pageSize: number;
  query: string;
}

export interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilters;
  createdAt: string;
}
