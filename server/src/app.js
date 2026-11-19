import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';

// Import Routes
import authRoutes from './routes/authRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import bugRoutes from './routes/bugRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import passport from './utils/passport.js';

const app = express();

// Middleware
const allowedOrigins = [
  'https://orbit-fontend.vercel.app',
  'http://localhost:5173',
  'http://localhost:5000',
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      origin.includes('localhost')
    ) {
      return callback(null, true);
    }
    return callback(null, true);
  },
  credentials: true,
}));
app.use(express.json());

// Clean up accidental double /api/api prefixes
app.use((req, res, next) => {
  if (req.url.startsWith('/api/api/')) {
    req.url = req.url.replace(/^\/api\/api\//, '/api/');
  }
  next();
});

// Session needed for Passport OAuth redirect flow only
app.use(session({
  secret: process.env.JWT_SECRET || 'fallback_secret_for_session',
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

// Health check and root landing endpoints
app.get(['/', '/api'], (req, res) => {
  res.status(200).json({
    status: 'online',
    message: 'ORBIT Bug Tracker API is active',
    frontend: process.env.CLIENT_URL || 'https://orbit-fontend.vercel.app',
    endpoints: {
      auth: '/api/auth',
      projects: '/api/projects',
      bugs: '/api/projects/:id/bugs',
      health: '/api/health'
    }
  });
});
app.get('/health', (req, res) => res.status(200).json({ status: 'ok', uptime: process.uptime() }));
app.get('/api/health', (req, res) => res.status(200).json({ status: 'ok', uptime: process.uptime() }));

// Routes — Support both /api/... (preferred) and direct /... aliases
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/projects', projectRoutes);
app.use('/projects', projectRoutes);

app.use('/api', bugRoutes);
app.use('/', bugRoutes);

app.use('/api', commentRoutes);
app.use('/', commentRoutes);

export default app;
