import React, { useState } from 'react';
import api from '../api/axios';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';

const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const oauthError = searchParams.get('error');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', formData);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/projects');
    } catch (err) {
      alert(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border-primary)', paddingBottom: '16px' }}>
          <h1 className="type-hero" style={{ fontSize: '42px', margin: 0 }}>ORBIT</h1>
          <div className="type-micro" style={{ color: 'var(--ink-secondary)', marginTop: '4px' }}>
            ISSUE &amp; BUG TRACKER
          </div>
        </div>

        {oauthError && (
          <div style={{ background: '#0F0F0F', color: '#F4F4F0', border: '1px solid var(--status-warning)', padding: '12px 14px', fontSize: '12px' }}>
            {oauthError === 'google_not_configured' ? (
              <span>⚠️ Google OAuth is not configured in <code>server/.env</code>. Please use email &amp; password below.</span>
            ) : oauthError === 'github_not_configured' ? (
              <span>⚠️ GitHub OAuth is not configured in <code>server/.env</code>. Please use email &amp; password below.</span>
            ) : (
              <span>OAuth sign-in failed. Please use email &amp; password.</span>
            )}
          </div>
        )}

        {/* OAuth Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <a
            href={`${BACKEND_URL}/api/auth/google`}
            className="btn btn-outline"
            style={{ width: '100%', justifyContent: 'center', padding: '12px', background: 'var(--bg-surface)' }}
          >
            <svg width="16" height="16" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.8 2.5 30.2 0 24 0 14.7 0 6.7 5.4 2.9 13.3l7.8 6.1C12.5 13.1 17.8 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.6 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 7.2-10 7.2-17z"/>
              <path fill="#FBBC05" d="M10.7 28.6A14.7 14.7 0 0 1 9.5 24c0-1.6.3-3.2.7-4.6L2.4 13.3A23.9 23.9 0 0 0 0 24c0 3.8.9 7.4 2.4 10.6l8.3-6z"/>
              <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2 1.4-4.6 2.3-7.7 2.3-6.2 0-11.5-4.2-13.3-9.9l-8.3 6C6.7 42.6 14.7 48 24 48z"/>
            </svg>
            CONTINUE WITH GOOGLE ↗
          </a>

          <a
            href={`${BACKEND_URL}/api/auth/github`}
            className="btn btn-dark"
            style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
          >
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.38.6.11.82-.26.82-.58v-2.17c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49 1 .11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02 0 2.04.14 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.66.25 2.88.12 3.18.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58C20.56 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            CONTINUE WITH GITHUB ↗
          </a>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
          <span className="type-micro" style={{ color: 'var(--ink-secondary)', fontSize: '10px' }}>OR SIGN IN WITH EMAIL</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label>EMAIL ADDRESS</label>
            <input
              required
              type="email"
              placeholder="NAME@COMPANY.COM"
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label>PASSWORD</label>
            <input
              required
              type="password"
              placeholder="••••••••••••"
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: '100%', marginTop: '6px' }}>
            {loading ? 'AUTHENTICATING...' : 'SIGN IN →'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          <Link to="/register" className="link">
            DON'T HAVE AN ACCOUNT? REGISTER HERE →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
