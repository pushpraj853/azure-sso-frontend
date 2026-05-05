import MicrosoftButton from '../components/MicrosoftButton';
import { useAuth } from '../context/AuthContext';

export default function Landing() {
  const { login } = useAuth();

  return (
    <div className="landing">
      <section className="hero">
        <div className="hero-badge">Enterprise SSO Platform</div>
        <h1 className="hero-title">
          Secure access for<br />
          <span className="gradient-text">every organization</span>
        </h1>
        <p className="hero-sub">
          Acme Corp SaaS — built on Microsoft Azure Active Directory.<br />
          Sign in with your company's Microsoft account, no extra passwords.
        </p>
        <div className="hero-cta">
          <MicrosoftButton onClick={login} />
        </div>
        <p className="hero-note">
          Supports multi-tenant SSO. Clients can configure dedicated Azure AD credentials.
        </p>
      </section>

      <section className="features">
        <div className="feature-card">
          <div className="feature-icon">🔐</div>
          <h3>Microsoft Azure SSO</h3>
          <p>Standard multi-tenant sign-in using your existing Microsoft/Outlook account.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🏢</div>
          <h3>Dedicated Client Tenants</h3>
          <p>Enterprise clients can provide their own Azure AD credentials for a dedicated SSO experience.</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">⚡</div>
          <h3>Fast provisioning</h3>
          <p>Map organizations to your app’s tenant registry as you grow — no app restarts for new IdP links.</p>
        </div>
      </section>

      <section className="how-it-works">
        <h2>How it works</h2>
        <div className="steps">
          <div className="step">
            <div className="step-num">1</div>
            <p>User clicks <strong>"Sign in with Microsoft"</strong></p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-num">2</div>
            <p>Microsoft detects their <strong>company tenant</strong></p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-num">3</div>
            <p>Token returned with <strong>tenant ID</strong> claim</p>
          </div>
          <div className="step-arrow">→</div>
          <div className="step">
            <div className="step-num">4</div>
            <p>App resolves client from <strong>tenant registry</strong></p>
          </div>
        </div>
      </section>
    </div>
  );
}
