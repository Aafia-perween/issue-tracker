const express = require('express');
const db = require('../db');
const auth = require('../middleware/auth');
const requireMember = require('../middleware/membership');

const router = express.Router();
router.use(auth);

// Create workspace (creator becomes admin)
router.post('/', async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Workspace name is required' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query(
      'INSERT INTO workspaces (name, owner_id) VALUES (?, ?)',
      [name, req.user.id]
    );
    await conn.query(
      'INSERT INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, ?)',
      [result.insertId, req.user.id, 'admin']
    );
    await conn.commit();
    res.status(201).json({ id: result.insertId, name, role: 'admin' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  } finally {
    conn.release();
  }
});

// List my workspaces
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT w.id, w.name, m.role
       FROM workspaces w
       JOIN workspace_members m ON m.workspace_id = w.id
       WHERE m.user_id = ?
       ORDER BY w.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add a member by email (admin only)
router.post('/:workspaceId/members', requireMember, async (req, res) => {
  try {
    if (req.memberRole !== 'admin') {
      return res.status(403).json({ message: 'Only admins can add members' });
    }
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const [users] = await db.query('SELECT id, name FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(404).json({ message: 'No user found with this email' });
    }

    await db.query(
      'INSERT IGNORE INTO workspace_members (workspace_id, user_id, role) VALUES (?, ?, ?)',
      [req.params.workspaceId, users[0].id, 'member']
    );
    res.status(201).json({ message: `${users[0].name} added to workspace` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Tickets live inside a workspace
router.use('/:workspaceId/tickets', requireMember, require('./tickets'));

module.exports = router;