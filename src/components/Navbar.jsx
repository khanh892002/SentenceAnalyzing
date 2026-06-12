import { Link } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">NLP Analyzer</Link>
      </div>
      <div className="navbar-links">
        <Link to="/">Dashboard</Link>
        <Link to="/about">About</Link>
        <Link to="/login">Login</Link>
      </div>
    </nav>
  );
}

export default Navbar;
