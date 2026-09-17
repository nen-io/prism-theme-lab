import { useEffect, useReducer, useRef, useState } from 'react';
import { editorReducer, initialEditor, type Action } from './domain/editor';
import { PRESETS } from './domain/presets';
import { browserStorage, loadWorkspace, saveWorkspace } from './domain/storage';
import { exportCss, exportJson, MAX_IMPORT_BYTES, parseTheme } from './domain/theme';
import { TokenEditor } from './components/TokenEditor';
import { Preview } from './components/Preview';
import { ContrastPanel } from './components/ContrastPanel';
import { ThemeName } from './components/ThemeName';
function restore() {
  return loadWorkspace(browserStorage());
}
export default function App() {
  const [restored] = useState(restore);
  const [editor, dispatch] = useReducer(editorReducer, restored.workspace, initialEditor);
  const [storageWarning, setStorageWarning] = useState(restored.warning);
  const [saveStatus, setSaveStatus] = useState('Saved on this device');
  const [importing, setImporting] = useState(false);
  const [exportNotice, setExportNotice] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const importGeneration = useRef(0);
  const theme = editor.current.modes[editor.current.activeMode];
  useEffect(
    () => () => {
      importGeneration.current += 1;
    },
    [],
  );
  useEffect(() => {
    const warning = saveWorkspace(browserStorage(), editor.current);
    setSaveStatus(warning ? 'Local save unavailable' : 'Saved on this device');
    if (warning) setStorageWarning(warning);
  }, [editor.current]);
  // A visible draft is newer intent even before blur/Enter commits it.
  function invalidateImport() {
    importGeneration.current += 1;
    setImporting(false);
    setExportNotice('');
  }
  function apply(action: Action) {
    invalidateImport();
    dispatch(action);
  }
  async function importFile(file?: File) {
    if (!file) return;
    const generation = ++importGeneration.current;
    setImporting(true);
    setExportNotice('');
    try {
      if (file.size > MAX_IMPORT_BYTES) throw new Error('Theme file exceeds 32 KiB.');
      const text = await file.text();
      if (generation !== importGeneration.current) return;
      dispatch({ type: 'import', theme: parseTheme(text) });
    } catch (error) {
      if (generation === importGeneration.current)
        dispatch({
          type: 'error',
          text: error instanceof Error ? error.message : 'Could not read this file.',
        });
    } finally {
      if (generation === importGeneration.current) setImporting(false);
    }
  }
  function download(kind: 'css' | 'json' | 'both') {
    try {
      const data =
        kind === 'both'
          ? exportCss(editor.current.modes.light) + '\n' + exportCss(editor.current.modes.dark)
          : kind === 'css'
            ? exportCss(theme)
            : exportJson(theme);
      const blob = new Blob([data], { type: kind === 'json' ? 'application/json' : 'text/css' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = kind === 'both' ? 'prism-both.css' : `prism-${theme.mode}.${kind}`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setExportNotice(
        kind === 'both'
          ? 'CSS exported for both committed modes.'
          : `${kind.toUpperCase()} exported for the committed ${theme.mode} theme.`,
      );
    } catch (error) {
      dispatch({ type: 'error', text: (error as Error).message });
    }
  }
  return (
    <div className="studio">
      <a className="skip-link" href="#workbench">
        Skip to workbench
      </a>
      <header className="site-header">
        <a href="#workbench" className="brand" aria-label="Prism theme studio">
          <span className="brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>
            prism<span className="brand-period">.</span>
          </span>
          <span className="brand-descriptor">A THEME WORKBENCH</span>
        </a>
        <div className="header-right">
          <span className="save-state">
            <span />
            {saveStatus}
          </span>
          <button onClick={() => fileInput.current?.click()} disabled={importing}>
            {importing ? 'Reading…' : 'Import JSON'} <span aria-hidden="true">↙</span>
          </button>
          <button className="dark-button" onClick={() => download('css')}>
            Export CSS <span aria-hidden="true">↗</span>
          </button>
          <input
            className="sr-only"
            ref={fileInput}
            type="file"
            accept=".json,application/json"
            aria-label="Import theme JSON file"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              void importFile(file);
            }}
          />
        </div>
      </header>
      <main id="workbench">
        <section className="hero">
          <div>
            <span className="eyebrow">MAKE SOMETHING FEEL LIKE YOU</span>
            <h1>
              Good taste.
              <br />
              <span>Measurable contrast.</span>
            </h1>
            <p>
              Find your colors. See them in context.
              <br />
              Build a theme that looks good and reads well.
            </p>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="art-circle" />
            <div className="art-arch" />
            <div className="art-square" />
            <div className="art-caption">
              A LITTLE COLOR.
              <br />A LOT OF POSSIBILITY.
            </div>
          </div>
        </section>
        {storageWarning ? (
          <div className="storage-warning" role="alert">
            <span>{storageWarning}</span>
            <button
              onClick={() => {
                setStorageWarning('');
                apply({ type: 'reset' });
              }}
            >
              Reset to preset
            </button>
            <button aria-label="Dismiss storage warning" onClick={() => setStorageWarning('')}>
              ×
            </button>
          </div>
        ) : null}
        <section className="presets" aria-label="Theme presets">
          <div className="preset-intro">
            <span className="eyebrow">START SOMEWHERE GOOD</span>
            <p>
              Three moods.
              <br />
              Endless possibilities.
            </p>
          </div>
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              className={`preset-card ${editor.current.presetId === preset.id ? 'active' : ''}`}
              aria-pressed={editor.current.presetId === preset.id}
              onClick={() => apply({ type: 'preset', id: preset.id })}
            >
              <div
                className="preset-art"
                style={{ backgroundColor: preset.light.background }}
                aria-hidden="true"
              >
                <i style={{ backgroundColor: preset.light.accent }} />
                <i style={{ backgroundColor: preset.dark.accent }} />
                <i style={{ backgroundColor: preset.light.text }} />
              </div>
              <span className="preset-copy">
                <strong>{preset.name}</strong>
                <small>{preset.description}</small>
              </span>
              <span className="preset-check" aria-hidden="true">
                {editor.current.presetId === preset.id ? '✓' : '↗'}
              </span>
            </button>
          ))}
        </section>
        <section className="workspace">
          <div className="workspace-toolbar">
            <ThemeName
              onDraftChange={invalidateImport}
              draftRevision={editor.draftRevision}
              value={theme.name}
              mode={theme.mode}
              onCommit={(value) => apply({ type: 'name', value })}
            />
            <div className="toolbar-controls">
              <div className="mode-toggle" aria-label="Theme mode">
                <button
                  aria-pressed={theme.mode === 'light'}
                  onClick={() => apply({ type: 'mode', mode: 'light' })}
                >
                  <span aria-hidden="true">☼</span> Light
                </button>
                <button
                  aria-pressed={theme.mode === 'dark'}
                  onClick={() => apply({ type: 'mode', mode: 'dark' })}
                >
                  <span aria-hidden="true">◔</span> Dark
                </button>
              </div>
              <div className="history-buttons">
                <button
                  disabled={!editor.past.length}
                  aria-label="Undo committed edit"
                  onClick={() => apply({ type: 'undo' })}
                >
                  ↶
                </button>
                <button
                  disabled={!editor.future.length}
                  aria-label="Redo committed edit"
                  onClick={() => apply({ type: 'redo' })}
                >
                  ↷
                </button>
              </div>
              <button className="reset-button" onClick={() => apply({ type: 'reset' })}>
                Reset preset
              </button>
            </div>
          </div>
          <div className="workspace-body">
            <TokenEditor
              onDraftChange={invalidateImport}
              draftRevision={editor.draftRevision}
              tokens={theme.tokens}
              mode={theme.mode}
              onChange={(key, value) => apply({ type: 'token', key, value })}
            />
            <div className="preview-column">
              <Preview theme={theme} />
              <div className="type-scale">
                <div>
                  <span className="type-glyph" aria-hidden="true">
                    Aa
                  </span>
                  <label htmlFor="font-scale">
                    <strong>A little breathing room</strong>
                    <small>Scale the preview typography.</small>
                  </label>
                </div>
                <div className="scale-control">
                  <span>85%</span>
                  <input
                    type="range"
                    id="font-scale"
                    min="0.85"
                    max="1.4"
                    step="0.01"
                    value={theme.fontScale}
                    onChange={(event) =>
                      apply({ type: 'scale', value: Number(event.target.value) })
                    }
                  />
                  <output htmlFor="font-scale">{Math.round(theme.fontScale * 100)}%</output>
                </div>
              </div>
            </div>
          </div>
        </section>
        <div
          className={`editor-notice ${editor.error ? 'notice-error' : ''}`}
          role={editor.error ? 'alert' : 'status'}
        >
          {editor.error || exportNotice || editor.notice}
        </div>
        <ContrastPanel
          theme={theme}
          onEdit={(key) => {
            const field = document.getElementById(`token-${key}`);
            field?.focus({ preventScroll: true });
            field?.scrollIntoView({
              block: 'center',
              behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
                ? 'instant'
                : 'smooth',
            });
          }}
          onApply={(key, value) => apply({ type: 'token', key, value })}
        />
        <section className="export-section">
          <div>
            <span className="eyebrow">FROM PLAYGROUND TO PRODUCT</span>
            <h2>Take your good work with you.</h2>
            <p>
              Validated CSS variables and a portable JSON theme.
              <br />
              No account. No uploads. Just your colors.
            </p>
          </div>
          <pre tabIndex={0} role="region" aria-label="CSS export preview">
            <code>{exportCss(theme)}</code>
          </pre>
          <div className="export-actions">
            <button className="dark-button" onClick={() => download('css')}>
              Download CSS <span aria-hidden="true">↗</span>
            </button>
            <button onClick={() => download('json')}>
              Export JSON <span aria-hidden="true">↗</span>
            </button>
            <button onClick={() => download('both')}>Download both modes</button>
            <small>
              CSS and JSON export the active mode. Both modes combines your light and dark CSS in
              one file.
            </small>
          </div>
        </section>
        <footer className="site-footer">
          <span>PRISM · AN INDEPENDENT DESIGN EXPERIMENT</span>
          <span>Solid sRGB colors. Transparent decisions.</span>
        </footer>
      </main>
    </div>
  );
}
