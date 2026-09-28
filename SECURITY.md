# Security Policy

This policy applies to Gather (React Event Platform), including the React
frontend, Express API, authentication flow, data storage, container images, and
repository automation.

## Supported versions

Security fixes target the latest code on `main` and container images built from
that code. Older releases, commit tags, and other branches do not have a
guaranteed security maintenance period. A published image is not a promise of
continued support for its dependencies. When reporting an issue, identify the
affected commit, release, or image digest.

## Reporting a vulnerability

Please do not disclose security vulnerabilities in public issues, discussions,
or pull requests, or include credentials and personal data in public logs.

Use GitHub's
[private vulnerability reporting form](https://github.com/fatmakahveci/react-ts-event/security/advisories/new)
if it is enabled for this repository. If it is unavailable, check the
[maintainer's GitHub profile](https://github.com/fatmakahveci) for a contact method
and request a private reporting channel before sharing vulnerability details.

Include the following information where possible:

- A short description and the affected component, endpoint, or file.
- The affected commit or release and relevant runtime/configuration details.
- Reproduction steps or a minimal proof of concept using synthetic data.
- Required access or preconditions and the potential security impact.
- A proposed mitigation, if available.

Redact passwords, tokens, signing keys, and personal information. For dependency
reports, include the package name, affected version, advisory identifier, and
how the vulnerable behavior is reachable in this application.

## Handling and disclosure

Reports are reviewed on a best-effort basis; there is no guaranteed response or
resolution deadline. The maintainer may request additional reproduction details
and coordinate a fix or mitigation through the private reporting channel.

Please coordinate public disclosure with the maintainer so users can apply a
fix or mitigation first. A report may describe a known limitation listed below;
additional impact or an unexpected way to exploit that limitation is still
useful to report.

Test only local instances or deployments for which you have explicit permission.
Use test accounts and synthetic data. Avoid accessing other users' data,
disrupting services, or performing destructive testing on shared deployments.

## Current security boundaries and limitations

The project is a prototype and does not currently provide the controls needed
for a public, multi-user production service:

- **Event permissions:** anyone can read events. Only the organizer identified by
  the signed JWT subject can update or delete an event. Events without an
  `ownerId` are read-only until ownership is verified and assigned by an operator.
  There are no administrator or moderation roles.
- **Sessions:** credentials use HttpOnly, SameSite=Strict cookies, with Secure
  and the `__Host-` prefix in production. JWT verification requires HS256, the
  application's issuer/audience, expiration, subject, and a session identifier.
  Each request also requires an active server-side session and an existing user.
  Logout revokes the current session; login rotates the cookie's prior session.
  Sessions expire after one hour, with at most five active sessions per account.
  Browser script compromise can still act through an active browser session;
  HttpOnly prevents scripts from reading the credential, not every XSS impact.
- **Authentication abuse:** login and signup share a limit of 30 attempts per IP
  per 15 minutes; newsletter submissions allow 10 and logout has its own limit
  of 30. Event creation, editing, and deletion share a limit of 30 per account
  and 60 per IP per 15 minutes. New sessions do not reset the account allowance.
  IPv4-mapped IPv6 addresses share the IPv4 budget; native IPv6 clients share a
  budget within a `/56` network. Limits are held in memory, reset on restart,
  and do not coordinate across processes. Forwarded IP headers
  are not trusted. Behind the bundled web proxy, visitors share the proxy's IP
  allowance; account allowances remain independent. Account lockout and email
  verification are absent.
  Signup passwords must contain at least 8 characters and at most 72 UTF-8 bytes.
  Missing-account login attempts perform a dummy password comparison; this
  removes the obvious missing-account fast path, without guaranteeing identical
  timings. Signup still identifies duplicate email addresses.
- **Return navigation:** post-login destinations must stay within the app after
  URL normalization. Paths that become a protocol-relative external URL are rejected.
- **Persistence:** users, sessions, events, and newsletter subscriptions share a JSON file.
  Mutations are queued within one API process and committed by atomic rename with
  restrictive file permissions. This is not a multi-process transaction system;
  do not share the file across API processes. Email addresses, password hashes,
  and backups remain sensitive. Session records contain digests of identifiers,
  not usable cookies. The default live file and temporary writes are Git-ignored;
  the committed example contains no accounts. Newsletter verification and delivery are
  not implemented.
- **External images:** event images load from user-supplied HTTP or HTTPS URLs.
  The image host can receive visitors' network requests.
- **CORS and CSRF:** only the exact configured origin is accepted. Every unsafe
  method requires `X-Gather-CSRF: 1`, including login and logout. Ordinary forms
  cannot send this header; cross-origin scripts require an approved preflight.
  CORS does not replace authentication or ownership authorization. Non-browser
  clients must send the header and preserve the session cookie.

## Deployment and secret management

Before exposing a deployment publicly:

- Use HTTPS for the frontend and API. The supplied Compose setup serves the web
  app on `127.0.0.1:8080` and keeps the API port inside the container network.
  Put an HTTPS reverse proxy in front of the web service on the same host.
  The web image sends API requests through `/api/` on the same origin.
- Set `NODE_ENV=production` and supply a randomly generated `JWT_SECRET` of at
  least 32 characters. Production startup rejects a missing or shorter secret.
  Development without a configured secret uses a new random key on each restart.
- Set `CORS_ORIGIN` to the exact intended HTTPS frontend origin. Startup rejects
  wildcard, missing, HTTP, or path-bearing production origins. If deploying the
  frontend and API separately, keep them on the same site for Strict cookies
  (such as HTTPS subdomains of the same registrable domain). Keep signing keys and other
  secrets in the server environment; `VITE_*` values are included in the client
  bundle and must not contain secrets.
- Keep `.env` files and real user data out of version control. Point
  `EVENTS_DATA_FILE` to protected storage outside the public web root and restrict
  access to the application account. The Compose setup stores this file in the
  `application-data` volume. Protect backups as carefully as live data, test
  restores, and avoid `docker compose down --volumes` on a live deployment.
- Keep the supplied container restrictions: non-root users, read-only root
  filesystems, dropped Linux capabilities, and no privilege escalation. Writable
  storage is limited to the data volume and temporary directories. These
  restrictions do not replace host updates or access control.
- Review the session design, proxy configuration, and deployment-wide abuse
  controls. Apply client-aware rate limits at a trusted HTTPS proxy before opening
  registration publicly. Replace JSON persistence with transactional storage
  before running multiple API instances. Bearer tokens are not accepted; clients
  must sign in and preserve the session cookie.
- Review dependency advisories, use lockfiles for reproducible installation,
  and run the project's checks after updates. Passing tests or an automated
  dependency scan alone does not establish that a deployment is secure.

## CI/CD and dependency checks

The [CI/CD workflow](.github/workflows/ci.yml) runs on pull requests, pushes to
`main`, manual requests, and a weekly schedule. It checks workflow syntax,
installs locked dependencies, runs frontend and backend tests with coverage,
builds the frontend, and exercises the production containers with disposable
data. The runtime checks cover cookie flags, CSRF rejection, ownership-protected
event operations, and session revocation.

Both npm dependency trees are audited. High and critical advisories fail CI;
lower-severity findings still need review. This audit does not scan operating
system packages in the container images. Dependabot proposes updates for npm
dependencies, GitHub Actions, and Docker base images. Actions are pinned to
commit SHAs and base images to digests; those pins still need regular updates.

Validation jobs use read-only repository permissions. Image publication has
package write access and uses `GITHUB_TOKEN`. On a successful push to `main`,
the workflow verifies the exported images' checksum and publishes the images
that passed the runtime checks, without rebuilding them. Pull request runs do
not publish images. A checksum detects changes to the export; it is not an image
signature or proof of provenance.

Deploy both services from the same tested commit using `sha-<full commit SHA>`
tags, and record their image digests. Publishing to the registry does not update
a running server. Operators are responsible for applying fixes and checking
data compatibility when updating or rolling back. Use the deployment smoke
script only against disposable test data; it creates accounts and events.

## If a secret is exposed

If a signing key is exposed, replace it on every API instance; tokens signed
with the old key will no longer validate, and users will need to sign in again.
Rotate other exposed credentials as appropriate and investigate affected systems.
Check logs, artifacts, and backups for the same exposure without copying secrets
into an issue or report. Removing a secret from a file or Git history does not
revoke it.

See the [README](README.md) for local setup and validation commands,
[deployment guide](docs/ci-cd.md) for container operation, and
[security hardening notes](docs/security-hardening.md) for the API migration and
regression checks.
