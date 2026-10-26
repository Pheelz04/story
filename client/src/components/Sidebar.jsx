import { NavLink, Link } from 'react-router-dom';
import { HomeIcon, SparkIcon, GridIcon, UserIcon, CoinIcon } from './Icons.jsx';
import { useAppData } from '../state/AppData.jsx';
import Avatar from './Avatar.jsx';
import { InstallButton } from './InstallApp.jsx';

export const NAV = [
  { to: '/', label: 'Home', icon: HomeIcon, end: true },
  { to: '/studio', label: 'Studio', icon: SparkIcon },
  { to: '/gallery', label: 'Community', icon: GridIcon },
  { to: '/profile', label: 'Profile', icon: UserIcon }
];

export default function Sidebar() {
  const { me } = useAppData();
  return (
    <aside className="sidebar" aria-label="Main navigation">
      <Link to="/" className="sidebar__brand" aria-label="LAMBA home">
        <img src="/lamba-logo-light.png" alt="LAMBA" />
      </Link>

      <nav className="sidebar__nav">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => `navlink${isActive ? ' is-active' : ''}`}>
            <Icon />
            <span>{label === 'Community' ? 'Community Gallery' : label === 'Studio' ? 'Studio / Create' : label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar__foot">
        <InstallButton variant="card" />
        <div className="credits-card">
          <div className="credits-card__row">
            <CoinIcon width={18} height={18} />
            <span>Credits</span>
            <strong>{me ? me.credits : '—'}</strong>
          </div>
          <div className="credits-card__bar"><span style={{ width: `${Math.min(100, ((me?.credits || 0) / 120) * 100)}%` }} /></div>
          <Link to="/studio" className="btn btn--ghost btn--sm btn--block">Get more credits</Link>
        </div>
        {me && (
          <Link to="/profile" className="sidebar__me">
            <Avatar user={me} size={32} />
            <span>
              <strong>{me.name}</strong>
              <small>@{me.username}</small>
            </span>
          </Link>
        )}
      </div>
    </aside>
  );
}

// Bottom tab bar used on narrow screens instead of the sidebar.
export function MobileNav() {
  return (
    <nav className="mobile-nav" aria-label="Main navigation">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} className={({ isActive }) => `mobile-nav__item${isActive ? ' is-active' : ''}`}>
          <Icon />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
