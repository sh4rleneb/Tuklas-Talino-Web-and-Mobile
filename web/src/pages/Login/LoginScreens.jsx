import React, { useEffect, useState } from 'react';
import { api } from '../../api/client';

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


function useRealtimeLoginCheck(role, identifier) {
  const [state, setState] = useState({
    checking: false,
    exists: false,
    message: '',
    name: '',
  });

  useEffect(() => {
    const value = String(identifier || '').trim();

    if (!value) {
      setState({ checking: false, exists: false, message: '', name: '' });
      return undefined;
    }

    if (value.length < 3) {
      setState({
        checking: false,
        exists: false,
        message: 'Enter at least 3 characters.',
        name: '',
      });
      return undefined;
    }

    let active = true;
    const roleLabel = role === 'teacher' ? 'teacher' : 'admin';

    setState({
      checking: true,
      exists: false,
      message: `Checking ${roleLabel} account...`,
      name: '',
    });

    const timeout = setTimeout(async () => {
      try {
        const data = await api(`/auth/check-${role}/${encodeURIComponent(value)}`);

        if (!active) return;

        setState({
          checking: false,
          exists: Boolean(data.exists),
          message: data.exists
            ? `Found: ${data.name || `${roleLabel} account`}`
            : `No active ${roleLabel} account found.`,
          name: data.name || '',
        });
      } catch (error) {
        if (!active) return;

        setState({
          checking: false,
          exists: false,
          message: error.message || `Could not check ${roleLabel} account.`,
          name: '',
        });
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [role, identifier]);

  return state;
}

function LoginCheckMessage({ check }) {
  if (!check?.message) return null;

  return (
    <p
      style={{
        margin: '8px 0 0',
        fontSize: 13,
        fontWeight: 800,
        color: check.exists ? '#16A34A' : '#DC2626',
      }}
    >
      {check.message}
    </p>
  );
}

export function StudentLogin({ go, onLogin }) {
  const [studentIdValue, setStudentIdValue] = useState('');
  const [studentIdExists, setStudentIdExists] = useState(false);
  const [showStudentPassword, setShowStudentPassword] = useState(false);

  useEffect(() => {
    const value = studentIdValue.trim();

    setStudentIdExists(false);

    if (value.length < 4) return;

    const timeout = setTimeout(async () => {
      try {
        const data = await api(`/auth/check-student/${encodeURIComponent(value)}`);
        setStudentIdExists(Boolean(data.exists));
      } catch {
        setStudentIdExists(false);
      }
    }, 350);

    return () => clearTimeout(timeout);
  }, [studentIdValue]);

  return <>
    <div className="top-nav login-top-nav login-student-nav"><button className="btn btn-outline btn-sm" onClick={() => go('screen-home')}>← Home</button><div className="logo">🎒 Student Login</div><div className="login-nav-pill">⭐ Tuklas. Matuto. Magsaya!</div></div>
    <div className="login-stage student-stage"><div className="login-shell student-shell">
      <aside className="login-visual-card student-visual-card"><div className="login-sparkles">✦</div><h2>Mag-login,<br />Estudyante! 👋</h2><p>Ilagay ang Student ID at password para magpatuloy.</p><div className="student-hero-illustration login-hero-png-wrap" aria-hidden="true"><img src="/login-student-girl.png" alt="" className="login-hero-png student" /></div><div className="login-info-card"><span className="info-icon">🛡️</span><div><b>Ligtas • Masaya • Makabuluhan</b><br /><span>Tuklas Talino, kasama mo sa bawat hakbang.</span></div></div></aside>
      <section className="login-form-panel student-form-panel"><div className="login-form-heading"><span className="heading-badge">🪪</span><div><h3>Mag-login bilang Estudyante</h3><p>Ilagay ang Student ID at password para magpatuloy.</p></div></div><label className="login-label" htmlFor="stu-id">🪪 Student ID</label><div className="input-with-icon"><span>👤</span><input className="input-field" id="stu-id" placeholder="Halimbawa: STU-2025-001" value={studentIdValue} onChange={(event) => setStudentIdValue(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); onLogin(); } }} />{studentIdExists && <span className="input-check">✓</span>}</div><label className="login-label" htmlFor="stu-password">🔒 Password</label><div className="input-with-icon"><span>🔐</span><input className="input-field" id="stu-password" placeholder="Default: student123" type={showStudentPassword ? "text" : "password"} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); onLogin(); } }} /><button type="button" className="password-eye-btn" aria-label={showStudentPassword ? "Hide password" : "Show password"} onClick={() => setShowStudentPassword((value) => !value)}>{showStudentPassword ? <EyeOffIcon /> : <EyeIcon />}</button></div><button className="btn btn-green login-main-btn" onClick={onLogin}>✨ Login</button><p className="secure-note">🔒 Ang iyong impormasyon ay ligtas at protektado.</p></section>
    </div></div>
  </>;
}

export function TeacherLogin({ go, onLogin }) {
  const [showTeacherPassword, setShowTeacherPassword] = useState(false);
  const [teacherIdentifier, setTeacherIdentifier] = useState('');
  const teacherCheck = useRealtimeLoginCheck('teacher', teacherIdentifier);
  const teacherLoginDisabled = teacherCheck.checking || !teacherCheck.exists;

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
              placeholder="Halimbawa: TCH-2025-001"
              value={teacherIdentifier}
              onChange={handleTeacherIdentifierChange}
              onKeyDown={submitTeacherLogin}
            />
            {teacherCheck.checking && <span className="input-check">…</span>}
            {teacherCheck.exists && <span className="input-check">✓</span>}
          </div>

          <LoginCheckMessage check={teacherCheck} />

          <label className="login-label" htmlFor="t-password">🔒 Password</label>
          <div className="input-with-icon">
            <span>🔐</span>
            <input
              className="input-field"
              id="t-password"
              placeholder="Enter your password"
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

          <div className="secure-login-strip">🛡️ Secure & Protected Login</div>
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
  const adminCheck = useRealtimeLoginCheck('admin', adminIdentifier);
  const adminLoginDisabled = adminCheck.checking || !adminCheck.exists;

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
              placeholder="Enter your username"
              value={adminIdentifier}
              onChange={handleAdminIdentifierChange}
              onKeyDown={submitAdminLogin}
            />
            {adminCheck.checking && <span className="input-check">…</span>}
            {adminCheck.exists && <span className="input-check">✓</span>}
          </div>

          <LoginCheckMessage check={adminCheck} />

          <label className="login-label" htmlFor="a-password">Password</label>
          <div className="input-with-icon admin-input">
            <span>🔒</span>
            <input
              className="input-field"
              id="a-password"
              placeholder="Enter your password"
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

          <div className="secure-login-strip admin-secure-strip">🛡️ Secure Login</div>
          <p className="secure-note">🔒 Only authorized administrators can access this system.</p>
        </section>
      </div>
    </div>
  </>;
}

