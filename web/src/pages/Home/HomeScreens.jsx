import React, { useState } from 'react';
import { SUBJECTS } from '../../constants/studentConstants';

function read(id) {
  return document.getElementById(id)?.value?.trim() || '';
}

export function LandingScreen({ go }) {
  const [publicPage, setPublicPage] = useState('home');

  const publicNav = [
    { id: 'home', icon: '🏠', label: 'Home' },
    { id: 'modules', icon: '📖', label: 'Modules' },
    { id: 'about', icon: 'ℹ️', label: 'About' },
    { id: 'help', icon: '❔', label: 'Help' },
  ];

  const selectPublicPage = (page) => {
    setPublicPage(page);
    if (typeof window !== 'undefined') {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }
  };

  const roleCards = [
    {
      type: 'student',
      image: '/landing-student-boy.png',
      title: 'Student',
      desc: 'Access lessons, quizzes, missions, groups, XP, badges, and your learning progress.',
      action: 'Student Login',
      screen: 'screen-login-student',
    },
    {
      type: 'teacher',
      image: '/landing-teacher.png',
      title: 'Teacher',
      desc: 'Create lessons, manage groups, monitor student progress, review outputs, and generate reports.',
      action: 'Teacher Login',
      screen: 'screen-login-teacher',
    },
    {
      type: 'admin',
      image: '/landing-admin.png',
      title: 'Admin',
      desc: 'Manage users, teacher accounts, student access, content, and system settings.',
      action: 'Admin Login',
      screen: 'screen-login-admin',
    },
  ];

  const lmsTools = [
    { icon: '📝', title: 'Quizzes', desc: 'Students answer assessments while attempts, scores, and progress are recorded.', tone: 'blue' },
    { icon: '🎮', title: 'Missions', desc: 'Game-like learning tasks help students practice lessons in a more engaging way.', tone: 'purple' },
    { icon: '👥', title: 'Groups', desc: 'Students can work on collaborative tasks guided by teacher-created groups.', tone: 'yellow' },
    { icon: '🏅', title: 'XP & Badges', desc: 'Reward features encourage participation, completion, and consistent learning.', tone: 'pink' },
    { icon: '📊', title: 'Monitoring', desc: 'Teachers can track lesson completion, quiz performance, XP, and learner status.', tone: 'blue' },
  ];

  const howSteps = [
    { icon: '🔐', title: 'Log in by role', desc: 'Students, teachers, and admins enter through their own secure dashboard.' },
    { icon: '📚', title: 'Open learning content', desc: 'Students access grade-level lessons, modules, quizzes, missions, and group tasks.' },
    { icon: '⭐', title: 'Complete activities', desc: 'The system records XP, badges, attempts, outputs, and learning progress.' },
    { icon: '👩‍🏫', title: 'Monitor and guide', desc: 'Teachers review performance, monitor learners, and support students who need guidance.' },
    { icon: '🛡️', title: 'Manage the system', desc: 'Admins manage accounts, access, and system-level records for organized use.' },
  ];

  const helpCards = [
    {
      title: 'Student Login Help',
      desc: 'Students should use their assigned Student ID and password. If access does not work, they should ask their teacher for help.',
    },
    {
      title: 'Teacher Account Help',
      desc: 'Teachers can access their dashboard to manage lessons, groups, monitoring, reports, and student records.',
    },
    {
      title: 'Admin Access Help',
      desc: 'Admins manage users, account access, and system settings. Admin access should only be used by authorized users.',
    },
    {
      title: 'Learning Progress Help',
      desc: 'XP, badges, quiz attempts, and lesson completion are recorded so learners and teachers can track progress clearly.',
    },
  ];

  const renderRoleCards = () => (
    <section className="tt-panel tt-role-panel" aria-label="Role login cards">
      <h2>👥 Mag-login bilang:</h2>
      <div className="tt-role-cards">
        {roleCards.map((role) => (
          <article className={`tt-role-card ${role.type}`} key={role.type}>
            <div className="tt-role-avatar">
              {role.image ? (
                <img src={role.image} alt="" className="tt-role-avatar-img" />
              ) : (
                role.icon
              )}
            </div>
            <div className="tt-role-content">
              <h3>{role.title}</h3>
              <p>{role.desc}</p>
            </div>
            <button onClick={() => go(role.screen)}>
              {role.action} <span>→</span>
            </button>
          </article>
        ))}
      </div>
    </section>
  );

  const renderHome = () => (
    <>
      <section className="tt-hero-card" aria-label="Tuklas Talino introduction">
        <div className="tt-hero-copy">
          <h1>Masayang Matuto sa Tuklas Talino!</h1>
          <p>
            Para sa <strong>Grades 1–6:</strong> lessons, quizzes, missions, badges,
            group tasks, at teacher monitoring.
          </p>
          <div className="tt-hero-points">
            <div><span>🤖</span><strong>AI Powered</strong><small>TTS & speech feedback</small></div>
            <div><span>🎮</span><strong>Games</strong><small>Fun learning tasks</small></div>
            <div><span>🏅</span><strong>XP & Badges</strong><small>Rewards and progress</small></div>
          </div>
        </div>
        <div className="tt-hero-art tt-hero-art-image" aria-hidden="true">
          <div className="tt-hero-illustration-wrap">
            <img
              src="/home-hero-student.png"
              alt=""
              className="tt-hero-illustration"
            />
          </div>
        </div>
        <div className="tt-slider-dots" aria-hidden="true"><span /><span /><span /></div>
      </section>

      {renderRoleCards()}

      <section className="tt-panel tt-system-preview-panel" aria-label="LMS feature overview">
        <div className="tt-section-heading">
          <h2>✨ Tuklas Talino Learning Features</h2>
          <button onClick={() => selectPublicPage('modules')}>Explore modules →</button>
        </div>
        <div className="tt-system-grid">
          <div><span>📚</span><strong>Lessons</strong><small>Organized learning content for Grades 1–6.</small></div>
          <div><span>🎮</span><strong>Missions</strong><small>Gamified tasks that support engagement.</small></div>
          <div><span>🏅</span><strong>XP & Badges</strong><small>Reward system for participation and completion.</small></div>
          <div><span>📊</span><strong>Teacher Monitoring</strong><small>Progress records for better guidance.</small></div>
        </div>
      </section>

      <section className="tt-ready-card" aria-label="Get started">
        <div className="tt-ready-art" aria-hidden="true"><span>👦</span><span>👧</span><span>👦</span><div>📚</div></div>
        <div className="tt-ready-copy">
          <h2>Handa nang magsimula?</h2>
          <p>Pumili ng inyong role at simulan ang mas organisado, masaya, at guided na pagkatuto.</p>
          <div className="tt-ready-actions">
            <button onClick={() => go('screen-login-student')}>Student Login <span>→</span></button>
            <button className="secondary" onClick={() => selectPublicPage('help')}>Need help?</button>
          </div>
        </div>
      </section>
    </>
  );

  const renderModules = () => (
    <>
      <section className="tt-panel tt-page-intro">
        <div className="tt-page-kicker">Learning Modules</div>
        <h1>Mga Learning Modules at System Tools</h1>
        <p>
          Tuklas Talino organizes Filipino learning through subject modules and system tools that support
          lessons, quizzes, missions, group work, badges, and teacher monitoring.
        </p>
      </section>

      <section className="tt-panel tt-modules-panel" aria-label="Learning modules">
        <div className="tt-section-heading">
          <h2>📚 Mga Learning Modules</h2>
          <button onClick={() => go('screen-login-student')}>Open student dashboard →</button>
        </div>
        <div className="tt-module-grid">
          {SUBJECTS.map((s) => (
            <article className={`tt-module-card ${s.tone}`} key={s.name}>
              <div className="tt-module-icon">{s.icon}</div>
              <h3>{s.name}</h3>
              <p>{s.desc}</p>
              <div className="tt-progress"><span style={{ width: '78%' }} /></div>
              <small>Learning Area</small>
            </article>
          ))}
        </div>
      </section>

      <section className="tt-panel tt-modules-panel" aria-label="LMS tools">
        <div className="tt-section-heading">
          <h2>🧩 System Tools</h2>
          <button onClick={() => selectPublicPage('about')}>How it works →</button>
        </div>
        <div className="tt-module-grid">
          {lmsTools.map((tool) => (
            <article className={`tt-module-card ${tool.tone}`} key={tool.title}>
              <div className="tt-module-icon">{tool.icon}</div>
              <h3>{tool.title}</h3>
              <p>{tool.desc}</p>
              <div className="tt-progress"><span style={{ width: '82%' }} /></div>
              <small>System Feature</small>
            </article>
          ))}
        </div>
      </section>
    </>
  );

  const renderAbout = () => (
    <>
      <section className="tt-panel tt-page-intro">
        <div className="tt-page-kicker">About Tuklas Talino</div>
        <h1>An AI-powered Filipino learning and gamified collaboration system for Grades 1–6</h1>
        <p>
          Tuklas Talino is designed to support Filipino learning through guided activities, gamified engagement, group tasks, automated feedback, teacher monitoring, and admin-managed access.
        </p>
      </section>

      <section className="tt-panel tt-about-split" aria-label="About the system">
        <article>
          <span>🎯</span>
          <h2>Purpose of the System</h2>
          <p>
            The system helps learners access lessons and activities in one place while allowing teachers
            to monitor progress, review outputs, and guide students based on learning records.
          </p>
        </article>
        <article>
          <span>👥</span>
          <h2>Built for Three Users</h2>
          <p>
            Students learn through lessons and activities, teachers manage and monitor learning, and admins
            maintain user access and system organization.
          </p>
        </article>
      </section>

      <section className="tt-panel tt-why-panel" aria-label="Why use Tuklas Talino">
        <h2>⭐ Bakit gamitin ang Tuklas Talino?</h2>
        <div className="tt-why-grid">
          <div><span>📗</span><strong>Grade-Level Learning</strong><small>Lessons and activities are organized for Grades 1–6 learners.</small></div>
          <div><span>🎮</span><strong>Interactive Tasks</strong><small>Quizzes, missions, groups, XP, and badges help keep learning engaging.</small></div>
          <div><span>📊</span><strong>Progress Monitoring</strong><small>Teachers can track completion, performance, attempts, and learner status.</small></div>
          <div><span>🛡️</span><strong>Role-Based Access</strong><small>Students, teachers, and admins have separate dashboards and permissions.</small></div>
        </div>
      </section>

      <section className="tt-panel tt-flow-panel" aria-label="How Tuklas Talino works">
        <div className="tt-section-heading">
          <h2>🔄 How Tuklas Talino Works</h2>
          <button onClick={() => selectPublicPage('help')}>View help →</button>
        </div>
        <div className="tt-flow-list">
          {howSteps.map((step, idx) => (
            <article className="tt-flow-step" key={step.title}>
              <div className="tt-flow-number">{idx + 1}</div>
              <span>{step.icon}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );

  const renderHelp = () => (
    <>
      <section className="tt-panel tt-page-intro">
        <div className="tt-page-kicker">Help and Support</div>
        <h1>Need help using Tuklas Talino?</h1>
        <p>
          This page guides students, teachers, and admins on where to start, how to log in,
          and what to do when account or learning access concerns happen.
        </p>
      </section>

      <section className="tt-panel" aria-label="Help cards">
        <div className="tt-section-heading">
          <h2>❔ Common Help Topics</h2>
          <button onClick={() => selectPublicPage('home')}>Back to home →</button>
        </div>
        <div className="tt-help-grid">
          {helpCards.map((item) => (
            <article className="tt-help-card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="tt-help-support" aria-label="Support guidance">
        <div>
          <h2>For account concerns</h2>
          <p>
            Students should ask their teacher for Student ID or password concerns. Teachers may contact
            the admin for account access or dashboard concerns.
          </p>
        </div>
        <button onClick={() => go('screen-login-student')}>Go to Student Login <span>→</span></button>
      </section>

      {renderRoleCards()}
    </>
  );

  const renderActivePage = () => {
    if (publicPage === 'modules') return renderModules();
    if (publicPage === 'about') return renderAbout();
    if (publicPage === 'help') return renderHelp();
    return renderHome();
  };

  return (
    <div className="tt-lms-home">
      <header className="tt-lms-nav">
        <button className="tt-logo" onClick={() => selectPublicPage('home')} aria-label="Tuklas Talino Home">
          <img src="/tuklas-talino-icon.png" alt="" className="tt-logo-img" />
          <span><strong>Tuklas Talino</strong><small>Matuto. Tuklasin. Magtagumpay.</small></span>
        </button>

        <nav className="tt-main-menu" aria-label="Main navigation">
          {publicNav.map((item) => (
            <button
              key={item.id}
              className={publicPage === item.id ? 'active' : ''}
              onClick={() => selectPublicPage(item.id)}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </nav>

        <div className="tt-login-actions">
          <button className="tt-login-pill student" onClick={() => go('screen-login-student')}>👤 Student Login</button>
          <button className="tt-login-pill teacher" onClick={() => go('screen-login-teacher')}>🖥️ Teacher Login</button>
          <button className="tt-login-pill admin" onClick={() => go('screen-login-admin')}>🛡️ Admin Login</button>
        </div>
      </header>

      <main className="tt-home-main">
        {renderActivePage()}
      </main>

      <footer className="tt-footer">
        <div className="tt-footer-brand">
          <img src="/tuklas-talino-icon.png" alt="" className="tt-footer-logo-img" />
          <div><strong>Tuklas Talino</strong><small>Matuto. Tuklasin. Magtagumpay.</small></div>
        </div>
        <div>
          <strong>Quick Links</strong>
          <button onClick={() => selectPublicPage('home')}>Home</button>
          <button onClick={() => selectPublicPage('modules')}>Modules</button>
          <button onClick={() => selectPublicPage('about')}>About</button>
          <button onClick={() => selectPublicPage('help')}>Help</button>
        </div>
        <div>
          <strong>For Users</strong>
          <button onClick={() => go('screen-login-student')}>Student Login</button>
          <button onClick={() => go('screen-login-teacher')}>Teacher Login</button>
          <button onClick={() => go('screen-login-admin')}>Admin Login</button>
        </div>
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
        <div className="role-card role-card-v2 role-student" onClick={() => go('screen-login-student')}><div className="role-tag">Para sa Mag-aaral</div><div className="role-illustration student-scene"><img src="/landing-student-boy.png" alt="" className="role-illustration-img student" /></div><div className="role-info"><h3>Mag-aaral</h3><p>Kumpletuhin ang mga aralin, sumali sa gawain, at kumita ng badges!</p><span className="role-arrow">→</span></div></div>
        <div className="role-card role-card-v2 role-teacher" onClick={() => go('screen-login-teacher')}><div className="role-tag">Para sa Guro</div><div className="role-illustration teacher-scene"><img src="/landing-teacher.png" alt="" className="role-illustration-img teacher" /></div><div className="role-info"><h3>Guro</h3><p>Gumawa ng aralin, grupo, at subaybayan ang progreso.</p><span className="role-arrow">→</span></div></div>
        <div className="role-card role-card-v2 role-admin" onClick={() => go('screen-login-admin')}><div className="role-tag">Para sa Admin</div><div className="role-illustration admin-scene"><img src="/landing-admin.png" alt="" className="role-illustration-img admin" /></div><div className="role-info"><h3>Admin</h3><p>Pamahalaan ang accounts, settings, at system activity logs.</p><span className="role-arrow">→</span></div></div>
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
