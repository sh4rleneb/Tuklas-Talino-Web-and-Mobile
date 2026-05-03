# Tuklas Talino — Converted Full-Stack Project

This folder is the converted version of the uploaded Tuklas Talino prototype.

## Final stack

- **Backend:** Node.js, Express, Sequelize
- **Web:** React + Vite + React Router
- **Mobile:** React Native / Expo + React Navigation
- **Database:** MySQL

## Final structure

```text
tuklas-talino/
├── backend/
├── web/
├── mobile/
├── database/
├── AUDIT_SOURCE_FILES.md
└── README.md
```

## What changed

The original upload was a static HTML/CSS/JavaScript prototype with localStorage seed data, incomplete PHP fragments, and incomplete Django files. The converted version replaces that with:

- a real REST API
- MySQL persistence
- hashed passwords
- JWT authentication
- role-based authorization
- React web screens
- Expo mobile screens
- database schema and seeders
- setup instructions

## Demo accounts

After running the backend seed command:

| Role | Username / ID | Password |
|---|---|---|
| Admin | `admin` | `admin123` |
| Teacher | `teacher1` | `teach123` |
| Student | `STU-2025-001` | `student123` |
| Student | `STU-2025-002` | `student123` |
| Student | `STU-2025-003` | `student123` |
| Student | `STU-2025-004` | `student123` |
| Student | `STU-2025-005` | `student123` |
| Student | `STU-2025-006` | `student123` |

## Backend setup

1. Create the MySQL database.

```sql
CREATE DATABASE tuklas_talino CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Configure environment.

```bash
cd backend
cp .env.example .env
```

Update `.env` if your MySQL username/password is different.

3. Install dependencies.

```bash
npm install
```

4. Create tables and seed demo data.

```bash
npm run reset
```

5. Start the API.

```bash
npm run dev
```

The API runs at:

```text
http://localhost:4000/api
```

Health check:

```text
GET http://localhost:4000/api/health
```

## Web setup

```bash
cd web
cp .env.example .env
npm install
npm run dev
```

The web app runs at:

```text
http://localhost:5173
```

## Mobile setup

For local device testing, set `EXPO_PUBLIC_API_URL` in `mobile/.env` to your computer LAN IP, for example:

```text
EXPO_PUBLIC_API_URL=http://192.168.1.10:4000/api
```

Then run:

```bash
cd mobile
cp .env.example .env
npm install
npm run start
```

Open with Expo Go or an emulator.

## Backend API coverage

### Auth

- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/change-password`
- `POST /api/auth/register/student`
- `POST /api/auth/register/teacher`

### Students

- `GET /api/students`
- `POST /api/students`
- `GET /api/students/dashboard`
- `GET /api/students/:id/dashboard`
- `GET /api/students/:id/progress`
- `GET /api/students/:id/badges`
- `PATCH /api/students/:id`
- `PATCH /api/students/:id/avatar`
- `POST /api/students/:id/archive`
- `POST /api/students/:id/reactivate`
- `POST /api/students/:id/reset-progress`

### Teachers

- `GET /api/teachers`
- `POST /api/teachers`
- `GET /api/teachers/dashboard`
- `GET /api/teachers/monitoring/stats`
- `GET /api/teachers/students/:studentId`
- `PATCH /api/teachers/:id`
- `POST /api/teachers/:id/archive`
- `POST /api/teachers/:id/reactivate`

### Lessons

- `GET /api/lessons`
- `GET /api/lessons/:id`
- `POST /api/lessons`
- `PATCH /api/lessons/:id`
- `POST /api/lessons/:id/complete`
- `POST /api/lessons/:id/mcq`
- `POST /api/lessons/:id/writing`
- `POST /api/lessons/:id/speech`

### Groups

- `GET /api/groups`
- `POST /api/groups`
- `PATCH /api/groups/:id`
- `DELETE /api/groups/:id`
- `POST /api/groups/:id/members`
- `DELETE /api/groups/:id/members/:studentId`
- `POST /api/groups/:id/tasks`
- `DELETE /api/groups/tasks/:taskId`
- `POST /api/groups/tasks/:taskId/complete`
- `GET /api/groups/:id/progress`

### Admin

- `GET /api/admin/stats`
- `GET /api/admin/accounts`
- `PATCH /api/admin/accounts/:id/status`
- `GET /api/admin/audit-logs`

### Reports

- `GET /api/reports/students.csv`
- `GET /api/reports/activity-logs.csv`
- `GET /api/reports/summary`

## Database contents

The MySQL schema includes tables for:

- users
- roles
- students
- teachers
- admins
- lessons
- lesson activities
- MCQ questions and options
- writing tasks
- speech/oral tasks
- completed lessons
- quiz history
- writing submissions
- speech attempts
- groups
- group members
- group tasks
- group task completions
- badges
- student badges
- XP logs
- audit logs
- passkey credentials

The generated lessons recreate Grade 1–6 Filipino content for:

- Pagbasa
- Bokabularyo
- Panitikan
- Oral Comm
- Pagsulat

## Preserved features

- Student login by Student ID
- Teacher login
- Admin login
- Student dashboard by grade level
- Grade 1–2 playful dashboard style
- Grade 4–6 cleaner dashboard style
- Lessons by subject
- MCQ activities
- Writing activities with feedback placeholder
- Speech/pronunciation practice storage
- XP reward system
- Level calculation
- Badges
- Group tasks
- Teacher monitoring table
- Teacher group creation
- Teacher/admin account actions
- Archive/reactivate students and teachers
- Reset student progress
- Audit logs
- CSV exports

## Fixed issues

- Replaced localStorage database with MySQL persistence.
- Removed incomplete procedural PHP from the final stack.
- Removed incomplete Django files from the final stack.
- Replaced unsafe raw SQL patterns with Sequelize ORM.
- Added password hashing with bcrypt.
- Added JWT authentication.
- Added role-based access control.
- Added request validation.
- Added centralized error handling.
- Converted DOM manipulation into React state/components.
- Removed inline event handler approach.
- Added loading, empty, success, error, and confirmation states.
- Added `.env.example` files.
- Added database schema, seed implementation, and setup instructions.

## Remaining limitations

- Dependencies are not bundled. Run `npm install` in `backend`, `web`, and `mobile`.
- Browser/mobile speech recognition differs by platform. This version stores oral practice transcripts/attempts and is ready for a speech SDK integration.
- Passkey credentials table is included, but full WebAuthn/passkey ceremony is scaffolded for future implementation rather than enabled by default.
- Student mobile screens are implemented. Teacher/admin mobile areas are scaffolded and ready for expansion.
- Reports are CSV/JSON summaries; advanced PDF report generation can be added later.

## Notes for the capstone team

This conversion intentionally avoids mixing Laravel, Node.js, procedural PHP, and Django. The final runnable backend is Node.js only.

## Web UI fidelity update

The React web frontend was updated to preserve the original static prototype design more closely. See `WEB_UI_FIDELITY_UPDATE.md` for details.

If PowerShell blocks `npm`, use `npm.cmd` instead:

```powershell
npm.cmd install
npm.cmd run dev -- --force
```
