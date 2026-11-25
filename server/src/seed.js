import './utils/env.js';
import dns from 'node:dns';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Project from './models/Project.js';
import Bug from './models/Bug.js';
import Comment from './models/Comment.js';

// Fix for Windows & ISP-specific querySrv ECONNREFUSED with MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Fall back to system DNS
}

const seed = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error('MONGO_URI is not defined in environment variables');
  }

  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 8000,
  });
  console.log('MongoDB connected successfully');

  // 1. Delete all existing records
  await Promise.all([
    Comment.deleteMany({}),
    Bug.deleteMany({}),
    Project.deleteMany({}),
    User.deleteMany({}),
  ]);
  console.log('Cleared existing Users, Projects, Bugs, and Comments');

  // 2. Create users with bcrypt-hashed password "Demo@1234"
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('Demo@1234', salt);

  const [adminUser, normalUser] = await User.create([
    {
      username: 'admin',
      email: 'admin@orbit.dev',
      password: hashedPassword,
      role: 'admin',
    },
    {
      username: 'user',
      email: 'user@orbit.dev',
      password: hashedPassword,
      role: 'user',
    },
  ]);

  // 3. Create 1 project "Demo App"
  const demoProject = await Project.create({
    name: 'Demo App',
    description: 'Primary demonstration repository for ORBIT triage, RBAC, and lifecycle workflows.',
    createdBy: adminUser._id,
  });

  // 4. Create 8 realistic bugs (varied status/priority, 2 near-duplicates, 2 assigned to user)
  const bugs = await Bug.create([
    {
      title: 'Login button unresponsive on mobile',
      description: 'Tapping the Sign In button on iOS Safari 17 does not trigger form submission.',
      priority: 'high',
      status: 'open',
      project: demoProject._id,
      createdBy: normalUser._id,
      assignedTo: normalUser._id,
      aiSuggestedPriority: 'high',
      aiTags: ['MOBILE', 'AUTH', 'UI'],
    },
    {
      title: "Can't tap sign in on phone",
      description: 'Mobile viewport overlaps the submit button hitbox on Android Chrome, blocking login.',
      priority: 'high',
      status: 'open',
      project: demoProject._id,
      createdBy: adminUser._id,
      assignedTo: null,
      aiSuggestedPriority: 'high',
      aiTags: ['MOBILE', 'AUTH', 'DUPLICATE-CANDIDATE'],
    },
    {
      title: 'JWT token refresh loop on expired session',
      description: 'Expired bearer tokens trigger repeated 401 redirects instead of clearing localStorage once.',
      priority: 'high',
      status: 'in-progress',
      project: demoProject._id,
      createdBy: adminUser._id,
      assignedTo: normalUser._id,
      aiSuggestedPriority: 'high',
      aiTags: ['SECURITY', 'JWT'],
    },
    {
      title: 'CSV export truncates rows with embedded commas',
      description: 'Bug descriptions containing commas shift columns in the exported spreadsheet.',
      priority: 'medium',
      status: 'in-progress',
      project: demoProject._id,
      createdBy: normalUser._id,
      assignedTo: null,
      aiSuggestedPriority: 'medium',
      aiTags: ['EXPORT', 'DATA'],
    },
    {
      title: 'Dark mode contrast too low on secondary badges',
      description: 'Neutral role badges are hard to read against #1A1A1A surfaces in dark theme.',
      priority: 'low',
      status: 'open',
      project: demoProject._id,
      createdBy: normalUser._id,
      assignedTo: null,
      aiSuggestedPriority: 'low',
      aiTags: ['THEME', 'A11Y'],
    },
    {
      title: 'Search filter resets when modal closes',
      description: 'Saving an edit in the bug detail modal clears the active title search query.',
      priority: 'medium',
      status: 'resolved',
      project: demoProject._id,
      createdBy: adminUser._id,
      assignedTo: null,
      aiSuggestedPriority: 'medium',
      aiTags: ['FRONTEND', 'STATE'],
    },
    {
      title: 'Rate limiter returns 500 instead of 429 on burst requests',
      description: 'Unhandled exception in middleware when Redis connection times out under load.',
      priority: 'high',
      status: 'resolved',
      project: demoProject._id,
      createdBy: adminUser._id,
      assignedTo: null,
      aiSuggestedPriority: 'high',
      aiTags: ['API', 'RESILIENCE'],
    },
    {
      title: 'Update footer copyright year to 2026',
      description: 'Static legal footer still displays 2025 on the login screen.',
      priority: 'low',
      status: 'closed',
      project: demoProject._id,
      createdBy: adminUser._id,
      assignedTo: null,
      aiSuggestedPriority: 'low',
      aiTags: ['COPY', 'UI'],
    },
  ]);

  // 5. Create 3 comments
  const comments = await Comment.create([
    {
      text: 'Reproduced on iPhone 15 Safari — z-index on the sticky banner overlaps the top 12px of the button.',
      bug: bugs[0]._id,
      createdBy: normalUser._id,
    },
    {
      text: 'Confirmed this is the same root cause as the Android Chrome tap issue.',
      bug: bugs[0]._id,
      createdBy: adminUser._id,
    },
    {
      text: 'Working on clearing localStorage inside the Axios 401 interceptor.',
      bug: bugs[2]._id,
      createdBy: normalUser._id,
    },
  ]);

  console.log('\n--- SEED SUMMARY ---');
  console.log(`Users created:    2 (admin@orbit.dev / user@orbit.dev, password: Demo@1234)`);
  console.log(`Projects created: 1 (${demoProject.name})`);
  console.log(`Bugs created:     ${bugs.length} (2 assigned to user, 2 near-duplicates included)`);
  console.log(`Comments created: ${comments.length}`);
  console.log('--------------------\n');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch(async (err) => {
  console.error('Seed failed:', err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
