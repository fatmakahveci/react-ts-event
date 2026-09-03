const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { after, before, beforeEach, test } = require("node:test");
const request = require("supertest");

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

const app = require("../app");
const { createJSONToken } = require("../util/auth");

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

	await request(app).get("/events/missing").expect(404, {
		message: "Could not find event for id missing",
	});
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
	assert.ok(signupResponse.body.token);

	const loginResponse = await request(app)
		.post("/login")
		.send({ email: "person@example.com", password: "secret123" })
		.expect(200);
	assert.ok(loginResponse.body.token);

	await request(app)
		.post("/login")
		.send({ email: "person@example.com", password: "wrong-password" })
		.expect(422);
});

test("rejects unauthorized writes and invalid event payloads", async () => {
	await request(app).post("/events").send(validEvent).expect(401);
	await request(app)
		.post("/events")
		.set("Authorization", "Bearer invalid-token")
		.send(validEvent)
		.expect(401);

	const token = createJSONToken("person@example.com");
	const response = await request(app)
		.post("/events")
		.set("Authorization", `Bearer ${token}`)
		.send({ ...validEvent, title: "", date: "not-a-date", image: "local.jpg" })
		.expect(422);
	assert.deepEqual(Object.keys(response.body.errors).sort(), [
		"date",
		"image",
		"title",
	]);
});

test("creates, updates, and deletes an authenticated event", async () => {
	const token = createJSONToken("person@example.com");
	const authorization = { Authorization: `Bearer ${token}` };

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
