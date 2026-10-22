import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useParams } from 'react-router-dom';
import { RequireAuth } from './components/Bits';
import { DepartmentGate } from './components/Department';
import { Footer } from './components/Footer';
import { Icon } from './components/Icon';
import { Wordmark } from './components/Logo';
import { Nav } from './components/Nav';
import { Stylist } from './components/Stylist';
import { Toasts } from './components/Toasts';
import { useStore } from './lib/store';
import Canvas from './pages/Canvas';
import Create from './pages/Create';
import Dashboard from './pages/Dashboard';
import Discover from './pages/Discover';
import ForgotPassword from './pages/ForgotPassword';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import SharedLook from './pages/SharedLook';
import Wardrobe from './pages/Wardrobe';

const BARE = ['/login', '/register', '/forgot-password'];

export default function App() {
  const { pathname } = useLocation();
  const { mode } = useStore();
  const bare = BARE.includes(pathname);
  const noFooter = bare || /^\/moments\/[^/]+/.test(pathname);

  // Block body on purpose: an effect must not return scrollTo's result (some embeds patch scrollTo to return a value).
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <Splash />
      {!bare && <Nav />}
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/discover" element={<Discover />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/look/s/:id" element={<SharedLook />} />
          <Route path="/look/:payload" element={<SharedLook />} />
          <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="/moments" element={<RequireAuth><Create /></RequireAuth>} />
          <Route path="/moments/:id" element={<RequireAuth><Canvas /></RequireAuth>} />
          <Route path="/wardrobe" element={<RequireAuth><Wardrobe /></RequireAuth>} />
          {/* Old paths from the first build */}
          <Route path="/create" element={<Navigate to="/moments" replace />} />
          <Route path="/create/:id" element={<LegacyCanvas />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      {!noFooter && <Footer />}
      <Toasts />
      {!bare && <Stylist />}
      {!bare && <DepartmentGate />}
      {mode === 'demo' && !bare && (
        <div className="demo-flag" title="The API isn't reachable, so FORYA is running on sample data saved in this browser.">
          <Icon name="info" size={14} /> Demo data
        </div>
      )}
    </div>
  );
}

function LegacyCanvas() {
  const { id } = useParams();
  return <Navigate to={`/moments/${id}`} replace />;
}

/** The brand reveal, once per browser session. */
function Splash() {
  const [show, setShow] = useState(() => {
    try {
      return !sessionStorage.getItem('forya.splash');
    } catch {
      return false;
    }
  });
  useEffect(() => {
    if (!show) return;
    try {
      sessionStorage.setItem('forya.splash', '1');
    } catch {
      /* ignore */
    }
    const t = setTimeout(() => setShow(false), 1500);
    return () => clearTimeout(t);
  }, [show]);
  if (!show) return null;
  return (
    <div className="splash" aria-hidden>
      <div className="splash-mark">
        <Wordmark size={64} />
      </div>
    </div>
  );
}
