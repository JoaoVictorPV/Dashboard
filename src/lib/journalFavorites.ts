export interface JournalFolder {
  id: string;
  name: string;
  journalIds: string[];
}

export const JOURNAL_FOLDERS_KEY = 'atlas-medico-journal-folders-v2';
export const LEGACY_FAVORITES_KEY = 'atlas-medico-favorite-journals-v1';
export const DEFAULT_FOLDER_ID = 'favorites-default';

const defaultFolder = (journalIds: string[] = []): JournalFolder => ({
  id: DEFAULT_FOLDER_ID,
  name: 'Favoritas',
  journalIds: [...new Set(journalIds)],
});

function validFolders(value: unknown): JournalFolder[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((folder) => {
    if (!folder || typeof folder !== 'object') return [];
    const candidate = folder as Partial<JournalFolder>;
    if (typeof candidate.id !== 'string' || typeof candidate.name !== 'string' || !Array.isArray(candidate.journalIds)) return [];
    const name = candidate.name.trim();
    if (!name) return [];
    return [{ id: candidate.id, name, journalIds: [...new Set(candidate.journalIds.filter((id): id is string => typeof id === 'string'))] }];
  });
}

export function readJournalFolders(): JournalFolder[] {
  try {
    const stored = validFolders(JSON.parse(localStorage.getItem(JOURNAL_FOLDERS_KEY) || 'null'));
    if (stored.length) return stored.some((folder) => folder.id === DEFAULT_FOLDER_ID) ? stored : [defaultFolder(), ...stored];
    const legacy = JSON.parse(localStorage.getItem(LEGACY_FAVORITES_KEY) || '[]');
    return [defaultFolder(Array.isArray(legacy) ? legacy.filter((id): id is string => typeof id === 'string') : [])];
  } catch {
    return [defaultFolder()];
  }
}

export function favoriteJournalIds(folders: JournalFolder[]) {
  return [...new Set(folders.flatMap((folder) => folder.journalIds))];
}

export function persistJournalFolders(folders: JournalFolder[]) {
  const safeFolders = validFolders(folders);
  const next = safeFolders.length ? safeFolders : [defaultFolder()];
  localStorage.setItem(JOURNAL_FOLDERS_KEY, JSON.stringify(next));
  localStorage.setItem(LEGACY_FAVORITES_KEY, JSON.stringify(favoriteJournalIds(next)));
}

export function setJournalFolderMembership(folders: JournalFolder[], folderId: string, journalId: string, included: boolean) {
  return folders.map((folder) => folder.id !== folderId ? folder : {
    ...folder,
    journalIds: included
      ? [...new Set([...folder.journalIds, journalId])]
      : folder.journalIds.filter((id) => id !== journalId),
  });
}
