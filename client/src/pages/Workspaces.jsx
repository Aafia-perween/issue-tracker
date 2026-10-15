import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { getUser, logout } from '../auth';

export default function Workspaces() {
  const navigate = useNavigate();
  const user = getUser();
  const [workspaces, setWorkspaces] = useState([]);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api('/workspaces')
      .then(setWorkspaces)
      .catch((err) => setError(err.message));
  }, []);

  const createWorkspace = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const created = await api('/workspaces', { method: 'POST', body: { name } });
      setWorkspaces([created, ...workspaces]);
      setName('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="page">
      <header className="topbar">
        <h1>My Workspaces</h1>
        <div>
          <span className="muted">{user?.name}</span>
          <button className="secondary" onClick={handleLogout}>Log out</button>
        </div>
      </header>

      <form className="inline-form" onSubmit={createWorkspace}>
        <input placeholder="New workspace name" value={name} onChange={(e) => setName(e.target.value)} required />
        <button type="submit">Create</button>
      </form>
      {error && <p className="error">{error}</p>}

      <div className="grid">
        {workspaces.map((w) => (
          <Link key={w.id} to={`/workspaces/${w.id}`} className="card">
            <h3>{w.name}</h3>
            <span className="badge">{w.role}</span>
          </Link>
        ))}
        {workspaces.length === 0 && <p className="muted">No workspaces yet. Create your first one above.</p>}
      </div>
    </div>
  );
}