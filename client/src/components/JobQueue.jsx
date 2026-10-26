import { useEffect, useRef } from 'react';
import { api } from '../api.js';

// Shows in-flight generations and polls each until it finishes.
export default function JobQueue({ jobs, onJobUpdate, onJobDone }) {
  const timers = useRef({});

  useEffect(() => {
    const active = jobs.filter((j) => j.status === 'queued' || j.status === 'running');
    active.forEach((job) => {
      if (timers.current[job.id]) return;
      timers.current[job.id] = setInterval(async () => {
        try {
          const next = await api.job(job.id);
          onJobUpdate(next);
          if (next.status === 'succeeded' || next.status === 'failed') {
            clearInterval(timers.current[job.id]);
            delete timers.current[job.id];
            onJobDone(next);
          }
        } catch {
          /* keep polling */
        }
      }, 900);
    });
  }, [jobs, onJobUpdate, onJobDone]);

  useEffect(() => () => Object.values(timers.current).forEach(clearInterval), []);

  const visible = jobs.filter((j) => j.status !== 'succeeded');
  if (!visible.length) return null;

  return (
    <ul className="job-queue" aria-label="Generations in progress">
      {visible.map((j) => (
        <li key={j.id} className={`job job--${j.status}`}>
          <div className={`job__thumb ratio-${j.aspectRatio.replace(':', 'x')}`}>
            <span className="job__shimmer" />
            <span className="job__pct">{j.status === 'failed' ? '!' : `${j.progress}%`}</span>
          </div>
          <div className="job__body">
            <p className="job__prompt">{j.prompt}</p>
            <p className="job__meta">
              {j.status === 'failed' ? j.error : j.stage} · {j.aspectRatio} · {j.duration}s
            </p>
            <div className="progress" role="progressbar" aria-valuenow={j.progress} aria-valuemin={0} aria-valuemax={100}>
              <span style={{ width: `${j.progress}%` }} />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
