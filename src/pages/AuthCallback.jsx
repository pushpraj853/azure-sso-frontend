import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthCallback() {
  const [params] = useSearchParams();
  const { refetch } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const success = params.get('success');
    const error = params.get('error');
    if (error) {
      navigate(`/login?error=${encodeURIComponent(error)}`);
      return;
    }

    if (success) {
      refetch().then(() => navigate('/dashboard'));
      return;
    }

    navigate('/login');
  }, [params, refetch, navigate]);

  return (
    <div className="callback-page">
      <div className="callback-spinner">
        <div className="spinner"></div>
        <p>Completing sign in…</p>
      </div>
    </div>
  );
}
