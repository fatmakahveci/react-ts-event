# Gather

Gather is a small app for finding and sharing community events. You can browse
without an account, search by name or description, and filter past or upcoming
events. Sign in to post an event. Only its creator can edit or delete it.

The frontend uses React, TypeScript, React Router, and Vite. The backend is an
Express API that stores data in a local JSON file.

[![CI/CD](https://github.com/fatmakahveci/react-ts-event/actions/workflows/ci.yml/badge.svg)](https://github.com/fatmakahveci/react-ts-event/actions/workflows/ci.yml)

## Demo

[![Gather on desktop and mobile: finding, saving, creating, and editing events](docs/assets/demo.gif)](docs/assets/demo.gif)

This 33-second walkthrough shows the updated desktop and mobile layouts, search,
favorites, sharing, and creating and editing an event. It also covers the mobile
menu and the prompt that protects an unsaved draft. Recorded on September 28,
2026, with temporary sample data. A fresh install starts with an empty event list.

Search, sorting, and date filters stay in the URL, so you can bookmark a view or
share it. The star button saves favorites in the current browser; they aren't
synced to an account. Each event also has a button for copying its link.

Event forms warn before you leave with unsaved changes. A failed background session
check keeps an open form intact, and a failed save leaves your entries available
to retry.

## Run it locally

You'll need npm and Node.js 24.15 or newer in the 24.x line, or Node 26+.
If you use nvm, run `nvm install` and `nvm use` from the project root.

Install the dependencies and start the API:

```sh
npm run setup
npm run dev:api
```

Then open a second terminal and start the frontend:

```sh
npm run dev
```

Visit [localhost:5173](http://localhost:5173). The API runs on port 8080.
Use `localhost` for both services; mixing it with `127.0.0.1` will cause problems
with session cookies.

Create an account to add your first event. Unless you set `JWT_SECRET`, restarting
the API signs you out because development uses a new signing key on each start.

## Settings

The defaults work for local development. To change the API address, copy
`frontend/.env.example` to `frontend/.env.local` and set `VITE_API_URL`.
Restart Vite after changing it, or rebuild if you're serving the production bundle.

For backend settings, export the variables in your shell or create `backend/.env`
from `backend/.env.example`. To load that file, run this from the `backend` directory:

```sh
node --env-file=.env src/server.js
```

`npm run dev:api` reads exported environment variables; it does not load
`backend/.env` automatically.

| Variable | Default | What it does |
| --- | --- | --- |
| `PORT` | `8080` | Sets the API port. |
| `CORS_ORIGIN` | `http://localhost:5173` in development | Sets the exact frontend origin allowed to call the API. Production requires an explicit HTTPS origin. |
| `JWT_SECRET` | Generated on startup in development | Signs session tokens. Production requires a random secret of at least 32 characters. |
| `EVENTS_DATA_FILE` | `backend/storage/application-data.json` | Chooses where the API stores its data. |
| `VITE_API_URL` | `http://localhost:8080` | Tells the frontend where to find the API. |

Values prefixed with `VITE_` end up in the browser bundle. Don't put secrets there.

## Working on the project

Run the tests, coverage checks, TypeScript check, and production build with:

```sh
npm run check
```

API tests use temporary files. They don't change your local events or accounts.
For shorter feedback loops, run just the checks you need:

| Command | What it runs |
| --- | --- |
| `npm test` | Frontend and backend tests. |
| `npm test --prefix frontend` | Frontend tests once. |
| `npm run test:watch --prefix frontend` | Frontend tests as you edit. |
| `npm test --prefix backend` | API and backend unit tests. |
| `npm run build` | TypeScript checking and the frontend production build. |

The latest local check on September 28, 2026, passed **63 frontend tests and
36 backend tests**, coverage thresholds, TypeScript checking, and the production
build on Node 24.21.0. Tests cover event ownership, session revocation, CSRF,
redirect validation, request limits, and form recovery after connection failures.

Both dependency trees reported no known vulnerabilities in that review. To check
against the current npm advisory database, run:

```sh
npm audit --prefix frontend
npm audit --prefix backend
```

CI runs these checks for pull requests and pushes to `main`, then starts the
production Docker containers and checks the full HTTP stack. Successful `main`
runs publish the tested API and web images to GitHub Container Registry. Coverage
reports, the frontend build, and image archives are available from the workflow
run. Scheduled weekly checks also look for dependency advisories.

See [CI/CD and deployment](docs/ci-cd.md) for image names, setup, and rollback.

Most changes belong in one of these directories:

```text
frontend/src/
  app/           Router and page layouts
  features/      Events, authentication, and newsletter signup
  components/    Shared UI
  lib/           API client and configuration
  styles/        Global styles
backend/
  src/           Routes, middleware, services, and data access
  scripts/       Local data setup
  storage/       Local data and the empty example file
  tests/         API and unit tests
docs/            Demo, change notes, and security details
```

Frontend component tests and styles sit next to their components. The API's
entry point is `backend/src/server.js`; `app.js` defines the app separately so
tests can use it without starting the server.

## Your data

Setup creates `backend/storage/application-data.json` only if it doesn't already
exist. It never replaces your data. This file holds events, accounts, sessions,
and newsletter subscriptions, so it's ignored by Git. Keep it and any backups
out of public folders and source archives.

To use a different location, export `EVENTS_DATA_FILE` and run
`node backend/scripts/initialize-data.js` from the project root. The same rule
applies: an existing file is left alone.

Older events without an `ownerId` stay read-only. To assign one, first verify who
owns the event, stop the API, and back up the file. Then set `ownerId` to that
person's existing user ID.

The newsletter form saves email addresses. It doesn't send email yet.

## Before deploying

To run the published Docker images, follow the
[container deployment instructions](docs/ci-cd.md#run-the-published-images).
They use a single public origin and keep data in a persistent volume. Publishing
an image does not deploy a public website; you still need an HTTPS host.

Build with `npm run build` and serve `frontend/dist`. The frontend host needs to
serve `index.html` for routes such as `/events/new`. Set `VITE_API_URL` to the
deployed API address before building; its value is baked into the bundle.
Run the API separately with `NODE_ENV=production`, `JWT_SECRET`, and `CORS_ORIGIN`
set, and initialize its data file before the first start.

A few things matter here:

- Use HTTPS and keep the frontend and API on the same site, such as
  `app.example.com` and `api.example.com`. The session cookie won't work across
  unrelated domains.
- Run one API process per data file. Writes are queued within that process;
  multiple processes sharing the JSON file are not supported. Move to a
  transactional database before running more than one instance.
- Review your proxy setup. The API doesn't trust forwarded IP headers by default.
  Configure frontend security headers at the static host; the API's headers only
  apply to API responses.
- Email verification and account recovery aren't implemented.

## Sessions and request limits

Sessions use HttpOnly cookies, expire after an hour, and are revoked on logout.
Up to five sessions can stay active per account. Production cookies use Secure
and SameSite=Strict. Write requests require `X-Gather-CSRF: 1`, and a supplied
Origin must exactly match `CORS_ORIGIN`. Login return links are checked after URL
normalization to keep redirects within the app.

The following limits use a 15-minute window:

| Requests | Per IP | Per account |
| --- | --- | --- |
| Login and signup, combined | 30 | — |
| Newsletter signup | 10 | — |
| Logout | 30 | — |
| Event creation, editing, and deletion, combined | 60 | 30 |

IPv6 addresses within one `/56` network share an IP allowance. Limits reset on
restart and aren't shared across API processes. A blocked request returns HTTP
429 with a `Retry-After` header; opening another session doesn't reset the account
limit. Browsing events doesn't use the event write allowance.

If you're upgrading from the older Bearer-token version, sign in again. API
clients need to preserve cookies and send the CSRF header described in the
[session migration notes](docs/security-hardening.md#api-migration).

## More details

- [Contributing](.github/CONTRIBUTING.md)
- [CI/CD and deployment](docs/ci-cd.md)
- [Reporting a security issue](SECURITY.md)
- [Security fixes and remaining limits](docs/security-hardening.md)
- [Feature changes](docs/improvements.md)
- [Dependency updates](docs/dependencies.md)
- [Changelog](CHANGELOG.md)
- [License](LICENSE.md)
