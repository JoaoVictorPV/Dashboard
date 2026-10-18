import type { PubMedArticle, SearchResponse, SortMode } from '../types';

async function jsonRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Não foi possível concluir a solicitação.');
  return data as T;
}

export const authApi = {
  session: () => jsonRequest<{ authenticated: boolean; expiresAt?: number }>('/api/auth/session'),
  login: (username: string, password: string) => jsonRequest<{ authenticated: boolean; expiresAt: number }>('/api/auth/login', {
    method: 'POST', body: JSON.stringify({ username, password }),
  }),
  refresh: () => jsonRequest<{ authenticated: boolean; expiresAt: number }>('/api/auth/refresh', { method: 'POST', body: '{}' }),
  logout: () => jsonRequest<{ ok: boolean }>('/api/auth/logout', { method: 'POST', body: '{}' }),
};

export function searchPubMed(query: string, page: number, sort: SortMode) {
  return jsonRequest<SearchResponse>('/api/pubmed/search', {
    method: 'POST', body: JSON.stringify({ query, page, pageSize: 25, sort }),
  });
}

export function fetchAbstract(pmid: string) {
  return jsonRequest<Pick<PubMedArticle, 'pmid' | 'abstract'>>(`/api/pubmed/details?pmid=${encodeURIComponent(pmid)}`);
}
