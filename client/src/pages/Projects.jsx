import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { Plus, Layout, LogOut, Pencil, Trash2, X, Moon, Sun, ArrowRight, Shield } from 'lucide-react';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [editingProject, setEditingProject] = useState(null);
  const [theme, setTheme] = useState(document.documentElement.getAttribute('data-theme') || 'light');
  const navigate = useNavigate();

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const currentUserId = user?.id || user?._id;
  const isAdmin = user?.role === 'admin';

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  const loadProjects = async () => {
    try {
      const { data } = await api.get('/projects');
      setProjects(data);
    } catch (e) {
      console.error(e);
    }
  };

  const createProject = async (e) => {
    e.preventDefault();
    try {
      await api.post('/projects', newProject);
      setNewProject({ name: '', description: '' });
      loadProjects();
    } catch (e) {
      alert('Error creating project');
    }
  };

  const deleteProject = async (e, projectId) => {
    e.stopPropagation();
    if (window.confirm("Delete project? This will permanently remove all associated issues.")) {
      try {
        await api.delete(`/projects/${projectId}`);
        setProjects(c => c.filter(p => p._id !== projectId));
      } catch (e) {
        alert("Failed to delete project");
      }
    }
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/projects/${editingProject._id}`, {
        name: editingProject.name,
        description: editingProject.description
      });
      setEditingProject(null);
      loadProjects();
    } catch (e) {
      alert("Failed to update project");
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  return (
    <div className="app-container">
      {/* Top Brutalist Navigation */}
      <nav className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="logo-small">ORBIT</span>
          <span className="type-micro" style={{ color: '#8E8E8E' }}>// ISSUE TRACKER</span>
        </div>

        <div className="nav-actions">
          <button onClick={toggleTheme} className="btn-logout" title="Toggle Light/Dark Theme">
            {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
            <span>{theme.toUpperCase()}</span>
          </button>
          <div style={{ border: '1px solid #3A3A3A', padding: '6px 12px', background: '#1A1A1A', color: '#F4F4F0' }}>
            <span className="type-micro" style={{ color: 'var(--accent-lime)' }}>{user?.username || 'ANONYMOUS'}</span>
            <span style={{ fontSize: '10px', color: '#8E8E8E', marginLeft: '6px' }}>[{user?.role || 'USER'}]</span>
          </div>
          <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="btn-logout">
            <LogOut size={14}/> LOGOUT
          </button>
        </div>
      </nav>

      <main className="content">
        {/* 4-Column KPI Grid */}
        <div className="kpi-grid">
          <div class="kpi-cell">
            <div className="kpi-top">
              <span className="type-micro">TOTAL PROJECTS</span>
              <span>↗</span>
            </div>
            <div className="type-h2-kpi">{projects.length}</div>
            <div className="kpi-bottom">
              <span className="type-micro" style={{ color: 'var(--status-success)' }}>ACTIVE REPOSITORIES</span>
              <span>●</span>
            </div>
          </div>

          <div className="kpi-cell">
            <div className="kpi-top">
              <span className="type-micro">ACCESS LEVEL</span>
              <Shield size={14} />
            </div>
            <div className="type-h2-kpi" style={{ textTransform: 'uppercase' }}>{user?.role || 'USER'}</div>
            <div className="kpi-bottom">
              <span className="type-micro" style={{ color: 'var(--ink-secondary)' }}>RBAC POLICY ENFORCED</span>
              <span>✓</span>
            </div>
          </div>

          <div className="kpi-cell">
            <div className="kpi-top">
              <span className="type-micro">AI TRIAGE ENGINE</span>
              <span>↗</span>
            </div>
            <div className="type-h2-kpi">GEMINI 4</div>
            <div className="kpi-bottom">
              <span className="type-micro" style={{ color: 'var(--accent-indigo)' }}>AUTO-CLASSIFICATION</span>
              <span>●</span>
            </div>
          </div>

          <div className="kpi-cell">
            <div className="kpi-top">
              <span className="type-micro">SYSTEM INTEGRITY</span>
              <span>↗</span>
            </div>
            <div className="type-h2-kpi">100%</div>
            <div className="kpi-bottom">
              <span className="type-micro" style={{ color: 'var(--status-success)' }}>ALL SERVICES OPERATIONAL</span>
              <span>✓</span>
            </div>
          </div>
        </div>

        {/* Section Header */}
        <div className="header-row">
          <div>
            <h1 className="type-hero" style={{ fontSize: '36px' }}>PROJECT DIRECTORY</h1>
            <div className="type-micro" style={{ color: 'var(--ink-secondary)', marginTop: '4px' }}>
              MANAGE ACTIVE CODEBASES AND ISSUE WORKFLOWS
            </div>
          </div>

          <form onSubmit={createProject} style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              placeholder="PROJECT NAME..."
              value={newProject.name}
              onChange={e => setNewProject({ ...newProject, name: e.target.value })}
              required
              style={{ width: '220px' }}
            />
            <input
              placeholder="DESCRIPTION (OPTIONAL)..."
              value={newProject.description}
              onChange={e => setNewProject({ ...newProject, description: e.target.value })}
              style={{ width: '220px' }}
            />
            <button type="submit" className="btn btn-primary">
              <Plus size={16} /> NEW PROJECT →
            </button>
          </form>
        </div>

        {/* Projects Grid */}
        <div className="grid">
          {projects.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', padding: '40px', textAlign: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border-primary)' }}>
              <div className="type-h3">NO PROJECTS INITIALIZED</div>
              <p style={{ color: 'var(--ink-secondary)', margin: '8px 0 0' }}>Create your first project above to begin tracking issues with AI triage.</p>
            </div>
          ) : (
            projects.map(p => {
              const isOwner = currentUserId && (p.createdBy === currentUserId || p.owner === currentUserId);
              const canEdit = isAdmin || isOwner;
              const canDelete = isAdmin;

              return (
                <div
                  key={p._id}
                  className="card"
                  onClick={() => navigate(`/projects/${p._id}`)}
                  style={{ cursor: 'pointer', justifyContent: 'space-between' }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                      <span className="badge badge-dark">REPOSITORY</span>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {canEdit && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditingProject(p); }}
                            className="btn btn-outline"
                            style={{ padding: '4px 8px' }}
                            title="Edit project"
                          >
                            <Pencil size={13} />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={(e) => deleteProject(e, p._id)}
                            className="btn btn-outline"
                            style={{ padding: '4px 8px', color: 'var(--status-danger)' }}
                            title="Delete project"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    <h2 className="type-h3" style={{ margin: '0 0 8px 0', fontSize: '22px' }}>{p.name}</h2>
                    <p style={{ margin: 0, color: 'var(--ink-secondary)', fontSize: '13px', lineHeight: '1.45' }}>
                      {p.description || "No description provided."}
                    </p>
                  </div>

                  <div style={{ marginTop: '20px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="type-micro" style={{ color: 'var(--ink-muted)' }}>
                      {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'ACTIVE'}
                    </span>
                    <span className="type-micro" style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--ink-primary)' }}>
                      OPEN ISSUES <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Edit Project Modal */}
      {editingProject && (
        <div className="modal-backdrop" onClick={() => setEditingProject(null)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-primary)', paddingBottom: '12px' }}>
              <h2 className="type-h1" style={{ fontSize: '24px' }}>EDIT REPOSITORY</h2>
              <button type="button" onClick={() => setEditingProject(null)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={saveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label>PROJECT NAME</label>
                <input
                  value={editingProject.name}
                  onChange={e => setEditingProject({ ...editingProject, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label>DESCRIPTION</label>
                <textarea
                  value={editingProject.description || ''}
                  onChange={e => setEditingProject({ ...editingProject, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>SAVE CHANGES →</button>
                <button type="button" className="btn btn-outline" onClick={() => setEditingProject(null)}>CANCEL</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
