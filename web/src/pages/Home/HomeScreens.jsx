import React, { useState } from 'react';
import { SUBJECTS } from '../../constants/studentConstants';

function read(id) {
  return document.getElementById(id)?.value?.trim() || '';
}

export function LandingScreen({ go }) {
  return (
    <div className="tt-lms-home">
      <header className="tt-lms-nav">
        <button className="tt-logo" onClick={() => go('screen-landing')} aria-label="Tuklas Talino Home">
          <span className="tt-sun">☀️</span>
          <span><strong>Tuklas Talino</strong><small>Matuto. Tuklasin. Magtagumpay.</small></span>
        </button>
        <nav className="tt-main-menu" aria-label="Main navigation">
          <button className="active" onClick={() => go('screen-landing')}>🏠 Home</button>
          <button onClick={() => document.getElementById('tt-modules')?.scrollIntoView({ behavior: 'smooth' })}>📖 Modules</button>
          <button onClick={() => document.getElementById('tt-about')?.scrollIntoView({ behavior: 'smooth' })}>ℹ️ About</button>
          <button onClick={() => document.getElementById('tt-help')?.scrollIntoView({ behavior: 'smooth' })}>❔ Help</button>
        </nav>
        <div className="tt-login-actions">
          <button className="tt-login-pill student" onClick={() => go('screen-login-student')}>👤 Student Login</button>
          <button className="tt-login-pill teacher" onClick={() => go('screen-login-teacher')}>🖥️ Teacher Login</button>
          <button className="tt-login-pill admin" onClick={() => go('screen-login-admin')}>🛡️ Admin Login</button>
        </div>
      </header>
      <main className="tt-home-main">
        <section className="tt-hero-card" aria-label="Tuklas Talino introduction">
          <div className="tt-hero-copy">
            <h1>Mas masaya ang pag-aaral!</h1>
            <p>Ang inyong learning space para sa <strong>Grades 1–6.</strong></p>
            <div className="tt-hero-points">
              <div><span>📗</span><strong>Matuto</strong><small>Interactive modules</small></div>
              <div><span>🏆</span><strong>Tuklasin</strong><small>Fun missions at activities</small></div>
              <div><span>⭐</span><strong>Magtagumpay</strong><small>Rewards at badges</small></div>
            </div>
          </div>
          <div className="tt-hero-art" aria-hidden="true">
            <div className="tt-art-window" /><div className="tt-art-shelf" /><div className="tt-art-desk" />
            <div className="tt-child boy">👦</div><div className="tt-child girl">👧</div><div className="tt-laptop">💻</div>
            <div className="tt-book-stack">📚</div><div className="tt-notebook">📖</div><div className="tt-pencil-cup">✏️</div>
          </div>
          <div className="tt-slider-dots" aria-hidden="true"><span /><span /><span /></div>
        </section>
        <section className="tt-panel tt-role-panel" aria-label="Role login cards">
          <h2>👥 Mag-login bilang:</h2>
          <div className="tt-role-cards">
            <article className="tt-role-card student"><div className="tt-role-avatar">👦</div><div className="tt-role-content"><h3>Student</h3><p>Mag-access sa modules, activities at inyong progress.</p></div><button onClick={() => go('screen-login-student')}>Student Login <span>→</span></button></article>
            <article className="tt-role-card teacher"><div className="tt-role-avatar">👩‍🏫</div><div className="tt-role-content"><h3>Teacher</h3><p>Pamahalaan ang klase, aralin at mga gawain ng inyong mag-aaral.</p></div><button onClick={() => go('screen-login-teacher')}>Teacher Login <span>→</span></button></article>
            <article className="tt-role-card admin"><div className="tt-role-avatar">👨‍💻</div><div className="tt-role-content"><h3>Admin</h3><p>Pamahalaan ang users, content at system settings.</p></div><button onClick={() => go('screen-login-admin')}>Admin Login <span>→</span></button></article>
          </div>
        </section>
        <section className="tt-panel tt-modules-panel" id="tt-modules" aria-label="Popular modules">
          <div className="tt-section-heading"><h2>📚 Mga Popular na Modules</h2><button onClick={() => go('screen-login-student')}>View all modules →</button></div>
          <div className="tt-module-grid">
            {SUBJECTS.map((s, idx) => <article className={`tt-module-card ${s.tone}`} key={s.name}><div className="tt-module-icon">{s.icon}</div><h3>{s.name}</h3><p>{s.desc}</p><div className="tt-progress"><span style={{ width: `${[75,60,65,55,70][idx]}%` }} /></div><small>Integrated Module</small></article>)}
          </div>
        </section>
        <section className="tt-panel tt-why-panel" id="tt-about" aria-label="Why use Tuklas Talino">
          <h2>⭐ Bakit gamitin ang Tuklas Talino?</h2>
          <div className="tt-why-grid">
            <div><span>📗</span><strong>Batay sa MELC</strong><small>Alinsunod sa Most Essential Learning Competencies para sa Grades 1–6.</small></div>
            <div><span>⭐</span><strong>Masaya at Interaktibo</strong><small>Mga laro, gawain, at aktibidad na makabuluhan at nakaka-engganyo.</small></div>
            <div><span>👥</span><strong>Para sa Lahat</strong><small>Dinisenyo para sa estudyante, guro, at admin.</small></div>
            <div><span>🛡️</span><strong>Ligtas at Maaasahan</strong><small>Ligtas na platform para sa bawat mag-aaral.</small></div>
          </div>
        </section>
        <section className="tt-ready-card" id="tt-help" aria-label="Get started">
          <div className="tt-ready-art" aria-hidden="true"><span>👦</span><span>👧</span><span>👦</span><div>📚</div></div>
          <div className="tt-ready-copy"><h2>Handa nang magsimula?</h2><p>Pumili ng inyong role at simulan ang masayang paglalakbay tungo sa kaalaman!</p><button onClick={() => go('screen-home')}>Mag-login na! <span>→</span></button></div>
        </section>
      </main>
      <footer className="tt-footer">
        <div className="tt-footer-brand"><span>☀️</span><div><strong>Tuklas Talino</strong><small>Matuto. Tuklasin. Magtagumpay.</small></div></div>
        <div><strong>Quick Links</strong><button onClick={() => go('screen-landing')}>Home</button><button onClick={() => document.getElementById('tt-modules')?.scrollIntoView({ behavior: 'smooth' })}>Modules</button><button onClick={() => document.getElementById('tt-about')?.scrollIntoView({ behavior: 'smooth' })}>About</button><button onClick={() => document.getElementById('tt-help')?.scrollIntoView({ behavior: 'smooth' })}>Help</button></div>
        <div><strong>For Users</strong><button onClick={() => go('screen-login-student')}>Student Login</button><button onClick={() => go('screen-login-teacher')}>Teacher Login</button><button onClick={() => go('screen-login-admin')}>Admin Login</button></div>
        <div><strong>Connect with Us</strong><p className="tt-socials">● ▶ ✉</p></div>
      </footer>
    </div>
  );
}

export function HomeScreen({ go, notify }) {
  return <div className="home-wrap home-wrap-v2">
    <div className="home-bg-shape shape-one" /><div className="home-bg-shape shape-two" /><div className="home-bg-shape shape-three" />
    <div className="home-card home-card-v2">
      <button className="btn btn-outline btn-sm home-back-btn" onClick={() => go('screen-landing')}>← Back to Welcome</button>
      <div className="home-title home-title-v2">Tuklas <span>Talino</span></div>
      <div className="home-subtitle-v2">PH Filipino Learning + Gamified Collaboration • Baitang 1–6</div>
      <div className="role-cards role-cards-v2">
        <div className="role-card role-card-v2 role-student" onClick={() => go('screen-login-student')}><div className="role-tag">Para sa Mag-aaral</div><div className="role-illustration student-scene"><span className="role-object bag">🎒</span><span className="role-person">👦</span><span className="role-object book">📖</span><span className="role-object sparkle">⭐</span></div><div className="role-info"><h3>Mag-aaral</h3><p>Kumpletuhin ang mga aralin, sumali sa gawain, at kumita ng badges!</p><span className="role-arrow">→</span></div></div>
        <div className="role-card role-card-v2 role-teacher" onClick={() => go('screen-login-teacher')}><div className="role-tag">Para sa Guro</div><div className="role-illustration teacher-scene"><span className="role-person">👩‍🏫</span><span className="role-object board">🔤</span><span className="role-object check">✅</span></div><div className="role-info"><h3>Guro</h3><p>Gumawa ng aralin, grupo, at subaybayan ang progreso.</p><span className="role-arrow">→</span></div></div>
        <div className="role-card role-card-v2 role-admin" onClick={() => go('screen-login-admin')}><div className="role-tag">Para sa Admin</div><div className="role-illustration admin-scene"><span className="role-person">🛡️</span><span className="role-object gear">⚙️</span><span className="role-object chart">📊</span></div><div className="role-info"><h3>Admin</h3><p>Pamahalaan ang accounts, settings, at system activity logs.</p><span className="role-arrow">→</span></div></div>
      </div>
      <div className="demo-panel-v2">
        <div className="demo-accounts-v2">
          <div className="section-title">✨ Quick Demo Accounts</div>
          <div className="demo-line"><span className="demo-icon purple">🛡️</span><b>Admin:</b> username <strong>admin</strong> / password <strong>admin123</strong></div>
          <div className="demo-line"><span className="demo-icon blue">👩‍🏫</span><b>Teacher:</b> username <strong>teacher1</strong> / password <strong>teach123</strong></div>
          <div className="demo-line"><span className="demo-icon green">🎒</span><b>Student IDs:</b> <strong>STU-2025-001</strong> ... <strong>STU-2025-006</strong></div>
          <div className="demo-tip">💡 Tip: Students use password <strong>student123</strong> by default.</div>
        </div>
        <div className="feature-grid-v2">
          <div className="feature-mini"><span>👥</span><div><b>Kolaborasyon</b><p>Gumawa ng grupo at makilahok sa mga gawain.</p></div></div>
          <div className="feature-mini"><span>🏅</span><div><b>Gamified Learning</b><p>Kumita ng XP, level up, at badges.</p></div></div>
          <div className="feature-mini"><span>📈</span><div><b>Progreso Tracking</b><p>Subaybayan ang pag-unlad.</p></div></div>
          <div className="feature-mini"><span>🔒</span><div><b>Ligtas at Maayos</b><p>May roles para sa student, teacher, at admin.</p></div></div>
        </div>
      </div>
      <div className="reset-area-v2"><button className="btn btn-green reset-btn-v2" onClick={() => notify('Database reset is done from backend: npm.cmd run reset', 'warn')}>♻️ Reset Demo Data</button><div className="muted">For full reset, run backend reset command.</div></div>
    </div>
  </div>;
}

export function ChangePasswordScreen({ user, onSubmit, onLogout }) {
  return (
    <>
      <div className="top-nav login-top-nav login-student-nav">
        <button className="btn btn-outline btn-sm" onClick={onLogout}>
          ← Logout
        </button>

        <div className="logo">🔐 Account Security</div>

        <div className="login-nav-pill">
          ⭐ Secure muna bago magpatuloy!
        </div>
      </div>

      <div className="login-stage student-stage">
        <div className="login-shell student-shell">
          <aside className="login-visual-card student-visual-card">
            <div className="login-sparkles">✦</div>

            <h2>
              Palitan ang<br />
              Password! 🔐
            </h2>

            <p>
              Para sa seguridad ng iyong account, kailangan mong gumawa ng sarili
              mong password bago ka makapagpatuloy.
            </p>

            <div className="student-hero-illustration" aria-hidden="true">
              <div className="hero-child">{user?.student?.avatar || '🧒'}</div>
              <div className="hero-school">🏫</div>
              <div className="hero-book">🔐</div>
            </div>

            <div className="login-info-card">
              <span className="info-icon">🛡️</span>
              <div>
                <b>Ligtas ang Iyong Account</b>
                <br />
                <span>
                  Protektado ang iyong progress, XP, badges, at learning records.
                </span>
              </div>
            </div>
          </aside>

          <section className="login-form-panel student-form-panel">
            <div className="login-form-heading">
              <span className="heading-badge">👤</span>
              <div>
                <h3>Kumusta, {user?.displayName || 'Mag-aaral'}!</h3>
                <p>Palitan muna ang temporary password bago magpatuloy.</p>
              </div>
            </div>

            <div className="login-divider" />

            <label className="login-label" htmlFor="cp-current-password">
              🔒 Current Password
            </label>
            <div className="input-with-icon">
              <span>🔐</span>
              <input
                className="input-field"
                id="cp-current-password"
                type="password"
                placeholder="Ilagay ang temporary/current password"
              />
            </div>

            <label className="login-label" htmlFor="cp-new-password">
              ✨ New Password
            </label>
            <div className="input-with-icon">
              <span>🆕</span>
              <input
                className="input-field"
                id="cp-new-password"
                type="password"
                placeholder="Gumawa ng bagong password"
              />
            </div>

            <label className="login-label" htmlFor="cp-confirm-password">
              ✅ Confirm New Password
            </label>
            <div className="input-with-icon">
              <span>✅</span>
              <input
                className="input-field"
                id="cp-confirm-password"
                type="password"
                placeholder="Ulitin ang bagong password"
              />
            </div>

            <button className="btn btn-green login-main-btn" onClick={onSubmit}>
              🔐 Change Password
            </button>

            <button
              className="btn btn-outline login-main-btn"
              type="button"
              onClick={onLogout}
              style={{ marginTop: 10 }}
            >
              Logout
            </button>

            <p className="secure-note">
              🔒 Gumamit ng password na may hindi bababa sa 8 characters.
            </p>
          </section>
        </div>

        <div className="login-tip-card">
          💡 <b>Tip:</b> Huwag ibahagi ang iyong password sa iba.
          <span> 💚</span>
        </div>
      </div>
    </>
  );
}
