const fs = require("node:fs/promises");
const path = require("node:path");

function getDataFile() {
	return process.env.EVENTS_DATA_FILE || path.join(__dirname, "..", "events.json");
}

async function readData() {
	const data = await fs.readFile(getDataFile(), "utf8");
	return JSON.parse(data);
}

async function writeData(data) {
	await fs.writeFile(getDataFile(), JSON.stringify(data));
}

exports.readData = readData;
exports.writeData = writeData;
