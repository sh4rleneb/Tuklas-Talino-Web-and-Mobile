# Demo seed data

The authoritative seed implementation is `backend/src/seed/seedData.js`.

It recreates:
- demo admin: `admin` / `admin123`
- demo teacher: `teacher1` / `teach123`
- demo students: `STU-2025-001` through `STU-2025-006` / `student123`
- Grade 1–6 Filipino lessons
- subjects: Pagbasa, Bokabularyo, Panitikan, Oral Comm, Pagsulat
- XP thresholds, badges, one demo group, one group task, and an audit log entry

Run it with:

```bash
cd backend
npm run reset
```
