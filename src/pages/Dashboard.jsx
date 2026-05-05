import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Row({ label, children }) {
  return (
    <div className="dash-card-row">
      <span className="dash-card-label">{label}</span>
      <span className="dash-card-value">{children}</span>
    </div>
  );
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="callback-page">
        <div className="callback-spinner"><div className="spinner" /><p>Loading…</p></div>
      </div>
    );
  }

  const accent = user.brandColor || '#0078D4';

  return (
    <div className="dashboard-page">
      <article className="dash-single-card" style={{ borderTopColor: accent }}>
        <header className="dash-card-header">
          <div className="dash-card-title-wrap">
            <h1 className="dash-card-title">Signed in</h1>
            <p className="dash-card-sub">{user.tenantDisplayName}</p>
          </div>
          <span
            className="dash-mode-pill"
            style={{ borderColor: accent, color: accent }}
          >
            {user.tenantMode === 'dedicated' ? 'Dedicated SSO' : 'Multi-tenant'}
          </span>
        </header>

        <div className="dash-card-rows">
          <Row label="Name">{user.name || '—'}</Row>
          <Row label="Email">{user.email || '—'}</Row>
          <Row label="Job title">{user.jobTitle || '—'}</Row>
          <Row label="Tenant ID (tid)"><code className="dash-mono">{user.tid}</code></Row>
          <Row label="Object ID (oid)"><code className="dash-mono">{user.oid}</code></Row>
        </div>
      </article>
    </div>
  );
}
