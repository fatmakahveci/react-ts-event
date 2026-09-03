# React Event Platform

[![React](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-149ECA?logo=react&logoColor=white)](frontend/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?logo=node.js&logoColor=white)](backend/)
[![Last commit](https://img.shields.io/github/last-commit/fatmakahveci/react-ts-event)](https://github.com/fatmakahveci/react-ts-event/commits/main)

A full-stack event application with account authentication, protected event management, and a React Router frontend backed by Express.

## Highlights

- Browse event listings and individual event details
- Create, edit, and delete events through protected routes
- Register, sign in, sign out, and refresh JWT-based sessions
- Newsletter signup and structured API error handling

## Technology

- React
- TypeScript
- Vite
- React Router
- Express
- JSON Web Tokens
- Styled Components

## Getting Started

### Prerequisites

- Node.js 20.19 or newer
- npm

### Installation

```bash
cd backend
npm install
npm start

# In a second terminal
cd frontend
npm install
npm run dev
```

The frontend opens on http://localhost:5173 and communicates with the local backend on port 3000.

## Quality Checks

```bash
cd frontend && npm test
cd frontend && npm run typecheck
cd frontend && npm run build
```

## Repository Structure

- `frontend/src/app/pages` — route-level screens
- `frontend/src/app/components` — event, authentication, and navigation UI
- `backend/routes` — authentication and event endpoints

## Project Resources

- [Changelog](CHANGELOG.md)
- [Contributing guide](.github/CONTRIBUTING.md)
- [Security policy](.github/SECURITY.md)
- [License](LICENSE.md)
