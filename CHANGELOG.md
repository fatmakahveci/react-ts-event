# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
where applicable.

## [Unreleased]

### Added

- Route integration tests for slow search, interrupted session checks, cross-tab logout, login redirects, and event ownership; additional API throttling, CSRF, and password-boundary tests.
- URL-based discovery filters, date filters, pagination, and persistent favorites.
- Event sharing, image fallbacks, unsaved-form protection, and accessible field errors.
- Persistent newsletter subscriptions with validation and duplicate handling.
- Cross-tab session synchronization, safe login return paths, and route recovery UI.

### Changed

- Upgrade React and React DOM to 19.3, Express to 5.2, TypeScript to 7.0, Vite to 8.3, and Vitest to 5.0; refresh both dependency lockfiles.
- Align React types with React 19 and infer component return types without the removed global JSX namespace.
- Require Node.js 24.15+ within the 24.x line, or 26+; select Node 24 for development and CI through `.nvmrc`.

### Removed

- Unused direct dependencies: `react-icons`, `styled-components`, `body-parser`, and `uuid`.
- The `qs` override, since the updated dependency tree already resolves to 6.16.0.

### Fixed

- Event filters no longer wait for session revalidation on each keystroke, preventing lost search characters on slow connections.
- Background session checks preserve open forms during connection failures and revalidate routes only after a verified session change.
- Concurrent JSON mutations now use a write queue and atomic file replacement.
- Account email normalization and duplicate checks run consistently across signup and login.
- Network errors and cancelled requests use a shared API client.

### Security

- Reject login return paths that normalize into external redirects, including encoded dot segments.
- Group IPv6 request limits by `/56` and normalize IPv4-mapped addresses to prevent address-based budget resets.
- Limit event mutations per account and IP, and throttle logout independently to bound repeated storage writes. Add regression coverage for rejected writes and shared budgets.
- Replace JavaScript-readable Bearer tokens with HttpOnly cookie sessions and persistent server-side revocation on logout. Reject legacy, unregistered, revoked, expired, and deleted-user sessions.
- Require exact-origin checks and a CSRF protection header for unsafe requests, including login/logout; use Secure host-only cookies and an explicit HTTPS frontend origin in production.
- Validate JWT issuer, audience, algorithm, expiration, and session claims; rotate sessions on login and cap active sessions per account.
- Remove the missing-account login fast path, reject compressed JSON bodies, and exclude live application data from Git. Initialize new data with restrictive permissions without overwriting existing files.
- Add npm security audits to CI and weekly dependency update checks for both applications.
- Enforce event ownership for edits and deletes; legacy ownerless events remain read-only.
- Limit authentication and newsletter attempts and validate input lengths server-side.
- Add safe API errors, request IDs, and response security headers.

See [the full list of 20 improvements](docs/improvements.md) for behavior and operating limits.
See [dependency upgrade notes](docs/dependencies.md) for versions and compatibility checks.

<!--
When preparing a release, move relevant entries from Unreleased into a dated
version section. Use Added, Changed, Deprecated, Removed, Fixed, and Security
headings as appropriate.
-->
