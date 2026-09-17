import { useEffect, useState } from 'react';
import { TOKEN_KEYS, validateHex, type Mode, type TokenKey, type Tokens } from '../domain/theme';
const labels: Record<TokenKey, string> = {
  background: 'Canvas',
  surface: 'Surface',
  text: 'Primary text',
  muted: 'Secondary text',
  accent: 'Accent',
  accentText: 'On accent',
  border: 'Border',
};
function TokenRow({
  token,
  value,
  mode,
  draftRevision,
  onDraftChange,
  onChange,
}: {
  token: TokenKey;
  value: string;
  mode: Mode;
  draftRevision: number;
  onDraftChange: () => void;
  onChange: (key: TokenKey, value: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const [error, setError] = useState('');
  useEffect(() => {
    setDraft(value);
    setError('');
  }, [value, mode, draftRevision]);
  function commit() {
    try {
      const valid = validateHex(draft);
      setDraft(valid);
      setError('');
      onChange(token, valid);
    } catch (cause) {
      setError((cause as Error).message);
    }
  }
  return (
    <div className={`token-row ${error ? 'invalid' : ''}`}>
      <label className="color-control">
        <span className="sr-only">{labels[token]} color picker</span>
        <input
          type="color"
          value={value}
          onChange={(event) => onChange(token, event.target.value)}
        />
      </label>
      <div className="token-content">
        <label htmlFor={`token-${token}`}>{labels[token]}</label>
        <div className="hex-wrap">
          <input
            id={`token-${token}`}
            value={draft}
            maxLength={16}
            onChange={(event) => {
              onDraftChange();
              setDraft(event.target.value);
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
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `error-${token}` : undefined}
            spellCheck={false}
            autoComplete="off"
          />
          <span className="token-key">{token}</span>
        </div>
      </div>
      {error ? (
        <p id={`error-${token}`} className="field-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
export function TokenEditor({
  tokens,
  mode,
  draftRevision,
  onDraftChange,
  onChange,
}: {
  tokens: Tokens;
  mode: Mode;
  draftRevision: number;
  onDraftChange: () => void;
  onChange: (key: TokenKey, value: string) => void;
}) {
  return (
    <section className="token-editor" aria-labelledby="palette-heading">
      <div className="panel-title">
        <div>
          <span className="eyebrow">THE BUILDING BLOCKS</span>
          <h2 id="palette-heading">Your palette</h2>
        </div>
        <span className="tiny-tag">7 tokens</span>
      </div>
      <div className="token-rows">
        {TOKEN_KEYS.map((token) => (
          <TokenRow
            key={token}
            token={token}
            value={tokens[token]}
            mode={mode}
            draftRevision={draftRevision}
            onDraftChange={onDraftChange}
            onChange={onChange}
          />
        ))}
      </div>
      <div className="rail-note">
        <span aria-hidden="true">↳</span>
        <p>
          Pick a color or type a hex.
          <br />
          Enter or leave the field to apply.
        </p>
      </div>
    </section>
  );
}
