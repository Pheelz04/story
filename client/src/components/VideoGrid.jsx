import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { useAppData } from '../state/AppData.jsx';
import VideoCard from './VideoCard.jsx';
import VideoModal from './VideoModal.jsx';

// Fetches a paged list of videos and renders a masonry grid with infinite scroll.
// `params` maps directly to GET /api/videos query params.
export default function VideoGrid({ params, empty, prepend = [], limit = 12, infinite = true, openId, onCloseOpen }) {
  const { feedVersion } = useAppData();
  const [items, setItems] = useState([]);
  const [cursor, setCursor] = useState('0');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [active, setActive] = useState(null);
  const sentinel = useRef(null);
  const key = JSON.stringify(params);

  const load = useCallback(
    async (from, replace, signal) => {
      setLoading(true);
      setError(null);
      try {
        const page = await api.videos({ ...params, cursor: from, limit }, signal);
        setItems((prev) => (replace ? page.items : [...prev, ...page.items.filter((v) => !prev.some((p) => p.id === v.id))]));
        setCursor(page.nextCursor);
      } catch (err) {
        if (err.name !== 'AbortError') setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key, limit]
  );

  useEffect(() => {
    const ctrl = new AbortController();
    load('0', true, ctrl.signal);
    return () => ctrl.abort();
  }, [load, feedVersion]);

  // Infinite scroll
  useEffect(() => {
    if (!infinite || !sentinel.current || !cursor) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loading) load(cursor, false);
    }, { rootMargin: '600px' });
    io.observe(sentinel.current);
    return () => io.disconnect();
  }, [cursor, loading, load, infinite]);

  // Deep link: /gallery?v=<id>
  useEffect(() => {
    if (!openId) return;
    const found = items.find((v) => v.id === openId);
    if (found) setActive(found);
    else api.video(openId).then(setActive).catch(() => {});
  }, [openId, items]);

  const update = (next) => {
    setItems((list) => list.map((v) => (v.id === next.id ? next : v)));
    setActive((a) => (a && a.id === next.id ? next : a));
  };
  const remove = (id) => {
    setItems((list) => list.filter((v) => v.id !== id));
    setActive(null);
  };

  const shown = [...prepend.filter((p) => !items.some((v) => v.id === p.id)), ...items];

  return (
    <>
      {error && (
        <div className="notice notice--error">
          {error} <button className="btn btn--ghost btn--sm" onClick={() => load('0', true)}>Retry</button>
        </div>
      )}

      {!loading && !error && shown.length === 0 && <div className="empty">{empty || 'Nothing here yet.'}</div>}

      <div className="masonry">
        {shown.map((v) => (
          <VideoCard key={v.id} video={v} onOpen={setActive} onChange={update} onRemove={remove} />
        ))}
        {loading && Array.from({ length: shown.length ? 3 : 8 }).map((_, i) => (
          <div key={`sk${i}`} className={`skeleton ratio-${['16x9', '9x16', '1x1'][i % 3]}`} />
        ))}
      </div>

      {infinite && cursor && <div ref={sentinel} className="sentinel" aria-hidden="true" />}
      {!infinite && cursor && (
        <div className="center">
          <button className="btn btn--ghost" onClick={() => load(cursor, false)} disabled={loading}>Load more</button>
        </div>
      )}

      {active && (
        <VideoModal
          video={active}
          onClose={() => { setActive(null); onCloseOpen?.(); }}
          onChange={update}
          onRemove={remove}
        />
      )}
    </>
  );
}
