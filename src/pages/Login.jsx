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
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (!loading && user) navigate('/dashboard');
  }, [user, loading, navigate]);

  const handleSignIn = () => {
    const trimmed = email.trim();
    if (!trimmed) {
      setLocalError('Please enter the email address registered with us.');
      return;
    }
    setLocalError('');
    login(trimmed, '/dashboard');
  };

  const displayError = localError || (error ? decodeURIComponent(error) : '');

  return (
    <div className="login-page">
      <div className="login-layout">
        <div className="login-card">
          <div className="login-brand">
            <div className="brand-logo large">A</div>
            <h1>Acme Corp</h1>
            <p>Sign in with your Microsoft account</p>
          </div>

          {displayError && (
            <div className="alert-error">&#9888; {displayError}</div>
          )}

          <div className="form-group">
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setLocalError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleSignIn()}
              placeholder="you@example.com"
              autoFocus
              autoComplete="email"
            />
            <small>
              Only emails registered for this app can continue. If you need access, ask your administrator to add you to <code>usersList</code>.
            </small>
          </div>

          <div className="login-body">
            <MicrosoftButton onClick={handleSignIn} disabled={loading} />
          </div>

          <p className="login-admin-hint">
            After signing in, open{' '}
            <Link to="/admin/tenants">Client tenants</Link> to manage SSO configuration.
          </p>
        </div>
      </div>
    </div>
  );
}
