import 'dotenv/config';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import User from '../models/User.js';

// Determine public backend server URL
const serverUrl = (
  process.env.SERVER_URL ||
  process.env.RENDER_EXTERNAL_URL ||
  (process.env.NODE_ENV === 'production' || process.env.RENDER ? 'https://orbit-backend-i2rz.onrender.com' : 'http://localhost:5000')
).replace(/\/+$/, '');

// ── Google OAuth ─────────────────────────────────────────────────────────────
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${serverUrl}/api/auth/google/callback`,
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ googleId: profile.id });

      if (!user) {
        const email = profile.emails?.[0]?.value;
        user = await User.findOne({ email });
        if (user) {
          user.googleId = profile.id;
          await user.save();
        } else {
          user = await User.create({
            username: profile.displayName.replace(/\s+/g, '_').toLowerCase() + '_' + profile.id.slice(-4),
            email: email || `${profile.id}@google.oauth`,
            password: 'OAUTH_NO_PASSWORD',
            googleId: profile.id,
          });
        }
      }
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }));
} else {
  console.log('[Auth] Google OAuth not configured (GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET missing). Skipping.');
}

// ── GitHub OAuth ──────────────────────────────────────────────────────────────
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: `${serverUrl}/api/auth/github/callback`,
    scope: ['user:email'],
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ githubId: profile.id });

      if (!user) {
        const email = profile.emails?.[0]?.value;
        user = await User.findOne({ email });
        if (user) {
          user.githubId = profile.id;
          await user.save();
        } else {
          user = await User.create({
            username: profile.username || `gh_${profile.id}`,
            email: email || `${profile.id}@github.oauth`,
            password: 'OAUTH_NO_PASSWORD',
            githubId: profile.id,
          });
        }
      }
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }));
} else {
  console.log('[Auth] GitHub OAuth not configured (GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET missing). Skipping.');
}

// Needed by passport
passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  const user = await User.findById(id).catch(err => done(err));
  done(null, user);
});

export default passport;
