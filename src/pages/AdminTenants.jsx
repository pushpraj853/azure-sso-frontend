import { useState, useEffect } from 'react';

const API = 'http://localhost:3001';
const EMPTY = { displayName: '', tenantId: '', allowedDomains: '', brandColor: '#0078D4', mode: 'standard', clientId: '', clientSecret: '' };

export default function AdminTenants() {
  const [tenants, setTenants] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [status, setStatus] = useState('');

  const load = async () => {
    const res = await fetch(`${API}/api/tenants`, { credentials: 'include' });
    if (res.ok) setTenants(await res.json());
  };

  useEffect(() => { load(); }, []);

  const save = async (e) => {
    e.preventDefault();
    setStatus('saving');
    const body = {
      ...form,
      allowedDomains: form.allowedDomains ? form.allowedDomains.split(',').map(s => s.trim()) : [],
    };
    const url = editing ? `${API}/api/tenants/${editing}` : `${API}/api/tenants`;
    const method = editing ? 'PUT' : 'POST';
    const res = await fetch(url, { method, credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (res.ok) { setStatus('saved'); await load(); cancelForm(); setTimeout(() => setStatus(''), 2000); }
    else { setStatus('error'); }
  };

  const remove = async (id) => {
    if (!confirm('Remove this tenant? This cannot be undone.')) return;
    await fetch(`${API}/api/tenants/${id}`, { method: 'DELETE', credentials: 'include' });
    await load();
  };

  const startEdit = (t) => {
    setForm({ ...t, allowedDomains: (t.allowedDomains || []).join(', '), clientSecret: '' });
    setEditing(t.id);
    setShowForm(true);
  };

  const cancelForm = () => { setForm(EMPTY); setEditing(null); setShowForm(false); };

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div>
          <h1>Client SSO Tenants</h1>
          <p>Manage enterprise clients and their Azure AD configurations</p>
        </div>
        <button className="btn-primary-sm" onClick={() => setShowForm(true)} id="btn-add-tenant">
          + Add Client
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && cancelForm()}>
          <form className="modal-card" onSubmit={save}>
            <h2>{editing ? 'Edit Tenant' : 'Add New Client Tenant'}</h2>

            <div className="form-row">
              <div className="form-group">
                <label>Display Name *</label>
                <input required value={form.displayName} onChange={e => setForm(f => ({ ...f, displayName: e.target.value }))} placeholder="Contoso Ltd." />
              </div>
              <div className="form-group">
                <label>Brand Color</label>
                <div className="color-input-row">
                  <input type="color" value={form.brandColor} onChange={e => setForm(f => ({ ...f, brandColor: e.target.value }))} />
                  <input value={form.brandColor} onChange={e => setForm(f => ({ ...f, brandColor: e.target.value }))} placeholder="#0078D4" />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Azure Tenant ID *</label>
              <input required value={form.tenantId} onChange={e => setForm(f => ({ ...f, tenantId: e.target.value }))} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className="monospace" />
              <small>Found in Azure Portal → Azure Active Directory → Overview</small>
            </div>

            <div className="form-group">
              <label>Allowed Domains</label>
              <input value={form.allowedDomains} onChange={e => setForm(f => ({ ...f, allowedDomains: e.target.value }))} placeholder="contoso.com, contoso.onmicrosoft.com" />
              <small>Comma-separated. Used for informational display only.</small>
            </div>

            <div className="form-group">
              <label>SSO Mode</label>
              <select value={form.mode} onChange={e => setForm(f => ({ ...f, mode: e.target.value }))}>
                <option value="standard">Standard Multi-tenant (no client secrets needed)</option>
                <option value="dedicated">Dedicated (client provides their own app registration)</option>
              </select>
            </div>

            {form.mode === 'dedicated' && (
              <>
                <div className="form-group">
                  <label>Client ID</label>
                  <input value={form.clientId} onChange={e => setForm(f => ({ ...f, clientId: e.target.value }))} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" className="monospace" />
                  <small>The Application (client) ID from the client's Azure App Registration</small>
                </div>
                <div className="form-group">
                  <label>Client Secret {editing && <span className="dim">(leave blank to keep existing)</span>}</label>
                  <input type="password" value={form.clientSecret} onChange={e => setForm(f => ({ ...f, clientSecret: e.target.value }))} placeholder={editing ? '••••••••' : 'Enter client secret'} />
                  <small>Provided by the client from their Azure App Registration</small>
                </div>
              </>
            )}

            <div className="form-actions">
              <button type="button" className="btn-ghost" onClick={cancelForm}>Cancel</button>
              <button type="submit" className="btn-primary-sm" disabled={status === 'saving'}>
                {status === 'saving' ? 'Saving…' : editing ? 'Save Changes' : 'Add Tenant'}
              </button>
            </div>
            {status === 'saved' && <p className="status-ok">✓ Saved successfully</p>}
            {status === 'error' && <p className="status-err">✗ Save failed — check the console</p>}
          </form>
        </div>
      )}

      <div className="tenant-grid">
        {tenants.length === 0 && (
          <div className="empty-state">No client tenants configured yet. Add your first client above.</div>
        )}
        {tenants.map(t => (
          <div className="tenant-card" key={t.id} style={{ borderTopColor: t.brandColor }}>
            <div className="tenant-card-header">
              <div className="tenant-dot" style={{ background: t.brandColor }} />
              <h3>{t.displayName}</h3>
              <span className={`mode-badge ${t.mode}`}>{t.mode === 'dedicated' ? '🔑 Dedicated' : '🌐 Standard'}</span>
            </div>
            <div className="tenant-meta">
              <div><span>Tenant ID</span><code>{t.tenantId}</code></div>
              {t.clientId && <div><span>Client ID</span><code>{t.clientId}</code></div>}
              {t.allowedDomains?.length > 0 && <div><span>Domains</span><span>{t.allowedDomains.join(', ')}</span></div>}
              <div><span>Added</span><span>{new Date(t.createdAt).toLocaleDateString()}</span></div>
            </div>
            <div className="tenant-card-actions">
              <button className="btn-ghost-sm" onClick={() => startEdit(t)}>Edit</button>
              <button className="btn-danger-sm" onClick={() => remove(t.id)}>Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
