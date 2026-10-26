import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import VideoGrid from '../components/VideoGrid.jsx';
import { SearchIcon, CloseIcon } from '../components/Icons.jsx';

const SORTS = [
  { id: 'trending', label: 'Trending' },
  { id: 'new', label: 'Newest' },
  { id: 'top', label: 'Most liked' }
];
const ASPECTS = [
  { id: '', label: 'All' },
  { id: '16:9', label: '16:9' },
  { id: '9:16', label: '9:16' },
  { id: '1:1', label: '1:1' }
];

export default function Gallery() {
  const [params, setParams] = useSearchParams();
  const sort = params.get('sort') || 'trending';
  const aspect = params.get('aspect') || '';
  const q = params.get('q') || '';
  const openId = params.get('v');
  const [draft, setDraft] = useState(q);

  useEffect(() => setDraft(q), [q]);

  const set = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    if (key !== 'v') next.delete('v');
    setParams(next, { replace: true });
  };

  return (
    <div className="page">
      <div className="gallery-head">
        <div>
          <p className="eyebrow">Community</p>
          <h2 className="page-title">Community Gallery</h2>
          <p className="muted">Videos people have made with LAMBA. Hover to preview, click to watch, remix any prompt.</p>
        </div>
      </div>

      <div className="toolbar">
        <div className="tabs" role="tablist" aria-label="Sort">
          {SORTS.map((s) => (
            <button key={s.id} role="tab" aria-selected={sort === s.id} className={`tab${sort === s.id ? ' is-on' : ''}`} onClick={() => set('sort', s.id === 'trending' ? '' : s.id)}>
              {s.label}
            </button>
          ))}
        </div>
        <div className="segmented segmented--sm" aria-label="Aspect ratio filter">
          {ASPECTS.map((a) => (
            <button key={a.label} type="button" className={`segmented__opt${aspect === a.id ? ' is-on' : ''}`} aria-pressed={aspect === a.id} onClick={() => set('aspect', a.id)}>
              {a.label}
            </button>
          ))}
        </div>
        <form className="search search--inline" onSubmit={(e) => { e.preventDefault(); set('q', draft.trim()); }} role="search">
          <SearchIcon width={16} height={16} />
          <input type="search" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Search prompts" aria-label="Search prompts" />
          {q && (
            <button type="button" className="icon-btn icon-btn--sm" aria-label="Clear search" onClick={() => set('q', '')}><CloseIcon width={14} height={14} /></button>
          )}
        </form>
      </div>

      <VideoGrid
        params={{ scope: 'community', sort, aspect, q }}
        openId={openId}
        onCloseOpen={() => openId && set('v', '')}
        empty={q ? `No videos match “${q}”.` : 'No community videos yet.'}
      />
    </div>
  );
}
