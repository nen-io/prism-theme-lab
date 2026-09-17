import { useEffect, useState } from 'react';
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
  useEffect(() => setDraft(value), [value, mode, draftRevision]);
  return (
    <label className="theme-name-label">
      <span>THEME NAME</span>
      <input
        aria-label="Theme name"
        value={draft}
        maxLength={64}
        onChange={(event) => {
          onDraftChange();
          setDraft(event.target.value);
        }}
        onBlur={() => onCommit(draft)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            onCommit(draft);
          }
          if (event.key === 'Escape') {
            onDraftChange();
            setDraft(value);
          }
        }}
      />
    </label>
  );
}
