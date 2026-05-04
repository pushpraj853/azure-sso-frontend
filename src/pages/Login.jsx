import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import MicrosoftButton from '../components/MicrosoftButton';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const error = params.get('error');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!loading && user) navigate('/dashboard');
  }, [user, loading, navigate]);

  const handleUserLogin  = () => login(email.trim() || undefined, '/dashboard');
  const handleAdminLogin = () => login(email.trim() || undefined, '/admin/tenants');

  return (
    <div className="login-page">
    <div className="login-layout">
        {/* Login card */}
        <div className="login-card">
          <div className="login-brand">
            <div className="brand-logo large">A</div>
            <h1>Acme Corp</h1>
            <p>Sign in to your account</p>
          </div>

          {error && (
            <div className="alert-error">&#9888; {decodeURIComponent(error)}</div>
          )}

          <div className="form-group">
            <label htmlFor="login-email">
              Work or personal email <span style={{ color: '#aaa', fontWeight: 400 }}>(optional)</span>
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleUserLogin()}
              placeholder="you@yourcompany.com"
              autoFocus
            />
            <small>
              Entering your email pre-fills Microsoft's login page.
              If your company domain is configured, you'll be routed to your company's SSO.
            </small>
          </div>

          <div className="login-body">
            <MicrosoftButton onClick={handleUserLogin} disabled={loading} />
            <div className="login-divider-text">or</div>
            <button
              id="btn-admin-login"
              className="btn-admin"
              onClick={handleAdminLogin}
              disabled={loading}
            >
              🔧 Admin: Sign in with Microsoft
            </button>
            <small style={{ display: 'block', textAlign: 'center', marginTop: 6 }}>
              Admin login opens the Tenant Management panel after sign-in.
            </small>
          </div>
        </div>
      </div>

      {/* How it works — sibling of login-layout, not inside it */}
      <div className="how-it-works-box">
          <h3>How it works</h3>
          <div className="how-steps">

            <div className="how-step">
              <div className="how-step-num">1</div>
              <div className="how-step-label">You click Sign in</div>
              <div className="how-step-desc">
                Browser redirects to Microsoft's secure login at{' '}
                <code>login.microsoftonline.com</code>
              </div>
            </div>

            <div className="how-arrow">→</div>

            <div className="how-step">
              <div className="how-step-num">2</div>
              <div className="how-step-label">Microsoft authenticates</div>
              <div className="how-step-desc">
                You sign in with your Microsoft account. Microsoft issues a signed
                JWT containing your identity.
              </div>
            </div>

            <div className="how-arrow">→</div>

            <div className="how-step">
              <div className="how-step-num">3</div>
              <div className="how-step-label">We read your tenant</div>
              <div className="how-step-desc">
                JWT contains a <code>tid</code> (tenant ID). We match it against
                registered clients to identify your organisation.
              </div>
            </div>

          </div>
          <p className="how-note">
            Enterprise clients can provide their own Azure credentials so their employees
            are routed through their company's login.{' '}
            <Link to="/admin/tenants">Configure SSO →</Link>
          </p>
        </div>
    </div>
  );
}
