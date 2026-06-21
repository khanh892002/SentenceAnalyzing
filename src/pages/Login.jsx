import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider } from '../config/firebase';
import { signInWithEmailAndPassword, signInWithPopup, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import './Login.css';

function Login() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const validatePassword = (pwd) => {
    if (pwd.length < 14) return "Mật khẩu phải dài ít nhất 14 ký tự.";
    if (!/[A-Z]/.test(pwd)) return "Mật khẩu phải chứa ít nhất 1 chữ hoa.";
    if (!/[a-z]/.test(pwd)) return "Mật khẩu phải chứa ít nhất 1 chữ thường.";
    if (!/[0-9]/.test(pwd)) return "Mật khẩu phải chứa ít nhất 1 số.";
    if (!/[^A-Za-z0-9]/.test(pwd)) return "Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt.";
    return null;
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (isRegistering) {
      if (password !== confirmPassword) {
        return setError("Mật khẩu nhập lại không khớp.");
      }
      const pwdError = validatePassword(password);
      if (pwdError) {
        return setError(pwdError);
      }

      try {
        await createUserWithEmailAndPassword(auth, email, password);
        navigate('/');
      } catch (err) {
        let errorMsg = "Đã xảy ra lỗi khi đăng ký.";
        if (err.code === 'auth/email-already-in-use') errorMsg = "Email này đã được sử dụng.";
        else if (err.code === 'auth/invalid-email') errorMsg = "Email không hợp lệ.";
        else if (err.code === 'auth/weak-password') errorMsg = "Mật khẩu quá yếu.";
        setError(errorMsg);
        console.error(err);
      }
    } else {
      try {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/');
      } catch (err) {
        setError('Đăng nhập thất bại. Vui lòng kiểm tra lại email/mật khẩu.');
        console.error(err);
      }
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/');
    } catch (err) {
      setError('Đăng nhập Google thất bại.');
      console.error(err);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Vui lòng nhập địa chỉ email của bạn vào ô Email phía trên trước khi nhấn Quên mật khẩu.');
      setMessage('');
      return;
    }

    try {
      setError('');
      await sendPasswordResetEmail(auth, email);
      setMessage('Đã gửi email khôi phục mật khẩu. Vui lòng kiểm tra hộp thư của bạn.');
    } catch (err) {
      let errorMsg = 'Lỗi khi gửi email khôi phục.';
      if (err.code === 'auth/invalid-email') errorMsg = 'Email không hợp lệ.';
      if (err.code === 'auth/user-not-found') errorMsg = 'Không tìm thấy tài khoản với email này.';
      setError(errorMsg);
      setMessage('');
      console.error(err);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        {isRegistering && (
          <button className="close-register-btn" onClick={() => {
            setIsRegistering(false);
            setError('');
          }}>
            &times;
          </button>
        )}

        <h2>{isRegistering ? "Register Account" : "Login to NLP Analyzer"}</h2>
        {error && <div className="login-error">{error}</div>}
        {message && <div className="login-success">{message}</div>}

        <form onSubmit={handleAuth} className="login-form">
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {isRegistering && (
              <small className="password-hint">
                Min 14 chars, uppercase, lowercase, number, special char.
              </small>
            )}
            {!isRegistering && (
              <div className="forgot-password" onClick={handleForgotPassword}>
                Forgot your password?
              </div>
            )}
          </div>

          {isRegistering && (
            <div className="form-group">
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}

          <button type="submit" className="email-login-btn">
            {isRegistering ? "Sign Up" : "Login with Email"}
          </button>
        </form>

        {!isRegistering && (
          <div className="register-prompt">
            Don't have an account? <span className="register-link" onClick={() => {
              setIsRegistering(true);
              setError('');
              setMessage('');
            }}>Sign up here</span>
          </div>
        )}

        <div className="divider">OR</div>

        <button onClick={handleGoogleLogin} className="google-login-btn">
          {isRegistering ? "Sign Up with Google" : "Login with Google"}
        </button>
      </div>
    </div>
  );
}

export default Login;
