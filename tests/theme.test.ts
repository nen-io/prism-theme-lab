import { describe, expect, it } from 'vitest';
import {
  assess,
  bestForeground,
  foregroundSuggestion,
  contrast,
  linearize,
  luminance,
  passes,
} from '../src/domain/contrast';
import { editorReducer, initialEditor } from '../src/domain/editor';
import { PRESETS, presetWorkspace } from '../src/domain/presets';
import { loadWorkspace, saveWorkspace, type StoragePort } from '../src/domain/storage';
import {
  cssProperties,
  exportCss,
  exportJson,
  MAX_HISTORY,
  parseTheme,
  validateHex,
  validateTheme,
  validateWorkspace,
} from '../src/domain/theme';
const theme = () => presetWorkspace().modes.light;
function memoryStorage(raw: string | null = null): StoragePort {
  let data = raw;
  return {
    getItem: () => data,
    setItem: (_, value) => {
      data = value;
    },
    removeItem: () => {
      data = null;
    },
  };
}
describe('WCAG contrast math', () => {
  it('matches black/white, identity, known gray, symmetry and channel boundary', () => {
    expect(contrast('#000000', '#FFFFFF')).toBe(21);
    expect(contrast('#AbCdEf', '#abcdef')).toBe(1);
    expect(contrast('#777777', '#FFFFFF')).toBeCloseTo(4.478089453577214, 12);
    expect(luminance('#FF0000')).toBeCloseTo(0.2126, 12);
    expect(contrast('#305C45', '#EEF2EC')).toBe(contrast('#EEF2EC', '#305C45'));
    expect(linearize(0.04045)).toBe(0.04045 / 12.92);
    expect(linearize(0.0404501)).toBe(((0.0404501 + 0.055) / 1.055) ** 2.4);
    for (const invalid of [-1, 2, NaN, Infinity]) expect(() => linearize(invalid)).toThrow();
  });
  it('compares raw ratios without rounding a near pass up', () => {
    expect((4.4999).toFixed(2)).toBe('4.50');
    expect(passes(4.4999, 4.5)).toBe(false);
    expect(passes(4.5, 4.5)).toBe(true);
    expect(passes(2.9999, 3)).toBe(false);
    expect(passes(6.9999, 7)).toBe(false);
    expect(passes(NaN, 4.5)).toBe(false);
    expect(bestForeground('#FFFFFF')).toBe('#000000');
    expect(bestForeground('#000000')).toBe('#FFFFFF');
  });
  it('assesses actual token pairs and all preset modes pass normal AA', () => {
    for (const preset of PRESETS)
      for (const mode of ['light', 'dark'] as const) {
        const current = presetWorkspace(preset.id).modes[mode];
        const pairs = assess(current);
        expect(pairs.map((pair) => [pair.foreground, pair.background])).toEqual([
          ['text', 'background'],
          ['text', 'surface'],
          ['muted', 'surface'],
          ['accentText', 'accent'],
        ]);
        expect(pairs.every((pair) => pair.normalAA)).toBe(true);
        for (const pair of pairs)
          expect(pair.ratio).toBe(
            contrast(current.tokens[pair.foreground], current.tokens[pair.background]),
          );
      }
  });
});
describe('strict theme boundary and export', () => {
  it('roundtrips exact schema, normalizes hex and shares exported preview properties', () => {
    const current = theme();
    current.tokens.accent = '#aabbcc';
    const parsed = parseTheme(exportJson(current));
    expect(parsed.tokens.accent).toBe('#AABBCC');
    expect(parsed).toEqual(validateTheme(current));
    const css = exportCss(parsed);
    expect(css).toContain('[data-theme="light"]');
    for (const [key, value] of Object.entries(cssProperties(parsed)))
      expect(css).toContain(`${key}: ${value};`);
    expect(cssProperties(parsed)['--prism-accent-text']).toBe(current.tokens.accentText);
    expect(cssProperties(parsed)['--prism-font-scale']).toBe('1');
  });
  it('rejects malformed colors, scales, names, schemas, versions and oversized imports', () => {
    for (const color of ['#fff', '#aabbccdd', '#fffffg', 'red', ' #ffffff', '#123456; color:red'])
      expect(() => validateHex(color)).toThrow();
    for (const scale of [NaN, Infinity, 0.84, 1.41, '1', null])
      expect(() => validateTheme({ ...theme(), fontScale: scale })).toThrow();
    for (const name of [
      '',
      'x'.repeat(49),
      '<img src=x onerror=alert(1)>',
      'evil"}body{color:red}',
      'theme\nname',
      '\u202Etheme',
    ])
      expect(() => validateTheme({ ...theme(), name })).toThrow();
    for (const input of [
      { ...theme(), dangerous: true },
      { ...theme(), version: 2 },
      { ...theme(), mode: 'light"] body {' },
      { ...theme(), tokens: { ...theme().tokens, url: 'https://bad.invalid' } },
      { ...theme(), tokens: [] },
    ])
      expect(() => validateTheme(input)).toThrow();
    expect(() => parseTheme('{bad')).toThrow('JSON');
    expect(() => parseTheme(' '.repeat(32769))).toThrow('32 KiB');
    expect(() =>
      parseTheme(
        JSON.stringify({ ...theme(), __proto__: {} }).replace(
          '"version":1',
          '"version":1,"__proto__":{}',
        ),
      ),
    ).toThrow('unknown');
  });
  it('never places a display name into generated CSS', () => {
    const current = { ...theme(), name: "Alex's Orchard (2)" };
    expect(exportCss(current)).not.toContain(current.name);
    expect(() => exportCss({ ...current, name: 'x; } @import url(x);' })).toThrow();
  });
});
describe('editor transitions', () => {
  it('preserves independent modes, supports undo/redo, and replaces both modes on preset/reset', () => {
    let state = initialEditor();
    state = editorReducer(state, { type: 'token', key: 'accent', value: '#112233' });
    state = editorReducer(state, { type: 'mode', mode: 'dark' });
    expect(state.current.modes.dark.tokens.accent).toBe(PRESETS[0].dark.accent);
    state = editorReducer(state, { type: 'token', key: 'accent', value: '#ABCDEF' });
    state = editorReducer(state, { type: 'undo' });
    expect(state.current.modes.dark.tokens.accent).toBe(PRESETS[0].dark.accent);
    state = editorReducer(state, { type: 'redo' });
    expect(state.current.modes.dark.tokens.accent).toBe('#ABCDEF');
    state = editorReducer(state, { type: 'mode', mode: 'light' });
    expect(state.current.modes.light.tokens.accent).toBe('#112233');
    state = editorReducer(state, { type: 'preset', id: 'terracotta' });
    expect(state.current.modes.light.tokens).toEqual(PRESETS[2].light);
    expect(state.current.modes.dark.tokens).toEqual(PRESETS[2].dark);
    state = editorReducer(state, { type: 'name', value: 'Custom palette' });
    state = editorReducer(state, { type: 'reset' });
    expect(state.current.modes.light.name).toBe('Terracotta');
    state = editorReducer(state, { type: 'undo' });
    expect(state.current.modes.light.name).toBe('Custom palette');
  });
  it('keeps invalid drafts from corrupting state and clears redo after a new edit', () => {
    const original = initialEditor();
    const invalid = editorReducer(original, { type: 'token', key: 'text', value: '#partial' });
    expect(invalid.current).toBe(original.current);
    expect(invalid.past).toHaveLength(0);
    expect(invalid.error).toContain('six hex');
    let state = editorReducer(original, { type: 'name', value: 'One' });
    state = editorReducer(state, { type: 'undo' });
    state = editorReducer(state, { type: 'name', value: 'Two' });
    expect(state.future).toHaveLength(0);
  });
  it('bounds history and imports one mode while preserving the other', () => {
    let state = initialEditor();
    for (let i = 0; i < MAX_HISTORY + 10; i++)
      state = editorReducer(state, { type: 'name', value: `Theme ${i}` });
    expect(state.past).toHaveLength(MAX_HISTORY);
    const light = state.current.modes.light;
    state = editorReducer(state, {
      type: 'import',
      theme: presetWorkspace('afterhours').modes.dark,
    });
    expect(state.current.activeMode).toBe('dark');
    expect(state.current.modes.light).toEqual(light);
    expect(state.current.modes.dark.name).toBe('After hours');
  });
});
describe('local persistence', () => {
  it('roundtrips mode edits with version validation', () => {
    const storage = memoryStorage();
    const workspace = presetWorkspace('terracotta');
    workspace.modes.dark.tokens.text = '#DDEEFF';
    workspace.activeMode = 'dark';
    expect(saveWorkspace(storage, workspace)).toBe('');
    expect(loadWorkspace(storage).workspace).toEqual(workspace);
    expect(() =>
      validateWorkspace(
        { ...workspace, version: 2 },
        PRESETS.map((p) => p.id),
      ),
    ).toThrow();
    expect(() =>
      validateWorkspace(
        { ...workspace, modes: { ...workspace.modes, dark: workspace.modes.light } },
        PRESETS.map((p) => p.id),
      ),
    ).toThrow();
  });
  it('recovers from corrupt/oversized storage and handles blocked getters and writes', () => {
    for (const raw of [
      '{bad',
      'x'.repeat(32769),
      JSON.stringify({ version: 99 }),
      JSON.stringify({ ...presetWorkspace(), dangerous: true }),
    ]) {
      const result = loadWorkspace(memoryStorage(raw));
      expect(result.workspace).toEqual(presetWorkspace());
      expect(result.warning).toContain('restored');
    }
    const blocked: StoragePort = {
      getItem: () => {
        throw new Error('blocked');
      },
      setItem: () => {
        throw new Error('quota');
      },
      removeItem: () => {
        throw new Error('blocked');
      },
    };
    expect(loadWorkspace(blocked).warning).toContain('restored');
    expect(saveWorkspace(blocked, presetWorkspace())).toContain('unavailable');
    expect(loadWorkspace(memoryStorage()).warning).toBe('');
  });
});

it('suggestions account for every surface sharing a token without promising an impossible repair', () => {
  const current = theme();
  current.tokens.text = '#FFFFFF';
  const suggestion = foregroundSuggestion(current, 'text');
  expect(suggestion.color).toBe('#000000');
  expect(suggestion.allPass).toBe(true);
  expect(suggestion.pairs.map((pair) => pair.id)).toEqual(['page', 'card']);
  current.tokens.background = '#000000';
  current.tokens.surface = '#FFFFFF';
  const impossible = foregroundSuggestion(current, 'text');
  expect(impossible.allPass).toBe(false);
  expect(Math.min(...impossible.pairs.map((pair) => pair.ratio))).toBe(1);
  expect(() => foregroundSuggestion(current, 'border')).toThrow();
  expect(current.tokens.text).toBe('#FFFFFF');
});
