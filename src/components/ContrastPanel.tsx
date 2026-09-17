import { assess, bestForeground, contrast, foregroundSuggestion } from '../domain/contrast';
import type { Theme, TokenKey } from '../domain/theme';
export function ContrastPanel({
  theme,
  onApply,
  onEdit,
}: {
  theme: Theme;
  onEdit: (key: TokenKey) => void;
  onApply: (key: TokenKey, value: string) => void;
}) {
  const pairs = assess(theme);
  const passes = pairs.filter((pair) => pair.normalAA).length;
  const suggested = bestForeground(theme.tokens.accent);
  const ratio = contrast(suggested, theme.tokens.accent);
  return (
    <section className="contrast-section" aria-labelledby="contrast-heading">
      <div className="section-heading">
        <div>
          <span className="eyebrow">BEAUTIFUL SHOULD BE READABLE</span>
          <h2 id="contrast-heading">A little science behind the palette.</h2>
        </div>
        <span className={`summary-pill ${passes < 4 ? 'needs-work' : ''}`}>
          {passes === 4 ? '✓' : '◌'} {passes} of 4 pairs meet normal AA
        </span>
      </div>
      <div className="contrast-grid">
        {pairs.map((pair) => {
          const suggestion = foregroundSuggestion(theme, pair.foreground);
          const siblings = suggestion.pairs.filter((item) => item.id !== pair.id);
          return (
            <article className="contrast-card" key={pair.id} data-testid={`contrast-${pair.id}`}>
              <div className="contrast-card-top">
                <span
                  className="pair-sample"
                  style={{
                    color: theme.tokens[pair.foreground],
                    backgroundColor: theme.tokens[pair.background],
                  }}
                  aria-hidden="true"
                >
                  Aa
                </span>
                <span className={`result-tag ${pair.normalAA ? 'pass' : 'fail'}`}>
                  {pair.normalAA ? 'AA PASS' : 'AA FAIL'}
                </span>
              </div>
              <h3>{pair.title}</h3>
              <div className="ratio">
                <strong>{pair.ratio.toFixed(2)}</strong>
                <span>: 1</span>
              </div>
              <div className="pair-description">
                <code>{pair.foreground}</code>
                <span>on</span>
                <code>{pair.background}</code>
              </div>
              <p>{pair.example}</p>
              <ul>
                <li>
                  <span>Normal AA · ≥4.5</span>
                  <strong>{pair.normalAA ? 'Pass' : 'Fail'}</strong>
                </li>
                <li>
                  <span>Large AA · ≥3.0</span>
                  <strong>{pair.largeAA ? 'Pass' : 'Fail'}</strong>
                </li>
                <li>
                  <span>Normal AAA · ≥7.0</span>
                  <strong>{pair.normalAAA ? 'Pass' : 'Fail'}</strong>
                </li>
              </ul>
              <div className="pair-actions">
                <button onClick={() => onEdit(pair.foreground)}>
                  Edit {pair.foreground} color <span aria-hidden="true">↗</span>
                </button>
                {!pair.normalAA && (
                  <div className="pair-remedy">
                    {siblings.length > 0 && (
                      <small>
                        Also changes {siblings.map((item) => item.title).join(' and ')}.
                      </small>
                    )}
                    <small>
                      {suggestion.pairs
                        .map((item) => `${item.title}: ${item.ratio.toFixed(2)}:1`)
                        .join(' · ')}
                    </small>
                    {suggestion.allPass ? (
                      <button onClick={() => onApply(pair.foreground, suggestion.color)}>
                        Use {suggestion.color}
                      </button>
                    ) : (
                      <small>
                        No black/white choice passes every shared pair. Adjust the foreground or
                        backgrounds.
                      </small>
                    )}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
      <div className="contrast-footnote">
        <p>
          <strong>Ratios, not a certification.</strong> Decisions use unrounded values. Large text
          means at least 24px regular or 18⅔px bold (700+); smaller text needs 4.5:1. These four
          checks cover opaque sRGB text pairs only.
        </p>
        <div className="suggestion">
          <span className="suggestion-dot" style={{ background: suggested }} />
          <div>
            <strong>A readable button label</strong>
            <small>
              {suggested} gives {ratio.toFixed(2)}:1 on your accent.
            </small>
          </div>
          <button onClick={() => onApply('accentText', suggested)}>
            Apply <span aria-hidden="true">↗</span>
          </button>
        </div>
      </div>
    </section>
  );
}
