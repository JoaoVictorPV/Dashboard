import { beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_JOURNAL_FOLDER_SEEDS,
  DEFAULT_FOLDER_ID,
  JOURNAL_FOLDERS_KEY,
  LEGACY_FAVORITES_KEY,
  favoriteJournalIds,
  mergeDefaultJournalFolders,
  persistJournalFolders,
  readJournalFolders,
  resolveDefaultJournalFolders,
  setJournalFolderMembership,
} from '../src/lib/journalFavorites';
import { journals } from '../src/data/journals.generated';

describe('pastas de revistas favoritas', () => {
  beforeEach(() => localStorage.clear());

  it('migra favoritos antigos para a pasta inicial', () => {
    localStorage.setItem(LEGACY_FAVORITES_KEY, JSON.stringify(['radiology', 'jama']));
    expect(readJournalFolders()).toEqual([{ id: DEFAULT_FOLDER_ID, name: 'Favoritas', journalIds: ['radiology', 'jama'] }]);
  });

  it('persiste pastas e mantém compatibilidade com a lista antiga', () => {
    persistJournalFolders([
      { id: DEFAULT_FOLDER_ID, name: 'Favoritas', journalIds: ['jama'] },
      { id: 'imagem', name: 'Imagem', journalIds: ['radiology', 'jama'] },
    ]);
    expect(JSON.parse(localStorage.getItem(JOURNAL_FOLDERS_KEY) || '[]')).toHaveLength(2);
    expect(JSON.parse(localStorage.getItem(LEGACY_FAVORITES_KEY) || '[]')).toEqual(['jama', 'radiology']);
  });

  it('adiciona e remove uma revista sem duplicar associações', () => {
    const folders = [{ id: DEFAULT_FOLDER_ID, name: 'Favoritas', journalIds: [] }];
    const included = setJournalFolderMembership(folders, DEFAULT_FOLDER_ID, 'radiology', true);
    expect(setJournalFolderMembership(included, DEFAULT_FOLDER_ID, 'radiology', true)[0].journalIds).toEqual(['radiology']);
    expect(favoriteJournalIds(setJournalFolderMembership(included, DEFAULT_FOLDER_ID, 'radiology', false))).toEqual([]);
  });

  it('resolve as 89 revistas das fotos nas três pastas padrão', () => {
    const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/gi, ' ').trim().toLowerCase();
    const catalogValues = new Set(journals.flatMap((journal) => [journal.name, journal.abbreviation, ...(journal.aliases ?? [])]).map(normalize));
    const unmatched = DEFAULT_JOURNAL_FOLDER_SEEDS.flatMap((folder) => folder.journals.filter((query) => !catalogValues.has(normalize(query))));
    expect(unmatched).toEqual([]);
    expect(resolveDefaultJournalFolders(journals).map((folder) => folder.journalIds.length)).toEqual([35, 28, 26]);
  });

  it('mescla as pastas padrão sem apagar personalizações nem duplicar revistas', () => {
    const custom = [{ id: 'minha-radiologia', name: 'Radiologia', journalIds: ['personalizada'] }];
    const first = mergeDefaultJournalFolders(custom, journals);
    const second = mergeDefaultJournalFolders(first, journals);
    expect(first.find((folder) => folder.name === 'Radiologia')?.journalIds).toContain('personalizada');
    expect(second).toEqual(first);
    expect(first.map((folder) => folder.name)).toEqual(['Radiologia', 'Clínica médica', 'Ortopedia']);
  });
});
