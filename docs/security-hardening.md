# Security fixes and session migration

The 2026-09-28 review covered the application code, dependency trees, authentication,
authorization, request handling, local persistence, and repository automation.

## Fixed risks

| Finding | Change |
| --- | --- |
| Browser scripts could read persistent login tokens. | Credentials now stay in HttpOnly cookies. Only display metadata is kept in memory; old local-storage tokens are removed. |
| Logout left a copied token valid until expiration. | Every authenticated request checks persistent session state. Logout removes that record, and replay is rejected. |
| Signed credentials lacked application/session binding. | JWTs require the application issuer, audience, HS256 algorithm, expiry, subject, and session identifier. The referenced user must still exist. |
| Cookie authentication needs protection against forged browser requests. | Unsafe requests require a custom CSRF header. Foreign and opaque (`null`) origins are rejected before body parsing. Cookies use SameSite=Strict. |
| Authentication configuration could silently fall back in production. | Production requires an exact HTTPS frontend origin and a signing secret of at least 32 characters. Cookies use Secure and the `__Host-` prefix. |
| Unknown-account login skipped password verification. | A dummy bcrypt comparison removes the obvious fast path; failure messages remain generic. |
| Compressed requests could incur decompression work before validation. | Compressed request bodies are rejected; the existing 100 KB JSON limit remains. |
| Live account data could be accidentally added to Git. | The default live data file is ignored; a separate empty example is committed. Initialization uses exclusive creation and mode 0600. |
| Dependency advisories were not checked in CI. | Both CI jobs run npm audit at the high-severity threshold, and Dependabot checks both npm projects weekly. |
| Login return paths could become external redirects after dot-segment normalization. | The normalized pathname is checked again before being used as a redirect destination. |
| Rotating IPv6 addresses within one allocation bypassed per-address throttling. | Limits now group native IPv6 addresses by `/56` and normalize IPv4-mapped addresses to IPv4. |
| Event writes and repeated logout requests could repeatedly rewrite the full data file without throttling. | Event mutations share account and IP budgets; logout has an independent IP budget. Rejected requests never reach the storage mutation. |

## Request budgets

Each allowance uses a 15-minute window and returns HTTP 429 with `Retry-After`
when exhausted. Creating another session does not reset an account allowance.

| Operations | Per IP or IPv6 /56 | Per account |
| --- | --- | --- |
| Login and signup, combined | 30 | — |
| Newsletter subscriptions | 10 | — |
| Logout | 30 | — |
| Event creation, editing, and deletion, combined | 60 | 30 |

Event reads and session checks do not consume these write allowances. Limits
also count failed requests that reach the corresponding limiter. IP limits are
checked before event authentication; the account limit uses the verified user ID.
These are local abuse controls, not protection against distributed denial of service.

## API migration

Legacy tokens no longer authenticate; sign in again after upgrading. Event data
and existing password hashes need no migration. Session records are created on
login. A restarted development server uses a new key unless `JWT_SECRET` is set.

- `POST /signup` and `POST /login` set the cookie and return `{ user, expiresAt }`;
  there is no token in JSON. A login replaces the session presented by that cookie.
- `GET /session` returns current display metadata or 401. At most five sessions
  per account stay active; creating a sixth evicts the oldest.
- `POST /logout` revokes the presented session and expires its cookie. It is safe
  to repeat. A failed revocation is reported, rather than presented as success.
- Browser requests use `credentials: "include"`. All unsafe methods send
  `X-Gather-CSRF: 1`; POST/PATCH bodies must be JSON objects. Logout sends `{}`.
- Non-browser clients must preserve the cookie and send the same CSRF header.
  They may omit Origin; an Origin that is present must match `CORS_ORIGIN` exactly.
- Host the UI and API on the same site, with HTTPS in production. Local development
  uses `localhost` for both, or matching `127.0.0.1` origins for both. Unrelated
  frontend/API domains are intentionally unsupported by the Strict cookie.

The default live file stays at `backend/storage/application-data.json`, but is no
longer source material. `npm run setup` creates it only when absent, from
`application-data.example.json`. Back it up through protected operational storage.
Custom data paths and any old Git history need the same protection.

## Verification and limits

Regression tests cover cookie attributes, logout replay, login rotation, owner
authorization, malformed/expired/unregistered sessions, deleted users, JWT claim
validation, foreign origins, missing CSRF headers, compressed bodies, and production
configuration. Frontend tests cover server-checked sessions, old-token cleanup,
expiry, return navigation, and unsuccessful logout handling. Browser checks use
temporary accounts and data to verify the actual cookie and application flows.

The follow-up review reproduced the redirect bypass, IPv6 limit bypass, and
unthrottled writes in failing regression tests before applying the fixes. Tests
now check encoded dot segments, the actual login redirect response, IPv4-mapped
addresses, account limits across sessions, shared limits across mutation methods,
and storage remaining unchanged after a rejected request.

Validation on Node 24.21.0 passed 58 frontend tests, 36 backend tests, both coverage
thresholds, TypeScript checking, and the production build. The earlier Chromium run
confirmed that page scripts cannot read the cookie, legacy local-storage tokens
are absent, logout replay returns 401, and the existing event flows still work.

Both full dependency trees reported zero vulnerabilities in `npm audit` on
2026-09-28. Run `npm run check` for the code checks. This review does not establish
that every possible vulnerability is absent. JSON storage still supports one API
process, rate limits remain per process, signup reveals duplicate emails, and
email verification/account recovery are absent. HttpOnly does not prevent a
compromised browser script from issuing requests. Frontend response headers must
be configured by its static host; the API headers do not protect a separate host.
See the [security policy](../.github/SECURITY.md) for deployment boundaries.

The session and CSRF design follows the relevant guidance in the
[OWASP session management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
and [CSRF prevention](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
cheat sheets. Return-path validation and request budgets also follow the
[redirect validation](https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html)
and [denial-of-service prevention](https://cheatsheetseries.owasp.org/cheatsheets/Denial_of_Service_Cheat_Sheet.html)
guidance. Address normalization uses [ipaddr.js](https://github.com/whitequark/ipaddr.js).
