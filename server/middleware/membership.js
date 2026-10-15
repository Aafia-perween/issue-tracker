const db = require('../db');

module.exports = async function requireMember(req, res, next) {
  try {
    const [rows] = await db.query(
      'SELECT role FROM workspace_members WHERE workspace_id = ? AND user_id = ?',
      [req.params.workspaceId, req.user.id]
    );
    if (rows.length === 0) {
      return res.status(403).json({ message: 'You are not a member of this workspace' });
    }
    req.memberRole = rows[0].role;
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};