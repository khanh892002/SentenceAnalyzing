import { useNavigate } from 'react-router-dom';

function SigninRequest({ message = 'Please log in to access this page.' }) {
    const navigate = useNavigate();
    return (
        <div className="saved-container empty-state">
            <div className="empty-content">
                <span className="empty-icon">🔒</span>
                <h2>Authentication Required</h2>
                <p>{message}</p>
                <button onClick={() => navigate('/login')} className="login-button">Go to Login</button>
            </div>
        </div>
    );
}

export default SigninRequest;