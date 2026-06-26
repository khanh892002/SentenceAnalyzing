import { NavLink, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import SigninRequest from '../components/SigninRequest';

const featuresPaths = [
    { path: 'reset-password', name: 'Reset Password' },
];

function Settings() {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });
        return () => unsubscribe();
    }, []);

    return (!user) ? (
        <SigninRequest />
    ) : (
        <div className="settings-container">
            <div className="features-navbar">
                {featuresPaths.map((feature) => (
                    <NavLink key={feature.path} to={feature.path}
                        style={({ isActive }) => ({ fontWeight: isActive ? "bold" : "normal", backgroundColor: isActive ? "#00000030" : "transparent" })}>
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