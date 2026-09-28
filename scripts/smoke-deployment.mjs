import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

// This script creates an account and event. Run it only against a disposable CI stack.
const base = process.env.SMOKE_BASE_URL;
const origin = process.env.CORS_ORIGIN;
assert.ok(base && origin, 'Set SMOKE_BASE_URL and CORS_ORIGIN for the disposable test stack.');
const call = (path, options = {}) => fetch(`${base}${path}`, {
  ...options, redirect: 'error', signal: AbortSignal.timeout(10000),
});
const write = (method, path, payload, cookie, requestOrigin = origin) => call(path, {
  method,
  headers: { 'Content-Type': 'application/json', 'X-Gather-CSRF': '1', Origin: requestOrigin, ...(cookie ? { Cookie: cookie } : {}) },
  body: JSON.stringify(payload),
});

const index = await call('/');
assert.equal(index.status, 200);
assert.match(index.headers.get('content-security-policy'), /frame-ancestors 'none'/);
assert.equal(index.headers.get('x-content-type-options'), 'nosniff');
const html = await index.text();
assert.match(html, /<div id="root"><\/div>/);
const script = html.match(/src="([^"]+\.js)"/)[1];
const bundle = await call(script);
assert.equal(bundle.status, 200);
assert.match(bundle.headers.get('content-type'), /javascript/);
assert.ok(!(await bundle.text()).includes('http://localhost:8080'), 'Production must use the same-origin API.');
const deepLink = await call('/events/new');
assert.equal(deepLink.status, 200);
assert.equal(await deepLink.text(), html);
assert.equal((await call('/assets/missing.js')).status, 404);
assert.equal((await call('/.env')).status, 404);
assert.deepEqual(await (await call('/api/health')).json(), { status: 'ok' });
const missing = await call('/api/not-a-route');
assert.equal(missing.status, 404);
assert.match(missing.headers.get('content-type'), /application\/json/);

const account = { email: `ci-${randomUUID()}@example.com`, password: randomUUID() };
const signup = await write('POST', '/api/signup', account);
assert.equal(signup.status, 201);
const setCookie = signup.headers.getSetCookie()[0];
assert.match(setCookie, /^__Host-gather_session=/);
for (const flag of ['HttpOnly', 'Secure', 'SameSite=Strict', 'Path=/']) assert.ok(setCookie.includes(flag));
const cookie = setCookie.split(';')[0];
const session = await call('/api/session', { headers: { Cookie: cookie } });
assert.equal(session.status, 200);
const event = { title: 'CI deployment check', description: 'Temporary CI data', date: '2030-01-01', image: `${origin}/images/community-meetup.jpg` };
assert.equal((await write('POST', '/api/events', event, cookie, 'https://invalid.example')).status, 403);
const noCsrf = await call('/api/events', { method: 'POST', headers: { Cookie: cookie, Origin: origin, 'Content-Type': 'application/json' }, body: JSON.stringify(event) });
assert.equal(noCsrf.status, 403);
const created = await write('POST', '/api/events', event, cookie);
assert.equal(created.status, 201);
const id = (await created.json()).event.id;
assert.equal((await write('PATCH', `/api/events/${id}`, { ...event, title: 'Updated CI event' }, cookie)).status, 200);
assert.equal((await write('DELETE', `/api/events/${id}`, {}, cookie)).status, 200);
assert.equal((await write('POST', '/api/logout', {}, cookie)).status, 204);
assert.equal((await call('/api/session', { headers: { Cookie: cookie } })).status, 401);
console.log('Production smoke checks passed: SPA, assets, API proxy, secure cookies, CSRF, event ownership flow, and logout revocation.');
