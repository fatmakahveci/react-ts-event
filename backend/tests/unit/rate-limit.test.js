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
