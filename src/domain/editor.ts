import {
  MAX_HISTORY,
  validateTheme,
  validateWorkspace,
  type Mode,
  type Theme,
  type TokenKey,
  type Workspace,
} from './theme';
import { PRESETS, presetWorkspace } from './presets';
export interface Editor {
  current: Workspace;
  past: Workspace[];
  future: Workspace[];
  revision: number;
  draftRevision: number;
  notice: string;
  error: string;
}
export type Action =
  | { type: 'token'; key: TokenKey; value: string }
  | { type: 'name'; value: string }
  | { type: 'scale'; value: number }
  | { type: 'mode'; mode: Mode }
  | { type: 'preset'; id: string }
  | { type: 'reset' }
  | { type: 'import'; theme: Theme }
  | { type: 'workspace'; workspace: Workspace }
  | { type: 'undo' }
  | { type: 'redo' }
  | { type: 'error'; text: string };
export function initialEditor(workspace = presetWorkspace()): Editor {
  return {
    current: workspace,
    past: [],
    future: [],
    revision: 0,
    draftRevision: 0,
    notice: 'A palette with room to make it your own.',
    error: '',
  };
}
function commit(state: Editor, current: Workspace, notice: string, resetDrafts = false): Editor {
  if (JSON.stringify(state.current) === JSON.stringify(current))
    return {
      ...state,
      notice,
      error: '',
      draftRevision: state.draftRevision + Number(resetDrafts),
    };
  return {
    current,
    past: [...state.past, state.current].slice(-MAX_HISTORY),
    future: [],
    revision: state.revision + 1,
    draftRevision: state.draftRevision + Number(resetDrafts),
    notice,
    error: '',
  };
}
export function editorReducer(state: Editor, action: Action): Editor {
  try {
    const mode = state.current.activeMode;
    const theme = state.current.modes[mode];
    switch (action.type) {
      case 'error':
        return { ...state, error: action.text };
      case 'mode':
        return {
          ...state,
          current: { ...state.current, activeMode: action.mode },
          revision: state.revision + 1,
          error: '',
          notice: `${action.mode === 'light' ? 'Light' : 'Dark'} palette. Your other mode is preserved.`,
        };
      case 'preset':
        return commit(
          state,
          { ...presetWorkspace(action.id), activeMode: mode },
          'Preset loaded in both modes.',
          true,
        );
      case 'reset':
        return commit(
          state,
          { ...presetWorkspace(state.current.presetId), activeMode: mode },
          'Both modes reset to the selected preset. Undo is available.',
          true,
        );
      case 'undo': {
        const previous = state.past.at(-1);
        if (!previous) return state;
        return {
          current: previous,
          past: state.past.slice(0, -1),
          future: [state.current, ...state.future].slice(0, MAX_HISTORY),
          revision: state.revision + 1,
          draftRevision: state.draftRevision + 1,
          notice: 'Previous committed edit restored.',
          error: '',
        };
      }
      case 'redo': {
        const next = state.future[0];
        if (!next) return state;
        return {
          current: next,
          past: [...state.past, state.current].slice(-MAX_HISTORY),
          future: state.future.slice(1),
          revision: state.revision + 1,
          draftRevision: state.draftRevision + 1,
          notice: 'Edit restored.',
          error: '',
        };
      }
      case 'workspace':
        return commit(
          state,
          validateWorkspace(
            action.workspace,
            PRESETS.map((p) => p.id),
          ),
          'Workspace imported. Both modes and the selected preset are restored.',
          true,
        );
      case 'import': {
        const imported = validateTheme(action.theme);
        return commit(
          state,
          {
            ...state.current,
            activeMode: imported.mode,
            modes: { ...state.current.modes, [imported.mode]: imported },
          },
          'Theme imported into its declared mode. The other mode is preserved.',
          true,
        );
      }
      default: {
        const updated = validateTheme({
          ...theme,
          ...(action.type === 'name'
            ? { name: action.value }
            : action.type === 'scale'
              ? { fontScale: action.value }
              : { tokens: { ...theme.tokens, [action.key]: action.value } }),
        });
        return commit(
          state,
          { ...state.current, modes: { ...state.current.modes, [mode]: updated } },
          'Theme updated. Preview and contrast use the same tokens.',
        );
      }
    }
  } catch (error) {
    return {
      ...state,
      error: error instanceof Error ? error.message : 'Could not update the theme.',
    };
  }
}
