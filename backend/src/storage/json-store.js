const fs = require("node:fs/promises");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

function getDataFile() {
  return process.env.EVENTS_DATA_FILE || path.join(__dirname, "..", "..", "storage", "application-data.json");
}
async function readFile(file) {
  const data = JSON.parse(await fs.readFile(file, "utf8"));
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("Invalid data store.");
  return data;
}
async function readData() { return readFile(getDataFile()); }
const queues = new Map();

// Serialize the whole read/modify/write operation within one API process.
function updateData(update) {
  const file = getDataFile();
  const previous = queues.get(file) || Promise.resolve();
  // A failed write must not block later writes; its own caller still receives the rejection.
  const operation = previous.catch(() => {}).then(async () => {
    const data = await readFile(file);
    const result = await update(data);
    const temporary = `${file}.${randomUUID()}.tmp`;
    try {
      // Keep the temporary file on the same filesystem so rename replaces it atomically.
      // Readers see either the old file or the complete new file, never a partial write.
      await fs.writeFile(temporary, JSON.stringify(data, null, 2) + "\n", { mode: 0o600, flag: "wx" });
      await fs.rename(temporary, file);
    } finally {
      await fs.rm(temporary, { force: true });
    }
    return result;
  });
  queues.set(file, operation);
  // An older operation may finish after a newer one has joined this queue.
  const cleanup = () => { if (queues.get(file) === operation) queues.delete(file); };
  operation.then(cleanup, cleanup);
  return operation;
}
module.exports = { getDataFile, readData, updateData };
