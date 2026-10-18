import { describe, expect, it } from 'vitest';
import { journals } from '../src/data/journals.generated';

describe('catálogo NLM', () => {
  it('inclui o catálogo integral e identifica títulos importantes', () => {
    expect(journals.length).toBeGreaterThan(40_000);

    const radiology = journals.find((journal) => journal.name === 'Radiology');
    expect(radiology).toMatchObject({ abbreviation: 'Radiology', issnPrint: '0033-8419', issnOnline: '1527-1315' });
    expect(radiology?.aliases).toContain('RSNA');

    const jama = journals.find((journal) => journal.name === 'JAMA');
    expect(jama).toMatchObject({ abbreviation: 'JAMA', issnPrint: '0098-7484', issnOnline: '1538-3598' });
  });
});
