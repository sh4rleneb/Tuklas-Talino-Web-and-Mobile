# Web UI Fidelity Update

This update rebuilds the React web frontend to closely mirror the original `index.html` prototype design instead of using the simplified generated layout.

## What changed

- Replaced the simplified React routes UI with a legacy-screen style React app that keeps the original screen IDs and class names.
- Preserved the original CSS identity from `assets/css/style.css` through `web/src/styles/legacy-theme.css`.
- Preserved original major layout/classes for:
  - Landing page
  - Role selection page
  - Student login
  - Teacher login
  - Admin login
  - Student dashboard
  - Lessons list and lesson details
  - Groups
  - Badges
  - Profile/avatar
  - Teacher dashboard
  - Admin dashboard
- Added `web/vite.config.js` with React plugin support.
- Updated web package versions to avoid the React/Vite blank-page issue:
  - React 18.3.1
  - React DOM 18.3.1
  - React Router DOM 6.28.0
  - Vite 6.4.2
  - @vitejs/plugin-react 5.x
- Reduced `web/src/styles/app.css` to helper styles only so it does not override the original design.

## Important note

The web app now keeps the original visual structure much more faithfully, but it is still a React + API version. The old localStorage and direct DOM scripts are not reused. React state and backend API calls replace the old `onclick` and localStorage logic.

## Run commands

Backend:

```powershell
cd "C:\Users\Sharlene Banawa\Downloads\tuklas-talino-converted\tuklas-talino\backend"
npm.cmd run dev
```

Web:

```powershell
cd "C:\Users\Sharlene Banawa\Downloads\tuklas-talino-converted\tuklas-talino\web"
npm.cmd install
npm.cmd run dev -- --force
```

Open:

```text
http://localhost:5173
```

