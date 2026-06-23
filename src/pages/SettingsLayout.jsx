import { NavLink, Outlet } from 'react-router-dom';
import './SettingsLayout.css';

const featuresPaths = [
    { path: 'reset-password', name: 'Reset Password' },
];

function Settings() {
    return (
        <div className="settings-container">
            <div className="features-navbar">
                {featuresPaths.map((feature) => (
                    <NavLink key={feature.path} to={feature.path}
                        style={({ isActive }) => ({ fontWeight: isActive ? "bold" : "normal" })}>
                        {feature.name}</NavLink>
                ))}
            </div>
            <div className="feature-setting">
                <Outlet />
            </div>
        </div>
    );
}

export default Settings;