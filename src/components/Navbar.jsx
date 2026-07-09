import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import './Navbar.css';

const routes = [
  {to: '/', name: 'Dashboard'},
  {to: 'saved', name: 'My Analysis'},
  {to: 'about', name: 'About'},
  {to: 'settings', name: 'Settings'}
]

function Navbar() {
  const [user, setUser] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">NLP Analyzer</Link>
      </div>

      {/* Desktop Navigation Links */}
      <div className="navbar-links">
        {routes.map(e => <Link to={e.to}>{e.name}</Link>)}
        {user ? (
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </div>

      {/* Hamburger Toggle Button for Mobile */}
      <button 
        className={`navbar-toggle ${isDrawerOpen ? 'active' : ''}`} 
        onClick={() => setIsDrawerOpen(!isDrawerOpen)}
        aria-label="Toggle navigation menu"
      >
        <span className="hamburger-bar"></span>
        <span className="hamburger-bar"></span>
        <span className="hamburger-bar"></span>
      </button>

      {/* Slide-in Mobile Drawer */}
      <div className={`navbar-drawer ${isDrawerOpen ? 'open' : ''}`}>
        <div className="drawer-header">
          <span className="drawer-title">Menu</span>
        </div>
        <div className="drawer-links">
          {routes.map(e => <Link to={e.to} onClick={() => setIsDrawerOpen(false)}>{e.name}</Link>)}
          {user ? (
            <button onClick={() => { handleLogout(); setIsDrawerOpen(false); }} className="logout-btn drawer-logout">Logout</button>
          ) : (
            <Link to="/login" onClick={() => setIsDrawerOpen(false)} className="drawer-login-btn">Login</Link>
          )}
        </div>
      </div>

      {/* Backdrop overlay */}
      {isDrawerOpen && <div className="drawer-backdrop" onClick={() => setIsDrawerOpen(false)}></div>}
    </nav>
  );
}

export default Navbar;
