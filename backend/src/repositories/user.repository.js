const { hash } = require("bcryptjs");
const { randomUUID } = require("node:crypto");
const { HttpError, NotFoundError } = require("../lib/http-errors");
const { readData, updateData } = require("../storage/json-store");
const normalizeEmail = email => typeof email === "string" ? email.trim().toLowerCase() : "";

async function add({ email, password }) {
  email = normalizeEmail(email);
  // Hash outside the write queue so password work does not hold up unrelated data changes.
  const hashedPassword = await hash(password, 12);
  return updateData(store => {
    const users = store.users ||= [];
    // Keep this check inside the mutation: simultaneous signups can use the same email.
    if (users.some(user => normalizeEmail(user.email) === email)) {
      throw new HttpError(422, "Please check your details.", { email: "An account with this email already exists." });
    }
    const user = { id: randomUUID(), email, password: hashedPassword };
    users.push(user);
    return { id: user.id, email: user.email };
  });
}
async function get(email) {
  const user = ((await readData()).users || []).find(user => normalizeEmail(user.email) === normalizeEmail(email));
  if (!user) throw new NotFoundError("User not found.");
  return user;
}
module.exports = { add, get, normalizeEmail };
