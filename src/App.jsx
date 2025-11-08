import React, { useState, useEffect } from 'react';
import {
  Mail, Lock, LogIn, Sun, Moon, ShieldCheck, WifiOff, LogOut, UserCheck, Eye, EyeOff, MessageSquare, Send, ArrowLeft
} from 'lucide-react';
import ChatPage from "./pages/ChatPage";
import AdminDashboard from "./pages/AdminDashboard";

const BACKEND_BASE_URL = 'http://10.42.0.1:8000';
const LOGIN_URL = `${BACKEND_BASE_URL}/login`;
const PROTECTED_URL = `${BACKEND_BASE_URL}/login`;

// Decode JWT 
const decodeJwtToken = (token) => {
  try {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(function (c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to decode JWT:', e);
    return null;
  }
};

// Robust sendRequest
const sendRequest = async (url, options) => {
  let attempts = 0;
  const maxAttempts = 3;
  const baseDelay = 1000;

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(url, options);
      const text = await response.text();
      const data = text && (text.startsWith('{') || text.startsWith('['))
        ? JSON.parse(text)
        : { raw_response: text };

      if (!response.ok) {
        if (response.status === 405) {
          throw new Error(`HTTP 405: Method Not Allowed. Check HTTP method for ${url}.`);
        }
        throw new Error(data.detail || data.raw_response || `HTTP error! Status: ${response.status}`);
      }
      return data;
    } catch (error) {
      const networkErrorMsg = `Network/Connection Error: Could not reach the server at ${url}. Possible Issues: Backend server is offline, incorrect IP, or missing CORS configuration.`;
      if (attempts === maxAttempts - 1 && !error.message.includes('Status:') && !error.message.includes('detail:')) {
        throw new Error(networkErrorMsg);
      }
      if (attempts === maxAttempts - 1) throw error;
      const delay = baseDelay * (2 ** attempts);
      await new Promise((resolve) => setTimeout(resolve, delay));
      attempts++;
    }
  }
};

const runtimeStyle = `
:root{
  --discord-blurple:#5865F2;
  --discord-blurple-2:#404EED;
  --bg-deep:#0f1226;
  --bg-mid:#0b0d16;
  --card:#0f1724;
  --muted:#99AAB5;
  --label:#B9BBBE;
  --white:#FFFFFF;
  --danger:#ff6b6b;
  --success:#3ad29f;
  --glass: rgba(255,255,255,0.03);
  --glass-2: rgba(255,255,255,0.02);
  --shadow: 0 8px 30px rgba(2,6,23,0.6);
  --radius: 14px;
  --transition: 0.28s;
}
`;




// Main App
export default function App() {
  // Page routing state
  const [page, setPage] = useState(' '); // 'login', 'chat', or 'admin'

  // Theme & form state
  const [isDarkMode, setIsDarkMode] = useState(true); // default to dark (Discord-like)
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [token, setToken] = useState(() => localStorage.getItem('access_token'));
  const [userData, setUserData] = useState(() => {
    const s = localStorage.getItem('user_data');
    return s ? JSON.parse(s) : null;
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    document.body.className = isDarkMode ? 'discord-dark' : 'discord-light';
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode((p) => !p);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    setToken(null);
    setUserData(null);
    setPage('login'); // Go back to login screen
    setMessage('Logged out and token/user data cleared.');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('Sending login request...');
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    setToken(null);
    setUserData(null);

    try {
      const data = await sendRequest(LOGIN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username, password }),
      });

      const newAccessToken = data.access_token || data.token;
      if (!newAccessToken) throw new Error("Login succeeded but no 'access_token' was returned in the response.");

      const decodedData = decodeJwtToken(newAccessToken);
      if (!decodedData) throw new Error('Token received but could not be parsed. The token might be malformed.');

      localStorage.setItem('access_token', newAccessToken);
      localStorage.setItem('user_data', JSON.stringify(decodedData));
      setToken(newAccessToken);
  setUserData(decodedData);
  console.log('Decoded userData after login:', decodedData);
  console.log('Decoded userData after login:', decodedData);
  setMessage(`Login successful! Logged in as: ${decodedData.role || 'N/A'}. Token and user data saved.`);
  setUsername('');
  setPassword('');
    } catch (error) {
      setMessage(`Login failed: ${error.message}`);
      setToken(null);
      setUserData(null);
    }
  };

  const testProtected = async () => {
    if (!token) {
      setMessage('ERROR: No token found. Please log in.');
      return;
    }
    setMessage('Checking token validity...');
    try {
      const data = await sendRequest(PROTECTED_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: userData?.email || 'admin@gmail.com', password: 'admin@1234' }),
      });
      setMessage(`SUCCESS! Token is valid. Protected resource accessed. Response snippet: ${data.message || JSON.stringify(data).substring(0, 150)}...`);
    } catch (error) {
      setMessage(`Token check failed: ${error.message}. Token cleared.`);
      handleLogout();
    }
  };

  const getMessageClass = () => {
    if (message && (message.includes('SUCCESS') || message.includes('successful'))) return 'bg-success';
    if (message && (message.includes('failed') || message.includes('ERROR') || message.includes('Connection Error') || message.includes('405'))) return 'bg-danger';
    return 'bg-default';
  };
  

  if (page === 'chat') {
    return <ChatPage 
        userData={userData} 
        handleLogout={handleLogout} 
        setPage={setPage} 
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        token={token}
    />;
  }

  if (page === 'admin') {
    return <AdminDashboard />;
  }

  //the Login/Session page by default
  return (
    <>
      <style>{runtimeStyle}</style>

      <div className="app-root">
        <div className="page-bg" aria-hidden="true" />

        <main className="center-wrap">
          <section className="login-card" role="region" aria-labelledby="welcome-heading">
            <header className="card-header">
              <div className="brand">
                <ShieldCheck className="brand-icon" />
                <div>
                  <h1 id="welcome-heading" className="title">Welcome Back!</h1>
                  <p className="subtitle">We’re so excited to see you again!</p>
                </div>
              </div>

              <button
                onClick={toggleDarkMode}
                aria-pressed={isDarkMode}
                title="Toggle light/dark"
                className="theme-toggle"
              >
                {isDarkMode ? <Sun className="icon"/> : <Moon className="icon"/>}
              </button>
            </header>

            {/* Login Form (when no token) */}
            {!token && (
              <form className="form-area" onSubmit={handleLogin} noValidate>
                <label className="visually-hidden" htmlFor="email">Email</label>
                <div className="field">
                  <Mail className="field-icon" />
                  <input
                    id="email"
                    type="email"
                    inputMode="email"
                    placeholder="you@example.com"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className={`input`}
                    aria-label="Email"
                  />
                </div>

                <label className="visually-hidden" htmlFor="password">Password</label>
                <div className="field">
                  <Lock className="field-icon" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={`input`}
                    aria-label="Password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="password-toggle"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={0}
                  >
                    {showPassword ? <EyeOff className="icon-small" /> : <Eye className="icon-small" />}
                  </button>
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-primary">
                    <LogIn className="btn-icon" /> Log In
                  </button>
                </div>

                <div className="form-links">
                  <a className="muted-link" href="#forgot">Forgot password?</a>
                  <div className="divider" />
                  <p className="hint">Need an account? <a href="#register" className="accent-link">Register</a></p>
                </div>
              </form>
            )}

            {/* Status Message */}
            <div className={`message ${getMessageClass()}`} role="status" aria-live="polite">
              <h3 className="msg-title">
                {message && message.includes('Connection Error') && <WifiOff className="mini" /> }
                Status Message:
              </h3>
              <p className="msg-body">{message || (token ? 'Token active. Try the protected route.' : 'Enter credentials to log in.')}</p>
            </div>

            {/* Logged-in View */}
            {token && (
              <div className="session-panel card" aria-live="polite">
                <div className="session-header">
                  <ShieldCheck className="session-icon" />
                  <div>
                    <h2 className="session-title">Session Active</h2>
                    <p className="session-sub">You are authenticated. Use the actions below.</p>
                  </div>
                </div>
                <div className="session-actions">
                  <button onClick={testProtected} className="btn-primary">
                    <ShieldCheck className="btn-icon" /> Test Token
                  </button>
                  <button onClick={() => setPage('chat')} className="btn-primary">
                    <MessageSquare className="btn-icon" /> Go to Chat
                  </button>
                  <button onClick={handleLogout} className="btn-primary">
                    <LogOut className="btn-icon" /> Log Out
                  </button>
                    {userData && userData.role === 'sys_admin' && (
                      <button onClick={() => setPage('admin')} className="btn-primary">
                        <ShieldCheck className="btn-icon" /> Admin Dashboard
                      </button>
                    )}
                </div>
                {userData && (
                  <div className="session-user card">
                    <h4 className="session-user-title"><UserCheck className="mini" /> Decoded User Details</h4>
                    <div className="session-user-body">
                      {Object.entries(userData).map(([k, v]) => (
                        <p key={k}><span className="key">{k}:</span> <span className="val">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</span></p>
                      ))}
                    </div>
                  </div>
                )}
                <div className="session-token card">
                  <strong>Raw Token</strong>
                  <pre className="token-pre">{token}</pre>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </>
  );
}
