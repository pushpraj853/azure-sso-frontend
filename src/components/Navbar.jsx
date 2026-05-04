import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <Link to="/login" className="navbar-brand">
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
            <button className="btn-ghost" onClick={handleLogout}>Sign out</button>
          </>
        ) : (
          /* Directly triggers Microsoft SSO — not just a link to /login */
          <button className="btn-primary-sm" onClick={() => login()}>Sign in</button>
        )}
      </div>
    </nav>
  );
}
