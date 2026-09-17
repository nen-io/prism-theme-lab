import { MAX_IMPORT_BYTES, validateWorkspace, type Workspace } from './theme';
import { PRESETS, presetWorkspace } from './presets';
export const STORAGE_KEY = 'prism.workspace.v1';
export interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
export function loadWorkspace(storage: StoragePort): { workspace: Workspace; warning: string } {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw === null) return { workspace: presetWorkspace(), warning: '' };
    if (new TextEncoder().encode(raw).length > MAX_IMPORT_BYTES)
      throw new Error('Saved content is too large.');
    const workspace = validateWorkspace(
      JSON.parse(raw),
      PRESETS.map((preset) => preset.id),
    );
    return { workspace, warning: '' };
  } catch {
    return {
      workspace: presetWorkspace(),
      warning: 'Saved data could not be read. A safe Orchard preset was restored.',
    };
  }
}
export function saveWorkspace(storage: StoragePort, workspace: Workspace): string {
  try {
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify(
        validateWorkspace(
          workspace,
          PRESETS.map((preset) => preset.id),
        ),
      ),
    );
    return '';
  } catch {
    return 'Local saving is unavailable. Keep editing and export JSON to save your work.';
  }
}
/** Accessing the localStorage getter itself can throw in restricted contexts. */
export function browserStorage(): StoragePort {
  return {
    getItem: (key) => window.localStorage.getItem(key),
    setItem: (key, value) => window.localStorage.setItem(key, value),
    removeItem: (key) => window.localStorage.removeItem(key),
  };
}
