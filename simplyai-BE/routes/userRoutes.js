/**
 * userRoutes.js
 * 
 * FIX 6.2.5 — Exposes GET and PUT /api/users/:id/profile so the frontend
 * Account page can fetch and update the full user profile including all
 * billing/invoice fields added in fix 6.2.4.
 *
 * Register in your main Express app:
 *   import userRoutes from './routes/userRoutes.js';
 *   app.use('/api/users', userRoutes);
 */
import express from 'express';
import { pool } from '../db.js';
import AuthService from '../services/authService.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// ─── Auth middleware ──────────────────────────────────────────────────────────
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

// ─── GET /api/users/:id/profile ───────────────────────────────────────────────
router.get('/:id/profile', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Security: users can only fetch their own profile (admins can fetch any)
    if (req.user.userId !== id && req.user.role !== 'administrator') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const profile = await AuthService.getUserById(id);

    return res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    console.error('❌ GET /users/:id/profile error:', error);
    if (error.message === 'User not found') {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.status(500).json({ success: false, message: error.message });
  }
});

// ─── PUT /api/users/:id/profile ───────────────────────────────────────────────
router.put('/:id/profile', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Security: users can only update their own profile (admins can update any)
    if (req.user.userId !== id && req.user.role !== 'administrator') {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const result = await AuthService.updateUserProfile(id, req.body);

    return res.json(result);
  } catch (error) {
    console.error('❌ PUT /users/:id/profile error:', error);
    if (error.message === 'User not found') {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.status(400).json({ success: false, message: error.message });
  }
});

export default router;