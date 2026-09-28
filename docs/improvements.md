# 20 completed improvements

These changes build on the feature-based project structure. Existing event data
is preserved, and public route URLs remain unchanged.

| # | Improvement | Result |
| --- | --- | --- |
| 1 | Event ownership | The API enforces organizer-only edits/deletes; the UI shows management controls only to the organizer and asks before deletion. Legacy events without owners are read-only. |
| 2 | Safe concurrent persistence | A per-file queue serializes complete mutations. Atomic rename avoids partially written JSON, and failed mutations do not block later writes. |
| 3 | Account input handling | Emails are normalized; duplicate registration is checked inside the write queue; signup passwords have minimum and bcrypt byte limits. Login failures use a consistent response. |
| 4 | Authentication throttling | Login/signup attempts are limited per IP with HTTP 429 and a retry interval. Newsletter submission has its own limit. |
| 5 | Consistent API errors | Missing endpoints and malformed bodies return JSON; internal errors are redacted and request IDs are provided. |
| 6 | Response security headers | API responses prevent MIME sniffing, framing, and caching; CORS includes preflight handling and origin variation. These headers apply to the API, not the separately hosted frontend. |
| 7 | Bounded event validation | Titles, descriptions, and URLs have server-side length limits; text is trimmed and image URLs cannot contain credentials. |
| 8 | Shared API client | Request cancellation, network errors, malformed responses, and HTTP statuses are handled consistently; duplicate event-fetch logic is removed. |
| 9 | Login return paths | Protected routes preserve the intended destination across login/signup. External and protocol-relative return URLs are rejected. |
| 10 | Session synchronization | Login/logout changes in another tab trigger session revalidation. Missing or blocked browser storage is handled safely. |
| 11 | Shareable discovery filters | Search and sort live in the URL, survive reloads, and cooperate with browser history without refetching the collection for every keystroke. |
| 12 | Date filtering | Visitors can select upcoming or past events using their local calendar date. |
| 13 | Event pagination | Collections show six cards per page; filters reset the page and out-of-range page numbers are bounded. |
| 14 | Persistent favorites | Visitors save events locally and filter the collection to saved items. Corrupted or unavailable storage does not crash the page. |
| 15 | Event sharing | A share control copies a canonical event link, with a selectable fallback when clipboard access fails. |
| 16 | Resilient images | Broken covers use a bundled fallback; images decode asynchronously and suppress referrer information. |
| 17 | Unsaved-change protection | Leaving a modified event form asks whether to keep editing or discard changes. Browser unloads are guarded; successful saves proceed normally. |
| 18 | Accessible form feedback | Server errors attach to individual fields with accessible descriptions and focus the first invalid field. Failed submissions retain entered values. |
| 19 | Navigation and recovery | Route titles, scroll restoration, initial/loading feedback, and status-specific recovery pages make navigation and failures clearer. |
| 20 | Real newsletter subscriptions | The form posts to the API, validates and deduplicates emails, saves subscriptions, and reports the actual outcome without an alert popup. Email delivery is not implemented. |

## Verification

- Frontend: `npm run test:coverage --prefix frontend` and `npm run build`.
- API: `npm run test:coverage --prefix backend` (tests use temporary data).
- Browser checks use isolated sample data: URL filters, pagination, favorites after
  reload, login return paths, unsaved forms, creation/editing/sharing/deletion,
  cross-tab logout, newsletter persistence, and missing-event recovery.
- Desktop (1200 px) and mobile (390 px) layouts were visually checked; mobile
  content fits the viewport without horizontal overflow.

## Operating limits

Run only one API process against a JSON file. Rate limits are per process and
reset on restart. Sessions now use HttpOnly cookies and are revoked server-side on logout;
see the subsequent [security fixes](security-hardening.md). Ownership backfill for legacy records requires manual verification.
See [deployment notes](../README.md#deployment-scope) and the
[security policy](../.github/SECURITY.md) before a public deployment.
