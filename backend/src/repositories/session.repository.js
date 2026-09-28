const { createHash } = require("node:crypto");
const { readData, updateData } = require("../storage/json-store");
const { NotAuthError } = require("../lib/http-errors");
const digest = id => createHash("sha256").update(id).digest("hex");

async function add(claims, previousId) {
  return updateData(store => {
    if (!(store.users || []).some(user => user.id === claims.sub)) throw new NotAuthError();
    const now = Date.now();
    const previous = previousId ? digest(previousId) : null;
    store.sessions = (store.sessions || []).filter(session => session.expiresAt > now && session.id !== previous);
    // Keep at most five active sessions for each account, oldest first.
    const own = store.sessions.filter(session => session.userId === claims.sub);
    const evicted = new Set(own.slice(0, Math.max(0, own.length - 4)).map(session => session.id));
    store.sessions = store.sessions.filter(session => !evicted.has(session.id));
    store.sessions.push({ id: digest(claims.jti), userId: claims.sub, expiresAt: claims.exp * 1000 });
  });
}
async function getUser(claims) {
  const store = await readData();
  // A valid signature alone cannot detect logout or a deleted account.
  const active = (store.sessions || []).some(session => session.id === digest(claims.jti) &&
    session.userId === claims.sub && session.expiresAt > Date.now());
  const user = active && (store.users || []).find(user => user.id === claims.sub);
  if (!user) throw new NotAuthError();
  return { id: user.id, email: user.email };
}
async function remove(id) {
  return updateData(store => {
    const hash = digest(id);
    store.sessions = (store.sessions || []).filter(session => session.id !== hash && session.expiresAt > Date.now());
  });
}
module.exports = { add, getUser, remove };
