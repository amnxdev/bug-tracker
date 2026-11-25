import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
// Strip trailing /api to prevent double /api/api/auth/google
const BACKEND_URL = rawUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [slowWake, setSlowWake] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const oauthError = searchParams.get('error');
  const { login } = useAuth();

  useEffect(() => {
    if (!loading) {
      setSlowWake(false);
      return;
    }
    const timer = setTimeout(() => setSlowWake(true), 5000);
    return () => clearTimeout(timer);
  }, [loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await api.post('/auth/login', formData);
      login(res.data.user, res.data.token);
      navigate('/projects');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
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
            ) : (
              <span>OAuth sign-in failed. Please use email &amp; password.</span>
            )}
          </div>
        )}

        {error && (
          <div role="alert" style={{ background: 'var(--status-danger)', color: '#FFFFFF', border: '1px solid #991B1B', padding: '10px 12px', fontSize: '12px', fontWeight: '700' }}>
            {error}
          </div>
        )}

        {/* OAuth Button */}
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

          {loading && (
            <div className="type-mono" style={{ textAlign: 'center', color: 'var(--ink-secondary)' }}>
              LOADING...
              {slowWake && (
                <div style={{ marginTop: '4px', color: 'var(--status-warning)' }}>
                  Server is waking up, this can take up to 50 seconds
                </div>
              )}
            </div>
          )}

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
