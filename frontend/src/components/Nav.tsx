import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useSession } from '../lib/session';
import { DepartmentSwitch } from './Department';
import { Icon, IconName } from './Icon';
import { Logo } from './Logo';
import { SectionLink } from './SectionLink';

const SIGNED_IN: { to: string; label: string; icon: IconName }[] = [
  { to: '/dashboard', label: 'Home', icon: 'home' },
  { to: '/moments', label: 'Moments', icon: 'calendar' },
  { to: '/discover', label: 'Discover', icon: 'compass' },
  { to: '/wardrobe', label: 'Wardrobe', icon: 'hanger' },
];

export function Nav() {
  const { user, signOut } = useSession();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenu(false);
  }, [pathname]);

  useEffect(() => {
    if (!menu) return;
    const close = (e: MouseEvent) => menuRef.current && !menuRef.current.contains(e.target as Node) && setMenu(false);
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [menu]);

  useEffect(() => {
    document.body.classList.toggle('has-tabs', !!user);
  }, [user]);

  const initials = user?.name
    ?.split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <>
      <header className={`topnav ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="container topnav-inner">
          <Logo to={user ? '/dashboard' : '/'} />

          <nav className="topnav-links" aria-label="Main">
            {user ? (
              SIGNED_IN.map((l) => (
                <NavLink key={l.to} to={l.to} className="navlink">
                  {l.label}
                </NavLink>
              ))
            ) : (
              <>
                <SectionLink className="navlink" id="how">
                  How it works
                </SectionLink>
                <SectionLink className="navlink" id="price-check">
                  Price check
                </SectionLink>
                <NavLink to="/discover" className="navlink">
                  Discover
                </NavLink>
              </>
            )}
          </nav>

          <div className="topnav-actions">
            {user ? (
              <>
                <button className="btn btn-primary btn-sm hide-mobile" onClick={() => navigate('/moments?new=1')}>
                  <Icon name="plus" size={16} stroke={2} /> New moment
                </button>
                <div style={{ position: 'relative' }} ref={menuRef}>
                  <button className="avatar" onClick={() => setMenu((m) => !m)} aria-haspopup="menu" aria-expanded={menu} aria-label="Account">
                    {initials || <Icon name="user" size={18} />}
                  </button>
                  {menu && (
                    <div className="menu" role="menu">
                      <div className="menu-head">
                        <div className="h4">{user.name}</div>
                        <div className="small">{user.email}</div>
                      </div>
                      <div className="menu-section">
                        <span className="eyebrow">Shopping for</span>
                        <DepartmentSwitch compact />
                      </div>
                      <Link className="menu-item" to="/dashboard" role="menuitem">
                        <Icon name="home" size={18} /> Home
                      </Link>
                      <Link className="menu-item" to="/wardrobe" role="menuitem">
                        <Icon name="heart" size={18} /> Saved pieces
                      </Link>
                      <button
                        className="menu-item"
                        role="menuitem"
                        onClick={() => {
                          signOut();
                          navigate('/');
                        }}
                      >
                        <Icon name="logout" size={18} /> Sign out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <span className="hide-mobile">
                  <DepartmentSwitch compact />
                </span>
                <Link to="/login" className="btn btn-ghost btn-sm">
                  Log in
                </Link>
                <Link to="/register" className="btn btn-primary btn-sm">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {user && (
        <nav className="mobile-tabs" aria-label="Main">
          {SIGNED_IN.map((l) => (
            <NavLink key={l.to} to={l.to}>
              <Icon name={l.icon} size={22} />
              {l.label}
            </NavLink>
          ))}
        </nav>
      )}
    </>
  );
}
