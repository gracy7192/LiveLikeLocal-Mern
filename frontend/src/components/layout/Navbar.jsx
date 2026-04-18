import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FiMenu, FiX, FiUser, FiLogOut, FiGrid, FiMessageSquare } from 'react-icons/fi';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setDropdownOpen(false);
    setMobileOpen(false);
  }, [location]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container">
        <Link to="/" className="navbar-brand">
          🏡 <span>LiveLikeLocals</span>
        </Link>

        <div className={`navbar-links ${mobileOpen ? 'mobile-open' : ''}`}>
          <Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link>
          <Link to="/listings" className={location.pathname === '/listings' ? 'active' : ''}>Explore</Link>
          {isAuthenticated && (
            <Link to="/chat" className={location.pathname === '/chat' ? 'active' : ''}>Chat</Link>
          )}
        </div>

        <div className="navbar-actions">
          {isAuthenticated ? (
            <div style={{ position: 'relative' }}>
              <div
                className="navbar-avatar"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                {getInitials(user?.name)}
              </div>
              {dropdownOpen && (
                <div className="navbar-dropdown">
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', marginBottom: '4px' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user?.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user?.role}</div>
                  </div>
                  <Link to="/dashboard"><FiGrid size={16} /> Dashboard</Link>
                  <Link to="/chat"><FiMessageSquare size={16} /> Messages</Link>
                  <button onClick={handleLogout}><FiLogOut size={16} /> Logout</button>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary btn-sm">Login</Link>
              <Link to="/signup" className="btn btn-primary btn-sm">Sign Up</Link>
            </>
          )}
          <button className="mobile-menu-btn" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
