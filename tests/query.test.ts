import { describe, expect, it } from 'vitest';
import { buildPubMedQuery, keywordExpression } from '../src/lib/query';
import type { Journal, SearchFilters } from '../src/types';

const journals: Journal[] = [{ id: '1', name: 'Radiology', abbreviation: 'Radiology', issnPrint: '0033-8419', issnOnline: null }];

describe('construtor PubMed', () => {
  it('preserva a ordem lógica e explicita os campos', () => {
    const expression = keywordExpression([
      { id: 'a', value: 'deep learning', operator: 'AND', field: 'title-abstract', phrase: true },
      { id: 'b', value: 'radiomics', operator: 'OR', field: 'mesh', phrase: false },
      { id: 'c', value: 'editorial', operator: 'NOT', field: 'all', phrase: false },
    ]);
    expect(expression).toBe('((("deep learning"[Title/Abstract]) OR (radiomics[MeSH Terms])) NOT (editorial[All Fields]))');
  });

  it('combina revista, autor, intervalo e texto gratuito', () => {
    const filters: SearchFilters = {
      keywords: [{ id: 'a', value: 'MRI', operator: 'AND', field: 'title', phrase: false }],
      authors: [{ id: 'b', value: 'Silva AJ', operator: 'AND' }],
      journalIds: ['1'], dateFrom: '2024-01-01', dateTo: '2025-12-31', freeFullText: true, sort: 'newest',
    };
    const query = buildPubMedQuery(filters, journals);
    expect(query).toContain('MRI[Title]');
    expect(query).toContain('"Silva AJ"[Author]');
    expect(query).toContain('"Radiology"[Journal]');
    expect(query).toContain('"2024/01/01"[Date - Publication] : "2025/12/31"[Date - Publication]');
    expect(query).toContain('"free full text"[sb]');
  });
});
