import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { saveAuth } from '../auth';

export default function AuthPage({ mode }) {
  const isSignup = mode === 'signup';
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignup) {
        await api('/auth/signup', { method: 'POST', body: form });
      }
      const data = await api('/auth/login', {
        method: 'POST',
        body: { email: form.email, password: form.password },
      });
      saveAuth(data);
      navigate('/workspaces');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <h1>{isSignup ? 'Create account' : 'Welcome back'}</h1>
      <form onSubmit={handleSubmit}>
        {isSignup && (
          <input name="name" placeholder="Name" value={form.name} onChange={handleChange} required />
        )}
        <input name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} required />
        <input name="password" type="password" placeholder="Password (min 6 characters)" value={form.password} onChange={handleChange} required />
        {error && <p className="error">{error}</p>}
        <button type="submit" disabled={loading}>
          {loading ? 'Please wait...' : isSignup ? 'Sign up' : 'Log in'}
        </button>
      </form>
      <p className="muted">
        {isSignup ? 'Already have an account? ' : "Don't have an account? "}
        <Link to={isSignup ? '/login' : '/signup'}>{isSignup ? 'Log in' : 'Sign up'}</Link>
      </p>
    </div>
  );
}