import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    const token = params.get('token');
    const userRaw = params.get('user');

    if (token && userRaw) {
      try {
        const user = JSON.parse(decodeURIComponent(userRaw));
        login(user, token);
        navigate('/projects', { replace: true });
      } catch {
        navigate('/login?error=oauth_parse_failed', { replace: true });
      }
    } else {
      navigate('/login?error=oauth_failed', { replace: true });
    }
  }, [login, navigate]);

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ textAlign: 'center', padding: '40px' }}>
        <span className="badge badge-lime" style={{ alignSelf: 'center' }}>OAUTH HANDSHAKE</span>
        <h2 className="type-h1" style={{ fontSize: '28px', marginTop: '12px' }}>AUTHORIZING SESSION...</h2>
        <p className="type-micro" style={{ color: 'var(--ink-secondary)', margin: '8px 0 0' }}>
          VERIFYING CREDENTIALS AND REDIRECTING TO WORKSPACE
        </p>
      </div>
    </div>
  );
}
