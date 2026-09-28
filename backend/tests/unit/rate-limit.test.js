const { test } = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const request = require("supertest");
const { createRateLimit } = require("../../src/middleware/rate-limit.middleware");

test("limits attempts, supplies retry time, and resets after the window", async () => {
  let time = 1000;
  const app = express();
  app.use(createRateLimit({ limit: 2, windowMs: 10000, now: () => time }));
  app.get("/", (req, res) => res.json({ ok: true }));
  await request(app).get("/").expect(200);
  await request(app).get("/").expect(200);
  const limited = await request(app).get("/").expect(429);
  assert.equal(limited.headers["retry-after"], "10");
  time += 10001;
  await request(app).get("/").expect(200);
});

function attempt(limiter, ip, userId) {
  const response = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    set() { return this; },
    json() { return this; },
  };
  limiter({ ip, user: { id: userId } }, response, () => {});
  return response.statusCode;
}

test("IPv6 clients cannot reset limits by rotating addresses within a /56", () => {
  const limit = createRateLimit({ limit: 1 });
  assert.equal(attempt(limit, "2001:db8:1234:5600::1"), 200);
  assert.equal(attempt(limit, "2001:db8:1234:56ff:ffff::2"), 429);
  assert.equal(attempt(limit, "2001:0db8:1234:5600:0000:0000:0000:0001"), 429);
  assert.equal(attempt(limit, "2001:db8:1234:5700::1"), 200);
});

test("IPv4 and its mapped IPv6 representation share one budget", () => {
  const limit = createRateLimit({ limit: 1 });
  assert.equal(attempt(limit, "192.0.2.1"), 200);
  assert.equal(attempt(limit, "::ffff:192.0.2.1"), 429);
  assert.equal(attempt(limit, "::ffff:c000:201"), 429);
  assert.equal(attempt(limit, "192.0.2.2"), 200);
});

test("unknown client addresses share a fallback budget", () => {
  const limit = createRateLimit({ limit: 1 });
  assert.equal(attempt(limit, undefined), 200);
  assert.equal(attempt(limit, "invalid"), 429);
});

test("account budgets survive IP changes without blocking another account", () => {
  const limit = createRateLimit({ limit: 1, keyGenerator: req => req.user.id });
  assert.equal(attempt(limit, "192.0.2.1", "organizer"), 200);
  assert.equal(attempt(limit, "198.51.100.1", "organizer"), 429);
  assert.equal(attempt(limit, "192.0.2.1", "other"), 200);
});
