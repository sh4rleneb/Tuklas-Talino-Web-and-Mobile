# React Design Match Update

This version keeps the working Node.js + Express + MySQL backend and updates the React web design to follow the original `index.html` more closely.

## What changed

- Preserved the original CSS files exactly:
  - `web/src/styles/legacy-theme.css` copied from `assets/css/style.css`
  - `web/src/styles/gamification.css` copied from `gamification/gamification.css`
- Rebuilt React screens using the original class names and layout identity:
  - `tt-lms-home`
  - `tt-hero-card`
  - `tt-role-card`
  - `home-card-v2`
  - `login-shell`
  - `student-visual-card`
  - `teacher-visual-card`
  - `admin-visual-card`
  - `kid-stage`
  - `kid-subject-card`
  - `g46-lite-shell`
  - `g46-lite-module-card`
- Kept React-compatible behavior using `onClick`, React state, and backend API calls instead of old inline `onclick` handlers and `localStorage` data storage.
- Added stronger Grade 1-3 and Grade 4-6 student dashboard designs using the same CSS class names from the original adaptive UI.
- Verified `npm run build` succeeds in `web/`.

## Honest note

The web app now follows the original HTML/CSS design language much more closely, but the old JavaScript files are not imported directly. Their behavior is rewritten in React so the app can stay maintainable and continue using the Node/MySQL backend.
