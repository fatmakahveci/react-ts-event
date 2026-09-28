# React Event Platform Frontend

The React and TypeScript client for React Event Platform, built with Vite and React Router.

## Requirements

- Node.js 24.15+ within the 24.x line, or 26+ (`.nvmrc` at the repository root selects 24 LTS)
- npm

## Development

```bash
npm ci
npm run dev
```

The development server runs at http://localhost:5173. Start the repository's backend separately on port 8080.

## Quality Commands

```bash
npm run test:coverage
npm run typecheck
npm run build
```

Use `npm run test:watch` while developing and `npm run preview` to inspect the production bundle locally.
