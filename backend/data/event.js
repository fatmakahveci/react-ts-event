const { v4: generateId } = require("uuid");

const { NotFoundError } = require("../util/errors");
const { readData, writeData } = require("./util");

async function getAll() {
	const storedData = await readData();
	if (!storedData.events) {
		throw new NotFoundError("Could not find any events.");
	}
	return storedData.events;
}

async function get(id) {
	const storedData = await readData();
	if (!storedData.events || storedData.events.length === 0) {
		throw new NotFoundError("Could not find any events.");
	}

	const event = storedData.events.find((ev) => ev.id === id);
	if (!event) {
		throw new NotFoundError("Could not find event for id " + id);
	}

	return event;
}

async function add(data) {
	const storedData = await readData();
	const event = { ...data, id: generateId() };
	storedData.events.unshift(event);
	await writeData(storedData);
	return event;
}

async function replace(id, data) {
	const storedData = await readData();
	if (!storedData.events || storedData.events.length === 0) {
		throw new NotFoundError("Could not find any events.");
	}

	const index = storedData.events.findIndex((ev) => ev.id === id);
	if (index < 0) {
		throw new NotFoundError("Could not find event for id " + id);
	}

	storedData.events[index] = { ...data, id };

	await writeData(storedData);
}

async function remove(id) {
	const storedData = await readData();
	const eventExists = storedData.events.some((event) => event.id === id);
	if (!eventExists) {
		throw new NotFoundError("Could not find event for id " + id);
	}
	const updatedData = storedData.events.filter((ev) => ev.id !== id);
	await writeData({ ...storedData, events: updatedData });
}

exports.getAll = getAll;
exports.get = get;
exports.add = add;
exports.replace = replace;
exports.remove = remove;
