import { useEffect, useState } from 'react';
import { validateName } from '../domain/theme';
export function ThemeName({
  value,
  mode,
  draftRevision,
  onDraftChange,
  onCommit,
}: {
  value: string;
  mode: string;
  draftRevision: number;
  onDraftChange: () => void;
  onCommit: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState('');
  useEffect(() => {
    setDraft(value);
    setError('');
  }, [value, mode, draftRevision]);
  function commit() {
    try {
      const name = validateName(draft);
      setError('');
      onCommit(name);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Check the theme name.');
    }
  }
  return (
    <div className="theme-name-label">
      <label htmlFor="theme-name">THEME NAME</label>
      <input
        id="theme-name"
        aria-label="Theme name"
        aria-invalid={!!error}
        aria-describedby={error ? 'theme-name-error' : 'theme-name-help'}
        value={draft}
        maxLength={64}
        onChange={(event) => {
          onDraftChange();
          setDraft(event.target.value);
          setError('');
        }}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commit();
          }
          if (event.key === 'Escape') {
            onDraftChange();
            setDraft(value);
            setError('');
          }
        }}
      />
      <span id="theme-name-help" className="sr-only">
        Use 1–48 letters, numbers, spaces or simple punctuation. Enter or leave the field to save.
        Escape restores the saved name.
      </span>
      {error && (
        <p id="theme-name-error" className="field-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
