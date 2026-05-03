import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <section className="landing">
      <div className="hero-card">
        <div className="hero-copy">
          <p className="eyebrow">Filipino Learning Companion</p>
          <h1>Tuklas Talino</h1>
          <p className="hero-subtitle">
            Isang makulay na learning system para sa pagbasa, bokabularyo, panitikan, oral communication, at pagsulat.
          </p>
          <div className="role-grid">
            <Link className="role-card student" to="/login/student">
              <span>🧒</span><strong>Student Login</strong><small>Student ID + password</small>
            </Link>
            <Link className="role-card teacher" to="/login/teacher">
              <span>👩‍🏫</span><strong>Teacher Login</strong><small>Monitor progress</small>
            </Link>
            <Link className="role-card admin" to="/login/admin">
              <span>🛡️</span><strong>Admin Login</strong><small>Manage accounts</small>
            </Link>
          </div>
        </div>
        <div className="mascot-panel" aria-hidden="true">
          <span className="mascot">📚</span>
          <div className="floating-badge one">XP +20</div>
          <div className="floating-badge two">🏅 Badge</div>
          <div className="floating-badge three">🎙️ Oral</div>
        </div>
      </div>
    </section>
  );
}
