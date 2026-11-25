import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, X, MessageSquare, Sparkles, AlertCircle, UserCheck, CheckCircle2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

export default function ProjectDetails() {
  const { id } = useParams();
  const [bugs, setBugs] = useState([]);
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();
  const [newBug, setNewBug] = useState({ title: '', description: '', priority: 'medium' });
  const [editingBug, setEditingBug] = useState(null);
  const [theme, setTheme] = useState(document.documentElement.getAttribute('data-theme') || 'light');
  const [localError, setLocalError] = useState(null);

  // AI & Comments state
  const [aiInsight, setAiInsight] = useState(null);
  const [commentsBugId, setCommentsBugId] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingAI, setLoadingAI] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [slowWake, setSlowWake] = useState(false);
  const [expandedAI, setExpandedAI] = useState({});

  // Client-side filter state
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { user, isAdmin, currentUserId } = useAuth();

  useEffect(() => {
    if (!loading && !loadingAI && !submitting) {
      setSlowWake(false);
      return;
    }
    const timer = setTimeout(() => setSlowWake(true), 5000);
    return () => clearTimeout(timer);
  }, [loading, loadingAI, submitting]);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    document.documentElement.setAttribute('data-theme', next);
  };

  /* ── Data Loaders ── */
  const loadBugs = async () => {
    setLoading(true);
    setLocalError(null);
    try {
      const { data } = await api.get(`/projects/${id}/bugs`);
      setBugs(data);
    } catch (e) {
      console.error(e);
      setLocalError(e.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    if (!isAdmin) return;
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch (e) {
      console.error("Could not load users list", e);
    }
  };

  const loadComments = async (bugId) => {
    try {
      const { data } = await api.get(`/bugs/${bugId}/comments`);
      setComments(data);
    } catch (e) {
      console.error(e);
      setLocalError(e.response?.data?.message || "Failed to load comments");
    }
  };

  useEffect(() => {
    loadBugs();
    loadUsers();
  }, [id, isAdmin]);

  /* ── Bug Actions ── */
  const createBug = async (e) => {
    e.preventDefault();
    if (!newBug.title.trim()) return;
    setLoadingAI(true);
    setAiInsight(null);
    setLocalError(null);
    try {
      const { data } = await api.post(`/projects/${id}/bugs`, newBug);
      setNewBug({ title: '', description: '', priority: 'medium' });
      if (data.ai) setAiInsight(data.ai);
      loadBugs();
    } catch (e) {
      setLocalError(e.response?.data?.message || "Failed to create issue");
    } finally {
      setLoadingAI(false);
    }
  };

  // Delete bug — allowed only if user is admin or creator
  const deleteBug = async (e, bugId) => {
    e.stopPropagation();
    if (!window.confirm("Permanently delete this issue? This will remove all associated comments.")) {
      return;
    }
    setLocalError(null);
    try {
      await api.delete(`/bugs/${bugId}`);
      setBugs(c => c.filter(b => b._id !== bugId));
      if (editingBug?._id === bugId) setEditingBug(null);
    } catch (e) {
      setLocalError(e.response?.data?.message || "Failed to delete issue");
    }
  };

  const updateStatus = async (e, bugId, newStatus) => {
    e.stopPropagation();
    setLocalError(null);
    try {
      await api.put(`/bugs/${bugId}`, { status: newStatus });
      loadBugs();
    } catch (e) {
      setLocalError(e.response?.data?.message || "Failed to update status");
    }
  };

  const closeBug = async (e, bugId) => {
    e.stopPropagation();
    setLocalError(null);
    try {
      await api.put(`/bugs/${bugId}`, { status: 'closed' });
      loadBugs();
    } catch (e) {
      setLocalError(e.response?.data?.message || "Failed to close issue");
    }
  };

  const handleAssignBug = async (e, bugId, currentAssignee) => {
    e.stopPropagation();
    const promptValue = window.prompt(
      "Assign developer to issue:\nEnter username, email, or user ID (leave blank to unassign):",
      currentAssignee?.username || currentAssignee?.email || ""
    );
    if (promptValue === null) return; // Cancelled
    setLocalError(null);
    try {
      await api.put(`/bugs/${bugId}/assign`, { assignedTo: promptValue.trim() });
      loadBugs();
    } catch (err) {
      setLocalError(err.response?.data?.message || "Failed to assign issue");
    }
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setLocalError(null);
    try {
      await api.put(`/bugs/${editingBug._id}`, {
        title: editingBug.title,
        description: editingBug.description,
        priority: editingBug.priority,
        status: editingBug.status
      });

      if (isAdmin && editingBug.assignedToInput !== undefined) {
        await api.put(`/bugs/${editingBug._id}/assign`, {
          assignedTo: editingBug.assignedToInput.trim()
        });
      }

      setEditingBug(null);
      await loadBugs();
    } catch (err) {
      setLocalError(err.response?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const applyAIPriority = (priority) => {
    setEditingBug(prev => ({ ...prev, priority }));
  };

  /* ── On-demand AI Re-triage ── */
  const retriage = async (e, bugId) => {
    e.stopPropagation();
    setLocalError(null);
    try {
      await api.post(`/bugs/${bugId}/retriage`);
      loadBugs();
      setExpandedAI(prev => ({ ...prev, [bugId]: true }));
    } catch (e) {
      setLocalError(e.response?.data?.message || "AI retriage failed");
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
    setSubmitting(true);
    setLocalError(null);
    try {
      await api.post(`/bugs/${commentsBugId}/comments`, { text: newComment });
      setNewComment('');
      await loadComments(commentsBugId);
    } catch (e) {
      setLocalError(e.response?.data?.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (commentId) => {
    if (!window.confirm("Delete comment?")) return;
    setLocalError(null);
    try {
      await api.delete(`/bugs/${commentsBugId}/comments/${commentId}`);
      loadComments(commentsBugId);
    } catch (e) {
      setLocalError(e.response?.data?.message || "Failed to delete comment");
    }
  };

  const openCount = bugs.filter(b => b.status === 'open' || !b.status).length;
  const inProgressCount = bugs.filter(b => b.status === 'in-progress').length;
  const resolvedCount = bugs.filter(b => b.status === 'resolved' || b.status === 'closed').length;
  const highPriorityCount = bugs.filter(b => b.priority === 'high').length;

  const filteredBugs = bugs.filter((b) => {
    const bugStatus = b.status || 'open';
    const matchesStatus = statusFilter === 'all' || bugStatus === statusFilter;
    const matchesPriority = priorityFilter === 'all' || b.priority === priorityFilter;
    const matchesSearch = !searchQuery.trim() || (b.title || '').toLowerCase().includes(searchQuery.trim().toLowerCase());
    return matchesStatus && matchesPriority && matchesSearch;
  });

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <Navbar subtitle="// GEMINI 2.5 FLASH // ISSUE MANAGEMENT" theme={theme} toggleTheme={toggleTheme} />

      {/* Local Error Banner */}
      {localError && (
        <div
          role="alert"
          style={{
            background: 'var(--status-danger)',
            color: '#FFFFFF',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            fontWeight: '700',
            letterSpacing: '0.04em',
            borderBottom: '2px solid #991B1B'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>ERROR: {localError}</span>
          </div>
          <button
            type="button"
            onClick={() => setLocalError(null)}
            style={{ background: 'transparent', border: 'none', color: '#FFFFFF', cursor: 'pointer', padding: 0 }}
          >
            <X size={14} />
          </button>
        </div>
      )}

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
              <span className="type-micro" style={{ color: 'var(--ink-secondary)' }}>ACTIVE DEVELOPMENT</span>
              <span>●</span>
            </div>
          </div>

          <div className="kpi-cell">
            <div className="kpi-top">
              <span className="type-micro">HIGH SEVERITY</span>
              <span>↗</span>
            </div>
            <div className="type-h2-kpi" style={{ color: 'var(--status-danger)' }}>{highPriorityCount}</div>
            <div className="kpi-bottom">
              <span className="type-micro" style={{ color: 'var(--status-danger)' }}>IMMEDIATE ATTENTION</span>
              <span>●</span>
            </div>
          </div>
        </div>

        {/* Action Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <button onClick={() => navigate('/projects')} className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <ArrowLeft size={14} /> BACK TO REPOSITORIES
          </button>
          <div className="type-micro" style={{ color: 'var(--ink-secondary)' }}>
            REPOSITORIES // {id}
          </div>
        </div>

        {/* Issue Ingestion Bar */}
        <div className="search-bar" style={{ marginBottom: '24px' }}>
          <form onSubmit={createBug} style={{ display: 'flex', gap: '8px', width: '100%', flexWrap: 'wrap' }}>
            <input
              placeholder="ISSUE TITLE / VULNERABILITY..."
              value={newBug.title}
              onChange={e => setNewBug({ ...newBug, title: e.target.value })}
              required
              style={{ flex: 2, minWidth: '220px' }}
            />
            <input
              placeholder="INCIDENT DETAILS / REPRODUCTION..."
              value={newBug.description}
              onChange={e => setNewBug({ ...newBug, description: e.target.value })}
              style={{ flex: 3, minWidth: '260px' }}
            />
            <select
              value={newBug.priority}
              onChange={e => setNewBug({ ...newBug, priority: e.target.value })}
              style={{ width: '130px', flexShrink: 0 }}
            >
              <option value="low">LOW PRIORITY</option>
              <option value="medium">MEDIUM PRIORITY</option>
              <option value="high">HIGH PRIORITY</option>
            </select>
            <button
              type="submit"
              disabled={loadingAI}
              className="btn btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}
            >
              {loadingAI ? (
                <>AI TRIAGING...</>
              ) : (
                <>
                  <Sparkles size={14} /> LOG ISSUE →
                </>
              )}
            </button>
          </form>
        </div>

        {/* AI Insight Live Feedback Banner */}
        {aiInsight && (
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--accent-lime)', padding: '16px 20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span className="badge badge-lime">GEMINI AI TRIAGE REPORT</span>
              <span className="type-micro" style={{ color: 'var(--ink-primary)' }}>AUTO-CLASSIFIED PRIORITY: {aiInsight.suggestedPriority?.toUpperCase()}</span>
            </div>
            {aiInsight.reasoning && (
              <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: 'var(--ink-secondary)' }}>
                <strong>Reasoning:</strong> {aiInsight.reasoning}
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

        {/* Client-side Filter Bar */}
        <div className="search-bar" style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="SEARCH ISSUES BY TITLE..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ flex: 2, minWidth: '220px' }}
          />
          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '160px', flexShrink: 0 }}
          >
            <option value="all">STATUS: ALL</option>
            <option value="open">OPEN</option>
            <option value="in-progress">IN PROGRESS</option>
            <option value="resolved">RESOLVED</option>
            <option value="closed">CLOSED</option>
          </select>
          <select
            aria-label="Filter by priority"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            style={{ width: '160px', flexShrink: 0 }}
          >
            <option value="all">PRIORITY: ALL</option>
            <option value="low">LOW</option>
            <option value="medium">MEDIUM</option>
            <option value="high">HIGH</option>
          </select>
        </div>

        {/* Loading & Slow Wake Indicator */}
        {(loading || loadingAI || submitting) && (
          <div className="type-mono" style={{ padding: '10px 0', color: 'var(--ink-secondary)' }}>
            LOADING...
            {slowWake && (
              <span style={{ marginLeft: '10px', color: 'var(--status-warning)' }}>
                Server is waking up, this can take up to 50 seconds
              </span>
            )}
          </div>
        )}

        {/* Issue Stack */}
        <div className="bug-stack">
          {loading ? null : bugs.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border-primary)' }}>
              <div className="type-h3">No bugs yet. Log your first issue.</div>
              <p style={{ color: 'var(--ink-secondary)', margin: '8px 0 0' }}>Log an issue using the bar above to run Gemini AI triage and deduplication.</p>
            </div>
          ) : filteredBugs.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center', background: 'var(--bg-surface)', border: '1px solid var(--border-primary)' }}>
              <div className="type-h3">No bugs match these filters</div>
            </div>
          ) : (
            filteredBugs.map(b => {
              const creatorId = String(b.createdBy?._id || b.createdBy || b.owner?._id || b.owner || '');
              const isOwner = currentUserId && creatorId === String(currentUserId);
              const assignedId = String(b.assignedTo?._id || b.assignedTo || '');
              const isAssigned = currentUserId && assignedId === String(currentUserId);

              // RBAC Permission Invariants
              const canEdit = isAdmin || isOwner || isAssigned;
              const canDeleteOrClose = isAdmin || isOwner;
              const hasAI = b.aiSuggestedPriority || b.aiTags?.length > 0;
              const aiExpanded = expandedAI[b._id];

              const assigneeName = b.assignedTo?.username || b.assignedTo?.email || (typeof b.assignedTo === 'string' && b.assignedTo.trim() ? b.assignedTo : null);

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

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                        <span className="type-micro" style={{ color: assigneeName ? 'var(--accent-indigo)' : 'var(--ink-muted)' }}>
                          ASSIGNED: {assigneeName || 'Unassigned'}
                        </span>

                        {/* Assign trigger — rendered ONLY for admins */}
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={(e) => handleAssignBug(e, b._id, b.assignedTo)}
                            className="btn btn-outline"
                            style={{ padding: '2px 8px', fontSize: '10px' }}
                            title="Assign or reassign developer (Admin only)"
                          >
                            <UserCheck size={11} style={{ marginRight: '4px' }} />
                            {assigneeName ? 'REASSIGN' : 'ASSIGN'}
                          </button>
                        )}
                      </div>
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
                        {/* Status 'closed' rendered ONLY if user is admin or creator */}
                        {canDeleteOrClose && <option value="closed">CLOSED</option>}
                      </select>

                      {/* Quick "Close" Button — rendered ONLY if user is admin or creator */}
                      {canDeleteOrClose && b.status !== 'closed' && (
                        <button
                          type="button"
                          onClick={(e) => closeBug(e, b._id)}
                          className="btn btn-outline"
                          style={{ padding: '7px 10px', color: 'var(--status-success)' }}
                          title="Close issue (Admin or Creator only)"
                        >
                          <CheckCircle2 size={14} style={{ marginRight: '4px' }} />
                          CLOSE
                        </button>
                      )}

                      {/* Comments Drawer Button */}
                      <button
                        type="button"
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
                          type="button"
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
                        type="button"
                        onClick={(e) => retriage(e, b._id)}
                        className="btn btn-outline"
                        style={{ padding: '7px 10px' }}
                        title="Re-run AI Triage"
                      >
                        ↺
                      </button>

                      {/* Delete Button — rendered ONLY if user is admin or creator */}
                      {canDeleteOrClose && (
                        <button
                          type="button"
                          onClick={(e) => deleteBug(e, b._id)}
                          className="btn btn-outline"
                          style={{ padding: '7px 10px', color: 'var(--status-danger)' }}
                          title="Delete issue (Admin or Creator only)"
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

                              {(isAdmin || String(c.createdBy?._id || c.createdBy) === String(currentUserId)) && (
                                <button
                                  type="button"
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
                        <button type="submit" className="btn btn-dark" disabled={submitting} style={{ flexShrink: 0 }}>
                          {submitting ? 'POSTING...' : 'POST →'}
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Edit / Bug Detail Modal */}
      {editingBug && (() => {
        const modalCreatorId = String(editingBug.createdBy?._id || editingBug.createdBy || editingBug.owner?._id || editingBug.owner || '');
        const modalCanDeleteOrClose = isAdmin || (currentUserId && modalCreatorId === String(currentUserId));
        const modalAssigneeName = editingBug.assignedTo?.username || editingBug.assignedTo?.email || (typeof editingBug.assignedTo === 'string' && editingBug.assignedTo.trim() ? editingBug.assignedTo : null);

        return (
          <div className="modal-backdrop" onClick={() => setEditingBug(null)}>
            <div className="modal-dialog" onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-primary)', paddingBottom: '12px' }}>
                <h2 className="type-h1" style={{ fontSize: '24px' }}>BUG DETAIL &amp; EDIT SPEC</h2>
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

                {/* Bug Detail: Assign dropdown rendered ONLY for admins; for others show assignee name as plain text ("Unassigned" if none) */}
                <div>
                  <label>ASSIGNED DEVELOPER</label>
                  {isAdmin ? (
                    <select
                      value={editingBug.assignedToInput !== undefined ? editingBug.assignedToInput : (editingBug.assignedTo?._id || (typeof editingBug.assignedTo === 'string' ? editingBug.assignedTo : ''))}
                      onChange={e => setEditingBug({ ...editingBug, assignedToInput: e.target.value })}
                    >
                      <option value="">-- UNASSIGNED --</option>
                      {users.map(u => (
                        <option key={u._id} value={u._id}>
                          {u.username} ({u.email}) [{u.role.toUpperCase()}]
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div
                      style={{
                        padding: '11px 14px',
                        border: '1px solid var(--border-primary)',
                        background: 'var(--bg-subtle)',
                        color: 'var(--ink-primary)',
                        fontSize: '13px',
                        fontWeight: '500',
                      }}
                    >
                      {modalAssigneeName || 'Unassigned'}
                    </div>
                  )}
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
                      {/* Close status rendered ONLY for admin or creator */}
                      {modalCanDeleteOrClose && <option value="closed">CLOSED</option>}
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                  <button type="submit" className="btn btn-primary" disabled={submitting} style={{ flex: 1 }}>
                    {submitting ? 'SAVING...' : 'SAVE CHANGES →'}
                  </button>

                  {/* Delete button in modal — rendered ONLY for admin or creator */}
                  {modalCanDeleteOrClose && (
                    <button
                      type="button"
                      className="btn btn-outline"
                      style={{ color: 'var(--status-danger)' }}
                      onClick={(e) => deleteBug(e, editingBug._id)}
                    >
                      DELETE ISSUE
                    </button>
                  )}

                  <button type="button" className="btn btn-outline" onClick={() => setEditingBug(null)}>
                    CANCEL
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
