import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, X, MessageSquare, Sparkles, AlertCircle, ChevronDown, ChevronUp, Moon, Sun, LogOut } from 'lucide-react';

export default function ProjectDetails() {
  const { id } = useParams();
  const [bugs, setBugs] = useState([]);
  const navigate = useNavigate();
  const [newBug, setNewBug] = useState({ title: '', description: '', priority: 'medium' });
  const [editingBug, setEditingBug] = useState(null);
  const [theme, setTheme] = useState(document.documentElement.getAttribute('data-theme') || 'light');

  // AI & Comments state
  const [aiInsight, setAiInsight] = useState(null);
  const [commentsBugId, setCommentsBugId] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [expandedAI, setExpandedAI] = useState({});

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const currentUserId = user?.id || user?._id;
  const isAdmin = user?.role === 'admin';

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  /* ── Data Loaders ── */
  const loadBugs = async () => {
    try {
      const { data } = await api.get(`/projects/${id}/bugs`);
      setBugs(data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadComments = async (bugId) => {
    try {
      const { data } = await api.get(`/bugs/${bugId}/comments`);
      setComments(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadBugs();
  }, [id]);

  /* ── Bug Actions ── */
  const createBug = async (e) => {
    e.preventDefault();
    if (!newBug.title.trim()) return;
    setLoadingAI(true);
    setAiInsight(null);
    try {
      const { data } = await api.post(`/projects/${id}/bugs`, newBug);
      setNewBug({ title: '', description: '', priority: 'medium' });
      if (data.ai) setAiInsight(data.ai);
      loadBugs();
    } catch (e) {
      alert("Failed to create issue");
    } finally {
      setLoadingAI(false);
    }
  };

  const deleteBug = async (e, bugId) => {
    e.stopPropagation();
    if (window.confirm("Permanently delete this issue?")) {
      try {
        await api.delete(`/bugs/${bugId}`);
        setBugs(c => c.filter(b => b._id !== bugId));
      } catch (e) {
        alert("Failed to delete issue");
      }
    }
  };

  const updateStatus = async (e, bugId, newStatus) => {
    e.stopPropagation();
    try {
      await api.put(`/bugs/${bugId}`, { status: newStatus });
      loadBugs();
    } catch (e) {
      alert("Failed to update status");
    }
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/bugs/${editingBug._id}`, {
        title: editingBug.title,
        description: editingBug.description,
        priority: editingBug.priority,
        status: editingBug.status
      });
      setEditingBug(null);
      loadBugs();
    } catch (err) {
      alert("Failed to save issue edits");
    }
  };

  const applyAIPriority = (priority) => {
    setEditingBug(prev => ({ ...prev, priority }));
  };

  /* ── On-demand AI Re-triage ── */
  const retriage = async (e, bugId) => {
    e.stopPropagation();
    try {
      const { data } = await api.post(`/bugs/${bugId}/retriage`);
      loadBugs();
      setExpandedAI(prev => ({ ...prev, [bugId]: true }));
    } catch (e) {
      alert("AI retriage failed");
    }
  };

  /* ── Comment Actions ── */
  const openComments = async (e, bugId) => {
    e.stopPropagation();
    if (commentsBugId === bugId) {
      setCommentsBugId(null);
      setComments([]);
      return;
    }
    setCommentsBugId(bugId);
    await loadComments(bugId);
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      await api.post(`/bugs/${commentsBugId}/comments`, { text: newComment });
      setNewComment('');
      loadComments(commentsBugId);
    } catch (e) {
      alert("Failed to post comment");
    }
  };

  const deleteComment = async (commentId) => {
    if (!window.confirm("Delete comment?")) return;
    try {
      await api.delete(`/bugs/${commentsBugId}/comments/${commentId}`);
      loadComments(commentsBugId);
    } catch (e) {
      alert("Failed to delete comment");
    }
  };

  const openCount = bugs.filter(b => b.status === 'open' || !b.status).length;
  const inProgressCount = bugs.filter(b => b.status === 'in-progress').length;
  const resolvedCount = bugs.filter(b => b.status === 'resolved' || b.status === 'closed').length;
  const highPriorityCount = bugs.filter(b => b.priority === 'high').length;

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <nav className="navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span className="logo-small" onClick={() => navigate('/projects')} style={{ cursor: 'pointer' }}>ORBIT</span>
          <span className="type-micro" style={{ color: '#8E8E8E' }}>// ISSUE MANAGEMENT</span>
        </div>

        <div className="nav-actions">
          <button onClick={toggleTheme} className="btn-logout" title="Toggle Light/Dark Theme">
            {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
            <span>{theme.toUpperCase()}</span>
          </button>
          <div style={{ border: '1px solid #3A3A3A', padding: '6px 12px', background: '#1A1A1A', color: '#F4F4F0' }}>
            <span className="type-micro" style={{ color: 'var(--accent-lime)' }}>{user?.username || 'ANONYMOUS'}</span>
          </div>
          <button onClick={() => { localStorage.clear(); navigate('/login'); }} className="btn-logout">
            <LogOut size={14}/> LOGOUT
          </button>
        </div>
      </nav>

      <main className="content">
        {/* Metric Summary Bar */}
        <div className="kpi-grid">
          <div className="kpi-cell">
            <div className="kpi-top">
              <span className="type-micro">TOTAL LOGGED ISSUES</span>
              <span>↗</span>
            </div>
            <div className="type-h2-kpi">{bugs.length}</div>
            <div className="kpi-bottom">
              <span className="type-micro" style={{ color: 'var(--ink-secondary)' }}>IN CURRENT PROJECT</span>
              <span>●</span>
            </div>
          </div>

          <div className="kpi-cell">
            <div className="kpi-top">
              <span className="type-micro">OPEN &amp; TRIAGED</span>
              <span>↗</span>
            </div>
            <div className="type-h2-kpi" style={{ color: 'var(--status-warning)' }}>{openCount}</div>
            <div className="kpi-bottom">
              <span className="type-micro" style={{ color: 'var(--ink-secondary)' }}>AWAITING ACTION</span>
              <span>●</span>
            </div>
          </div>

          <div className="kpi-cell">
            <div className="kpi-top">
              <span className="type-micro">IN PROGRESS</span>
              <span>↗</span>
            </div>
            <div className="type-h2-kpi" style={{ color: 'var(--accent-indigo)' }}>{inProgressCount}</div>
            <div className="kpi-bottom">
              <span className="type-micro" style={{ color: 'var(--ink-secondary)' }}>CURRENTLY ACTIVE</span>
              <span>●</span>
            </div>
          </div>

          <div className="kpi-cell">
            <div className="kpi-top">
              <span className="type-micro">CRITICAL (HIGH)</span>
              <span>↗</span>
            </div>
            <div className="type-h2-kpi" style={{ color: 'var(--status-danger)' }}>{highPriorityCount}</div>
            <div className="kpi-bottom">
              <span className="type-micro" style={{ color: 'var(--status-success)' }}>{resolvedCount} RESOLVED</span>
              <span>✓</span>
            </div>
          </div>
        </div>

        {/* Section Header */}
        <div className="header-row">
          <div>
            <button
              onClick={() => navigate('/projects')}
              className="btn btn-outline"
              style={{ padding: '5px 10px', marginBottom: '8px', border: '1px solid var(--border-primary)' }}
            >
              <ArrowLeft size={14} /> ALL PROJECTS
            </button>
            <h1 className="type-hero" style={{ fontSize: '36px' }}>ISSUE TRACKER</h1>
          </div>

          {/* Create Issue Bar */}
          <form onSubmit={createBug} style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              placeholder="ISSUE TITLE..."
              value={newBug.title}
              onChange={e => setNewBug({ ...newBug, title: e.target.value })}
              required
              style={{ width: '220px' }}
            />
            <input
              placeholder="DETAILS (OPTIONAL)..."
              value={newBug.description}
              onChange={e => setNewBug({ ...newBug, description: e.target.value })}
              style={{ width: '200px' }}
            />
            <select
              value={newBug.priority}
              onChange={e => setNewBug({ ...newBug, priority: e.target.value })}
              style={{ width: '120px' }}
            >
              <option value="low">LOW</option>
              <option value="medium">MEDIUM</option>
              <option value="high">HIGH</option>
            </select>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loadingAI}
              style={{ display: 'flex', gap: '6px' }}
            >
              <Sparkles size={14} />
              {loadingAI ? 'TRIAGING...' : 'SUBMIT ISSUE →'}
            </button>
          </form>
        </div>

        {/* AI Insight Banner (Post-Creation) */}
        {aiInsight && (
          <div style={{ background: 'var(--bg-surface)', border: '2px solid var(--border-primary)', padding: '16px 20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-primary)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span className="badge badge-lime">GEMINI 4 AI TRIAGE</span>
                <span className="type-micro">AUTOMATED ASSESSMENT COMPLETE</span>
              </div>
              <button onClick={() => setAiInsight(null)} className="btn btn-outline" style={{ padding: '4px 8px' }}>
                <X size={14} />
              </button>
            </div>

            <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
              {aiInsight.suggestedPriority && (
                <span className="badge badge-dark">
                  RECOMMENDED PRIORITY: <strong>{aiInsight.suggestedPriority.toUpperCase()}</strong>
                </span>
              )}
              {aiInsight.tags?.map(tag => (
                <span key={tag} className="badge badge-indigo">#{tag.toUpperCase()}</span>
              ))}
            </div>

            {aiInsight.reasoning && (
              <p style={{ margin: '10px 0 0 0', fontSize: '13px', color: 'var(--ink-primary)' }}>
                <strong>Rationale:</strong> {aiInsight.reasoning}
              </p>
            )}

            {aiInsight.enhancedDescription && (
              <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: 'var(--ink-secondary)', fontStyle: 'italic' }}>
                <strong>Refined description:</strong> "{aiInsight.enhancedDescription}"
              </p>
            )}

            {/* Duplicates Alert */}
            {aiInsight.possibleDuplicates?.length > 0 && (
              <div style={{ marginTop: '14px', background: '#0F0F0F', color: '#F4F4F0', border: '1px solid var(--status-warning)', padding: '12px 14px' }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginBottom: '6px', color: 'var(--status-warning)' }}>
                  <AlertCircle size={15} />
                  <span className="type-micro" style={{ color: 'var(--status-warning)' }}>POTENTIAL DUPLICATE ISSUES DETECTED</span>
                </div>
                {aiInsight.possibleDuplicates.map((d, i) => (
                  <div key={i} style={{ fontSize: '12px', marginTop: '4px', display: 'flex', justifyContent: 'space-between' }}>
                    <span>• "{d.title}" — {d.reason}</span>
                    <span className="badge badge-lime tabular">{d.similarity} MATCH</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Issue Stack */}
        <div className="bug-stack">
          {bugs.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border-primary)' }}>
              <div className="type-h3">NO ISSUES LOGGED IN THIS REPOSITORY</div>
              <p style={{ color: 'var(--ink-secondary)', margin: '8px 0 0' }}>Log an issue using the bar above to run Gemini AI triage and deduplication.</p>
            </div>
          ) : (
            bugs.map(b => {
              const isOwner = currentUserId && (b.createdBy === currentUserId || b.owner === currentUserId || b.owner?._id === currentUserId);
              const isAssigned = b.assignedTo && (b.assignedTo._id === currentUserId || b.assignedTo === currentUserId);
              const canEdit = isAdmin || isOwner || isAssigned;
              const canDelete = isAdmin;
              const hasAI = b.aiSuggestedPriority || b.aiTags?.length > 0;
              const aiExpanded = expandedAI[b._id];

              return (
                <div key={b._id} style={{ display: 'flex', flexDirection: 'column' }}>
                  <div
                    onClick={() => setEditingBug(b)}
                    className="bug-row"
                    style={{ cursor: 'pointer' }}
                  >
                    <div style={{ maxWidth: '60%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '6px' }}>
                        <span className="type-h3" style={{ fontSize: '18px' }}>{b.title}</span>
                        <span className={`priority-badge ${b.priority}`}>{b.priority}</span>
                        <span className={`status-badge ${b.status ? b.status.replace(' ', '-') : 'open'}`}>
                          {b.status || 'open'}
                        </span>
                        {b.aiTags?.map(tag => (
                          <span key={tag} className="badge badge-dark" style={{ fontSize: '9px', padding: '1px 6px' }}>
                            #{tag.toUpperCase()}
                          </span>
                        ))}
                      </div>

                      <p style={{ margin: 0, fontSize: '13px', color: 'var(--ink-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {b.description || "No description provided."}
                      </p>

                      {b.assignedTo && (
                        <div className="type-micro" style={{ marginTop: '6px', color: 'var(--accent-indigo)' }}>
                          ASSIGNED: {b.assignedTo.username || b.assignedTo}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {/* AI suggestion pill if differing */}
                      {b.aiSuggestedPriority && b.aiSuggestedPriority !== b.priority && (
                        <span
                          className="badge badge-lime"
                          title={`AI recommends: ${b.aiSuggestedPriority}`}
                        >
                          AI: {b.aiSuggestedPriority.toUpperCase()}
                        </span>
                      )}

                      {/* Status Dropdown */}
                      <select
                        value={b.status || 'open'}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => updateStatus(e, b._id, e.target.value)}
                        disabled={!canEdit}
                        style={{ width: '130px', padding: '7px 10px', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase' }}
                      >
                        <option value="open">OPEN</option>
                        <option value="in-progress">IN PROGRESS</option>
                        <option value="resolved">RESOLVED</option>
                        <option value="closed">CLOSED</option>
                      </select>

                      {/* Comments Drawer Button */}
                      <button
                        onClick={(e) => openComments(e, b._id)}
                        className="btn btn-outline"
                        style={{ padding: '7px 10px', background: commentsBugId === b._id ? 'var(--accent-lime)' : 'transparent', color: commentsBugId === b._id ? '#0F0F0F' : 'inherit' }}
                        title="Discussion"
                      >
                        <MessageSquare size={14} />
                      </button>

                      {/* AI Expand Button */}
                      {hasAI && (
                        <button
                          onClick={(e) => { e.stopPropagation(); setExpandedAI(prev => ({ ...prev, [b._id]: !prev[b._id] })); }}
                          className="btn btn-outline"
                          style={{ padding: '7px 10px' }}
                          title="View AI details"
                        >
                          <Sparkles size={14} />
                        </button>
                      )}

                      {/* Re-triage button */}
                      <button
                        onClick={(e) => retriage(e, b._id)}
                        className="btn btn-outline"
                        style={{ padding: '7px 10px' }}
                        title="Re-run AI Triage"
                      >
                        ↺
                      </button>

                      {/* Delete */}
                      {canDelete && (
                        <button
                          onClick={(e) => deleteBug(e, b._id)}
                          className="btn btn-outline"
                          style={{ padding: '7px 10px', color: 'var(--status-danger)' }}
                          title="Delete issue"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded AI Insights Panel */}
                  {aiExpanded && hasAI && (
                    <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-primary)', borderTop: 'none', padding: '12px 20px', fontSize: '13px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
                        <span className="badge badge-lime">AI SYNTHESIS</span>
                        {b.aiSuggestedPriority && <span className="type-micro">SUGGESTED PRIORITY: {b.aiSuggestedPriority.toUpperCase()}</span>}
                      </div>
                      {b.aiEnhancedDescription && (
                        <p style={{ margin: '4px 0 0 0', fontStyle: 'italic', color: 'var(--ink-secondary)' }}>
                          {b.aiEnhancedDescription}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Comments Panel */}
                  {commentsBugId === b._id && (
                    <div
                      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-primary)', borderTop: 'none', padding: '16px 20px' }}
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="type-micro" style={{ marginBottom: '10px', letterSpacing: '0.06em' }}>
                        DISCUSSION THREAD // {b.title}
                      </div>

                      <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {comments.length === 0 ? (
                          <div style={{ color: 'var(--ink-muted)', fontSize: '12px' }}>No comments recorded yet.</div>
                        ) : (
                          comments.map(c => (
                            <div key={c._id} style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span className="type-micro" style={{ color: 'var(--accent-indigo)' }}>{c.createdBy?.username || 'USER'}</span>
                                  <span className="type-micro tabular" style={{ color: 'var(--ink-muted)', fontSize: '10px' }}>
                                    {new Date(c.createdAt).toLocaleTimeString()} • {new Date(c.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <p style={{ margin: '4px 0 0 0', fontSize: '13px' }}>{c.text}</p>
                              </div>

                              {(isAdmin || c.createdBy?._id === currentUserId) && (
                                <button
                                  onClick={() => deleteComment(c._id)}
                                  className="btn btn-outline"
                                  style={{ padding: '2px 6px', color: 'var(--status-danger)', border: 'none' }}
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>

                      <form onSubmit={submitComment} style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                        <input
                          placeholder="ADD COMMENT TO THREAD..."
                          value={newComment}
                          onChange={e => setNewComment(e.target.value)}
                        />
                        <button type="submit" className="btn btn-dark" style={{ flexShrink: 0 }}>POST →</button>
                      </form>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Edit Issue Modal */}
      {editingBug && (
        <div className="modal-backdrop" onClick={() => setEditingBug(null)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-primary)', paddingBottom: '12px' }}>
              <h2 className="type-h1" style={{ fontSize: '24px' }}>EDIT ISSUE SPEC</h2>
              <button type="button" onClick={() => setEditingBug(null)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            {/* AI suggestion shortcuts in modal */}
            {editingBug.aiSuggestedPriority && (
              <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-primary)', padding: '12px', marginBottom: '16px' }}>
                <div className="type-micro" style={{ marginBottom: '6px' }}>AI RECOMMENDATION</div>
                <button
                  type="button"
                  onClick={() => applyAIPriority(editingBug.aiSuggestedPriority)}
                  className="btn btn-lime"
                  style={{ padding: '5px 10px', fontSize: '10px' }}
                >
                  APPLY AI PRIORITY: {editingBug.aiSuggestedPriority.toUpperCase()} ↗
                </button>
              </div>
            )}

            <form onSubmit={saveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label>ISSUE TITLE</label>
                <input
                  value={editingBug.title}
                  onChange={e => setEditingBug({ ...editingBug, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <label>DESCRIPTION</label>
                <textarea
                  value={editingBug.description || ''}
                  onChange={e => setEditingBug({ ...editingBug, description: e.target.value })}
                  rows={4}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label>PRIORITY</label>
                  <select
                    value={editingBug.priority}
                    onChange={e => setEditingBug({ ...editingBug, priority: e.target.value })}
                  >
                    <option value="low">LOW</option>
                    <option value="medium">MEDIUM</option>
                    <option value="high">HIGH</option>
                  </select>
                </div>

                <div>
                  <label>LIFECYCLE STATUS</label>
                  <select
                    value={editingBug.status}
                    onChange={e => setEditingBug({ ...editingBug, status: e.target.value })}
                  >
                    <option value="open">OPEN</option>
                    <option value="in-progress">IN PROGRESS</option>
                    <option value="resolved">RESOLVED</option>
                    <option value="closed">CLOSED</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>SAVE CHANGES →</button>
                <button type="button" className="btn btn-outline" onClick={() => setEditingBug(null)}>CANCEL</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
