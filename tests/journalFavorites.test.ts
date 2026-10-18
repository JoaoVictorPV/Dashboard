import { beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_FOLDER_ID,
  JOURNAL_FOLDERS_KEY,
  LEGACY_FAVORITES_KEY,
  favoriteJournalIds,
  persistJournalFolders,
  readJournalFolders,
  setJournalFolderMembership,
} from '../src/lib/journalFavorites';

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
});
