import { useState } from 'react';
import { TeacherRedesignStyles } from '../../components/styles/StyleBlocks';
import { fmtDate } from '../../utils/studentHelpers';
import { verifyPassword } from '../../api/client';

export default function AdminDashboard({
  data,
  logout,
  addStudent,
  addTeacher,
  archiveStudent,
  reactivateStudent,
  resetStudentPassword,
  resetStudent,
  resetTeacherPassword,
  archiveTeacher,
  reactivateTeacher,
  assignTeacherClass,
  removeTeacherAssignment,
  reload
}) {
  const [adminTab, setAdminTab] = useState('overview');

  const [logSearch, setLogSearch] = useState('');
  const [logAction, setLogAction] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // Add Student form state (mirrors mobile AdminHome)
  const [stuForm, setStuForm] = useState({ name: '', gradeLevel: '', section: '' });
  const [stuErrors, setStuErrors] = useState({});
  const [stuSubmitting, setStuSubmitting] = useState(false);
  const [stuCredentials, setStuCredentials] = useState(null);

  // Add Teacher form state (mirrors mobile AdminHome)
  const [tchForm, setTchForm] = useState({ name: '', email: '' });
  const [tchErrors, setTchErrors] = useState({});
  const [tchSubmitting, setTchSubmitting] = useState(false);
  const [tchCredentials, setTchCredentials] = useState(null);

  // Validation helpers (mirrors mobile accountValidation.js)
  function normalizeSpaces(v = '') {
    return String(v).replace(/\s+/g, ' ').trim();
  }
  function isValidName(v = '') {
    const name = normalizeSpaces(v);
    if (!/^(?=.*[A-Za-zÀ-ÿ])[A-Za-zÀ-ÿ'. -]+$/.test(name)) return false;
    const parts = name.split(' ').map(p => p.trim()).filter(Boolean);
    return parts.length >= 2 && parts.every(part => /[A-Za-zÀ-ÿ]/.test(part));
  }
  function isValidGrade(v) {
    const g = Number(v);
    return Number.isInteger(g) && g >= 1 && g <= 6;
  }
  function isValidEmail(v = '') {
    const e = String(v).trim();
    if (!e) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  }
  function validateStudent(form) {
    return {
      name: !isValidName(form.name),
      gradeLevel: !isValidGrade(form.gradeLevel),
      section: !normalizeSpaces(form.section),
    };
  }
  function validateTeacher(form) {
    return {
      name: !isValidName(form.name),
      email: !isValidEmail(form.email),
    };
  }
  function hasErrors(errs) {
    return Object.values(errs).some(Boolean);
  }

  async function handleAddStudent(e) {
    e.preventDefault();
    const errs = validateStudent(stuForm);
    setStuErrors(errs);
    if (hasErrors(errs)) return;
    setStuSubmitting(true);
    setStuCredentials(null);
    try {
      const payload = {
        name: normalizeSpaces(stuForm.name),
        gradeLevel: Number(stuForm.gradeLevel),
        section: normalizeSpaces(stuForm.section),
        avatar: '🧒',
      };
      const saved = await addStudent(payload);
      if (saved) {
        setStuCredentials({ username: saved.username, pin: saved.temporaryPin });
        setStuForm({ name: '', gradeLevel: '', section: '' });
        setStuErrors({});
      }
    } finally {
      setStuSubmitting(false);
    }
  }

  async function handleAddTeacher(e) {
    e.preventDefault();
    const errs = validateTeacher(tchForm);
    setTchErrors(errs);
    if (hasErrors(errs)) return;
    setTchSubmitting(true);
    setTchCredentials(null);
    try {
      const teacherEmail = String(tchForm.email || '').trim();
      const payload = { name: normalizeSpaces(tchForm.name) };
      if (teacherEmail) payload.email = teacherEmail;
      const saved = await addTeacher(payload);
      if (saved) {
        setTchCredentials({ username: saved.username, pin: saved.temporaryPin });
        setTchForm({ name: '', email: '' });
        setTchErrors({});
      }
    } finally {
      setTchSubmitting(false);
    }
  }

  const stats = data.stats || {};
  const students = data.students || [];
  const archivedStudents = data.archivedStudents || [];
  const teachers = data.teachers || [];
  const archivedTeachers = data.archivedTeachers || [];
  const teacherAssignments = data.teacherAssignments || [];
  const classOptions = data.classOptions || [];
  const logs = data.logs || [];

  const actionOptions = [...new Set(
    logs.map(log => log.action).filter(Boolean)
  )];


  const now = new Date();

  const todayLogs = logs.filter(log => {
    const d = new Date(log.createdAt);
    return d.toDateString() === now.toDateString();
  }).length;

  const weekLogs = logs.filter(log => {
    const d = new Date(log.createdAt);
    return (now - d) <= (7 * 24 * 60 * 60 * 1000);
  }).length;

  const monthLogs = logs.filter(log => {
    const d = new Date(log.createdAt);
    return (
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  }).length;

const filteredLogs = logs.filter(log => {
    const createdAt = new Date(log.createdAt);

    const matchesSearch =
      !logSearch ||
      log.action?.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.entityType?.toLowerCase().includes(logSearch.toLowerCase());

    const matchesAction =
      !logAction ||
      log.action === logAction;

    const matchesFrom =
      !fromDate ||
      createdAt >= new Date(fromDate);

    const matchesTo =
      !toDate ||
      createdAt <= new Date(`${toDate}T23:59:59`);

    return (
      matchesSearch &&
      matchesAction &&
      matchesFrom &&
      matchesTo
    );
  });

  const [assignGradeFilter, setAssignGradeFilter] = useState('');
  const [studentGradeFilter, setStudentGradeFilter] = useState('all');
  const [studentSectionFilter, setStudentSectionFilter] = useState('all');
  const sectionOptions = [...new Set(
    classOptions
      .filter(option => !assignGradeFilter || Number(option.gradeLevel) === Number(assignGradeFilter))
      .map(option => option.section)
      .filter(Boolean)
  )].sort();

  // Sections filtered by the currently selected grade in the Add Student form.
  // Sources: teacher assignments (class structure) + existing students (classOptions).
  // Teacher assignments are set up before students exist, so this works on fresh systems too.
  const stuSectionOptions = [...new Set([
    ...teacherAssignments
      .filter(a => !stuForm.gradeLevel || Number(a.gradeLevel) === Number(stuForm.gradeLevel))
      .map(a => a.section),
    ...classOptions
      .filter(o => !stuForm.gradeLevel || Number(o.gradeLevel) === Number(stuForm.gradeLevel))
      .map(o => o.section),
  ].filter(Boolean))].sort();

  const studentManagementSectionOptions = [...new Set(
    students
      .filter(student => studentGradeFilter === 'all' || Number(student.gradeLevel || student.grade) === Number(studentGradeFilter))
      .map(student => normalizeSpaces(student.section || student.sectionName || student.classSection || ''))
      .filter(Boolean)
  )].sort();

  const filteredStudents = students.filter(student => {
    const matchesGrade = studentGradeFilter === 'all' || Number(student.gradeLevel || student.grade) === Number(studentGradeFilter);
    const matchesSection = studentSectionFilter === 'all' || normalizeSpaces(student.section || student.sectionName || student.classSection || '') === studentSectionFilter;

    return matchesGrade && matchesSection;
  });

  function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  }

  function openTab(tab, targetId = 'admin-dashboard-workspace') {
    setAdminTab(tab);
    setTimeout(() => scrollTo(targetId), 0);
  }

  function assignmentLabel(assignment) {
    return `Grade ${assignment.gradeLevel} • ${assignment.section}`;
  }


  function teacherUsernameForCard(teacher) {
    return teacher?.User?.username || teacher?.user?.username || teacher?.username || teacher?.employeeCode || 'No username';
  }


  const [vaultOpen, setVaultOpen] = useState(false);
  const [vaultUser, setVaultUser] = useState(null);
  const [generatedPin, setGeneratedPin] = useState('');

  const [passwordVerifyOpen, setPasswordVerifyOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [pendingVaultUser, setPendingVaultUser] = useState(null);

  const [verificationExpiresAt, setVerificationExpiresAt] = useState(null);



  async function openVault(userType, user) {
    try {

      if (hasActiveVerificationSession()) {
        setGeneratedPin('');

        setVaultUser({
          ...user,
          type: userType
        });

        setVaultOpen(true);
        return;
      }

      setPasswordInput('');

      setPendingVaultUser({
        ...user,
        type: userType
      });

      setPasswordVerifyOpen(true);
    } catch (err) {
      window.alert(
        err?.message ||
        'Unable to generate temporary PIN.'
      );
    }
  }



  function hasActiveVerificationSession() {
    return (
      verificationExpiresAt &&
      Date.now() < verificationExpiresAt
    );
  }

async function executeVerifiedOpenVault() {
    try {
      await verifyPassword(passwordInput);

      setVerificationExpiresAt(
        Date.now() + (5 * 60 * 1000)
      );

      setGeneratedPin('');

      setVaultUser(pendingVaultUser);
      setVaultOpen(true);

      setPasswordVerifyOpen(false);
      setPasswordInput('');
      setPendingVaultUser(null);
    } catch (err) {
      window.alert(
        err?.message ||
        'Password verification failed.'
      );
    }
  }

function teacherNameForAssignment(assignment) {
    return assignment.Teacher?.name || teachers.find(t => Number(t.id) === Number(assignment.teacherId))?.name || 'Teacher';
  }

  return (
    <div className="teacher-redesign-page">
      <TeacherRedesignStyles />

      <header className="teacher-main-header teacher-main-header-clean">
        <div className="teacher-brand-area">
          <div className="teacher-brand-mark">
            <img
              src="/tuklas-talino-icon.png"
              alt=""
              className="teacher-brand-logo-img"
              style={{ width: '52px', height: '52px', objectFit: 'contain', borderRadius: '14px', background: '#ffffff' }}
            />
            <div className="teacher-brand-text">
              <strong>Tuklas Talino</strong>
              <small>Tuklasin. Matuto. Magningning.</small>
            </div>
          </div>
        </div>

        <div className="teacher-header-actions">
          <div className="teacher-profile-pill">
            <div className="teacher-profile-avatar">🛡️</div>
            <div className="teacher-profile-text">
              <strong>Admin</strong>
              <small>System Manager</small>
            </div>
            <span>⌄</span>
          </div>
        </div>
      </header>

      <main className="teacher-main-content teacher-main-content-clean" id="admin-dashboard-top">
        <div className="teacher-sidebar-layout">
          <aside className="teacher-side-nav" aria-label="Admin workspace navigation">
            <div className="teacher-side-nav-title">
              <span>🛡️</span>
              <strong>Admin Panel</strong>
            </div>

            <button className={`teacher-sidebar-button ${adminTab === 'overview' ? 'active' : ''}`} type="button" onClick={() => openTab('overview')}>
              <span>📊</span>
              <strong>Overview</strong>
            </button>

            <button className={`teacher-sidebar-button ${adminTab === 'add' ? 'active' : ''}`} type="button" onClick={() => openTab('add')}>
              <span>➕</span>
              <strong>Add Accounts</strong>
            </button>

            <button className={`teacher-sidebar-button ${adminTab === 'assignments' ? 'active' : ''}`} type="button" onClick={() => openTab('assignments')}>
              <span>🏫</span>
              <strong>Teacher Assignments</strong>
            </button>

            <button className={`teacher-sidebar-button ${adminTab === 'students' ? 'active' : ''}`} type="button" onClick={() => openTab('students')}>
              <span>👨‍🎓</span>
              <strong>Students</strong>
            </button>

            <button className={`teacher-sidebar-button ${adminTab === 'teachers' ? 'active' : ''}`} type="button" onClick={() => openTab('teachers')}>
              <span>👩‍🏫</span>
              <strong>Teachers</strong>
            </button>

            <button className={`teacher-sidebar-button ${adminTab === 'archives' ? 'active' : ''}`} type="button" onClick={() => openTab('archives')}>
              <span>🗃️</span>
              <strong>Archives</strong>
            </button>

            <button className={`teacher-sidebar-button ${adminTab === 'logs' ? 'active' : ''}`} type="button" onClick={() => openTab('logs')}>
              <span>🧾</span>
              <strong>Audit Logs</strong>
            </button>

            <button className="teacher-sidebar-button danger" type="button" onClick={logout}>
              <span>⇥</span>
              <strong>Logout</strong>
            </button>
          </aside>

          <div className="teacher-main-workarea" id="admin-dashboard-workspace">
            <section className="teacher-clean-hero">
              <div className="teacher-clean-hero-copy">
                <div className="lms-section-label">Admin Workspace</div>
                <h1>Admin Dashboard</h1>
                <p>Manage accounts, class assignments, archives, and system activity in one place.</p>
              </div>

              <div className="teacher-clean-actions">
                <button className="lms-view-button" type="button" onClick={() => openTab('assignments')}>
                  🏫 Assign Teachers
                </button>
                <button className="teacher-logout-btn light" type="button" onClick={reload}>
                  🔄 Refresh
                </button>
              </div>
            </section>

            {adminTab === 'overview' && (
              <>
                <section className="teacher-clean-metrics" aria-label="Admin quick stats">
                  <button className="teacher-clean-metric" type="button" onClick={() => openTab('students')}>
                    <span className="metric-icon blue">👥</span>
                    <span><small>Total Users</small><strong>{stats.users || 0}</strong></span>
                  </button>

                  <button className="teacher-clean-metric" type="button" onClick={() => openTab('students')}>
                    <span className="metric-icon green">👨‍🎓</span>
                    <span><small>Students</small><strong>{stats.students || students.length || 0}</strong></span>
                  </button>

                  <button className="teacher-clean-metric" type="button" onClick={() => openTab('teachers')}>
                    <span className="metric-icon yellow">👩‍🏫</span>
                    <span><small>Teachers</small><strong>{stats.teachers || teachers.length || 0}</strong></span>
                  </button>

                  <button className="teacher-clean-metric" type="button" onClick={() => openTab('assignments')}>
                    <span className="metric-icon purple">🏫</span>
                    <span><small>Assignments</small><strong>{teacherAssignments.length}</strong></span>
                  </button>
                </section>

                <section className="teacher-workspace-card">
                  <div className="teacher-workspace-heading">
                    <div>
                      <div className="lms-section-label">System Overview</div>
                      <h2>Account Management Summary</h2>
                      <p>Use this area to check active accounts, teacher assignments, and recent maintenance actions.</p>
                    </div>
                  </div>

                  <div className="teacher-monitor-summary">
                    <div><span>Active Students</span><strong>{students.length}</strong></div>
                    <div><span>Active Teachers</span><strong>{teachers.length}</strong></div>
                    <div><span>Archived Accounts</span><strong>{archivedStudents.length + archivedTeachers.length}</strong></div>
                  </div>

                  <div className="lms-empty-line" style={{ marginTop: 14 }}>
                    Tip: Assign teachers to grade and section first so their dashboard, reports, quizzes, and student monitoring stay properly filtered.
                  </div>
                </section>
              </>
            )}

            {adminTab === 'add' && (
              <section className="teacher-clean-panel">
                <div className="teacher-form-grid">
                  <div className="teacher-workspace-card">
                    <div className="teacher-workspace-heading">
                      <div>
                        <div className="lms-section-label">Student Account</div>
                        <h2>Add Student</h2>
                        <p>Create a learner account. The system automatically generates the username and temporary PIN.</p>
                      </div>
                    </div>


                    <form onSubmit={handleAddStudent} noValidate>
                      <label style={{ display: 'block', marginBottom: 4, fontWeight: 700 }}>Student Full Name</label>
                      <input
                        className="input-field"
                        placeholder="e.g. Juan Dela Cruz"
                        value={stuForm.name}
                        onChange={e => setStuForm(f => ({ ...f, name: e.target.value }))}
                      />
                      {stuErrors.name && <p style={{ color: '#dc2626', fontSize: 13, margin: '4px 0 8px' }}>Enter the student's first and last name.</p>}

                      <div style={{ height: 10 }} />
                      <label style={{ display: 'block', marginBottom: 4, fontWeight: 700 }}>Grade</label>
                      <select
                        className="input-field"
                        value={stuForm.gradeLevel}
                        onChange={e => setStuForm(f => ({ ...f, gradeLevel: e.target.value }))}
                      >
                        <option value="">Select Grade</option>
                        {[1,2,3,4,5,6].map(grade => (
                          <option key={grade} value={grade}>Grade {grade}</option>
                        ))}
                      </select>
                      {stuErrors.gradeLevel && <p style={{ color: '#dc2626', fontSize: 13, margin: '4px 0 8px' }}>Grade must be from 1 to 6.</p>}

                      <div style={{ height: 10 }} />
                      <label style={{ display: 'block', marginBottom: 4, fontWeight: 700 }}>Section</label>
                      <input
                        className="input-field"
                        placeholder={stuSectionOptions.length ? 'Pumili o mag-type ng section' : 'Type section name'}
                        list="stu-section-list"
                        value={stuForm.section}
                        onChange={e => setStuForm(f => ({ ...f, section: e.target.value }))}
                        autoComplete="off"
                      />
                      {stuSectionOptions.length > 0 && (
                        <datalist id="stu-section-list">
                          {stuSectionOptions.map(sec => (
                            <option key={sec} value={sec} />
                          ))}
                        </datalist>
                      )}
                      {stuErrors.section && <p style={{ color: '#dc2626', fontSize: 13, margin: '4px 0 8px' }}>Section is required.</p>}

                      <p className="add-teacher-helper-note" style={{ margin: '8px 0 18px', color: '#687a72', fontSize: 16, fontWeight: 800, lineHeight: 1.35 }}>
                        The system automatically generates the student's username and temporary PIN.
                        The student must change the PIN on first login.
                      </p>

                      {stuCredentials && (
                        <div style={{ background: '#f0fdf4', border: '1.5px solid #22c55e', borderRadius: 10, padding: '14px 16px', marginBottom: 14 }}>
                          <p style={{ fontWeight: 900, color: '#166534', marginBottom: 6 }}>✅ Student Account Created</p>
                          <p style={{ margin: '2px 0', fontSize: 14 }}><strong>Username:</strong> {stuCredentials.username}</p>
                          <p style={{ margin: '2px 0', fontSize: 14 }}><strong>Temporary PIN:</strong> {stuCredentials.pin}</p>
                          <p style={{ margin: '6px 0 0', fontSize: 12, color: '#687a72' }}>Student must change this PIN on first login.</p>
                        </div>
                      )}

                      <div className="divider" />
                      <button
                        className="lms-main-action full"
                        type="submit"
                        disabled={stuSubmitting}
                        style={{ opacity: stuSubmitting ? 0.6 : 1 }}
                      >
                        {stuSubmitting ? 'Creating...' : 'Create Student'}
                      </button>
                    </form>
                  </div>

                  <div className="teacher-workspace-card">
                    <div className="teacher-workspace-heading">
                      <div>
                        <div className="lms-section-label">Teacher Account</div>
                        <h2>Add Teacher</h2>
                        <p>Create a teacher account. The system automatically generates the username, employee code, and temporary PIN.</p>
                      </div>
                    </div>


                    <form onSubmit={handleAddTeacher} noValidate>
                      <label style={{ display: 'block', marginBottom: 4, fontWeight: 700 }}>Teacher Full Name</label>
                      <input
                        className="input-field"
                        placeholder="e.g. Maria Santos"
                        value={tchForm.name}
                        onChange={e => setTchForm(f => ({ ...f, name: e.target.value }))}
                      />
                      {tchErrors.name && <p style={{ color: '#dc2626', fontSize: 13, margin: '4px 0 8px' }}>Enter the teacher's first and last name.</p>}

                      <div style={{ height: 10 }} />
                      <label style={{ display: 'block', marginBottom: 4, fontWeight: 700 }}>Email (optional)</label>
                      <input
                        className="input-field"
                        type="email"
                        placeholder="Email (Optional)"
                        value={tchForm.email}
                        autoComplete="off"
                        onChange={e => setTchForm(f => ({ ...f, email: e.target.value.trim() }))}
                      />
                      {tchErrors.email && <p style={{ color: '#dc2626', fontSize: 13, margin: '4px 0 8px' }}>Invalid email address.</p>}

                      <p className="add-teacher-helper-note" style={{ margin: '8px 0 18px', color: '#687a72', fontSize: 16, fontWeight: 800, lineHeight: 1.35 }}>
                        Username (TCH-YYYY-XXX) and employee code are generated automatically.
                        The teacher must change the PIN on first login.
                      </p>

                      {tchCredentials && (
                        <div style={{ background: '#f0fdf4', border: '1.5px solid #22c55e', borderRadius: 10, padding: '14px 16px', marginBottom: 14 }}>
                          <p style={{ fontWeight: 900, color: '#166534', marginBottom: 6 }}>✅ Teacher Account Created</p>
                          <p style={{ margin: '2px 0', fontSize: 14 }}><strong>Username:</strong> {tchCredentials.username}</p>
                          <p style={{ margin: '2px 0', fontSize: 14 }}><strong>Temporary PIN:</strong> {tchCredentials.pin}</p>
                          <p style={{ margin: '6px 0 0', fontSize: 12, color: '#687a72' }}>Teacher must change this PIN on first login.</p>
                        </div>
                      )}

                      <div className="divider" />
                      <button
                        className="lms-main-action full"
                        type="submit"
                        disabled={tchSubmitting}
                        style={{ opacity: tchSubmitting ? 0.6 : 1 }}
                      >
                        {tchSubmitting ? 'Creating...' : 'Create Teacher'}
                      </button>
                    </form>
                  </div>
                </div>
              </section>
            )}

            {adminTab === 'assignments' && (
              <section className="teacher-workspace-card">
                <div className="teacher-workspace-heading">
                  <div>
                    <div className="lms-section-label">Teacher Assignment</div>
                    <h2>Assign Teacher to Class</h2>
                    <p>Choose which grade each teacher handles, then pick a matching section. This controls their monitoring, reports, quiz attempts, and student lists.</p>
                  </div>
                </div>

                <div className="teacher-tool-box">
                  <div className="teacher-form-grid">
                    <select className="input-field" id="a-assign-teacher" defaultValue="">
                      <option value="">Select teacher</option>
                      {teachers.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>

                    <select className="input-field" id="a-assign-grade" value={assignGradeFilter} onChange={e => { setAssignGradeFilter(e.target.value); const section = document.getElementById('a-assign-section'); if (section) section.value = ''; }}>
                      <option value="">Grade</option>
                      {[1, 2, 3, 4, 5, 6].map(grade => (
                        <option key={grade} value={grade}>Grade {grade}</option>
                      ))}
                    </select>

                    <select className="input-field" id="a-assign-section" defaultValue="">
                      <option value="">Section</option>
                      {sectionOptions.map(section => (
                        <option key={section} value={section}>{section}</option>
                      ))}
                      {!sectionOptions.length && (
                        <option value="" disabled>No sections found for this grade</option>
                      )}
                    </select>

                    <button className="lms-main-action" type="button" onClick={assignTeacherClass}>
                      Save Assignment
                    </button>
                  </div>
                </div>

                <div className="divider" />

                <div className="teacher-groups-grid">
                  {teacherAssignments.map(assignment => (
                    <div className="teacher-group-item" key={assignment.id}>
                      <div className="teacher-group-item-top">
                        <div>
                          <strong>{teacherNameForAssignment(assignment)}</strong>
                          <p>{assignmentLabel(assignment)}</p>
                        </div>
                        <span className="lms-mini-pill">Assigned</span>
                      </div>

                      <button className="btn btn-danger btn-sm" type="button" onClick={() => removeTeacherAssignment(assignment.id)}>
                        Remove
                      </button>
                    </div>
                  ))}

                  {!teacherAssignments.length && (
                    <div className="lms-empty-line">No teacher class assignments yet.</div>
                  )}
                </div>
              </section>
            )}

            {adminTab === 'students' && (
              <section className="teacher-workspace-card">
                <div className="teacher-workspace-heading">
                  <div>
                    <div className="lms-section-label">Learner Accounts</div>
                    <h2>Students</h2>
                    <p>Manage active student accounts, reset passwords, and reset progress when needed.</p>
                  </div>

                  <button className="lms-view-button" type="button" onClick={reload}>
                    Refresh
                  </button>
                </div>

                <div className="admin-clean-table">
                  <div className="admin-clean-table-head">
                    <span>Student</span>
                    <span>Grade & Section</span>
                    <span>Status</span>
                    <span>Actions</span>
                  </div>


                    <div className="teacher-tool-box" style={{ marginBottom: 16 }}>
                      <div className="teacher-form-grid">
                        <select
                          className="input-field"
                          value={studentGradeFilter}
                          onChange={event => {
                            setStudentGradeFilter(event.target.value);
                            setStudentSectionFilter('all');
                          }}
                        >
                          <option value="all">All year levels</option>
                          {[1, 2, 3, 4, 5, 6].map(grade => (
                            <option key={grade} value={grade}>Grade {grade}</option>
                          ))}
                        </select>

                        <select
                          className="input-field"
                          value={studentSectionFilter}
                          onChange={event => setStudentSectionFilter(event.target.value)}
                        >
                          <option value="all">All sections</option>
                          {studentManagementSectionOptions.map(section => (
                            <option key={section} value={section}>{section}</option>
                          ))}
                        </select>
                      </div>
                      <p style={{ margin: '10px 0 0', color: '#64748b', fontSize: 13 }}>
                        Showing {filteredStudents.length} of {students.length} active student{students.length === 1 ? '' : 's'}.
                      </p>
                    </div>

{filteredStudents.map(s => (
                    <div className="admin-clean-table-row" key={s.id}>
                      <span>
                        <strong>{s.name}</strong>
                        <small>{s.studentCode}</small>
                      </span>

                      <span>
                        <strong>Grade {s.gradeLevel}</strong>
                        <small>{s.section}</small>
                      </span>

                      <span>
                        <span className="lms-mini-pill">{s.status}</span>
                      </span>

                      <span className="admin-clean-actions">
                        <button className="btn btn-outline btn-sm" onClick={() => openVault('Student', s)}>Login Credentials</button>
                        <button className="btn btn-outline btn-sm" onClick={() => resetStudent(s.id)}>Reset Progress</button>
                        <button className="btn btn-danger btn-sm" onClick={() => archiveStudent(s.id)}>Archive</button>
                      </span>
                    </div>
                  ))}

                  {!students.length && (
                    <div className="lms-empty-line">No active students.</div>
                  )}
                </div>
              </section>
            )}

            {adminTab === 'teachers' && (
              <section className="teacher-workspace-card">
                <div className="teacher-workspace-heading">
                  <div>
                    <div className="lms-section-label">Teacher Accounts</div>
                    <h2>Teachers</h2>
                    <p>Manage teacher accounts and check their assigned classes.</p>
                  </div>
                </div>

                <div className="teacher-groups-grid">
                  {teachers.map(t => {
                    const assignments = teacherAssignments.filter(a => Number(a.teacherId) === Number(t.id));

                    return (
                      <div className="teacher-group-item" key={t.id}>
                        <div className="teacher-group-item-top">
                          <div>
                            <strong>{t.name}</strong>
                            <p>
                              Username: <strong>{teacherUsernameForCard(t)}</strong> • {t.status}
                            </p>
                            <p className="g46-ref-muted">
                              Handles: {assignments.length ? assignments.map(assignmentLabel).join(', ') : 'No class assigned yet'}
                            </p>
                          </div>
                          <span className="lms-mini-pill">Teacher</span>
                        </div>

                        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
                          <button className="btn btn-outline btn-sm" onClick={() => openVault('Teacher', t)}>Login Credentials</button>
                          <button className="btn btn-danger btn-sm" onClick={() => archiveTeacher(t.id)}>Archive</button>
                        </div>
                      </div>
                    );
                  })}

                  {!teachers.length && (
                    <div className="lms-empty-line">No active teachers.</div>
                  )}
                </div>
              </section>
            )}

            {adminTab === 'archives' && (
              <section className="teacher-clean-panel">
                <div className="teacher-workspace-card">
                  <div className="teacher-workspace-heading">
                    <div>
                      <div className="lms-section-label">Archived Accounts</div>
                      <h2>Archived Students</h2>
                      <p>Archived students cannot log in, but their records remain saved.</p>
                    </div>
                  </div>

                  {archivedStudents.map(s => (
                    <div className="teacher-group-item" key={s.id}>
                      <div className="teacher-group-item-top">
                        <div>
                          <strong>{s.name}</strong>
                          <p>{s.studentCode} • Grade {s.gradeLevel} • {s.section}</p>
                        </div>
                        <button className="btn btn-green btn-sm" onClick={() => reactivateStudent(s.id)}>Reactivate</button>
                      </div>
                    </div>
                  ))}

                  {!archivedStudents.length && (
                    <div className="lms-empty-line">No archived students.</div>
                  )}
                </div>

                <div className="teacher-workspace-card" style={{ marginTop: 16 }}>
                  <div className="teacher-workspace-heading">
                    <div>
                      <div className="lms-section-label">Archived Accounts</div>
                      <h2>Archived Teachers</h2>
                      <p>Archived teachers cannot log in, but their records remain saved.</p>
                    </div>
                  </div>

                  {archivedTeachers.map(t => (
                    <div className="teacher-group-item" key={t.id}>
                      <div className="teacher-group-item-top">
                        <div>
                          <strong>{t.name}</strong>
                          <p>
                            Username: <strong>{teacherUsernameForCard(t)}</strong> • Archived
                          </p>
                        </div>
                        <button className="btn btn-green btn-sm" onClick={() => reactivateTeacher(t.id)}>Reactivate</button>
                      </div>
                    </div>
                  ))}

                  {!archivedTeachers.length && (
                    <div className="lms-empty-line">No archived teachers.</div>
                  )}
                </div>
              </section>
            )}

            {adminTab === 'logs' && (
              <section className="teacher-workspace-card">
                <div className="teacher-workspace-heading">
                  <div>
                    <div className="lms-section-label">Audit Trail</div>
                    <h2>Account History</h2>
                    <p>Read-only record of recent admin and system maintenance actions.</p>
                  </div>
                </div>


                <div
                  style={{
                    display:'grid',
                    gridTemplateColumns:'repeat(4,1fr)',
                    gap:12,
                    marginBottom:20
                  }}
                >
                  <div className="teacher-stat-card">
                    <strong>{logs.length}</strong>
                    <div>Total Logs</div>
                  </div>

                  <div className="teacher-stat-card">
                    <strong>{todayLogs}</strong>
                    <div>Today</div>
                  </div>

                  <div className="teacher-stat-card">
                    <strong>{weekLogs}</strong>
                    <div>Last 7 Days</div>
                  </div>

                  <div className="teacher-stat-card">
                    <strong>{monthLogs}</strong>
                    <div>This Month</div>
                  </div>
                </div>

                <div
                  style={{
                    display:'flex',
                    gap:10,
                    flexWrap:'wrap',
                    marginBottom:16
                  }}
                >
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      const d = new Date();
                      setFromDate(d.toISOString().slice(0,10));
                      setToDate(d.toISOString().slice(0,10));
                    }}
                  >
                    Today
                  </button>

                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate()-7);
                      setFromDate(d.toISOString().slice(0,10));
                      setToDate(new Date().toISOString().slice(0,10));
                    }}
                  >
                    Last 7 Days
                  </button>

                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      const d = new Date();
                      d.setDate(d.getDate()-30);
                      setFromDate(d.toISOString().slice(0,10));
                      setToDate(new Date().toISOString().slice(0,10));
                    }}
                  >
                    Last 30 Days
                  </button>

                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setFromDate('');
                      setToDate('');
                    }}
                  >
                    All
                  </button>
                </div>

<div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
                    gap: 12,
                    marginBottom: 20,
                    alignItems: 'end'
                  }}
                >
                  <input
                    className="input-field"
                    type="text"
                    placeholder="Search action or entity..."
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                  />

                  <select
                    className="input-field"
                    value={logAction}
                    onChange={(e) => setLogAction(e.target.value)}
                  >
                    <option value="">All Actions</option>

                    {actionOptions.map(action => (
                      <option key={action} value={action}>
                        {action}
                      </option>
                    ))}
                  </select>

                  <input
                    className="input-field"
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />

                  <input
                    className="input-field"
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />

                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setLogSearch('');
                      setLogAction('');
                      setFromDate('');
                      setToDate('');
                    }}
                  >
                    Reset
                  </button>
                </div>

                <div className="admin-clean-table admin-audit-table">
                  <div className="admin-clean-table-head">
                    <span>Action</span>
                    <span>Entity</span>
                    <span>Record</span>
                    <span>Date</span>
                  </div>

                  {filteredLogs.map(log => (
                    <div className="admin-clean-table-row" key={log.id}>
                      <span>
                        <strong>{log.action}</strong>
                      </span>

                      <span>
                        <strong>{log.entityType || 'Record'}</strong>
                      </span>

                      <span>
                        <span className="lms-mini-pill">#{log.entityId || '-'}</span>
                      </span>

                      <span>
                        <small>{fmtDate(log.createdAt)}</small>
                      </span>
                    </div>
                  ))}

                  {!filteredLogs.length && (
                    <div className="lms-empty-line">No audit logs match the selected filters.</div>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>

      {passwordVerifyOpen && (
        <div
          className="vault-overlay"
          onClick={() => {
            setPasswordVerifyOpen(false);
            setPasswordInput('');
            setPendingVaultUser(null);
          }}
        >
          <div
            className="vault-card"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>🔐 Verify Password</h2>

            <div className="vault-note">
              Re-enter your admin password to continue.
            </div>

            <input
              className="input-field"
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="Admin password"
            />

            <div className="vault-actions">
              <button
                className="btn btn-primary"
                onClick={executeVerifiedOpenVault}
              >
                Verify
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => {
                  setPasswordVerifyOpen(false);
                  setPasswordInput('');
                  setPendingVaultUser(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

{vaultOpen && (
        <div
          className="vault-overlay"
          onClick={() => setVaultOpen(false)}
        >
          <div
            className="vault-card"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>🔑 Login Credentials</h2>

            <div className="vault-note">
              View login information and generate a temporary PIN for password resets.
            </div>

            <div className="vault-row">
              <strong>Name</strong>
              <span>{vaultUser?.name}</span>
            </div>

            <div className="vault-row">
              <strong>Account Type</strong>
              <span>{vaultUser?.type}</span>
            </div>

            <div className="vault-row">
              <strong>Temporary PIN</strong>
              <div className="vault-pin">
                {generatedPin}
              </div>
            </div>

            <div className="vault-note">
              User must change password on next login.
            </div>

            <div className="vault-actions">
              <button
                className="btn btn-primary"
                onClick={async () => {
                  if (!vaultUser) return;

                  const pin =
                    vaultUser.type === 'Student'
                      ? await resetStudentPassword(vaultUser.id, vaultUser.name, true)
                      : await resetTeacherPassword(vaultUser.id, vaultUser.name, true);

                  setGeneratedPin(pin || '');
                }}
              >
                Generate New PIN
              </button>

              <button
                className="btn btn-primary"
                disabled={!generatedPin}
                onClick={() => navigator.clipboard.writeText(generatedPin)}
              >
                Copy Temporary PIN
              </button>

              <button
                className="btn btn-secondary"
                onClick={() => setVaultOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}


      </main>
    </div>
  );
}
