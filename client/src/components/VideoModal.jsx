import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, mediaUrl, compact, timeAgo } from '../api.js';
import { useAppData } from '../state/AppData.jsx';
import { useToast } from './Toast.jsx';
import Avatar from './Avatar.jsx';
import ShareMenu from './ShareMenu.jsx';
import { CloseIcon, HeartIcon, RemixIcon, EyeIcon, DownloadIcon, GlobeIcon, LockIcon } from './Icons.jsx';

const viewed = new Set(); // count one view per video per page load

export default function VideoModal({ video, onClose, onChange }) {
  const { config } = useAppData();
  const toast = useToast();
  const navigate = useNavigate();
  const dialogRef = useRef(null);

  useEffect(() => {
    dialogRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  useEffect(() => {
    if (viewed.has(video.id)) return;
    viewed.add(video.id);
    api.view(video.id).then(({ views }) => onChange?.({ ...video, views })).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video.id]);

  const model = config?.models.find((m) => m.id === video.model);
  const style = config?.styles.find((s) => s.id === video.style);
  const camera = config?.cameraMoves.find((c) => c.id === video.camera);

  async function like() {
    try {
      const r = await api.like(video.id);
      onChange?.({ ...video, ...r });
    } catch (err) { toast(err.message, 'error'); }
  }
  async function remix() {
    const { preset } = await api.remix(video.id);
    onClose();
    navigate('/studio', { state: { preset } });
  }
  async function togglePublish() {
    const updated = await api.publish(video.id, !video.published);
    onChange?.(updated);
    toast(updated.published ? 'Published to Community Gallery' : 'Made private');
  }

  return (
    <div className="modal" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal__dialog" role="dialog" aria-modal="true" aria-label="Video details" tabIndex={-1} ref={dialogRef}>
        <button className="icon-btn modal__close" aria-label="Close" onClick={onClose}><CloseIcon /></button>

        <div className={`modal__player ratio-${video.aspectRatio.replace(':', 'x')}`}>
          <video src={mediaUrl(video.videoUrl)} poster={mediaUrl(video.posterUrl)} controls autoPlay loop playsInline muted />
        </div>

        <div className="modal__side">
          <div className="modal__author">
            <Avatar user={video.author} size={40} />
            <div>
              <strong>{video.author?.name}</strong>
              <small>@{video.author?.username} · {timeAgo(video.createdAt)}</small>
            </div>
          </div>

          <h2 className="modal__label">Prompt</h2>
          <p className="modal__prompt">{video.prompt}</p>

          <dl className="meta">
            <div><dt>Model</dt><dd>{model?.name || video.model}</dd></div>
            <div><dt>Style</dt><dd>{style?.name || video.style}</dd></div>
            <div><dt>Camera</dt><dd>{camera?.name || 'Auto'}</dd></div>
            <div><dt>Aspect</dt><dd>{video.aspectRatio}</dd></div>
            <div><dt>Duration</dt><dd>{video.duration}s</dd></div>
            <div><dt>Views</dt><dd><EyeIcon width={14} height={14} /> {compact(video.views)}</dd></div>
          </dl>

          <div className="modal__actions">
            <button className={`btn btn--ghost${video.likedByMe ? ' is-liked' : ''}`} onClick={like} aria-pressed={video.likedByMe}>
              <HeartIcon width={18} height={18} /> {compact(video.likes)}
            </button>
            <button className="btn btn--primary" onClick={remix}><RemixIcon width={18} height={18} /> Remix</button>
            <ShareMenu video={video} align="left" onShared={(shares) => onChange?.({ ...video, shares })} />
            <a className="icon-btn" href={mediaUrl(video.videoUrl)} download aria-label="Download"><DownloadIcon width={18} height={18} /></a>
          </div>

          {video.isMine && (
            <button className="btn btn--ghost btn--block" onClick={togglePublish}>
              {video.published ? <><LockIcon width={16} height={16} /> Make private</> : <><GlobeIcon width={16} height={16} /> Publish to Community</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
