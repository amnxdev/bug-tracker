import '../utils/env.js';
import express from 'express';
import jwt from 'jsonwebtoken';
import { register, login } from '../controllers/authController.js';
import passport from '../utils/passport.js';

const router = express.Router();

// ── Email / Password ──────────────────────────────────────────────────────────
router.post('/register', register);
router.post('/login', login);

// Helper: resolve current frontend client URL
const getClientUrl = () => {
  return (
    process.env.CLIENT_URL ||
    (process.env.NODE_ENV === 'production' || process.env.RENDER ? 'https://orbit-fontend.vercel.app' : 'http://localhost:5173')
  ).replace(/\/+$/, '');
};

// Helper: issue a JWT and redirect to frontend after OAuth success
const issueTokenAndRedirect = (req, res) => {
  const user = req.user;
  const clientUrl = getClientUrl();
  if (!user) {
    return res.redirect(`${clientUrl}/login?error=oauth_failed`);
  }
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
  const userPayload = encodeURIComponent(JSON.stringify({ id: user._id, username: user.username, role: user.role }));
  res.redirect(`${clientUrl}/oauth-callback#token=${token}&user=${userPayload}`);
};

// ── Google OAuth ──────────────────────────────────────────────────────────────
router.get('/google', (req, res, next) => {
  const clientUrl = getClientUrl();
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.redirect(`${clientUrl}/login?error=google_not_configured`);
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get('/google/callback', (req, res, next) => {
  const clientUrl = getClientUrl();
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return res.redirect(`${clientUrl}/login?error=google_not_configured`);
  }
  passport.authenticate('google', { session: false }, (err, user, info) => {
    if (err || !user) {
      console.error('[Google OAuth Callback Error]:', err || info);
      return res.redirect(`${clientUrl}/login?error=google_failed`);
    }
    req.user = user;
    issueTokenAndRedirect(req, res);
  })(req, res, next);
});

// ── GitHub OAuth ──────────────────────────────────────────────────────────────
router.get('/github', (req, res, next) => {
  const clientUrl = getClientUrl();
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    return res.redirect(`${clientUrl}/login?error=github_not_configured`);
  }
  passport.authenticate('github', { scope: ['user:email'] })(req, res, next);
});

router.get('/github/callback', (req, res, next) => {
  const clientUrl = getClientUrl();
  if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
    return res.redirect(`${clientUrl}/login?error=github_not_configured`);
  }
  passport.authenticate('github', { session: false }, (err, user, info) => {
    if (err || !user) {
      console.error('[GitHub OAuth Callback Error]:', err?.message || err, err?.data || '');
      return res.redirect(`${clientUrl}/login?error=github_failed`);
    }
    req.user = user;
    issueTokenAndRedirect(req, res);
  })(req, res, next);
});

export default router;
