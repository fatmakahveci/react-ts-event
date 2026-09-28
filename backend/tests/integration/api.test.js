const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { after, before, beforeEach, test } = require("node:test");
const supertest = require("supertest");
const request = app => supertest.agent(app).set("X-Gather-CSRF", "1");

let dataFile;
let tempDirectory;

before(async () => {
	tempDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "event-api-"));
	dataFile = path.join(tempDirectory, "events.json");
	process.env.EVENTS_DATA_FILE = dataFile;
});

beforeEach(async () => {
	await fs.writeFile(
		dataFile,
		JSON.stringify({
			events: [
				{
					id: "event-1",
					title: "React Summit",
					description: "A community conference",
					date: "2030-06-15",
					image: "https://example.com/event.jpg",
				},
			],
			users: [],
		})
	);
});

after(async () => {
	delete process.env.EVENTS_DATA_FILE;
	await fs.rm(tempDirectory, { recursive: true, force: true });
});

const app = require("../../src/app");
const { createJSONToken, validateJSONToken } = require("../../src/services/auth.service");
const sessions = require("../../src/repositories/session.repository");
const { updateData } = require("../../src/storage/json-store");
async function authenticated(userId = "user-1") {
  await updateData(store => { store.users.push({ id: userId, email: `${userId}@example.com` }); });
  const token = createJSONToken(userId);
  await sessions.add(validateJSONToken(token));
  return `gather_session=${token}`;
}

const validEvent = {
	title: "TypeScript Workshop",
	description: "Learn practical TypeScript patterns",
	date: "2030-07-20",
	image: "https://example.com/typescript.jpg",
};

test("serves event collections and event details", async () => {
	const listResponse = await request(app).get("/events").expect(200);
	assert.equal(listResponse.body.events.length, 1);
	assert.equal(listResponse.body.events[0].title, "React Summit");

	const detailResponse = await request(app).get("/events/event-1").expect(200);
	assert.equal(detailResponse.body.event.id, "event-1");

	const missing = await request(app).get("/events/missing").expect(404);
  assert.equal(missing.body.message, "Could not find event for id missing");
  assert.equal(missing.body.requestId, missing.headers["x-request-id"]);
});

test("validates signup and authenticates registered users", async () => {
	const invalidResponse = await request(app)
		.post("/signup")
		.send({ email: "invalid", password: "short" })
		.expect(422);
	assert.deepEqual(Object.keys(invalidResponse.body.errors).sort(), [
		"email",
		"password",
	]);

	const signupResponse = await request(app)
		.post("/signup")
		.send({ email: "person@example.com", password: "secret123" })
		.expect(201);
	assert.equal(signupResponse.body.user.email, "person@example.com");
	assert.equal(signupResponse.body.token, undefined);
  assert.match(signupResponse.headers["set-cookie"][0], /HttpOnly/);

	const loginResponse = await request(app)
		.post("/login")
		.send({ email: "person@example.com", password: "secret123" })
		.expect(200);
	assert.equal(loginResponse.body.token, undefined);
  assert.ok(loginResponse.body.expiresAt > Date.now());

	await request(app)
		.post("/login")
		.send({ email: "person@example.com", password: "wrong-password" })
		.expect(401);
});

test("rejects unauthorized writes and invalid event payloads", async () => {
	await request(app).post("/events").send(validEvent).expect(401);
	await request(app)
		.post("/events")
		.set("Authorization", "Bearer invalid-token")
		.send(validEvent)
		.expect(401);

	const token = await authenticated();
	const response = await request(app)
		.post("/events")
		.set("Cookie", token)
		.send({ ...validEvent, title: "", date: "not-a-date", image: "local.jpg" })
		.expect(422);
	assert.deepEqual(Object.keys(response.body.errors).sort(), [
		"date",
		"image",
		"title",
	]);
});

test("creates, updates, and deletes an authenticated event", async () => {
	const token = await authenticated();
	const authorization = { Cookie: token };

	const createResponse = await request(app)
		.post("/events")
		.set(authorization)
		.send(validEvent)
		.expect(201);
	assert.ok(createResponse.body.event.id);
	assert.equal(createResponse.body.event.title, validEvent.title);

	const eventId = createResponse.body.event.id;
	const updateResponse = await request(app)
		.patch(`/events/${eventId}`)
		.set(authorization)
		.send({ ...validEvent, title: "Advanced TypeScript Workshop" })
		.expect(200);
	assert.equal(updateResponse.body.event.title, "Advanced TypeScript Workshop");

	await request(app)
		.delete(`/events/${eventId}`)
		.set(authorization)
		.expect(200, { message: "Event deleted." });
	await request(app)
		.delete(`/events/${eventId}`)
		.set(authorization)
		.expect(404);
});

test("rejects malformed field types without crashing", async () => {
  await request(app).post("/signup").send({ email: 12, password: {} }).expect(422);
  await request(app).post("/login").send({ email: "person@example.com", password: {} }).expect(401);
  const token = await authenticated();
  for (const method of ["post", "patch"]) {
    const response = await request(app)[method](method === "post" ? "/events" : "/events/event-1")
      .set("Cookie", token)
      .send({ title: {}, description: [], date: "2030-02-30", image: "http-not-a-url" }).expect(422);
    assert.equal(Object.keys(response.body.errors).length, 4);
  }
});

test("handles browser preflight and exposes a health endpoint", async () => {
  await request(app).options("/events").expect(204);
  await request(app).get("/health").expect(200, { status: "ok" });
});

test("rejects Basic authorization", async () => {
  await request(app).post("/events")
    .set("Authorization", `Basic ${await authenticated()}`)
    .send(validEvent).expect(401);
});

test("enforces ownership, keeps legacy events read-only, and ignores forged owner fields", async () => {
  const owner = await authenticated("owner");
  const other = await authenticated("other");
  const created = await request(app).post("/events").set("Cookie", owner).send({ ...validEvent, ownerId: "other", id: "forged" }).expect(201);
  assert.equal(created.body.event.ownerId, "owner");
  assert.notEqual(created.body.event.id, "forged");
  const endpoint = `/events/${created.body.event.id}`;
  await request(app).patch(endpoint).set("Cookie", other).send(validEvent).expect(403);
  await request(app).delete(endpoint).set("Cookie", other).expect(403);
  await request(app).patch("/events/event-1").set("Cookie", owner).send(validEvent).expect(403);
  await request(app).get(endpoint).expect(200);
  await request(app).delete(endpoint).set("Cookie", owner).expect(200);
});

test("preserves every concurrent write and recovers after a rejected mutation", async () => {
  const auth = await authenticated();
  await Promise.all(Array.from({ length: 12 }, (_, index) => request(app).post("/events").set("Cookie", auth).send({ ...validEvent, title: `Event ${index}` }).expect(201)));
  await request(app).delete("/events/missing").set("Cookie", auth).expect(404);
  await request(app).post("/events").set("Cookie", auth).send(validEvent).expect(201);
  const store = JSON.parse(await fs.readFile(dataFile, "utf8"));
  assert.equal(store.events.length, 14);
  assert.equal(new Set(store.events.map(event => event.id)).size, 14);
  assert.deepEqual((await fs.readdir(tempDirectory)).filter(name => name.endsWith(".tmp")), []);
});

test("normalizes email and prevents concurrent duplicate registration", async () => {
  const responses = await Promise.all([" Reader@Example.com ", "reader@example.com"].map(email => request(app).post("/signup").send({ email, password: "secret123", role: "admin" })));
  assert.deepEqual(responses.map(response => response.status).sort(), [201, 422]);
  const stored = JSON.parse(await fs.readFile(dataFile, "utf8"));
  assert.equal(stored.users.length, 1);
  assert.equal(stored.users[0].email, "reader@example.com");
  assert.equal(stored.users[0].role, undefined);
  assert.notEqual(stored.users[0].password, "secret123");
  await request(app).post("/login").send({ email: "READER@example.com", password: "secret123" }).expect(200);
  await request(app).post("/signup").send({ email: "long@example.com", password: "a".repeat(73) }).expect(422);
});

test("validates event lengths and rejects credentials in image URLs", async () => {
  const auth = await authenticated();
  const response = await request(app).post("/events").set("Cookie", auth).send({ ...validEvent, title: "a".repeat(161), description: "a".repeat(10001), image: "https://user:password@example.com/event.jpg" }).expect(422);
  assert.deepEqual(Object.keys(response.body.errors).sort(), ["description", "image", "title"]);
  const saved = await request(app).post("/events").set("Cookie", auth).send({ ...validEvent, title: "  A gathering  " }).expect(201);
  assert.equal(saved.body.event.title, "A gathering");
});

test("returns safe JSON errors, request IDs, security headers, and no-cache responses", async () => {
  const missing = await request(app).get("/missing").expect(404);
  assert.equal(missing.body.requestId, missing.headers["x-request-id"]);
  assert.equal(missing.headers["cache-control"], "no-store");
  assert.equal(missing.headers["x-content-type-options"], "nosniff");
  assert.match(missing.headers.vary, /Origin/);
  assert.equal(missing.headers["x-powered-by"], undefined);
  const invalid = await request(app).post("/signup").set("Content-Type", "application/json").send('{"password":').expect(400);
  assert.equal(invalid.body.message, "Invalid JSON body.");
  await request(app).post("/signup").send([]).expect(400);
  await request(app).post("/signup").send({ padding: "x".repeat(110000) }).expect(413);
  const original = await fs.readFile(dataFile, "utf8");
  try {
    await fs.writeFile(dataFile, "bad-json");
    const failed = await request(app).get("/events").expect(500);
    assert.equal(failed.body.message, "Something went wrong. Please try again.");
    assert.ok(!JSON.stringify(failed.body).includes(dataFile));
  } finally { await fs.writeFile(dataFile, original); }
});

test("persists newsletter subscriptions once and validates input", async () => {
  await request(app).post("/newsletter").send({ email: "invalid" }).expect(422);
  for (const email of ["Reader@Example.com", "reader@example.com"]) {
    await request(app).post("/newsletter").send({ email }).expect(200, { message: "Your subscription has been saved." });
  }
  const store = JSON.parse(await fs.readFile(dataFile, "utf8"));
  assert.equal(store.subscriptions.length, 1);
  assert.equal(store.subscriptions[0].email, "reader@example.com");
});

test("applies bcrypt's password boundary to UTF-8 bytes without truncating", async () => {
  const password = "😀".repeat(18);
  assert.equal(Buffer.byteLength(password, "utf8"), 72);
  await request(app).post("/signup").send({ email: "unicode@example.com", password }).expect(201);
  await request(app).post("/login").send({ email: "unicode@example.com", password }).expect(200);
  await request(app).post("/login").send({ email: "unicode@example.com", password: password + "x" }).expect(401);
  const rejected = await request(app).post("/signup")
    .send({ email: "too-long@example.com", password: password + "😀" }).expect(422);
  assert.ok(rejected.body.errors.password);
  const store = JSON.parse(await fs.readFile(dataFile, "utf8"));
  assert.equal(store.users.length, 1);
  assert.notEqual(store.users[0].password, password);
});
