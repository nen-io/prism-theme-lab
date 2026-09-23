import { expect, it } from 'vitest';
import { parseImport, exportWorkspace } from '../src/domain/transfer';
import { editorReducer, initialEditor } from '../src/domain/editor';
import { presetWorkspace } from '../src/domain/presets';
import { exportJson, MAX_IMPORT_BYTES } from '../src/domain/theme';
it('roundtrips independent modes, selected mode and preset as one undoable replacement', () => {
  const workspace = presetWorkspace('terracotta');
  workspace.activeMode = 'dark';
  workspace.modes.light.tokens.accent = '#112233';
  workspace.modes.dark.fontScale = 1.12;
  const imported = parseImport(exportWorkspace(workspace));
  expect(imported).toEqual({ type: 'workspace', workspace });
  const original = initialEditor();
  const changed = editorReducer(original, imported);
  expect(changed.current).toEqual(workspace);
  expect(changed.past).toHaveLength(1);
  const undone = editorReducer(changed, { type: 'undo' });
  expect(undone.current).toEqual(original.current);
  expect(editorReducer(undone, { type: 'redo' }).current).toEqual(workspace);
});
it('accepts legacy theme-only files and rejects unknown or mismatched workspace data atomically', () => {
  const theme = presetWorkspace().modes.dark;
  expect(parseImport(exportJson(theme))).toEqual({ type: 'import', theme });
  const workspace = presetWorkspace();
  for (const bad of [
    null,
    [],
    { ...workspace, version: 2 },
    { ...workspace, presetId: '__proto__' },
    { ...workspace, mode: 'light' },
    { ...workspace, modes: { light: workspace.modes.light, dark: workspace.modes.light } },
    JSON.parse('{"__proto__":{}}'),
  ])
    expect(() => parseImport(JSON.stringify(bad))).toThrow();
  const state = initialEditor();
  const result = editorReducer(state, {
    type: 'workspace',
    workspace: { ...workspace, presetId: 'unknown' },
  });
  expect(result.current).toBe(state.current);
  expect(result.past).toHaveLength(0);
  expect(result.error).toBeTruthy();
  expect(() => parseImport(' '.repeat(MAX_IMPORT_BYTES + 1))).toThrow('32 KiB');
  expect(() => parseImport('é'.repeat(MAX_IMPORT_BYTES / 2 + 1))).toThrow('32 KiB');
  expect(() => parseImport('{bad')).toThrow('JSON');
});
