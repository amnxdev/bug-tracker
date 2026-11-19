import express from 'express';
import User from '../models/User.js';
import { verifyToken, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/users — any logged-in user; returns _id, username, email, role only
router.get('/', verifyToken, async (req, res) => {
  try {
    const users = await User.find().select('_id username email role').sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error: error.message });
  }
});

// PUT /api/users/:id/role — admin only; body { role: 'user'|'admin' }; an admin cannot demote themselves
router.put('/:id/role', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { role } = req.body;
    if (!role || !['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: "Role must be 'user' or 'admin'" });
    }

    const targetUserId = req.params.id;
    const currentAdminId = String(req.user?._id || req.user?.id);

    // An admin cannot demote themselves
    if (String(targetUserId) === currentAdminId && role !== 'admin') {
      return res.status(403).json({ message: "Admins cannot demote themselves" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      targetUserId,
      { role },
      { new: true }
    ).select('_id username email role');

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User role updated successfully",
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ message: "Error updating user role", error: error.message });
  }
});

export default router;
