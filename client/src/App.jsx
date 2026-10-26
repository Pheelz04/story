import { Routes, Route, useLocation, Link } from 'react-router-dom';
import Sidebar, { MobileNav } from './components/Sidebar.jsx';
import Topbar from './components/Topbar.jsx';
import Home from './pages/Home.jsx';
import Studio from './pages/Studio.jsx';
import Gallery from './pages/Gallery.jsx';
import Profile from './pages/Profile.jsx';
import { useAppData } from './state/AppData.jsx';
import { AppStatus } from './components/InstallApp.jsx';

const TITLES = { '/': 'Home', '/studio': 'Studio', '/gallery': 'Community Gallery', '/profile': 'Profile' };

function NotFound() {
  return (
    <div className="page empty">
      <h2>Page not found</h2>
      <Link className="btn btn--primary" to="/">Back home</Link>
    </div>
  );
}

export default function App() {
  const { pathname } = useLocation();
  const { error } = useAppData();

  return (
    <div className="shell">
      <Sidebar />
      <div className="shell__main">
        <Topbar title={TITLES[pathname] || ''} />
        <AppStatus />
        {error &&<div className="notice notice--error">Can’t reach the LAMBA API: {error}. Is the server running on port 4000?</div>}
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/studio" element={<Studio />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
