import express from 'express';
import jwt from 'jsonwebtoken';
import { register, login } from '../controllers/authController.js';
import passport from '../utils/passport.js';

const router = express.Router();

// ── Email / Password ──────────────────────────────────────────────────────────
router.post('/register', register);
router.post('/login', login);

// Helper: issue a JWT and redirect to frontend after OAuth success
const issueTokenAndRedirect = (req, res) => {
  const user = req.user;
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
  const userPayload = encodeURIComponent(JSON.stringify({ id: user._id, username: user.username, role: user.role }));
  res.redirect(`${clientUrl}/oauth-callback#token=${token}&user=${userPayload}`);
};

// ── Google OAuth ──────────────────────────────────────────────────────────────
router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    return res.redirect(`${clientUrl}/login?error=google_not_configured`);
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.redirect(`${clientUrl}/login?error=google_not_configured`);
  }
  passport.authenticate('google', { failureRedirect: `${clientUrl}/login?error=google_failed`, session: false })(req, res, () => {
    issueTokenAndRedirect(req, res);
  });
});

// ── GitHub OAuth ──────────────────────────────────────────────────────────────
router.get('/github', (req, res, next) => {
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    return res.redirect(`${clientUrl}/login?error=github_not_configured`);
  }
  passport.authenticate('github', { scope: ['user:email'] })(req, res, next);
});

router.get('/github/callback', (req, res, next) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    return res.redirect(`${clientUrl}/login?error=github_not_configured`);
  }
  passport.authenticate('github', { failureRedirect: `${clientUrl}/login?error=github_failed`, session: false })(req, res, () => {
    issueTokenAndRedirect(req, res);
  });
});

export default router;
