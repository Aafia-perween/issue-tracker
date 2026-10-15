const express = require('express');
const db = require('../db');

const router = express.Router({ mergeParams: true });

function notify(req) {
  req.app.get('io').to(`workspace:${req.params.workspaceId}`).emit('tickets_changed');
}

const STATUSES = ['todo', 'in_progress', 'done'];
const PRIORITIES = ['low', 'medium', 'high'];

// Create ticket
router.post('/', async (req, res) => {
  try {
    const { title, description, priority, assignee_id } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    if (priority && !PRIORITIES.includes(priority)) {
      return res.status(400).json({ message: 'Invalid priority' });
    }

    const [result] = await db.query(
      `INSERT INTO tickets (workspace_id, title, description, priority, assignee_id, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.params.workspaceId,
        title,
        description || null,
        priority || 'medium',
        assignee_id || null,
        req.user.id,
      ]
    );
    notify(req);
    res.status(201).json({ id: result.insertId, title, status: 'todo' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// List tickets in this workspace
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT t.*, u.name AS assignee_name
       FROM tickets t
       LEFT JOIN users u ON u.id = t.assignee_id
       WHERE t.workspace_id = ?
       ORDER BY t.created_at DESC`,
      [req.params.workspaceId]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update ticket (title, description, status, priority, assignee)
router.patch('/:ticketId', async (req, res) => {
  try {
    const allowed = ['title', 'description', 'status', 'priority', 'assignee_id'];
    const fields = [];
    const values = [];

    if (req.body.status && !STATUSES.includes(req.body.status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    if (req.body.priority && !PRIORITIES.includes(req.body.priority)) {
      return res.status(400).json({ message: 'Invalid priority' });
    }

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(req.body[key]);
      }
    }
    if (fields.length === 0) {
      return res.status(400).json({ message: 'Nothing to update' });
    }

    values.push(req.params.ticketId, req.params.workspaceId);
    const [result] = await db.query(
      `UPDATE tickets SET ${fields.join(', ')} WHERE id = ? AND workspace_id = ?`,
      values
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    notify(req);
    res.json({ message: 'Ticket updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete ticket (admin only)
router.delete('/:ticketId', async (req, res) => {
  try {
    if (req.memberRole !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete tickets' });
    }
    const [result] = await db.query(
      'DELETE FROM tickets WHERE id = ? AND workspace_id = ?',
      [req.params.ticketId, req.params.workspaceId]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Ticket not found' });
    }
    notify(req);
    res.json({ message: 'Ticket deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;