import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const defaults = {
  student: { label: 'Student ID', icon: '🧒' },
  teacher: { label: 'Username', icon: '👩‍🏫' },
  admin: { label: 'Username', icon: '🛡️' }
};

export default function LoginPage() {
  const { role = 'student' } = useParams();
  const meta = defaults[role] || defaults.student;
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login({ role, identifier, password });
      navigate(user.role === 'student' ? '/student' : user.role === 'teacher' ? '/teacher' : '/admin');
    } catch (err) {
      setError(err.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <Link to="/" className="back-link">← Back</Link>
        <div className="auth-icon">{meta.icon}</div>
        <h1>{role[0].toUpperCase() + role.slice(1)} Login</h1>

        <label>{meta.label}
          <input value={identifier} onChange={e => setIdentifier(e.target.value)} required />
        </label>
        <label>Password
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        </label>

        {error && <div className="alert error">{error}</div>}
        <button className="btn primary" disabled={loading}>{loading ? 'Signing in...' : 'Login'}</button>
      </form>
    </section>
  );
}
