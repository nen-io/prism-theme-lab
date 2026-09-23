import { PRESETS } from './presets';
import {
  MAX_IMPORT_BYTES,
  ThemeError,
  validateTheme,
  validateWorkspace,
  type Theme,
  type Workspace,
} from './theme';
export type ImportDocument =
  { type: 'import'; theme: Theme } | { type: 'workspace'; workspace: Workspace };

/** Select a schema, then validate it in full; never merge untrusted properties. */
export function parseImport(text: string): ImportDocument {
  if (new TextEncoder().encode(text).length > MAX_IMPORT_BYTES)
    throw new ThemeError('Theme or workspace file exceeds 32 KiB.');
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new ThemeError('Could not read JSON. Choose a Prism theme or workspace file.');
  }
  return value !== null && typeof value === 'object' && Object.hasOwn(value, 'modes')
    ? {
        type: 'workspace',
        workspace: validateWorkspace(
          value,
          PRESETS.map((p) => p.id),
        ),
      }
    : { type: 'import', theme: validateTheme(value) };
}
export function exportWorkspace(workspace: Workspace): string {
  return (
    JSON.stringify(
      validateWorkspace(
        workspace,
        PRESETS.map((p) => p.id),
      ),
      null,
      2,
    ) + '\n'
  );
}
