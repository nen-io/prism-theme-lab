import { validateHex, type Theme, type TokenKey } from './theme';
/** WCAG 2.2 sRGB transfer function; input is one normalized channel [0,1]. */
export function linearize(channel: number): number {
  if (!Number.isFinite(channel) || channel < 0 || channel > 1)
    throw new Error('Channel must be between 0 and 1.');
  return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
}
export function luminance(hex: string): number {
  const valid = validateHex(hex);
  const [r, g, b] = [1, 3, 5].map((index) =>
    linearize(parseInt(valid.slice(index, index + 2), 16) / 255),
  );
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(foreground: string, background: string): number {
  const a = luminance(foreground);
  const b = luminance(background);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
export function passes(ratio: number, requirement: 3 | 4.5 | 7): boolean {
  return Number.isFinite(ratio) && ratio >= requirement;
}
export function bestForeground(background: string): '#000000' | '#FFFFFF' {
  return contrast('#000000', background) >= contrast('#FFFFFF', background) ? '#000000' : '#FFFFFF';
}
export const PAIRS: {
  id: string;
  title: string;
  foreground: TokenKey;
  background: TokenKey;
  example: string;
}[] = [
  {
    id: 'page',
    title: 'Page text',
    foreground: 'text',
    background: 'background',
    example: 'Navigation and page heading',
  },
  {
    id: 'card',
    title: 'Card text',
    foreground: 'text',
    background: 'surface',
    example: 'Card heading and form input',
  },
  {
    id: 'muted',
    title: 'Secondary text',
    foreground: 'muted',
    background: 'surface',
    example: 'Card description and field hint',
  },
  {
    id: 'button',
    title: 'Button label',
    foreground: 'accentText',
    background: 'accent',
    example: 'Primary action label',
  },
];
export function assess(theme: Theme) {
  return PAIRS.map((pair) => {
    const ratio = contrast(theme.tokens[pair.foreground], theme.tokens[pair.background]);
    return {
      ...pair,
      ratio,
      normalAA: passes(ratio, 4.5),
      largeAA: passes(ratio, 3),
      normalAAA: passes(ratio, 7),
    };
  });
}

/** Maximize the weakest measured pair sharing this foreground token.
 * Only black and white are considered; this is not an automatic palette solver.
 */
export function foregroundSuggestion(theme: Theme, token: TokenKey) {
  const related = PAIRS.filter((pair) => pair.foreground === token);
  if (!related.length) throw new Error('No measured text pair uses this token.');
  const score = (color: string) =>
    Math.min(...related.map((pair) => contrast(color, theme.tokens[pair.background])));
  const color = score('#000000') >= score('#FFFFFF') ? '#000000' : '#FFFFFF';
  return {
    color,
    pairs: related.map((pair) => ({
      ...pair,
      ratio: contrast(color, theme.tokens[pair.background]),
    })),
    allPass: score(color) >= 4.5,
  };
}
