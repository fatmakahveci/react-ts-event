# CI/CD and deployment

GitHub Actions checks each pull request and every push to `main`. A successful
`main` run publishes two runnable Linux AMD64 images to GitHub Container Registry:

- `ghcr.io/fatmakahveci/react-ts-event-api`
- `ghcr.io/fatmakahveci/react-ts-event-web`

No hosting account or deployment secret is needed to build and publish these
images. Publishing uses the repository's `GITHUB_TOKEN`. Running the application
on a public server still requires a host, HTTPS, and the runtime settings below.

## What runs

The [CI/CD workflow](../.github/workflows/ci.yml) follows this order:

1. Validate workflow syntax and Docker Compose configuration.
2. Install locked dependencies, audit both dependency trees, run frontend and
   backend coverage checks, and type check and build the frontend.
3. Build the API and web images, then start them with production settings and
   disposable data. Check SPA routes, assets, the API proxy, Secure cookies,
   CSRF enforcement, event creation/editing/deletion, and session revocation.
4. Export the tested images and their checksum as a workflow artifact.
5. On a push to `main`, load those exact images and publish them. No rebuild
   happens between the runtime checks and publication.

Frontend builds and coverage reports are retained for seven days; image exports
for three days. These artifacts are available from the workflow run. Image tags
use `sha-<full commit SHA>` so both services can be deployed together. The `main`
tag is updated only if the tested commit is still the branch head.

Pull requests, scheduled checks, and manual CI runs never publish images. New PR
commits cancel superseded PR checks. A weekly scheduled run checks for dependency
advisories even when there are no code changes. Dependabot covers npm packages,
Actions, and pinned Docker base images.

The existing [source package workflow](../.github/workflows/publish-source-package.yml)
also runs all checks before publishing on a release or manual request. Its OCI
source archive remains separate from the runnable web and API images.

## Run the published images

Install Docker Engine and Docker Compose on a Linux AMD64 host. Copy this repo's
`compose.yml` and `deploy/.env.example`, then create `.env` beside `compose.yml`:

```sh
cp deploy/.env.example .env
openssl rand -hex 32
```

Put the generated value in `JWT_SECRET` and set `CORS_ORIGIN` to the public HTTPS
origin, for example `https://events.example.com`. Set `GATHER_IMAGE_TAG` to the
`sha-...` tag printed in the successful CI/CD run summary. Keep `.env` private.
Neither the signing secret nor a production data file is included in an image.

If the packages are private, authenticate to GHCR with a credential that can
read them. Package visibility and access are controlled in GitHub Packages.

```sh
docker compose pull
docker compose up --detach --no-build --wait
```

The web service listens on `127.0.0.1:8080`. Put an HTTPS reverse proxy on the same
host in front of that address. It serves the frontend and proxies `/api/` to the
API, so both use the same origin. The API port is not published to the host.
`VITE_API_URL=/api` is already built into the web image.

The containers run without root privileges and with read-only root filesystems.
An `application-data` named volume stores account, event, session, and newsletter
data. Initialization preserves an existing data file. Back up the volume and
keep one API instance per volume. Do not use `docker compose down --volumes` on a
deployment whose data you want to keep.

The API does not trust forwarded IP headers. With this proxy, IP-based allowances
are shared across visitors; account limits still apply independently. Review
deployment-wide rate limiting at the HTTPS proxy before opening registration
to the public. See the [security policy](../SECURITY.md).

## Update or roll back

Back up the data volume, change `GATHER_IMAGE_TAG` in `.env` to the desired
successful commit tag, and run the same pull/up commands. Use the same tag for
both images. Application rollback does not restore or migrate saved data; check
data compatibility before switching versions. Inspect startup with
`docker compose ps` and `docker compose logs --tail 100`.

## Build and check locally

With a running Docker daemon and the environment file configured:

```sh
docker compose build
docker compose up --detach --no-build --wait
```

Local builds target the host's architecture, including Apple Silicon. Published
images currently target Linux AMD64. Normal development can continue to use
`npm run dev:api` and `npm run dev` without Docker.

`scripts/smoke-deployment.mjs` creates temporary accounts and events; use it only
against a disposable test stack. CI gives it an isolated volume and removes that
volume afterward. It is not a health check for a live deployment.

Implementation references: [GitHub workflow artifacts](https://docs.github.com/en/actions/tutorials/store-and-share-data),
[Docker Compose health dependencies](https://docs.docker.com/compose/how-tos/startup-order/),
and the [unprivileged NGINX image](https://github.com/nginx/docker-nginx-unprivileged).
