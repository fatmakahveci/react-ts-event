const { after, before, test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const supertest = require("supertest");
const app = require("../../src/app");
const { createJSONToken, validateJSONToken } = require("../../src/services/auth.service");
const sessions = require("../../src/repositories/session.repository");
let directory, file;
const request = () => supertest.agent(app).set("X-Gather-CSRF", "1");
const event = { title: "Local test", description: "Synthetic data", date: "2030-01-01", image: "https://example.com/event.jpg" };

before(async () => {
  directory = await fs.mkdtemp(path.join(os.tmpdir(), "gather-write-limits-"));
  file = path.join(directory, "store.json");
  process.env.EVENTS_DATA_FILE = file;
  await fs.writeFile(file, JSON.stringify({ events: [], users: ["first", "second", "third"].map(id => ({ id, email: `${id}@example.com` })) }));
});
after(async () => { delete process.env.EVENTS_DATA_FILE; await fs.rm(directory, { recursive: true, force: true }); });

async function authenticate(id) {
  const token = createJSONToken(id);
  await sessions.add(validateJSONToken(token));
  return `gather_session=${token}`;
}

test("event writes share account and IP budgets across methods and sessions", async () => {
  const first = await authenticate("first");
  const anotherSession = await authenticate("first");
  const second = await authenticate("second");
  const third = await authenticate("third");
  const created = [];
  for (let i = 0; i < 20; i++) {
    const response = await request().post("/events").set("Cookie", first).send(event).expect(201);
    created.push(response.body.event.id);
  }
  const endpoint = `/events/${created[0]}`;
  for (let i = 0; i < 5; i++) await request().patch(endpoint).set("Cookie", first).send(event).expect(200);
  for (const id of created.slice(1, 6)) await request().delete(`/events/${id}`).set("Cookie", first).expect(200);
  const before = await fs.readFile(file, "utf8");
  for (const cookie of [first, anotherSession]) {
    for (const method of ["post", "patch", "delete"]) {
      const response = await request()[method](method === "post" ? "/events" : endpoint)
        .set("Cookie", cookie).send(event).expect(429);
      assert.ok(Number(response.headers["retry-after"]) > 0);
      assert.equal(response.body.requestId, response.headers["x-request-id"]);
    }
  }
  assert.equal(await fs.readFile(file, "utf8"), before);

  // A different account still has its own allowance, but cannot bypass the shared IP limit.
  for (let i = 0; i < 24; i++) await request().post("/events").set("Cookie", second).send(event).expect(201);
  const atLimit = await fs.readFile(file, "utf8");
  await request().post("/events").set("Cookie", third).set("X-Forwarded-For", "203.0.113.7").send(event).expect(429);
  assert.equal(await fs.readFile(file, "utf8"), atLimit);
  await request().get("/events").expect(200);
  await request().get(endpoint).expect(200);
  await request().get("/session").set("Cookie", first).expect(200);
});

test("logout has a separate limit and revoked-cookie spam stops before storage", async () => {
  const cookie = await authenticate("third");
  for (let i = 0; i < 30; i++) await request().post("/logout").set("Cookie", cookie).send({}).expect(204);
  const before = await fs.stat(file);
  await request().post("/logout").set("Cookie", cookie).send({}).expect(429);
  const after = await fs.stat(file);
  assert.equal(after.ino, before.ino);
  assert.equal(after.mtimeMs, before.mtimeMs);
  await request().get("/session").set("Cookie", cookie).expect(401);
});
