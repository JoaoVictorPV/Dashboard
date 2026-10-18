import { describe, expect, it } from 'vitest';
import { createResultsHtml } from '../src/lib/exportHtml';

describe('exportação HTML', () => {
  it('gera arquivo independente, ordenável e com conteúdo escapado', () => {
    const html = createResultsHtml([{ pmid: '123', title: '<script>alert(1)</script>', journal: 'Radiology', journalAbbreviation: 'Radiology', authors: ['Silva A'], publicationDate: '2026', doi: '10.1/test', pmcId: null, hasAbstract: true, abstract: 'Resumo seguro' }], 'MRI');
    expect(html).toContain('data-sort');
    expect(html).toContain('Ajustar colunas');
    expect(html).toContain('Densidade padrão');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<script>alert(1)</script>');
  });
});
