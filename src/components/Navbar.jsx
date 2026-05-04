import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const onLoginScreen = pathname === '/login' || pathname === '/auth/callback';

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to={user ? '/dashboard' : '/login'} className="navbar-brand">
        <div className="brand-logo">A</div>
        <span>Acme Corp</span>
      </Link>
      <div className="navbar-actions">
        {user ? (
          <>
            <Link to="/dashboard" className="nav-link">Dashboard</Link>
            <Link to="/admin/tenants" className="nav-link">Admin</Link>
            <div className="nav-avatar" title={user.email}>
              {user.name?.split(' ').map(p => p[0]).join('').slice(0, 2)}
            </div>
            <button type="button" className="btn-ghost" onClick={handleLogout}>Sign out</button>
          </>
        ) : (
          !onLoginScreen && (
            <Link to="/login" className="btn-primary-sm">Sign in</Link>
          )
        )}
      </div>
    </nav>
  );
}
