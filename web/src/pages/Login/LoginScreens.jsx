import React, { useState } from 'react';
const EyeIcon = () => (
  <svg viewBox="0 0 24 24" className="password-eye-svg" aria-hidden="true">
    <path d="M2.25 12s3.5-6.75 9.75-6.75S21.75 12 21.75 12s-3.5 6.75-9.75 6.75S2.25 12 2.25 12Z" />
    <circle cx="12" cy="12" r="2.75" />
  </svg>
);

const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" className="password-eye-svg" aria-hidden="true">
    <path d="M3 3l18 18" />
    <path d="M10.6 5.35A9.7 9.7 0 0 1 12 5.25c6.25 0 9.75 6.75 9.75 6.75a17.8 17.8 0 0 1-3.07 3.95" />
    <path d="M6.35 6.9C3.75 8.7 2.25 12 2.25 12s3.5 6.75 9.75 6.75c1.53 0 2.9-.4 4.08-1.02" />
    <path d="M9.9 9.9a2.75 2.75 0 0 0 3.9 3.9" />
  </svg>
);

export function StudentLogin({ go, onLogin }) {
  const [studentIdValue, setStudentIdValue] = useState('');
const [showStudentPassword, setShowStudentPassword] = useState(false);
return <>
    <div className="top-nav login-top-nav login-student-nav"><button className="btn btn-outline btn-sm" onClick={() => go('screen-home')}>← Home</button><div className="logo">🎒 Student Login</div><div className="login-nav-pill">⭐ Tuklas. Matuto. Magsaya!</div></div>
    <div className="login-stage student-stage"><div className="login-shell student-shell">
      <aside className="login-visual-card student-visual-card"><div className="login-sparkles">✦</div><h2>Mag-login,<br />Estudyante! 👋</h2><p>Ilagay ang Student ID at password para magpatuloy.</p><div className="student-hero-illustration login-hero-png-wrap" aria-hidden="true"><img src="/login-student-girl.png" alt="" className="login-hero-png student" /></div><div className="login-info-card"><span className="info-icon">🛡️</span><div><b>Ligtas • Masaya • Makabuluhan</b><br /><span>Tuklas Talino, kasama mo sa bawat hakbang.</span></div></div></aside>
      <section className="login-form-panel student-form-panel"><div className="login-form-heading"><span className="heading-badge">🪪</span><div><h3>Mag-login bilang Estudyante</h3><p>Ilagay ang Student ID at password para magpatuloy.</p></div></div><label className="login-label" htmlFor="stu-id">🪪 Student ID</label><div className="input-with-icon"><span>👤</span><input className="input-field" id="stu-id" value={studentIdValue} onChange={(event) => setStudentIdValue(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); onLogin(); } }} /></div><label className="login-label" htmlFor="stu-password">🔒 Password</label><div className="input-with-icon"><span>🔐</span><input className="input-field" id="stu-password" type={showStudentPassword ? "text" : "password"} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); onLogin(); } }} /><button type="button" className="password-eye-btn" aria-label={showStudentPassword ? "Hide password" : "Show password"} onClick={() => setShowStudentPassword((value) => !value)}>{showStudentPassword ? <EyeOffIcon /> : <EyeIcon />}</button></div><button className="btn btn-green login-main-btn" onClick={onLogin}>✨ Login</button><p className="secure-note">🔒 Ang iyong impormasyon ay ligtas at protektado.</p></section>
    </div></div>
  </>;
}

export function TeacherLogin({ go, onLogin }) {
  const [showTeacherPassword, setShowTeacherPassword] = useState(false);
  const [teacherIdentifier, setTeacherIdentifier] = useState('');
  const teacherLoginDisabled = false;
function handleTeacherIdentifierChange(event) {
    const value = event.target.value
      .replace(/\s+/g, '')
      .replace(/[^A-Za-z0-9._@-]/g, '')
      .toUpperCase();

    setTeacherIdentifier(value);
  }

  function submitTeacherLogin(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      if (!teacherLoginDisabled) onLogin();
    }
  }

  return <>
    <div className="top-nav login-top-nav login-teacher-nav">
      <button className="btn btn-outline btn-sm" onClick={() => go('screen-home')}>← Home</button>
      <div className="logo">👩‍🏫 Teacher Login</div>
      <div className="login-nav-pill teacher-pill">⭐ Salamat sa dedikasyon, Guro!</div>
    </div>

    <div className="login-stage teacher-stage">
      <div className="login-shell teacher-shell">
        <aside className="login-visual-card teacher-visual-card">
          <h2>Inspire<br />Educate<br />Empower</h2>
          <div className="teacher-hero-illustration login-hero-png-wrap" aria-hidden="true">
            <img src="/landing-teacher.png" alt="" className="login-hero-png teacher" />
          </div>
          <div className="login-info-card">
            <span className="info-icon">👥</span>
            <div>
              <b>Tuklas Talino para sa mga Guro</b><br />
              <span>Pamahalaan ang klase, gumawa ng aralin, at subaybayan ang progreso.</span>
            </div>
          </div>
        </aside>

        <section className="login-form-panel teacher-form-panel">
          <h2>Mag-login, Guro!</h2>
          <p className="login-subtitle">Gamitin ang iyong teacher username o ID at password.</p>

          <div className="login-divider" />

          <label className="login-label" htmlFor="t-username">👤 Username / Teacher ID</label>
          <div className="input-with-icon">
            <span>👤</span>
            <input
              className="input-field"
              id="t-username"
              value={teacherIdentifier}
              onChange={handleTeacherIdentifierChange}
              onKeyDown={submitTeacherLogin}
            />
            
            
          </div>

          

          <label className="login-label" htmlFor="t-password">🔒 Password</label>
          <div className="input-with-icon">
            <span>🔐</span>
            <input
              className="input-field"
              id="t-password"
              type={showTeacherPassword ? "text" : "password"}
              onKeyDown={submitTeacherLogin}
            />
            <button
              type="button"
              className="password-eye-btn"
              aria-label={showTeacherPassword ? "Hide password" : "Show password"}
              onClick={() => setShowTeacherPassword((value) => !value)}
            >
              {showTeacherPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>

          <button
            className="btn btn-green login-main-btn teacher-login-btn"
            onClick={onLogin}
            disabled={teacherLoginDisabled}
          >
            🔐 Login
          </button>

        </section>
      </div>

      <div className="login-feature-row teacher-feature-row">
        <div><span>👥</span><b>Manage Classes</b><p>Pamahalaan ang klase at grupo.</p></div>
        <div><span>📖</span><b>Create Lessons</b><p>Gumawa at magbahagi ng aralin.</p></div>
        <div><span>📊</span><b>Track Progress</b><p>Subaybayan ang pag-unlad.</p></div>
        <div><span>🏅</span><b>Inspire & Guide</b><p>Gabay sa pagkatuto.</p></div>
      </div>
    </div>
  </>;
}

export function AdminLogin({ go, onLogin }) {
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminIdentifier, setAdminIdentifier] = useState('');
  const adminLoginDisabled = false;
function handleAdminIdentifierChange(event) {
    const value = event.target.value
      .replace(/\s+/g, '')
      .replace(/[^A-Za-z0-9._@-]/g, '');

    setAdminIdentifier(value);
  }

  function submitAdminLogin(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      if (!adminLoginDisabled) onLogin();
    }
  }

  return <>
    <div className="top-nav login-top-nav login-admin-nav">
      <button className="btn btn-outline btn-sm" onClick={() => go('screen-home')}>← Home</button>
      <div className="logo admin-logo">🛡️ Admin Login</div>
      <div className="login-nav-pill admin-pill">🛡️ Secure Access • Protected System 🔒</div>
    </div>

    <div className="login-stage admin-stage">
      <div className="login-shell admin-shell">
        <aside className="login-visual-card admin-visual-card">
          <h2>Mag-login,<br />Admin!</h2>
          <p>Gamitin ang admin username at password para magpatuloy.</p>
          <div className="admin-hero-illustration login-hero-png-wrap" aria-hidden="true">
            <img src="/landing-admin.png" alt="" className="login-hero-png admin" />
          </div>
          <div className="login-info-card admin-info-card">
            <span className="info-icon">🔐</span>
            <div>
              <b>Secure & Trusted</b><br />
              <span>Ang impormasyon at settings ay protektado.</span>
            </div>
          </div>
        </aside>

        <section className="login-form-panel admin-form-panel">
          <div className="admin-icon-top">🛡️</div>
          <h2>Welcome Back, Admin</h2>
          <div className="admin-underline" />

          <label className="login-label" htmlFor="a-username">Username</label>
          <div className="input-with-icon admin-input">
            <span>👤</span>
            <input
              className="input-field"
              id="a-username"
              value={adminIdentifier}
              onChange={handleAdminIdentifierChange}
              onKeyDown={submitAdminLogin}
            />
            
            
          </div>

          

          <label className="login-label" htmlFor="a-password">Password</label>
          <div className="input-with-icon admin-input">
            <span>🔒</span>
            <input
              className="input-field"
              id="a-password"
              type={showAdminPassword ? "text" : "password"}
              onKeyDown={submitAdminLogin}
            />
            <button
              type="button"
              className="password-eye-btn"
              aria-label={showAdminPassword ? "Hide password" : "Show password"}
              onClick={() => setShowAdminPassword((value) => !value)}
            >
              {showAdminPassword ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>

          <button
            className="btn btn-purple login-main-btn admin-login-btn"
            onClick={onLogin}
            disabled={adminLoginDisabled}
          >
            🔐 Login
          </button>

        </section>
      </div>
    </div>
  </>;
}

