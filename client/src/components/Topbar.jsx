import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { SearchIcon, CoinIcon, SparkIcon } from './Icons.jsx';
import { useAppData } from '../state/AppData.jsx';
import { InstallButton } from './InstallApp.jsx';

export default function Topbar({ title }) {
  const { me } = useAppData();
  const [q, setQ] = useState('');
  const navigate = useNavigate();

  const submit = (e) => {
    e.preventDefault();
    navigate(`/gallery${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}`);
  };

  return (
    <header className="topbar">
      <Link to="/" className="topbar__logo" aria-label="LAMBA home">
        <img src="/lamba-logo-light.png" alt="LAMBA" />
      </Link>
      <h1 className="topbar__title">{title}</h1>
      <form className="search" onSubmit={submit} role="search">
        <SearchIcon width={18} height={18} />
        <input
          type="search"
          placeholder="Search community videos"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search community videos"
        />
      </form>
      <div className="topbar__right">
        <span className="topbar__install"><InstallButton /></span>
        <span className="pill pill--credits" title="Credits remaining">
          <CoinIcon width={16} height={16} /> {me ? me.credits : '—'}
        </span>
        <Link to="/studio" className="btn btn--primary btn--sm topbar__create">
          <SparkIcon width={16} height={16} /> Create
        </Link>
      </div>
    </header>
  );
}
