const { after, before, test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const request = require("supertest");
const app = require("../../src/app");
let directory;
let file;

before(async () => {
  directory = await fs.mkdtemp(path.join(os.tmpdir(), "gather-throttling-"));
  file = path.join(directory, "data.json");
  process.env.EVENTS_DATA_FILE = file;
  await fs.writeFile(file, JSON.stringify({ users: [], events: [] }));
});
after(async () => { delete process.env.EVENTS_DATA_FILE; await fs.rm(directory, { recursive: true, force: true }); });

test("login and signup share an IP budget that forwarded headers cannot bypass", async () => {
  for (let attempt = 0; attempt < 30; attempt++) {
    const signup = attempt % 2 === 0;
    await request(app).post(signup ? "/signup" : "/login").set("X-Gather-CSRF", "1")
      .send({ email: "invalid", password: "short" }).expect(signup ? 422 : 401);
  }
  for (const endpoint of ["/login", "/signup"]) {
    const blocked = await request(app).post(endpoint).set("X-Gather-CSRF", "1")
      .set("X-Forwarded-For", "203.0.113.99").send({ email: "new@example.com", password: "ValidPassword123!" }).expect(429);
    const retry = Number(blocked.headers["retry-after"]);
    assert.ok(retry > 0 && retry <= 900);
  }
  assert.equal(JSON.parse(await fs.readFile(file, "utf8")).users.length, 0);
  await request(app).get("/events").expect(200);
});

test("newsletter has its own budget and blocked submissions do not reach storage", async () => {
  for (let attempt = 0; attempt < 10; attempt++) {
    await request(app).post("/newsletter").set("X-Gather-CSRF", "1")
      .send({ email: `reader-${attempt}@example.com` }).expect(200);
  }
  await request(app).post("/newsletter").set("X-Gather-CSRF", "1")
    .send({ email: "blocked@example.com" }).expect(429);
  const { subscriptions } = JSON.parse(await fs.readFile(file, "utf8"));
  assert.equal(subscriptions.length, 10);
  assert.ok(!subscriptions.some(entry => entry.email === "blocked@example.com"));
});
