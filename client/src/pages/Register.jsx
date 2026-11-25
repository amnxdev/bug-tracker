import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
// Strip trailing /api to prevent double /api/api/auth
const BACKEND_URL = rawUrl.replace(/\/api\/?$/, '').replace(/\/+$/, '');

export default function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [slowWake, setSlowWake] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
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
      const { data } = await api.post('/auth/register', formData);
      login(data.user, data.token);
      navigate('/projects');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <form className="auth-card" onSubmit={handleSubmit}>
        <div style={{ textAlign: 'center', borderBottom: '1px solid var(--border-primary)', paddingBottom: '16px' }}>
          <h1 className="type-hero" style={{ fontSize: '42px', margin: 0 }}>ORBIT</h1>
          <div className="type-micro" style={{ color: 'var(--ink-secondary)', marginTop: '4px' }}>
            CREATE DEVELOPER ACCOUNT
          </div>
        </div>

        {error && (
          <div role="alert" style={{ background: 'var(--status-danger)', color: '#FFFFFF', border: '1px solid #991B1B', padding: '10px 12px', fontSize: '12px', fontWeight: '700' }}>
            {error}
          </div>
        )}

        {/* OAuth on Register */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <a
            href={`${BACKEND_URL}/api/auth/google`}
            className="btn btn-outline"
            style={{ flex: 1, justifyContent: 'center', padding: '10px 8px', fontSize: '10px' }}
          >
            GOOGLE ↗
          </a>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
          <span className="type-micro" style={{ color: 'var(--ink-secondary)', fontSize: '10px' }}>OR REGISTER WITH CREDENTIALS</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
        </div>

        <div>
          <label>FULL NAME / USERNAME</label>
          <input
            placeholder="E.G. ALEX JOHNSON"
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div>
          <label>EMAIL ADDRESS</label>
          <input
            type="email"
            placeholder="NAME@COMPANY.COM"
            onChange={e => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>

        <div>
          <label>PASSWORD</label>
          <input
            type="password"
            placeholder="••••••••••••"
            onChange={e => setFormData({ ...formData, password: e.target.value })}
            required
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
          {loading ? 'CREATING ACCOUNT...' : 'REGISTER & LAUNCH →'}
        </button>

        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          <Link to="/login" className="link">
            ALREADY REGISTERED? SIGN IN HERE →
          </Link>
        </div>
      </form>
    </div>
  );
}
