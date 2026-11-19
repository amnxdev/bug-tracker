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
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// Session needed for Passport OAuth redirect flow only
app.use(session({
  secret: process.env.JWT_SECRET || 'fallback_secret_for_session',
  resave: false,
  saveUninitialized: false,
}));
app.use(passport.initialize());
app.use(passport.session());

// Health check endpoint
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
