# 🐞 Bug Tracking System | MERN + RBAC

A backend-focused bug tracking system built with the MERN stack.

The project is intentionally scoped to demonstrate **authentication**, **role-based access control**, **ownership enforcement**, and **clean API design**, rather than UI complexity or SaaS-style features.

---

## 🔗 Live Demo

**Frontend:** [https://orbit-fontend.vercel.app](https://orbit-fontend.vercel.app)
**Backend API:** [https://orbit-backend-i2rz.onrender.com](https://orbit-backend-i2rz.onrender.com)

> The live deployment mirrors the local setup. All authentication, authorization, and ownership checks are enforced at the API level.

---

## 🧭 Project Scope

The system models how teams track bugs across projects with strict access rules.

Users work inside projects, report bugs, update progress through a defined status flow, and discuss issues via comments. Data access is controlled entirely by role and ownership checks on the backend.

---

## 👥 Roles & Permissions

### User

* Register and login
* View projects
* Create bugs inside projects
* Comment on bugs
* Update bug status **only if assigned**

### Admin

* All user permissions
* Create projects
* Assign bugs to users

---

## 🔐 Authorization Rules

All rules are enforced server-side:

* JWT required for all protected routes
* Only admins can create projects
* Only admins can assign bugs
* Only the bug creator or assigned user can update a bug
* Users cannot read or modify resources they do not own

No permission logic is trusted to the frontend.

---

## 🧩 Core Features

### Authentication

* User registration and login
* JWT-based authentication
* Central auth middleware

### Projects

* Project creation (admin only)
* View all projects (authenticated users)

### Bugs

* Create bugs inside projects
* Status lifecycle:
  **Open → In Progress → Resolved → Closed**
* Priority levels:
  **Low / Medium / High**
* Assign bugs to users (admin only)
* Filter bugs by status and priority

### AI-Powered Features (Gemini API — Paper Gap Implementation)

Based on the research paper *"Past, Present, and Future of Bug Tracking in the Generative AI Era"* (arXiv 2510.08005v2), which identifies the **lack of AI-assisted triage** as the primary gap in modern bug tracking systems, the following AI features have been implemented:

* **Automatic Bug Triage** — On every bug creation, the Gemini API (`gemini-4-hydrogen`) analyzes the title and description to suggest a priority level (low / medium / high), generate semantic category tags (e.g., `#ui`, `#auth`, `#crash`), and produce an enhanced, structured description.
* **Duplicate Detection** — When creating a bug, AI checks all open bugs in the same project for semantic similarity and surfaces potential duplicates with similarity scores and explanations.
* **On-Demand Re-triage** — Any bug can be re-analyzed at any time via the ↺ button on the bug row.
* **AI Insights Panel** — Each bug card can expand to display the AI-generated priority suggestion, tags, and enhanced description inline.
* **Graceful Degradation** — All AI features fail safely; if the Gemini API is unavailable or the key is missing, bug creation proceeds normally without blocking.

### Comments

* Add threaded comments to any bug
* Only the comment author or an admin can delete a comment



---

## 🧠 Data Models

### User

* name
* email
* password (hashed)
* role (`user | admin`)

### Project

* name
* description
* createdBy

### Bug

* title
* description
* status (`open | in-progress | resolved | closed`)
* priority (`low | medium | high`)
* projectId
* createdBy
* assignedTo
* aiSuggestedPriority (AI-generated)
* aiEnhancedDescription (AI-generated)
* aiTags (AI-generated)

### Comment

* bugId
* text
* userId

---

## 🌐 API Routes

### Auth

* `POST /api/auth/register`
* `POST /api/auth/login`
* `GET /api/auth/google` (OAuth 2.0 redirect)
* `GET /api/auth/google/callback`
* `GET /api/auth/github` (OAuth 2.0 redirect)
* `GET /api/auth/github/callback`

### Projects

* `POST /api/projects` (admin only)
* `GET /api/projects`

### Bugs

* `POST /api/projects/:projectId/bugs` — Create bug (triggers AI triage + duplicate check)
* `GET /api/projects/:projectId/bugs`
* `PUT /api/bugs/:bugId`
* `PUT /api/bugs/:bugId/assign` (admin only)
* `POST /api/bugs/:bugId/retriage` — Re-run AI triage on demand
* `DELETE /api/bugs/:bugId`

### Comments

* `POST /api/bugs/:bugId/comments`
* `GET /api/bugs/:bugId/comments`
* `DELETE /api/bugs/:bugId/comments/:commentId`

---

## 🔁 Authentication & Request Flow

1. User registers or logs in
2. Server issues a JWT
3. JWT sent via `Authorization: Bearer <token>`
4. Auth middleware validates token
5. Role and ownership checks are applied
6. Request is allowed or rejected

---

## 🛠 Tech Stack

* **Frontend:** React (Vite)
* **Backend:** Node.js, Express
* **Database:** MongoDB (Mongoose)
* **Authentication:** JSON Web Tokens (JWT)

---

## 📁 Folder Structure

```
bug-tracker-mern/
├── server/
│   ├── src/
│   │   ├── models/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── app.js
│   ├── server.js
│   ├── .env.example
│   └── package.json
├── client/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   └── App.jsx
│   └── package.json
└── README.md
```

---

## ▶️ Local Setup

### Backend

```
cd server
npm install
npm run dev
```

Create `.env` using `.env.example`:

```
PORT=5000
MONGO_URI=your_mongodb_uri
JWT_SECRET=your_secret
```

### Frontend

```
cd client
npm install
npm run dev
```

---

## 🧪 Postman Collection

A Postman collection is included to test the backend end-to-end.

Covers:

* User registration and login
* JWT handling
* Project creation and listing
* Bug creation and assignment
* Bug status updates
* Comment creation and fetching
* Bug deletion

### Collection Flow

* `login` stores JWT as a collection variable (`token`)
* `create project` stores `projectId`
* `create bug` stores `bugId`
* Subsequent requests reuse variables automatically

Authorization header used:

```
Authorization: Bearer {{token}}
```

RBAC and ownership rules can be verified by logging in as different users.
