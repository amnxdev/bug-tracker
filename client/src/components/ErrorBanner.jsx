import React, { useState, useEffect } from 'react';
import { AlertCircle, X } from 'lucide-react';

export default function ErrorBanner() {
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    const handleForbidden = (event) => {
      setErrorMessage(event.detail || "Forbidden: You do not have permission for this action.");
    };

    window.addEventListener('orbit:forbidden', handleForbidden);
    return () => window.removeEventListener('orbit:forbidden', handleForbidden);
  }, []);

  if (!errorMessage) return null;

  return (
    <div
      role="alert"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 9999,
        background: 'var(--status-danger)',
        color: '#FFFFFF',
        borderBottom: '2px solid #991B1B',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        fontFamily: 'var(--font-sans)',
        fontSize: '12px',
        fontWeight: '700',
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <AlertCircle size={16} />
        <span>HTTP 403 FORBIDDEN: {errorMessage}</span>
      </div>
      <button
        type="button"
        onClick={() => setErrorMessage(null)}
        style={{
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.4)',
          color: '#FFFFFF',
          padding: '4px 8px',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '10px',
        }}
        title="Dismiss error banner"
      >
        <X size={12} />
        <span>DISMISS</span>
      </button>
    </div>
  );
}
