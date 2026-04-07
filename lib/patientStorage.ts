const STORAGE_KEY = 'healthfirst_saved_entries_v1';

export interface SavedEntry {
  id: string;
  title: string;
  testType: string;
  createdAt: string;
  values: Record<string, string>;
}

export function loadSavedEntries(): SavedEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveEntry(entry: SavedEntry) {
  const entries = loadSavedEntries();
  const next = [entry, ...entries.filter((item) => item.id !== entry.id)].slice(0, 12);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function deleteEntry(id: string) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(loadSavedEntries().filter((item) => item.id !== id))
  );
}
