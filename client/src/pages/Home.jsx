import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import VideoGrid from '../components/VideoGrid.jsx';
import { SparkIcon } from '../components/Icons.jsx';

const QUICK = [
  { label: 'Cinematic drone', prompt: 'Sweeping drone shot over misty mountains at sunrise', style: 'cinematic', aspectRatio: '16:9' },
  { label: 'Anime scene', prompt: 'Anime girl on a rooftop as fireworks burst over the city', style: 'anime', aspectRatio: '9:16' },
  { label: 'Product spin', prompt: 'Sleek sneaker rotating on a glossy pedestal, studio light', style: 'none', aspectRatio: '1:1' },
  { label: 'Retro VHS', prompt: 'Family road trip in the 80s, kids waving from the back seat', style: 'vhs', aspectRatio: '16:9' }
];

export default function Home() {
  const [prompt, setPrompt] = useState('');
  const navigate = useNavigate();

  const go = (preset) => navigate('/studio', { state: { preset } });

  return (
    <div className="page">
      <section className="hero">
        <div className="hero__glow" aria-hidden="true" />
        <p className="eyebrow">AI video studio</p>
        <h2 className="hero__title">Type an idea. <span>Get a film.</span></h2>
        <p className="hero__sub">Turn a sentence into a cinematic clip in seconds, then share it with the LAMBA community.</p>

        <form
          className="hero__prompt"
          onSubmit={(e) => {
            e.preventDefault();
            go({ prompt: prompt.trim() });
          }}
        >
          <input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A neon city at night, rain, slow camera push…"
            aria-label="Describe your video"
          />
          <button className="btn btn--primary" type="submit">
            <SparkIcon width={18} height={18} /> Generate
          </button>
        </form>

        <div className="hero__chips">
          {QUICK.map((q) => (
            <button key={q.label} type="button" className="chip chip--action" onClick={() => go(q)}>{q.label}</button>
          ))}
        </div>
      </section>

      <div className="section-head">
        <h2>Trending this week</h2>
        <Link to="/gallery" className="link">See all</Link>
      </div>
      <VideoGrid params={{ scope: 'community', sort: 'trending' }} limit={8} infinite={false} />
    </div>
  );
}
