import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import FeedbackWidget from './FeedbackWidget';
import './Layout.css';

function Layout() {
  return (
    <div className="app-layout">
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
      <FeedbackWidget />
    </div>
  );
}

export default Layout;
