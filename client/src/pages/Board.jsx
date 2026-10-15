import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { io } from 'socket.io-client';
import { api } from '../api';

const STATUSES = [
  { key: 'todo', label: 'To Do' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'done', label: 'Done' },
];

export default function Board() {
  const { workspaceId } = useParams();
  const base = `/workspaces/${workspaceId}`;
  const [tickets, setTickets] = useState([]);
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('medium');
  const [memberEmail, setMemberEmail] = useState('');
  const [message, setMessage] = useState('');

  const loadTickets = useCallback(() => {
    return api(`${base}/tickets`)
      .then(setTickets)
      .catch((err) => setMessage(err.message));
  }, [base]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    const socket = io('http://localhost:5000', {
      auth: { token: localStorage.getItem('token') },
    });
    socket.on('connect', () => socket.emit('join_workspace', workspaceId));
    socket.on('tickets_changed', loadTickets);
    return () => socket.disconnect();
  }, [workspaceId, loadTickets]);

  const addTicket = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      await api(`${base}/tickets`, { method: 'POST', body: { title, priority } });
      setTitle('');
      loadTickets();
    } catch (err) {
      setMessage(err.message);
    }
  };

  const move = async (ticket, step) => {
    const index = STATUSES.findIndex((s) => s.key === ticket.status) + step;
    if (index < 0 || index >= STATUSES.length) return;
    const status = STATUSES[index].key;
    try {
      await api(`${base}/tickets/${ticket.id}`, { method: 'PATCH', body: { status } });
      loadTickets();
    } catch (err) {
      setMessage(err.message);
    }
  };

  const remove = async (id) => {
    try {
      await api(`${base}/tickets/${id}`, { method: 'DELETE' });
      loadTickets();
    } catch (err) {
      setMessage(err.message);
    }
  };

  const addMember = async (e) => {
    e.preventDefault();
    try {
      const data = await api(`${base}/members`, { method: 'POST', body: { email: memberEmail } });
      setMessage(data.message);
      setMemberEmail('');
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <div className="page">
      <header className="topbar">
        <h1>Board</h1>
        <Link to="/workspaces">← All workspaces</Link>
      </header>

      <form className="inline-form" onSubmit={addTicket}>
        <input placeholder="New ticket title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button type="submit">Add ticket</button>
      </form>

      <form className="inline-form" onSubmit={addMember}>
        <input type="email" placeholder="Invite member by email (admin only)" value={memberEmail} onChange={(e) => setMemberEmail(e.target.value)} required />
        <button type="submit" className="secondary">Add member</button>
      </form>

      {message && <p className="error">{message}</p>}

      <div className="board">
        {STATUSES.map((col) => (
          <div key={col.key} className="column">
            <h2>{col.label} <span className="badge">{tickets.filter((t) => t.status === col.key).length}</span></h2>
            {tickets
              .filter((t) => t.status === col.key)
              .map((t) => (
                <div key={t.id} className="ticket">
                  <strong>{t.title}</strong>
                  <span className={`badge ${t.priority}`}>{t.priority}</span>
                  <div className="ticket-actions">
                    <button className="secondary" onClick={() => move(t, -1)} disabled={col.key === 'todo'}>←</button>
                    <button className="secondary" onClick={() => move(t, 1)} disabled={col.key === 'done'}>→</button>
                    <button className="danger" onClick={() => remove(t.id)}>Delete</button>
                  </div>
                </div>
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}