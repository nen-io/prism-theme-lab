import { useRef, useState, type CSSProperties } from 'react';
import { cssProperties, type Theme } from '../domain/theme';
export function Preview({ theme }: { theme: Theme }) {
  const [tab, setTab] = useState<'overview' | 'projects'>('overview');
  const [project, setProject] = useState('');
  const [created, setCreated] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const input = useRef<HTMLInputElement>(null);
  function create() {
    if (project.trim()) {
      setCreated(project.trim());
      setFeedback(`${project.trim()} created in this preview only.`);
      setProject('');
    } else {
      setFeedback('Enter a name for your sample project.');
      input.current?.focus();
    }
  }
  return (
    <section className="preview-frame" aria-labelledby="preview-heading">
      <div className="preview-toolbar">
        <div>
          <span className="preview-live-dot" />
          <h2 id="preview-heading">The real-world test</h2>
        </div>
        <span>INTERACTIVE PREVIEW</span>
      </div>
      <div
        className="product-preview"
        style={cssProperties(theme) as CSSProperties}
        data-theme={theme.mode}
        data-testid="product-preview"
      >
        <nav className="product-nav" aria-label="Sample product navigation">
          <a href="#preview-heading" className="product-brand">
            <span aria-hidden="true">✳</span>sunday
          </a>
          <div className="product-tabs">
            <button
              className={tab === 'overview' ? 'current' : ''}
              aria-pressed={tab === 'overview'}
              onClick={() => setTab('overview')}
            >
              Overview
            </button>
            <button
              className={tab === 'projects' ? 'current' : ''}
              aria-pressed={tab === 'projects'}
              onClick={() => setTab('projects')}
            >
              Projects
            </button>
          </div>
          <span className="product-avatar" aria-label="Synthetic profile initials, AM">
            AM
          </span>
        </nav>
        <div className="product-body">
          <div className="product-greeting">
            <span className="product-eyebrow">YOUR SPACE TO CREATE</span>
            <h3 data-testid="page-heading">
              {tab === 'overview' ? (
                <>
                  A little room for
                  <br />
                  your next big idea.
                </>
              ) : (
                <>
                  Good things start
                  <br />
                  with a little space.
                </>
              )}
            </h3>
            <div className="preview-art" aria-hidden="true">
              <i />
              <i />
              <i />
            </div>
          </div>
          <article className="product-card">
            <div className="card-icon" aria-hidden="true">
              ↗
            </div>
            <div className="product-card-copy">
              <span className="product-eyebrow">
                {created ? 'YOUR NEW PROJECT' : 'MAKE IT YOURS'}
              </span>
              <h4 data-testid="card-heading">
                {created ??
                  (tab === 'projects'
                    ? 'A blank page. A fresh start.'
                    : 'A home for your good ideas.')}
              </h4>
              <p data-testid="muted-copy">
                {created
                  ? 'Your sample project lives here for this preview session.'
                  : 'Gather the things that inspire you. Give your next project a place to grow.'}
              </p>
              <button
                className="product-primary"
                data-testid="preview-primary"
                onClick={() => input.current?.focus()}
              >
                Create a space <span aria-hidden="true">↗</span>
              </button>
            </div>
            <div className="product-card-art" aria-hidden="true">
              <span>✳</span>
            </div>
          </article>
          <form
            className="product-form"
            onSubmit={(event) => {
              event.preventDefault();
              create();
            }}
          >
            <div>
              <label htmlFor="sample-project">Name your next project</label>
              <p id="sample-project-help" className="product-helper">
                Just a little spark to get started.
              </p>
            </div>
            <div className="product-input-group">
              <input
                ref={input}
                id="sample-project"
                aria-describedby="sample-project-help"
                value={project}
                onChange={(event) => setProject(event.target.value)}
                maxLength={80}
                placeholder="Something wonderful"
              />
              <button type="submit" aria-label="Add sample project">
                ↗
              </button>
            </div>
          </form>
          <p role="status" aria-label="Preview feedback" className="product-helper">
            {feedback}
          </p>
          <div className="product-bottom">
            <span>GOOD THINGS TAKE A LITTLE SPACE.</span>
            <span>Made for the way you think.</span>
          </div>
        </div>
      </div>
      <div className="preview-caption">
        <span>Actual tokens. Actual components.</span>
        <span>Preview text: {(16 * theme.fontScale).toFixed(1)}px base</span>
      </div>
    </section>
  );
}
