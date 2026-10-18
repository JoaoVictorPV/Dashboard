import { describe, expect, it } from 'vitest';
import { buildPubMedQuery, keywordExpression, relativeDateRange } from '../src/lib/query';
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
      journalIds: ['1'], dateFrom: '2024-01-01', dateTo: '2025-12-31', datePreset: null, freeFullText: true, excludeCorrections: true, sort: 'newest',
    };
    const query = buildPubMedQuery(filters, journals);
    expect(query).toContain('MRI[Title]');
    expect(query).toContain('"Silva AJ"[Author]');
    expect(query).toContain('"Radiology"[Journal]');
    expect(query).toContain('"2024/01/01"[Date - Publication] : "2025/12/31"[Date - Publication]');
    expect(query).toContain('"free full text"[sb]');
    expect(query).toContain('"Published Erratum"[pt:noexp] AND (erratum[Title] OR corrigendum[Title] OR correction[Title])');
    expect(query).toContain('"Expression of Concern"[pt:noexp] AND "expression of concern"[Title]');
  });

  it('permite incluir avisos editoriais quando solicitado', () => {
    const query = buildPubMedQuery({ keywords: [{ id: 'a', value: 'MRI', operator: 'AND', field: 'title', phrase: false }], authors: [], journalIds: [], dateFrom: '', dateTo: '', datePreset: null, freeFullText: false, excludeCorrections: false, sort: 'newest' }, journals);
    expect(query).not.toContain('Published Erratum');
  });

  it('não oculta artigos apenas por uma classificação editorial ampla', () => {
    const query = buildPubMedQuery({ keywords: [{ id: 'a', value: 'MRI', operator: 'AND', field: 'title', phrase: false }], authors: [], journalIds: [], dateFrom: '', dateTo: '', datePreset: null, freeFullText: false, excludeCorrections: true, sort: 'newest' }, journals);
    expect(query).not.toContain('"Published Erratum"[Publication Type] OR');
    expect(query).toContain('correction[Title]');
    expect(query).toContain('[pt:noexp]');
  });

  it('recalcula intervalos móveis ao executar uma busca salva', () => {
    const filters: SearchFilters = {
      keywords: [{ id: 'a', value: 'MRI', operator: 'AND', field: 'title', phrase: false }],
      authors: [], journalIds: [], dateFrom: '2020-01-01', dateTo: '2020-01-31', datePreset: '30d', freeFullText: false, excludeCorrections: false, sort: 'newest',
    };
    const query = buildPubMedQuery(filters, journals, new Date('2026-10-18T12:00:00'));
    expect(query).toContain('"2026/09/18"[Date - Publication] : "2026/10/18"[Date - Publication]');
    expect(query).not.toContain('2020/01/01');
  });

  it('oferece 90 dias, seis meses e dois anos como períodos de calendário', () => {
    const now = new Date('2026-10-18T12:00:00');
    expect(relativeDateRange('90d', now)).toEqual({ dateFrom: '2026-07-20', dateTo: '2026-10-18' });
    expect(relativeDateRange('6m', now)).toEqual({ dateFrom: '2026-04-18', dateTo: '2026-10-18' });
    expect(relativeDateRange('2y', now)).toEqual({ dateFrom: '2024-10-18', dateTo: '2026-10-18' });
  });
});
