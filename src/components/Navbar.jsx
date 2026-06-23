import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import './Navbar.css';

function Navbar() {
  const [user, setUser] = useState(null);
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
      <div className="navbar-links">
        <Link to="/">Dashboard</Link>
        <Link to="/saved">My Analyses</Link>
        <Link to="/about">About</Link>
        <Link to="/settings">Settings</Link>
        {user ? (
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
