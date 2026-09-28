const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const os = require("node:os");
const { spawnSync } = require("node:child_process");

test("initializes private data without overwriting an existing store", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "gather-init-"));
  const file = path.join(directory, "private", "data.json");
  const initialize = () => spawnSync(process.execPath, ["scripts/initialize-data.js"], {
    cwd: path.join(__dirname, "../.."), env: { ...process.env, EVENTS_DATA_FILE: file }, encoding: "utf8",
  });
  try {
    const created = initialize();
    assert.equal(created.status, 0, created.stderr);
    const data = JSON.parse(await fs.readFile(file, "utf8"));
    assert.deepEqual(data, { events: [], users: [], sessions: [], subscriptions: [] });
    if (process.platform !== "win32") assert.equal((await fs.stat(file)).mode & 0o777, 0o600);
    const original = JSON.stringify({ events: [{ id: "preserve-me" }], users: [] });
    await fs.writeFile(file, original);
    assert.equal(initialize().status, 0);
    assert.equal(await fs.readFile(file, "utf8"), original);
  } finally { await fs.rm(directory, { recursive: true, force: true }); }
});
