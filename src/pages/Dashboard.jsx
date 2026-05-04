import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate('/login');
  }, [user, loading, navigate]);

  const handleLogout = async () => { await logout(); navigate('/'); };

  if (loading || !user) {
    return (
      <div className="callback-page">
        <div className="callback-spinner"><div className="spinner" /><p>Loading…</p></div>
      </div>
    );
  }

  const isOwnTenant = user.tid?.includes('acme') || user.email?.endsWith('@acmecorp.com');

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          <h1>Welcome back, {user.name?.split(' ')[0]} 👋</h1>
          <p className="dash-sub">You're signed in to Acme Corp SaaS</p>
        </div>
        <button className="btn-ghost" onClick={handleLogout}>Sign out</button>
      </div>

      {/* Auth badge */}
      <div className="auth-badge" style={{ borderColor: user.brandColor || '#0078D4' }}>
        <div className="auth-badge-dot" style={{ background: user.brandColor || '#0078D4' }} />
        <div>
          <div className="auth-badge-label">Authenticated via</div>
          <div className="auth-badge-tenant" style={{ color: user.brandColor || '#0078D4' }}>
            {user.tenantDisplayName}
          </div>
        </div>
        <div className="auth-badge-mode">
          {user.isMock ? '🟡 Mock Mode' : '🟢 Real Azure'}
          {' · '}
          {user.tenantMode === 'dedicated' ? '🔑 Dedicated SSO' : '🌐 Standard Multi-tenant'}
        </div>
      </div>

      {/* User info grid */}
      <div className="info-grid">
        <div className="info-card">
          <label>Full Name</label>
          <value>{user.name}</value>
        </div>
        <div className="info-card">
          <label>Email</label>
          <value>{user.email}</value>
        </div>
        <div className="info-card">
          <label>Job Title</label>
          <value>{user.jobTitle || '—'}</value>
        </div>
        <div className="info-card">
          <label>Organization</label>
          <value>{user.tenantDisplayName}</value>
        </div>
        <div className="info-card full">
          <label>Azure Tenant ID (tid claim)</label>
          <value className="monospace">{user.tid}</value>
        </div>
        <div className="info-card">
          <label>SSO Mode</label>
          <value>{user.tenantMode === 'dedicated' ? 'Dedicated (client secrets)' : 'Standard Multi-tenant'}</value>
        </div>
        <div className="info-card">
          <label>Object ID (oid claim)</label>
          <value className="monospace">{user.oid}</value>
        </div>
      </div>

      {/* Token explanation */}
      <div className="token-explainer">
        <h2>How you were identified</h2>
        <div className="token-flow">
          <div className="token-step">
            <span className="token-step-num">1</span>
            <p>You clicked <strong>"Sign in with Microsoft"</strong></p>
          </div>
          <div className="token-arrow">→</div>
          <div className="token-step">
            <span className="token-step-num">2</span>
            <p>Microsoft issued a JWT with your <strong>tenant ID (tid)</strong></p>
          </div>
          <div className="token-arrow">→</div>
          <div className="token-step">
            <span className="token-step-num">3</span>
            <p>Backend matched <code>{user.tid?.slice(0, 16)}…</code> to <strong>{user.tenantDisplayName}</strong></p>
          </div>
          <div className="token-arrow">→</div>
          <div className="token-step">
            <span className="token-step-num">4</span>
            <p>Session created — no password stored</p>
          </div>
        </div>
      </div>

      <div className="dashboard-links">
        <Link to="/admin/tenants" className="btn-primary-sm">Manage Client Tenants →</Link>
      </div>
    </div>
  );
}
