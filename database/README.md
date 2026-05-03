# Database

The Node.js backend uses Sequelize migrations/sync against MySQL.

Recommended setup:

```sql
CREATE DATABASE tuklas_talino CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Then run from `backend/`:

```bash
cp .env.example .env
npm install
npm run reset
```

`database/schema.sql` is included for reviewers who want to inspect the complete MySQL table structure without running the backend.
