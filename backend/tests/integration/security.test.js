const { test, before, beforeEach, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const supertest = require("supertest");
const { sign, decode } = require("jsonwebtoken");
process.env.JWT_SECRET = "test-only-signing-secret-with-at-least-32-characters";
process.env.CORS_ORIGIN = "http://localhost:5173";
const app = require("../../src/app");
const { createJSONToken, validateJSONToken } = require("../../src/services/auth.service");
const sessions = require("../../src/repositories/session.repository");
const request = () => supertest.agent(app).set("X-Gather-CSRF", "1").set("Origin", process.env.CORS_ORIGIN);
const cookie = response => response.headers["set-cookie"][0].split(";")[0];
let directory, file;
before(async () => {
  directory = await fs.mkdtemp(path.join(os.tmpdir(), "gather-security-"));
  file = path.join(directory, "store.json");
  process.env.EVENTS_DATA_FILE = file;
});
beforeEach(async () => { await fs.writeFile(file, JSON.stringify({ users: [], events: [] })); });
after(async () => { await fs.rm(directory, { recursive: true, force: true }); });
const credentials = { email: "security@example.com", password: "SafeTestPassword123!" };
const event = { title: "Security check", description: "Local synthetic test", date: "2030-01-01", image: "https://example.com/image.jpg" };

async function signup() { return request().post("/signup").send(credentials).expect(201); }

test("uses HttpOnly cookies and never exposes a credential in JSON or storage", async () => {
  const response = await signup();
  const header = response.headers["set-cookie"][0];
  assert.match(header, /^gather_session=/);
  for (const flag of ["HttpOnly", "SameSite=Strict", "Path=/", "Max-Age=3600"]) assert.ok(header.includes(flag));
  assert.ok(!header.includes("Domain="));
  assert.equal(response.body.token, undefined);
  assert.equal(response.body.user.password, undefined);
  const current = await request().get("/session").set("Cookie", cookie(response)).expect(200);
  assert.deepEqual(current.body.user, response.body.user);
  const persisted = await fs.readFile(file, "utf8");
  assert.ok(!persisted.includes(cookie(response).split("=")[1]));
  assert.ok(!persisted.includes(decode(cookie(response).split("=")[1]).jti));
});

test("revokes a copied cookie on logout and rejects subsequent replay", async () => {
  const savedCookie = cookie(await signup());
  await request().post("/events").set("Cookie", savedCookie).send(event).expect(201);
  const out = await request().post("/logout").set("Cookie", savedCookie).send({}).expect(204);
  assert.match(out.headers["set-cookie"][0], /Expires=Thu, 01 Jan 1970/);
  await request().get("/session").set("Cookie", savedCookie).expect(401);
  await request().post("/events").set("Cookie", savedCookie).send(event).expect(401);
  assert.equal(JSON.parse(await fs.readFile(file, "utf8")).sessions.length, 0);
  await request().post("/logout").send({}).expect(204);
});

test("rotates the prior session at login and rejects legacy Bearer authentication", async () => {
  const oldCookie = cookie(await signup());
  const login = await request().post("/login").set("Cookie", oldCookie).send(credentials).expect(200);
  assert.notEqual(cookie(login), oldCookie);
  await request().get("/session").set("Cookie", oldCookie).expect(401);
  await request().get("/session").set("Cookie", cookie(login)).expect(200);
  await request().post("/events").set("Authorization", `Bearer ${cookie(login).split("=")[1]}`).send(event).expect(401);
});

test("blocks foreign origins, null origins, simple forms, and missing CSRF headers", async () => {
  const savedCookie = cookie(await signup());
  for (const origin of ["https://evil.example", "null", "http://localhost:5173.evil.example"]) {
    const denied = await request().post("/events").set("Origin", origin).set("Cookie", savedCookie).send(event).expect(403);
    assert.equal(denied.headers["access-control-allow-origin"], undefined);
    await request().options("/events").set("Origin", origin).expect(403);
  }
  for (const endpoint of ["/signup", "/login", "/logout", "/newsletter", "/events"]) {
    await supertest(app).post(endpoint).set("Origin", process.env.CORS_ORIGIN).set("Cookie", savedCookie).send({}).expect(403);
  }
  await supertest(app).post("/logout").set("Cookie", savedCookie).type("form").send({}).expect(403);
  await request().get("/session").set("Cookie", savedCookie).expect(200);
  const preflight = await request().options("/events").expect(204);
  assert.equal(preflight.headers["access-control-allow-origin"], process.env.CORS_ORIGIN);
  assert.equal(preflight.headers["access-control-allow-credentials"], "true");
  assert.match(preflight.headers["access-control-allow-headers"], /X-Gather-CSRF/);
  assert.equal(JSON.parse(await fs.readFile(file, "utf8")).events.length, 0);
});

test("rejects malformed, duplicate, unregistered, expired and deleted-user sessions", async () => {
  const registered = await signup();
  const savedCookie = cookie(registered);
  for (const bad of ["gather_session=invalid", "gather_session=", `gather_session=${"x".repeat(2050)}`, `${savedCookie}; ${savedCookie}`,
    `gather_session=${createJSONToken(registered.body.user.id)}`]) {
    await request().get("/session").set("Cookie", bad).expect(401);
  }
  const store = JSON.parse(await fs.readFile(file, "utf8"));
  store.sessions[0].expiresAt = Date.now() - 1;
  await fs.writeFile(file, JSON.stringify(store));
  await request().get("/session").set("Cookie", savedCookie).expect(401);
  store.sessions[0].expiresAt = Date.now() + 3600000;
  store.users = [];
  await fs.writeFile(file, JSON.stringify(store));
  await request().get("/session").set("Cookie", savedCookie).expect(401);
});

test("requires signed, expiring JWTs with the application issuer and audience", () => {
  const base = { sub: "test-user", jti: "test-session", iss: "gather-api", aud: "gather-browser", exp: Math.floor(Date.now() / 1000) + 3600 };
  for (const payload of [{ ...base, iss: "other" }, { ...base, aud: "other" }, { ...base, exp: 1 },
    { ...base, exp: undefined }, { ...base, sub: "" }, { ...base, jti: "" }]) {
    const claims = Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined));
    const token = sign(claims, process.env.JWT_SECRET, { algorithm: "HS256" });
    assert.throws(() => validateJSONToken(token), { status: 401 });
  }
  const wrongAlgorithm = sign(base, process.env.JWT_SECRET, { algorithm: "HS384" });
  assert.throws(() => validateJSONToken(wrongAlgorithm), { status: 401 });
});

test("caps active sessions and prunes expired records", async () => {
  const registered = await signup();
  const first = cookie(registered);
  for (let i = 0; i < 5; i++) {
    const token = createJSONToken(registered.body.user.id);
    await sessions.add(validateJSONToken(token));
  }
  await request().get("/session").set("Cookie", first).expect(401);
  assert.equal(JSON.parse(await fs.readFile(file, "utf8")).sessions.length, 5);
  const store = JSON.parse(await fs.readFile(file, "utf8"));
  store.sessions[0].expiresAt = 1;
  await fs.writeFile(file, JSON.stringify(store));
  await sessions.add(validateJSONToken(createJSONToken(registered.body.user.id)));
  assert.ok(JSON.parse(await fs.readFile(file, "utf8")).sessions.every(session => session.expiresAt > Date.now()));
});

test("keeps failed login responses generic for existing and absent accounts", async () => {
  await signup();
  const existing = await request().post("/login").send({ ...credentials, password: "wrong-password" }).expect(401);
  const absent = await request().post("/login").send({ email: "absent@example.com", password: "wrong-password" }).expect(401);
  assert.deepEqual(existing.body, absent.body);
});

test("rejects compressed request bodies before inflation", async () => {
  await request().post("/signup").set("Content-Encoding", "gzip").send({}).expect(415);
});

test("production requires an exact HTTPS origin and a signing secret", () => {
  const run = overrides => spawnSync(process.execPath, ["-e", 'require("./src/app"); const {cookieName,cookieOptions}=require("./src/config/security"); console.log(JSON.stringify({cookieName,cookieOptions}));'], {
    cwd: path.join(__dirname, "../.."), env: { ...process.env, NODE_ENV: "production", ...overrides }, encoding: "utf8",
  });
  for (const origin of ["", "*", "http://example.com", "https://example.com/path", "https://user@example.com", "null"]) {
    assert.notEqual(run({ CORS_ORIGIN: origin }).status, 0);
  }
  assert.notEqual(run({ CORS_ORIGIN: "https://gather.example.com", JWT_SECRET: "short" }).status, 0);
  const good = run({ CORS_ORIGIN: "https://gather.example.com" });
  assert.equal(good.status, 0, good.stderr);
  const config = JSON.parse(good.stdout);
  assert.equal(config.cookieName, "__Host-gather_session");
  assert.deepEqual(config.cookieOptions, { httpOnly: true, secure: true, sameSite: "strict", path: "/" });
});
