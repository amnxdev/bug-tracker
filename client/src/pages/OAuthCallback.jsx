import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function OAuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    const params = new URLSearchParams(hash);
    const token = params.get('token');
    const userRaw = params.get('user');

    if (token && userRaw) {
      try {
        const user = JSON.parse(decodeURIComponent(userRaw));
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        navigate('/projects');
      } catch {
        navigate('/login?error=oauth_parse_failed');
      }
    } else {
      navigate('/login?error=oauth_failed');
    }
  }, []);

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
