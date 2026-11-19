import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { Shield, ArrowLeft, UserCheck, AlertTriangle } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

export default function Admin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState(document.documentElement.getAttribute('data-theme') || 'light');
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();
  const { currentUserId, isAdmin } = useAuth();

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (targetUserId, newRole) => {
    if (String(targetUserId) === String(currentUserId) && newRole !== 'admin') {
      alert("Self-demotion is prevented: Admins cannot demote their own account.");
      return;
    }

    try {
      await api.put(`/users/${targetUserId}/role`, { role: newRole });
      setMessage(`User role updated to ${newRole.toUpperCase()}`);
      setTimeout(() => setMessage(null), 4000);
      loadUsers();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update user role");
    }
  };

  return (
    <div className="app-container">
      <Navbar subtitle="// ROLE MANAGEMENT // RBAC" theme={theme} toggleTheme={toggleTheme} />

      <main className="content">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <button onClick={() => navigate('/projects')} className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <ArrowLeft size={14} /> BACK TO REPOSITORIES
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Shield size={16} color="var(--accent-lime)" />
            <span className="type-micro" style={{ color: 'var(--accent-lime)' }}>ADMIN PRIVILEGES ACTIVE</span>
          </div>
        </div>

        {message && (
          <div style={{ background: 'var(--status-success)', color: '#FFFFFF', padding: '10px 16px', marginBottom: '16px', fontWeight: '700', fontSize: '12px' }}>
            ✓ {message}
          </div>
        )}

        <div className="auth-card" style={{ maxWidth: '100%', width: '100%', margin: 0, padding: '24px' }}>
          <div className="auth-header" style={{ marginBottom: '20px' }}>
            <h1 className="type-h1" style={{ fontSize: '24px' }}>USER ACCESS &amp; ROLE CONTROL</h1>
            <p className="type-micro" style={{ color: 'var(--ink-secondary)', marginTop: '4px' }}>
              PROMOTE OR DEMOTE SYSTEM MEMBERS // RBAC POLICIES ENFORCED
            </p>
          </div>

          {loading ? (
            <div style={{ padding: '24px', textAlign: 'center' }} className="type-micro">LOADING USER DIRECTORY...</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-primary)' }}>
                    <th style={{ padding: '10px 12px' }} className="type-micro">USERNAME</th>
                    <th style={{ padding: '10px 12px' }} className="type-micro">EMAIL</th>
                    <th style={{ padding: '10px 12px' }} className="type-micro">SYSTEM ROLE</th>
                    <th style={{ padding: '10px 12px' }} className="type-micro">ASSIGN NEW ROLE</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => {
                    const isSelf = String(u._id) === String(currentUserId);
                    return (
                      <tr key={u._id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '12px' }}>
                          <span style={{ fontWeight: '700' }}>{u.username}</span>
                          {isSelf && <span className="type-micro" style={{ marginLeft: '6px', color: 'var(--accent-indigo)' }}>(YOU)</span>}
                        </td>
                        <td style={{ padding: '12px', color: 'var(--ink-secondary)' }}>{u.email}</td>
                        <td style={{ padding: '12px' }}>
                          {u.role === 'admin' ? (
                            <span className="badge badge-lime">ADMIN</span>
                          ) : (
                            <span className="badge badge-dark">USER</span>
                          )}
                        </td>
                        <td style={{ padding: '12px' }}>
                          <select
                            value={u.role}
                            onChange={(e) => handleRoleChange(u._id, e.target.value)}
                            disabled={isSelf}
                            style={{ width: '130px', padding: '6px 10px', fontSize: '11px', fontWeight: '700' }}
                          >
                            <option value="user">USER</option>
                            <option value="admin">ADMIN</option>
                          </select>
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
