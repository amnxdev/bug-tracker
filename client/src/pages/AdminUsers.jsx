import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [theme, setTheme] = useState(document.documentElement.getAttribute('data-theme') || 'light');
  const navigate = useNavigate();
  const { currentUserId } = useAuth();

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleRole = async (targetUser) => {
    const isSelf = String(targetUser._id) === String(currentUserId);
    if (isSelf) return;

    const nextRole = targetUser.role === 'admin' ? 'user' : 'admin';
    setUpdatingId(targetUser._id);
    setError(null);
    try {
      await api.put(`/users/${targetUser._id}/role`, { role: nextRole });
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update user role.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="app-container">
      <Navbar subtitle="// ADMIN // USER MANAGEMENT" theme={theme} toggleTheme={toggleTheme} />

      <main className="content">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <button
            onClick={() => navigate('/projects')}
            className="btn btn-outline"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <ArrowLeft size={14} /> BACK TO REPOSITORIES
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={16} color="var(--accent-lime)" />
            <span className="type-micro" style={{ color: 'var(--accent-lime)' }}>ADMIN PRIVILEGES ACTIVE</span>
          </div>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              background: 'var(--status-danger)',
              color: '#FFFFFF',
              border: '1px solid #991B1B',
              padding: '12px 16px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              fontWeight: '700',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="card" style={{ padding: '24px' }}>
          <div style={{ marginBottom: '20px', borderBottom: '1px solid var(--border-primary)', paddingBottom: '12px' }}>
            <h1 className="type-h1" style={{ fontSize: '24px' }}>USER ACCESS &amp; ROLE CONTROL</h1>
            <p className="type-micro" style={{ color: 'var(--ink-secondary)', marginTop: '4px', marginBottom: 0 }}>
              MANAGE SYSTEM MEMBERS // PROMOTE OR DEMOTE ROLES
            </p>
          </div>

          {loading ? (
            <div style={{ padding: '32px', textAlign: 'center' }} className="type-micro">
              LOADING USERS...
            </div>
          ) : users.length === 0 ? (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--ink-secondary)' }} className="type-micro">
              NO USERS FOUND.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-primary)' }}>
                    <th style={{ padding: '10px 12px' }} className="type-micro">Username</th>
                    <th style={{ padding: '10px 12px' }} className="type-micro">Email</th>
                    <th style={{ padding: '10px 12px' }} className="type-micro">Role</th>
                    <th style={{ padding: '10px 12px' }} className="type-micro">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => {
                    const isSelf = String(u._id) === String(currentUserId);
                    const isTargetAdmin = u.role === 'admin';
                    const isUpdating = updatingId === u._id;

                    return (
                      <tr key={u._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '12px' }}>
                          <span style={{ fontWeight: '700' }}>{u.username}</span>
                          {isSelf && (
                            <span className="type-micro" style={{ marginLeft: '6px', color: 'var(--accent-indigo)' }}>
                              (YOU)
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px', color: 'var(--ink-secondary)' }}>{u.email}</td>
                        <td style={{ padding: '12px' }}>
                          {isTargetAdmin ? (
                            <span className="badge badge-lime">ADMIN</span>
                          ) : (
                            <span className="badge badge-dark">USER</span>
                          )}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleRole(u)}
                            disabled={isSelf || isUpdating}
                            className={isTargetAdmin ? 'btn btn-outline' : 'btn btn-primary'}
                            style={{
                              padding: '6px 12px',
                              fontSize: '11px',
                              opacity: isSelf ? 0.45 : 1,
                              cursor: isSelf ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {isUpdating
                              ? 'UPDATING...'
                              : isTargetAdmin
                              ? 'Make User'
                              : 'Make Admin'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
