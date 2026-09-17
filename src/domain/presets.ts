import type { Theme, Tokens, Workspace } from './theme';
export interface Preset {
  id: string;
  name: string;
  description: string;
  light: Tokens;
  dark: Tokens;
}
export const PRESETS: Preset[] = [
  {
    id: 'orchard',
    name: 'Orchard',
    description: 'Grounded. A little unexpected.',
    light: {
      background: '#EEF2EC',
      surface: '#FFFFFF',
      text: '#253B2D',
      muted: '#56675A',
      accent: '#305C45',
      accentText: '#FFFFFF',
      border: '#C9D5C9',
    },
    dark: {
      background: '#141F19',
      surface: '#213128',
      text: '#EDF4EB',
      muted: '#BACABC',
      accent: '#BAD7A5',
      accentText: '#17251B',
      border: '#536757',
    },
  },
  {
    id: 'afterhours',
    name: 'After hours',
    description: 'A softer side of electric.',
    light: {
      background: '#F1EFFA',
      surface: '#FCFAFF',
      text: '#302A48',
      muted: '#655A7C',
      accent: '#7054AB',
      accentText: '#FFFFFF',
      border: '#D4CEE4',
    },
    dark: {
      background: '#1A1724',
      surface: '#272235',
      text: '#F1ECFC',
      muted: '#C1B5D8',
      accent: '#CEBDF3',
      accentText: '#29203D',
      border: '#655878',
    },
  },
  {
    id: 'terracotta',
    name: 'Terracotta',
    description: 'Warm light. Strong character.',
    light: {
      background: '#F8EEE5',
      surface: '#FFFCF7',
      text: '#4B3027',
      muted: '#7B5D4F',
      accent: '#A6462E',
      accentText: '#FFFFFF',
      border: '#E2CCBA',
    },
    dark: {
      background: '#271B17',
      surface: '#382721',
      text: '#FFF1E4',
      muted: '#D5B9A5',
      accent: '#F3B89B',
      accentText: '#38241D',
      border: '#785B4B',
    },
  },
];
export function presetWorkspace(id = 'orchard'): Workspace {
  const preset = PRESETS.find((item) => item.id === id);
  if (!preset) throw new Error('Unknown preset.');
  const theme = (mode: 'light' | 'dark'): Theme => ({
    version: 1,
    name: preset.name,
    mode,
    tokens: { ...preset[mode] },
    fontScale: 1,
  });
  return {
    version: 1,
    presetId: id,
    activeMode: 'light',
    modes: { light: theme('light'), dark: theme('dark') },
  };
}
