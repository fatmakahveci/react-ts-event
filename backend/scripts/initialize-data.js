const fs = require("node:fs/promises");
const path = require("node:path");
const { getDataFile } = require("../src/storage/json-store");

async function initialize() {
  const file = getDataFile();
  await fs.mkdir(path.dirname(file), { recursive: true, mode: 0o700 });
  const seed = await fs.readFile(path.join(__dirname, "../storage/application-data.example.json"));
  try {
    // Exclusive creation protects existing data even if two setup processes run together.
    await fs.writeFile(file, seed, { flag: "wx", mode: 0o600 });
    console.log("Initialized the local application data file.");
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    console.log("Existing application data preserved.");
  }
}
initialize().catch(() => { console.error("Could not initialize application data. Check its path and permissions."); process.exitCode = 1; });
