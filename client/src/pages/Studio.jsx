import { useCallback, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import PromptWorkspace from '../components/PromptWorkspace.jsx';
import JobQueue from '../components/JobQueue.jsx';
import VideoGrid from '../components/VideoGrid.jsx';
import { api } from '../api.js';
import { useAppData } from '../state/AppData.jsx';
import { useToast } from '../components/Toast.jsx';

export default function Studio() {
  const location = useLocation();
  const { bumpFeed, refreshMe } = useAppData();
  const toast = useToast();
  const [jobs, setJobs] = useState([]);
  const [fresh, setFresh] = useState([]);
  const preset = location.state?.preset;

  // Pick up any generations still running (e.g. after a page refresh).
  useEffect(() => {
    api.jobs().then((list) => setJobs(list.filter((j) => j.status === 'queued' || j.status === 'running'))).catch(() => {});
  }, []);

  const onJobUpdate = useCallback((next) => {
    setJobs((list) => list.map((j) => (j.id === next.id ? next : j)));
  }, []);

  const onJobDone = useCallback((job) => {
    if (job.status === 'succeeded' && job.video) {
      setFresh((f) => [job.video, ...f]);
      toast('Your video is ready');
      refreshMe();
    } else {
      toast(job.error || 'Generation failed', 'error');
    }
    setJobs((list) => list.filter((j) => j.id !== job.id));
  }, [toast, refreshMe]);

  return (
    <div className="page studio">
      <div className="studio__panel">
        <PromptWorkspace preset={preset} onJobCreated={(job) => setJobs((j) => [job, ...j])} />
      </div>

      <div className="studio__results">
        <div className="section-head">
          <h2>Your generations</h2>
          <button className="link" type="button" onClick={() => { setFresh([]); bumpFeed(); }}>Refresh</button>
        </div>
        <JobQueue jobs={jobs} onJobUpdate={onJobUpdate} onJobDone={onJobDone} />
        <VideoGrid
          params={{ scope: 'mine', sort: 'new' }}
          prepend={fresh}
          empty="No videos yet. Write a prompt and press Generate."
        />
      </div>
    </div>
  );
}
