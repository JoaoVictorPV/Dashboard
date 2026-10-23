import type { Journal } from '../types';

export interface JournalFolder {
  id: string;
  name: string;
  journalIds: string[];
}

export const JOURNAL_FOLDERS_KEY = 'atlas-medico-journal-folders-v2';
export const LEGACY_FAVORITES_KEY = 'atlas-medico-favorite-journals-v1';
export const DEFAULT_FOLDER_ID = 'favorites-default';
export const DEFAULT_FOLDERS_SEED_KEY = 'atlas-medico-default-journal-folders-v1';

export const DEFAULT_JOURNAL_FOLDER_SEEDS = [
  {
    id: 'interest-radiology',
    name: 'Radiologia',
    journals: [
      'Abdom Radiol (NY)', 'Acad Radiol', 'Acta Radiol (Stockh)', 'AJNR Am J Neuroradiol', 'AJR Am J Roentgenol',
      'BMC Med Imaging', 'Clin Imaging', 'Clin Neuroradiol', 'Clin Radiol', 'Diagn Interv Imaging', 'Emerg Radiol',
      'Eur J Radiol', 'Eur Radiol', 'Insights Imaging', 'Invest Radiol', 'Jpn J Radiol', 'J Am Coll Radiol',
      'J Comput Assist Tomogr', 'J Digit Imaging', 'J Magn Reson Imaging', 'Korean J Radiol',
      'Magn Reson Imaging Clin N Am', 'Neuroradiology', 'Pediatr Radiol', 'Radiographics', 'Radiol Bras',
      'Radiol Clin North Am', 'Radiology', 'Semin Musculoskelet Radiol', 'Semin Roentgenol', 'Skeletal Radiol',
      'Br J Radiol', 'Lancet Med Imaging Theranostics', 'Tomography (Ann Arbor, Mich.)', 'World J Radiol',
    ],
  },
  {
    id: 'interest-internal-medicine',
    name: 'Clínica médica',
    journals: [
      'Ann Intern Med', 'Ann Med', 'BMC Med', 'BMJ Evid Based Med', 'BMJ Med', 'Chin Med J (Engl)',
      'Cleve Clin J Med', 'Clin Med (Lond)', 'Clinics (Sao Paulo)', 'CMAJ', 'EClinicalMedicine', 'Eur J Intern Med',
      'Intern Med', 'JAMA', 'JAMA Intern Med', 'J Gen Intern Med', 'J Korean Med Sci', 'J Formos Med Assoc',
      'Lancet', 'PLoS Med', 'Rev Assoc Med Bras (1992)', 'Am J Med', 'Br J Gen Pract', 'Indian J Med Res',
      'Med Clin North Am', 'Natl Med J India', 'N Engl J Med', 'N Z Med J',
    ],
  },
  {
    id: 'interest-orthopedics',
    name: 'Ortopedia',
    journals: [
      'Acta Orthop', 'Acta Ortop Bras', 'Arch Orthop Trauma Surg', 'Arthroscopy', 'Can J Surg',
      'Clin Orthop Relat Res', 'Curr Rev Musculoskelet Med', 'EFORT Open Rev', 'Eur Spine J', 'Foot Ankle Int',
      'Injury', 'Int Orthop', 'J Orthop Trauma', 'J Shoulder Elbow Surg', 'J Am Acad Orthop Surg Glob Res Rev',
      'Knee Surg Sports Traumatol Arthrosc', 'Orthop J Sports Med', 'Orthop Surg', 'Rev Bras Ortop (Sao Paulo)',
      'Spine (Phila Pa 1976)', 'Am J Sports Med', 'Bone Joint J', 'J Arthroplasty', 'J Bone Joint Surg Am',
      'J Hand Surg Am', 'Spine J',
    ],
  },
] as const;

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

function normalizeJournalValue(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/gi, ' ').trim().toLowerCase();
}

export function resolveDefaultJournalFolders(journals: Journal[]) {
  const journalIdsByValue = new Map<string, string>();
  journals.forEach((journal) => {
    [journal.name, journal.abbreviation, ...(journal.aliases ?? [])].forEach((value) => {
      const normalized = normalizeJournalValue(value);
      if (!journalIdsByValue.has(normalized)) journalIdsByValue.set(normalized, journal.id);
    });
  });
  return DEFAULT_JOURNAL_FOLDER_SEEDS.map((seed) => ({
    id: seed.id,
    name: seed.name,
    journalIds: seed.journals.flatMap((query) => journalIdsByValue.get(normalizeJournalValue(query)) ?? []),
  }));
}

export function mergeDefaultJournalFolders(folders: JournalFolder[], journals: Journal[]) {
  const seeded = resolveDefaultJournalFolders(journals);
  const next = folders.map((folder) => ({ ...folder, journalIds: [...folder.journalIds] }));
  seeded.forEach((seed) => {
    const existing = next.find((folder) => normalizeJournalValue(folder.name) === normalizeJournalValue(seed.name));
    if (existing) existing.journalIds = [...new Set([...existing.journalIds, ...seed.journalIds])];
    else next.push(seed);
  });
  return next;
}

export function seedDefaultJournalFolders(folders: JournalFolder[], journals: Journal[]) {
  if (!journals.length || localStorage.getItem(DEFAULT_FOLDERS_SEED_KEY)) return folders;
  const next = mergeDefaultJournalFolders(folders, journals);
  persistJournalFolders(next);
  localStorage.setItem(DEFAULT_FOLDERS_SEED_KEY, '1');
  return next;
}
