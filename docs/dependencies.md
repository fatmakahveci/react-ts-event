# Dependency upgrade notes

Dependencies were refreshed on 2026-09-28. These are the resolved versions from
the lockfiles before and after the update; package manifests allow compatible
updates, while `npm ci` installs the locked versions.

| Package | Before | After |
| --- | --- | --- |
| `react`, `react-dom` | 18.3.1 | 19.3.0 |
| `react-router-dom` | 7.18.3 | 7.18.4 |
| `@testing-library/dom` | 10.4.1 | 10.4.2 |
| `@types/react` | 18.3.31 | 19.3.0 |
| `@types/react-dom` | 18.3.7 | 19.3.0 |
| `@types/node` | 20.19.43 | 24.19.0 |
| `typescript` | 5.9.3 | 7.0.2 |
| `vite` | 8.2.2 | 8.3.1 |
| `vitest`, `@vitest/coverage-v8` | 4.1.11 | 5.0.2 |
| `jsdom` | 27.4.0 | 30.1.1 |
| `express` | 4.22.2 | 5.2.1 |
| `bcryptjs` | 2.4.3 | 3.0.3 |
| `jsonwebtoken` | 9.0.2 | 9.0.3 |
| `supertest` | 7.2.2 | 7.3.0 |

Already-current packages were retained. `@types/node` deliberately follows the
Node 24 baseline instead of the Node 26 type definitions.

The follow-up security review added `ipaddr.js` 2.5.0 as a direct API dependency
to normalize IPv4-mapped addresses and group IPv6 request budgets. Express's
`proxy-addr` dependency still uses its own compatible 1.9.1 copy. The updated
backend dependency tree also passed `npm audit` with zero reported vulnerabilities.

## Compatibility

- Use Node 24.15 or newer within 24.x, or Node 26+. The updated jsdom dependency sets the minimum Node 24 patch version. `.nvmrc` and CI select Node 24.
- React 19 uses scoped JSX types. Components now infer return types, and the existing `react-jsx` transform remains enabled. See the [React upgrade guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide).
- Express 5 runs the existing CommonJS API and route handlers. API tests exercise authentication, ownership checks, malformed requests, and persistence. See the [Express migration guide](https://expressjs.com/en/guide/migrating-5/).
- TypeScript runs through its CLI; the project does not consume the compiler API. See the [TypeScript 7 release notes](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/).
- Unused direct dependencies `react-icons`, `styled-components`, `body-parser`, and `uuid` were removed. Express still uses `body-parser` internally. The old `qs` override was removed; the resolved tree uses `qs` 6.16.0.

## Verification

Validation used an isolated Node 24.21.0 runtime; the system Node installation was
not modified. Both lockfiles passed a clean `npm ci` installation. The frontend's
39 tests, backend's 14 tests, coverage thresholds, TypeScript check, and production
build passed. Both complete dependency trees reported zero vulnerabilities in
`npm audit` on the date above; this is a point-in-time result.

A Chromium smoke check also passed with temporary data: URL filters, pagination,
favorites after reload, mobile overflow, signup and return navigation, unsaved
form protection, event creation/editing/sharing/deletion, cross-tab logout,
newsletter persistence, and missing-event recovery. No page errors were recorded.

Run `npm run setup` and `npm run check` from the repository root to reproduce the
installation and automated checks on a supported Node version.
