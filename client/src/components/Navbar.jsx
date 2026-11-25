import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Moon, Sun, LogOut, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar({ subtitle = "// ISSUE TRACKER", theme, toggleTheme }) {
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span
          className="logo-small"
          onClick={() => navigate('/projects')}
          style={{ cursor: 'pointer' }}
        >
          ORBIT
        </span>
        <span className="type-micro" style={{ color: '#8E8E8E' }}>{subtitle}</span>
      </div>

      <div className="nav-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {isAdmin && (
          <Link
            to="/admin"
            className="btn-logout"
            style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            title="Admin Role Management"
          >
            <Shield size={14} color="var(--accent-lime)" />
            <span>Admin</span>
          </Link>
        )}

        {toggleTheme && (
          <button onClick={toggleTheme} className="btn-logout" title="Toggle Light/Dark Theme">
            {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
            <span>{theme ? theme.toUpperCase() : 'THEME'}</span>
          </button>
        )}

        {/* Username + Role Badge */}
        <div
          style={{
            border: '1px solid #3A3A3A',
            padding: '6px 12px',
            background: '#1A1A1A',
            color: '#F4F4F0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span className="type-micro" style={{ color: 'var(--accent-lime)' }}>
            {user?.username || 'ANONYMOUS'}
          </span>
          {isAdmin ? (
            <span className="badge badge-lime">ADMIN</span>
          ) : (
            <span className="badge badge-dark" style={{ background: '#262626', borderColor: '#404040', color: '#DCDCD6' }}>
              USER
            </span>
          )}
        </div>

        <button onClick={handleLogout} className="btn-logout">
          <LogOut size={14} /> LOGOUT
        </button>
      </div>
    </nav>
  );
}
