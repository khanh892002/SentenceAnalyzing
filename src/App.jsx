import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import About from './pages/About';
import Login from './pages/Login';
import SavedResults from './pages/SavedResults';
import SharedResult from './pages/SharedResult';
import SettingsLayout from './pages/SettingsLayout';
import ResetPassword from './pages/ResetPassword';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="about" element={<About />} />
          <Route path="login" element={<Login />} />
          <Route path="saved" element={<SavedResults />} />
          <Route path="share/:id" element={<SharedResult />} />
          <Route path="settings" element={<SettingsLayout />}>
            <Route index element={<Navigate to="reset-password" replace />} />
            <Route path="reset-password" element={<ResetPassword />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
