import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, mediaUrl, compact, timeAgo } from '../api.js';
import { useAppData } from '../state/AppData.jsx';
import { useToast } from './Toast.jsx';
import Avatar from './Avatar.jsx';
import ShareMenu from './ShareMenu.jsx';
import { HeartIcon, EyeIcon, RemixIcon, PlayIcon, GlobeIcon, LockIcon, DownloadIcon, TrashIcon } from './Icons.jsx';

const canHover = typeof window !== 'undefined' && window.matchMedia?.('(hover: hover)').matches;

export default function VideoCard({ video, onOpen, onChange, onRemove }) {
  const { config } = useAppData();
  const toast = useToast();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  const modelName = config?.models.find((m) => m.id === video.model)?.name || video.model;
  const styleName = config?.styles.find((s) => s.id === video.style)?.name || video.style;

  // ---- hover-to-play ----
  const play = () => {
    const el = videoRef.current;
    if (!el) return;
    el.muted = true;
    const p = el.play();
    p?.then(() => setPlaying(true)).catch(() => {});
  };
  const stop = () => {
    const el = videoRef.current;
    if (!el) return;
    el.pause();
    el.currentTime = 0;
    setPlaying(false);
  };

  // ---- actions ----
  async function toggleLike(e) {
    e.stopPropagation();
    const optimistic = { ...video, likedByMe: !video.likedByMe, likes: video.likes + (video.likedByMe ? -1 : 1) };
    onChange?.(optimistic);
    try {
      const r = await api.like(video.id);
      onChange?.({ ...optimistic, ...r });
    } catch (err) {
      onChange?.(video);
      toast(err.message, 'error');
    }
  }

  async function remix(e) {
    e.stopPropagation();
    try {
      const { preset } = await api.remix(video.id);
      navigate('/studio', { state: { preset } });
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function togglePublish(e) {
    e.stopPropagation();
    try {
      const updated = await api.publish(video.id, !video.published);
      onChange?.(updated);
      toast(updated.published ? 'Published to Community Gallery' : 'Made private');
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  async function remove(e) {
    e.stopPropagation();
    if (!window.confirm('Delete this video? This cannot be undone.')) return;
    try {
      await api.remove(video.id);
      onRemove?.(video.id);
      toast('Video deleted');
    } catch (err) {
      toast(err.message, 'error');
    }
  }

  return (
    <article
      className={`vcard ratio-${video.aspectRatio.replace(':', 'x')}${playing ? ' is-playing' : ''}`}
      onMouseEnter={canHover ? play : undefined}
      onMouseLeave={canHover ? stop : undefined}
    >
      <button
        type="button"
        className="vcard__media"
        onClick={() => onOpen?.(video)}
        onFocus={canHover ? play : undefined}
        onBlur={canHover ? stop : undefined}
        aria-label={`Open video: ${video.prompt}`}
      >
        <video
          ref={videoRef}
          src={mediaUrl(video.videoUrl)}
          poster={mediaUrl(video.posterUrl)}
          muted
          loop
          playsInline
          preload="none"
          tabIndex={-1}
        />
        <span className="vcard__badge">{video.duration}s · {video.aspectRatio}</span>
        {!playing && (
          <span className="vcard__playhint" aria-hidden="true"><PlayIcon width={16} height={16} /></span>
        )}
      </button>

      <div className="vcard__overlay">
        <div className="vcard__top">
          {video.isMine && (
            <span className={`pill ${video.published ? 'pill--public' : 'pill--private'}`}>
              {video.published ? <GlobeIcon width={13} height={13} /> : <LockIcon width={13} height={13} />}
              {video.published ? 'Public' : 'Private'}
            </span>
          )}
        </div>
      </div>

      <div className="vcard__info">
        <p className="vcard__prompt" title={video.prompt}>{video.prompt}</p>
        <div className="vcard__chips">
          <span className="chip chip--model">{modelName}</span>
          {video.style !== 'none' && <span className="chip">{styleName}</span>}
        </div>
        <div className="vcard__row">
          <span className="vcard__author">
            <Avatar user={video.author} size={22} />
            <span className="vcard__name">{video.author?.name}</span>
            <span className="vcard__time">· {timeAgo(video.createdAt)}</span>
          </span>
          <span className="vcard__views" title={`${video.views} views`}>
            <EyeIcon width={14} height={14} /> {compact(video.views)}
          </span>
        </div>
        <div className="vcard__actions">
          <button
            type="button"
            className={`icon-btn icon-btn--count${video.likedByMe ? ' is-liked' : ''}`}
            aria-pressed={video.likedByMe}
            aria-label={video.likedByMe ? 'Unlike' : 'Like'}
            onClick={toggleLike}
          >
            <HeartIcon width={18} height={18} /> <span>{compact(video.likes)}</span>
          </button>
          <button type="button" className="icon-btn icon-btn--count" aria-label="Remix this prompt" title="Remix" onClick={remix}>
            <RemixIcon width={18} height={18} /> <span>{compact(video.remixes)}</span>
          </button>
          <ShareMenu video={video} align="left" onShared={(shares) => onChange?.({ ...video, shares })} />
          {video.isMine && (
            <>
              <span className="vcard__spacer" />
              <button type="button" className="icon-btn" aria-label={video.published ? 'Make private' : 'Publish to community'} title={video.published ? 'Make private' : 'Publish'} onClick={togglePublish}>
                {video.published ? <LockIcon width={18} height={18} /> : <GlobeIcon width={18} height={18} />}
              </button>
              <a className="icon-btn vcard__download" href={mediaUrl(video.videoUrl)} download aria-label="Download" title="Download" onClick={(e) => e.stopPropagation()}>
                <DownloadIcon width={18} height={18} />
              </a>
              <button type="button" className="icon-btn icon-btn--danger" aria-label="Delete" title="Delete" onClick={remove}>
                <TrashIcon width={18} height={18} />
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  );
}
