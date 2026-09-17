export const TOKEN_KEYS = [
  'background',
  'surface',
  'text',
  'muted',
  'accent',
  'accentText',
  'border',
] as const;
export type TokenKey = (typeof TOKEN_KEYS)[number];
export type Mode = 'light' | 'dark';
export type Tokens = Record<TokenKey, string>;
export interface Theme {
  version: 1;
  name: string;
  mode: Mode;
  tokens: Tokens;
  fontScale: number;
}
export interface Workspace {
  version: 1;
  activeMode: Mode;
  presetId: string;
  modes: Record<Mode, Theme>;
}
export const MAX_IMPORT_BYTES = 32 * 1024;
export const MAX_HISTORY = 50;
export class ThemeError extends Error {}
function object(
  value: unknown,
  keys: readonly string[],
  label: string,
): asserts value is Record<string, unknown> {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value) ||
    Object.getPrototypeOf(value) !== Object.prototype
  )
    throw new ThemeError(`${label} must be an object.`);
  const found = Object.keys(value);
  if (found.length !== keys.length || found.some((key) => !keys.includes(key)))
    throw new ThemeError(`${label} contains missing or unknown properties.`);
}
export function validateHex(value: unknown): string {
  if (typeof value !== 'string' || !/^#[0-9a-f]{6}$/i.test(value))
    throw new ThemeError('Use six hex digits, for example #305C45.');
  return value.toUpperCase();
}
export function validateTheme(value: unknown): Theme {
  object(value, ['version', 'name', 'mode', 'tokens', 'fontScale'], 'Theme');
  if (value.version !== 1) throw new ThemeError('Only theme version 1 is supported.');
  if (
    typeof value.name !== 'string' ||
    !/^[\p{L}\p{N}][\p{L}\p{M}\p{N} _.'()-]{0,47}$/u.test(value.name)
  )
    throw new ThemeError('Use a name of 1–48 letters, numbers, spaces or simple punctuation.');
  if (value.mode !== 'light' && value.mode !== 'dark')
    throw new ThemeError('Mode must be light or dark.');
  if (
    typeof value.fontScale !== 'number' ||
    !Number.isFinite(value.fontScale) ||
    value.fontScale < 0.85 ||
    value.fontScale > 1.4
  )
    throw new ThemeError('Text scale must be a finite number from 0.85 to 1.40.');
  object(value.tokens, TOKEN_KEYS, 'Tokens');
  const rawTokens = value.tokens;
  const tokens = Object.fromEntries(
    TOKEN_KEYS.map((key) => [key, validateHex(rawTokens[key])]),
  ) as Tokens;
  return { version: 1, name: value.name, mode: value.mode, tokens, fontScale: value.fontScale };
}
export function parseTheme(text: string): Theme {
  if (new TextEncoder().encode(text).length > MAX_IMPORT_BYTES)
    throw new ThemeError('Theme file exceeds 32 KiB.');
  let input: unknown;
  try {
    input = JSON.parse(text);
  } catch {
    throw new ThemeError('Could not read JSON. Choose a valid Prism theme file.');
  }
  return validateTheme(input);
}
export function validateWorkspace(value: unknown, presetIds: string[]): Workspace {
  object(value, ['version', 'activeMode', 'presetId', 'modes'], 'Saved workspace');
  if (
    value.version !== 1 ||
    (value.activeMode !== 'light' && value.activeMode !== 'dark') ||
    typeof value.presetId !== 'string' ||
    !presetIds.includes(value.presetId)
  )
    throw new ThemeError('Saved workspace version, mode or preset is invalid.');
  object(value.modes, ['light', 'dark'], 'Saved modes');
  const light = validateTheme(value.modes.light);
  const dark = validateTheme(value.modes.dark);
  if (light.mode !== 'light' || dark.mode !== 'dark')
    throw new ThemeError('Saved mode labels do not match their themes.');
  return {
    version: 1,
    activeMode: value.activeMode,
    presetId: value.presetId,
    modes: { light, dark },
  };
}
export function cssProperties(theme: Theme): Record<string, string> {
  const valid = validateTheme(theme);
  return {
    ...Object.fromEntries(
      TOKEN_KEYS.map((key) => [
        `--prism-${key.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`)}`,
        valid.tokens[key],
      ]),
    ),
    '--prism-font-scale': String(valid.fontScale),
  };
}
export function exportCss(theme: Theme): string {
  const valid = validateTheme(theme);
  // Only a validated enum enters the selector. The human name is never included.
  return `[data-theme="${valid.mode}"] {\n${Object.entries(cssProperties(valid))
    .map(([key, value]) => `  ${key}: ${value};`)
    .join('\n')}\n}\n`;
}
export function exportJson(theme: Theme): string {
  return JSON.stringify(validateTheme(theme), null, 2) + '\n';
}
