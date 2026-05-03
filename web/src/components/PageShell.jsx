import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function PageShell({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const navByRole = {
    student: [
      ['/student', 'Dashboard'],
      ['/student/lessons', 'Lessons'],
      ['/student/groups', 'Groups'],
      ['/student/badges', 'Badges'],
      ['/student/profile', 'Profile']
    ],
    teacher: [
      ['/teacher', 'Teacher Dashboard'],
      ['/teacher?tab=students', 'Students'],
      ['/teacher?tab=groups', 'Groups']
    ],
    admin: [
      ['/admin', 'Admin Dashboard']
    ]
  };

  function doLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="brand-mark">TT</span>
          <span>Tuklas Talino</span>
        </Link>
        {user && (
          <nav className="nav-pills" aria-label="Main navigation">
            {(navByRole[user.role] || []).map(([to, label]) => (
              <NavLink key={to} to={to}>{label}</NavLink>
            ))}
          </nav>
        )}
        {user && (
          <button className="btn ghost" onClick={doLogout}>Logout</button>
        )}
      </header>
      <main>{children}</main>
    </div>
  );
}
