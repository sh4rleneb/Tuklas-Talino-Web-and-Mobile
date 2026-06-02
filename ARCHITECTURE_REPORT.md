# Tuklas Talino Architecture Report

## Executive Summary

Tuklas Talino is a three-part learning platform:

- `backend/`: Node.js, Express, Sequelize, Socket.IO REST API
- `web/`: React and Vite web application
- `mobile/`: React Native and Expo mobile application

The repository currently uses **MySQL**, not PostgreSQL. The runtime database configuration uses the `mysql` Sequelize dialect and the backend depends on `mysql2`. Converting to PostgreSQL is a separate migration project.

The Sequelize models are ahead of `database/schema.sql` and `database/migrations/001_create_schema.sql`. Runtime setup currently relies on `sequelize.sync()`, so the model definitions are the authoritative schema.

## 1. Existing Database Models

Defined in `backend/src/models/index.js`:

| Model | Table | Purpose |
|---|---|---|
| `Role` | `roles` | Admin, teacher, and student roles |
| `User` | `users` | Login credentials, status, forced password change, last login |
| `Student` | `students` | Student profile, grade, section, avatar, XP, activity timestamp |
| `Teacher` | `teachers` | Teacher profile and employee code |
| `AdminProfile` | `admins` | Admin profile |
| `TeacherAssignment` | `teacher_assignments` | Teacher-to-grade-and-section assignments |
| `Lesson` | `lessons` | Grade-level lesson metadata and publishing status |
| `LessonActivity` | `lesson_activities` | Lesson blocks including materials, MCQ, writing, speech, matching, vocabulary, and infographic data |
| `MCQQuestion` | `mcq_questions` | Multiple-choice questions |
| `MCQOption` | `mcq_options` | Multiple-choice answers and correctness |
| `WritingTask` | `writing_tasks` | Writing prompts and rubrics |
| `SpeechTask` | `speech_tasks` | Speech prompts and target text |
| `CompletedLesson` | `completed_lessons` | Per-student lesson completion |
| `QuizHistory` | `quiz_history` | Individual MCQ answer history |
| `QuizAttempt` | `quiz_attempts` | Quiz score, mastery, review, attempt limit, and XP |
| `WritingSubmission` | `writing_submissions` | Student writing responses and feedback |
| `SpeechAttempt` | `speech_attempts` | Speech transcripts and scores |
| `Group` | `groups` | Teacher-created groups |
| `GroupMember` | `group_members` | Student membership and leader role |
| `GroupTask` | `group_tasks` | Collaborative tasks with due dates and XP |
| `GroupTaskCompletion` | `group_task_completions` | Group submissions, approval state, files, feedback, and awarded XP |
| `MissionCompletion` | `mission_completions` | Completed learning-game challenges and XP |
| `Badge` | `badges` | Badge definitions |
| `StudentBadge` | `student_badges` | Earned badges |
| `XpLog` | `xp_logs` | XP ledger |
| `AuditLog` | `audit_logs` | Administrative and learning activity audit events |
| `Notification` | `notifications` | In-app notifications, currently used for student group-task approval |
| `PasskeyCredential` | `passkey_credentials` | Passkey storage model; no active passkey API flow exists |

## 2. Existing API Endpoints

### General and Authentication

| Method | Endpoint |
|---|---|
| `GET` | `/api/health` |
| `POST` | `/api/auth/login` |
| `POST` | `/api/auth/logout` |
| `GET` | `/api/auth/me` |
| `POST` | `/api/auth/change-password` |
| `GET` | `/api/auth/check-student/:identifier` |
| `POST` | `/api/auth/register/student` |
| `POST` | `/api/auth/register/teacher` |

### Student Shortcuts and Students

| Method | Endpoint |
|---|---|
| `GET` | `/api/dashboard` |
| `GET` | `/api/badges` |
| `GET` | `/api/missions` |
| `POST` | `/api/missions/:missionId/claim` |
| `GET` | `/api/students` |
| `POST` | `/api/students` |
| `GET` | `/api/students/notifications` |
| `POST` | `/api/students/notifications/:id/read` |
| `GET` | `/api/students/dashboard` |
| `GET` | `/api/students/:id/dashboard` |
| `GET` | `/api/students/:id/progress` |
| `GET` | `/api/students/:id/badges` |
| `PATCH` | `/api/students/:id` |
| `PATCH` | `/api/students/:id/avatar` |
| `POST` | `/api/students/:id/archive` |
| `POST` | `/api/students/:id/reactivate` |
| `POST` | `/api/students/:id/reset-password` |
| `POST` | `/api/students/:id/reset-progress` |

### Teachers

| Method | Endpoint |
|---|---|
| `GET` | `/api/teachers` |
| `POST` | `/api/teachers` |
| `GET` | `/api/teachers/dashboard` |
| `GET` | `/api/teachers/monitoring/stats` |
| `GET` | `/api/teachers/quiz-performance` |
| `GET` | `/api/teachers/students/:studentId` |
| `PATCH` | `/api/teachers/:id` |
| `POST` | `/api/teachers/:id/reset-password` |
| `POST` | `/api/teachers/:id/archive` |
| `POST` | `/api/teachers/:id/reactivate` |

### Lessons and Activities

| Method | Endpoint |
|---|---|
| `GET` | `/api/lessons` |
| `POST` | `/api/lessons/materials/upload` |
| `GET` | `/api/lessons/:id` |
| `DELETE` | `/api/lessons/:id` |
| `POST` | `/api/lessons` |
| `PATCH` | `/api/lessons/:id` |
| `POST` | `/api/lessons/:id/complete` |
| `POST` | `/api/lessons/:id/mcq` |
| `POST` | `/api/lessons/:id/quiz-result` |
| `POST` | `/api/lessons/:id/writing` |
| `POST` | `/api/lessons/:id/speech` |

### Groups

| Method | Endpoint |
|---|---|
| `GET` | `/api/groups` |
| `POST` | `/api/groups` |
| `PATCH` | `/api/groups/:id` |
| `DELETE` | `/api/groups/:id` |
| `POST` | `/api/groups/:id/members` |
| `POST` | `/api/groups/:id/members/:studentId/leader` |
| `DELETE` | `/api/groups/:id/members/:studentId` |
| `POST` | `/api/groups/:id/tasks` |
| `DELETE` | `/api/groups/tasks/:taskId` |
| `POST` | `/api/groups/tasks/:taskId/complete` |
| `GET` | `/api/groups/task-completions/pending` |
| `POST` | `/api/groups/tasks/:taskId/completions/:studentId/approve` |
| `GET` | `/api/groups/:id/progress` |

### Missions, Admin, and Reports

| Method | Endpoint |
|---|---|
| `POST` | `/api/missions/:missionId/complete` |
| `POST` | `/api/missions/:missionId/claim` |
| `GET` | `/api/missions/completions/me` |
| `GET` | `/api/admin/stats` |
| `GET` | `/api/admin/accounts` |
| `PATCH` | `/api/admin/accounts/:id/status` |
| `GET` | `/api/admin/enrollments` |
| `PATCH` | `/api/admin/students/:id/enrollment` |
| `POST` | `/api/admin/teachers/:id/assignments` |
| `DELETE` | `/api/admin/teacher-assignments/:id` |
| `GET` | `/api/admin/audit-logs` |
| `GET` | `/api/reports/students.csv` |
| `GET` | `/api/reports/activity-logs.csv` |
| `GET` | `/api/reports/summary` |
| `GET` | `/api/reports/summary.txt` |

## 3. Existing Mobile Screens

### Reachable Screens

- Authentication: landing, student login, teacher login, admin login
- Students: junior home, junior lessons, junior lesson detail, junior modules, quiz screen, missions, groups, badges, profile, senior home, senior lessons
- Teachers: teacher home dashboard
- Admins: admin home dashboard

### Present but Empty, Static, or Unreachable Screens

- Empty files: junior leaderboard, junior progress, junior module card, senior leaderboard, senior progress, senior quiz, senior module card
- Static or incomplete flows: junior quiz, senior modules, senior lessons
- Older unused screens: `src/screens/LandingScreen.js`, `LoginScreen.js`, `StudentHomeScreen.js`, and `PlaceholderScreen.js`

## 4. Existing Web Pages

The active web application is a state-driven single-page application in `web/src/App.jsx`; it does not currently use React Router routes for its main navigation.

### Active Web Screens

- Landing and role-selection home
- Student, teacher, and admin login
- Forced password change
- Student dashboard
- Lessons list and lesson detail
- Quiz list, quiz player, and quiz results
- Missions list and mission games
- Groups
- Badges
- Profile
- Teacher dashboard
- Admin dashboard

### Legacy Router-Style Pages Still Present

`web/src/pages/Student/*`, `web/src/pages/Auth/LoginPage.jsx`, and `web/src/pages/Landing/LandingPage.jsx` contain older page implementations. They are not mounted by `web/src/App.jsx`.

## 5. Existing Teacher Functionality

- Assigned class filtering by grade and section
- Dashboard totals for students, lessons, completions, and groups
- Student monitoring table with completion percentages
- Quiz-performance monitoring with mastery bands and two-attempt history
- Lesson creation with activities and uploaded PPT, PPTX, or PDF materials
- Lesson archive
- Group creation, archive, membership, leader assignment, task creation, and task archive
- Group-task approval with file review, feedback support, XP award, badges, notifications, and realtime updates
- CSV activity/student exports and text summary report

The web UI exposes most teacher behavior. The mobile teacher UI currently exposes a read-only dashboard summary.

## 6. Existing Admin Functionality

- System totals
- Account listing and account status update API
- Student and teacher creation
- Student and teacher archive/reactivation
- Password reset to temporary PIN with forced password change
- Student progress reset
- Student enrollment changes
- Teacher class assignment management
- Audit-log viewing

The web UI exposes the principal account and assignment workflows. The mobile admin UI currently exposes read-only summary information.

## 7. Existing Student Functionality

- Role-specific login
- Grade-level dashboard and lesson filtering
- Lesson completion
- MCQ answer recording
- Quiz attempts, mastery labels, review, and two-attempt cap
- Writing submissions, including auto-checked fill-in tasks
- Speech attempt storage
- XP, levels, badges, and badge progress
- Missions and mission XP
- Group task submission by group leader, optional file upload, teacher approval, and approval notification
- Avatar update

The web UI exposes the broadest set. Mobile student coverage varies by grade band and contains static or incomplete screens.

## 8. Navigation Structure

### Web

`web/src/App.jsx` stores a `screen` identifier in component state and renders matching `<Screen>` blocks. Student navigation includes dashboard, lessons, quizzes, quiz play/results, missions, mission play, groups, badges, and profile. Teacher and admin screens each render dashboards with internal tabs.

### Mobile

`mobile/src/navigation/RootNavigator.js` uses one native stack:

- `Landing`
- `StudentLogin`, `TeacherLogin`, `AdminLogin`
- `ChangePassword`
- Student junior and senior screens
- `TeacherHome`
- `AdminHome`

## 9. Authentication Flow

- Backend login validates credentials with bcrypt and returns a 12-hour JWT.
- Middleware loads `User`, `Role`, and the role-specific profile.
- Inactive users are rejected.
- Protected routes usually enforce `requirePasswordChanged`.
- Web stores JWT in `localStorage`, restores `/auth/me`, and has a forced-password-change screen.
- Mobile stores JWT in Expo SecureStore.
- Mobile now routes users with `mustChangePassword` through a real password-change screen and clears SecureStore tokens during logout.

Known authentication gaps remain:

- No refresh-token or server-side token-revocation implementation
- `PasskeyCredential` exists without registration or authentication endpoints
- Public student self-registration is enabled and needs a product-policy decision
- Mobile still lacks automatic session restoration at app launch

## 10. Progress Tracking Implementation

Progress is persisted through:

- `CompletedLesson` for lesson completion
- `QuizHistory` for individual MCQ answers
- `QuizAttempt` for scored quiz submissions
- `WritingSubmission` and `SpeechAttempt`
- `GroupTaskCompletion` for reviewed collaborative work
- `MissionCompletion`
- `XpLog` as the XP ledger
- `StudentBadge` for awards

`backend/src/services/progress.service.js` calculates levels, XP thresholds, and badge eligibility. Student dashboard payloads aggregate lesson counts, XP logs, quiz attempts, badges, and group-task states. Teacher endpoints aggregate class-level completion and quiz-performance data.

## Gap Analysis

### Missing Teacher Features

- Mobile teacher management screens for lessons, groups, approvals, reports, and student drill-down
- Writing-submission review and feedback endpoint/UI
- Speech-attempt review and feedback endpoint/UI
- Teacher announcements and class notifications
- Per-subject and per-lesson trend views

### Missing Admin Features

- Mobile account-management workflows
- Role-aware notification center
- School-year, class, section, and enrollment-history management
- Configurable curriculum and subject administration
- Backup/export and operational health UI

### Missing Student Features

- Complete mobile quiz flows for both grade bands
- Real senior mobile lesson flow backed by the API
- Mobile progress and leaderboard screens
- Notification inbox instead of one-time toast consumption
- Proper speech recording/transcription integration
- Offline behavior and retry handling

### Missing API Endpoints

- Writing review, feedback, and grading endpoints
- Speech review, feedback, and grading endpoints
- Notification list/read-all endpoints for teachers and admins
- Student notification history and read-all endpoint
- Announcement endpoints
- Leaderboard endpoints
- Detailed analytics endpoints by subject, lesson, class, and time period
- Passkey registration and authentication endpoints, or removal of the unused model

### Missing Database Tables or Models

- Announcements and announcement recipients
- Class/section entities with school-year enrollment history
- Teacher feedback or rubric-score records for writing and speech
- Notification preference records
- Refresh tokens or revoked-token records if server-managed sessions are required

The checked-in SQL schema also needs to be regenerated or replaced with migrations for existing runtime models and columns such as `teacher_assignments`, `quiz_attempts`, `mission_completions`, `notifications`, richer group completions, and richer lesson activities.

### Missing Analytics

- Completion trends over time
- Subject mastery distribution
- Lesson difficulty and drop-off analysis
- Writing and speech review queues
- Student inactivity and intervention signals
- Mission engagement analytics
- Cohort comparison by section and grade

### Missing Reports

- Detailed learner progress report
- Class mastery report
- Subject performance report
- Quiz-attempt report
- Pending-review report
- Badge and XP report
- Date-filtered report exports

### Missing Notifications

- Teacher notifications for pending writing and speech review
- Student notifications for lesson assignments, writing feedback, speech feedback, announcements, and badge awards
- Admin notifications for operational events
- Read-all, history, and inbox UI
- Push-notification delivery on mobile

## Prioritized Implementation Roadmap

### Priority 0: Security and Data Integrity

1. Complete mobile forced-password-change and secure logout behavior. **Implemented in this pass.**
2. Replace schema drift with versioned migrations and decide whether MySQL remains supported or PostgreSQL migration is required.
3. Add automated backend tests for role boundaries, teacher assignment scoping, XP idempotency, and group-task approval.

### Priority 1: Complete Core Learning Workflows

1. Finish mobile student quiz and senior lesson flows against existing APIs.
2. Add teacher writing and speech review APIs with feedback persistence and web UI queues.
3. Add mobile teacher group-task approval and lesson/group management screens.

### Priority 2: Notifications and Intervention

1. Build a unified notification service and inbox APIs.
2. Add student, teacher, and admin notification centers.
3. Add inactivity and low-mastery intervention signals.

### Priority 3: Analytics and Reporting

1. Add subject, lesson, class, and time-based analytics endpoints.
2. Add detailed downloadable learner and class reports.
3. Add admin analytics dashboards and report filters.

### Priority 4: Platform Hardening

1. Decide whether to implement passkeys or remove the dormant model.
2. Add mobile session restoration and offline retry behavior.
3. Add push notifications, upload retention rules, and deployment documentation.
