import './src/utils/env.js';
import dns from 'node:dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './src/models/User.js';
import Project from './src/models/Project.js';
import Bug from './src/models/Bug.js';
import Comment from './src/models/Comment.js';

async function seed() {
  console.log("Connecting to MongoDB...");
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing from environment variables.");
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB successfully.");

  // Password for all seeded users: password123
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('password123', salt);

  console.log("Cleaning existing demo data (keeping existing non-demo if any)...");

  // Upsert users
  const userData = [
    { username: 'amnxdev', email: 'amnxdev@gmail.com', role: 'admin' },
    { username: 'alex.chen', email: 'alex.chen@orbit.dev', role: 'user' },
    { username: 'sarah.kim', email: 'sarah.kim@orbit.dev', role: 'user' },
    { username: 'marcus.vance', email: 'marcus.vance@orbit.dev', role: 'user' },
    { username: 'elena.rostova', email: 'elena.rostova@orbit.dev', role: 'admin' },
  ];

  const userMap = {};

  for (const u of userData) {
    let existing = await User.findOne({ $or: [{ email: u.email }, { username: u.username }] });
    if (existing) {
      existing.role = u.role;
      existing.password = hashedPassword;
      await existing.save();
      userMap[u.username] = existing;
      console.log(`Updated user: ${u.username} (${u.role})`);
    } else {
      const created = await User.create({
        username: u.username,
        email: u.email,
        password: hashedPassword,
        role: u.role
      });
      userMap[u.username] = created;
      console.log(`Created user: ${u.username} (${u.role})`);
    }
  }

  const adminUser = userMap['amnxdev'] || userMap['elena.rostova'];
  const devUser = userMap['alex.chen'];
  const sarahUser = userMap['sarah.kim'];
  const marcusUser = userMap['marcus.vance'];

  // Seed Projects
  const projectDefs = [
    {
      name: 'orbit-core-engine',
      description: 'Distributed event-driven task and bug orchestration pipeline with real-time WebSocket pub/sub.',
      createdBy: adminUser._id
    },
    {
      name: 'auth-service-v2',
      description: 'Zero-trust identity provider supporting OAuth 2.0 PKCE, session rotation, and multi-tenant RBAC.',
      createdBy: adminUser._id
    },
    {
      name: 'payment-gateway-relay',
      description: 'Stripe & Adyen idempotent payment reconciliation and webhook dispatch microservice.',
      createdBy: devUser._id
    },
    {
      name: 'gemini-triage-worker',
      description: 'Asynchronous Gemini 2.5 Flash inference worker for semantic deduplication and severity tagging.',
      createdBy: adminUser._id
    }
  ];

  const projectMap = {};
  for (const p of projectDefs) {
    let existing = await Project.findOne({ name: p.name });
    if (existing) {
      existing.description = p.description;
      await existing.save();
      projectMap[p.name] = existing;
      console.log(`Updated project: ${p.name}`);
    } else {
      const created = await Project.create(p);
      projectMap[p.name] = created;
      console.log(`Created project: ${p.name}`);
    }
  }

  const coreProject = projectMap['orbit-core-engine'];

  // Clean old bugs for coreProject to ensure clean screenshot state
  await Bug.deleteMany({ project: coreProject._id });
  console.log(`Cleared previous bugs for ${coreProject.name}`);

  // Seed Rich Realistic Bugs
  const bugsData = [
    {
      title: 'Race condition in distributed state sync during partition failover',
      description: 'Under network partition simulation, the Raft consensus leader election causes duplicate heartbeat packets, dropping 2.4% of in-flight task ACKs.',
      priority: 'high',
      status: 'in-progress',
      project: coreProject._id,
      createdBy: adminUser._id,
      assignedTo: devUser._id,
      aiSuggestedPriority: 'high',
      aiEnhancedDescription: 'Distributed state desynchronization caused by unthrottled duplicate heartbeat packets during consensus failover.',
      aiTags: ['DISTRIBUTED-SYSTEMS', 'RACE-CONDITION', 'FAILOVER']
    },
    {
      title: 'JWT token invalidation fails on password reset due to Redis TTL mismatch',
      description: 'Revoked session tokens remain active for up to 15 minutes because token blacklisting writes to Redis with an absolute epoch instead of relative offset.',
      priority: 'high',
      status: 'open',
      project: coreProject._id,
      createdBy: devUser._id,
      assignedTo: sarahUser._id,
      aiSuggestedPriority: 'high',
      aiEnhancedDescription: 'Session hijacking vulnerability: revoked JWT tokens bypass authentication filter due to miscalculated TTL offset in Redis.',
      aiTags: ['SECURITY', 'AUTH', 'REDIS']
    },
    {
      title: 'PostgreSQL connection pool exhaustion during batch analytics export',
      description: 'Triggering CSV export on projects with >50k events opens unpooled direct connections without closing the cursor stream.',
      priority: 'medium',
      status: 'open',
      project: coreProject._id,
      createdBy: adminUser._id,
      assignedTo: null,
      aiSuggestedPriority: 'medium',
      aiEnhancedDescription: 'Resource leak causing DB connection exhaustion during unbuffered large CSV streaming.',
      aiTags: ['DATABASE', 'PERFORMANCE', 'LEAK']
    },
    {
      title: 'CSS Grid layout misalignment on ultra-wide viewports in dark mode',
      description: '4-column KPI cards overflow parent container bounds when client viewport exceeds 2560px width.',
      priority: 'low',
      status: 'resolved',
      project: coreProject._id,
      createdBy: adminUser._id,
      assignedTo: marcusUser._id,
      aiSuggestedPriority: 'low',
      aiEnhancedDescription: 'Visual layout bug causing viewport horizontal scrollbar on displays >= 2560px.',
      aiTags: ['UI', 'CSS', 'FRONTEND']
    },
    {
      title: 'Elevate bcryptjs salt rounds from 8 to 12 for SOC2 compliance',
      description: 'SOC2 compliance requirement: elevate password hashing work factor across all user registration endpoints.',
      priority: 'medium',
      status: 'closed',
      project: coreProject._id,
      createdBy: adminUser._id,
      assignedTo: devUser._id,
      aiSuggestedPriority: 'medium',
      aiEnhancedDescription: 'Compliance hardening for credential hashing parameters.',
      aiTags: ['COMPLIANCE', 'SECURITY', 'SOC2']
    }
  ];

  for (const b of bugsData) {
    const createdBug = await Bug.create(b);
    console.log(`Created bug: ${createdBug.title} [${createdBug.priority}] (${createdBug.status})`);

    // Add sample discussion comment on Bug 1
    if (b.title.startsWith('Race condition')) {
      await Comment.create({
        text: 'I isolated the issue to the Raft leader election heartbeat timeout in raft_node.go:142. Submitting PR with exponential jitter backoff.',
        bug: createdBug._id,
        createdBy: devUser._id
      });
      await Comment.create({
        text: 'Approved. Make sure to run the chaos mesh partition tests before merging to main.',
        bug: createdBug._id,
        createdBy: adminUser._id
      });
    }
  }

  console.log("\n==========================================");
  console.log("DEMO DATA SEEDED SUCCESSFULLY!");
  console.log("==========================================");
  console.log("Admin Account:     amnxdev@gmail.com / password123 (Role: admin)");
  console.log("Developer Account: alex.chen@orbit.dev / password123 (Role: user)");
  console.log("Sarah Account:     sarah.kim@orbit.dev / password123 (Role: user)");
  console.log("==========================================\n");

  await mongoose.disconnect();
}

seed().catch(err => {
  console.error("Seeding error:", err);
  process.exit(1);
});
