const { randomUUID } = require("node:crypto");
const { HttpError, NotFoundError } = require("../lib/http-errors");
const { readData, updateData } = require("../storage/json-store");

async function getAll() { return (await readData()).events || []; }
async function get(id) {
  const event = (await getAll()).find(event => event.id === id);
  if (!event) throw new NotFoundError("Could not find event for id " + id);
  return event;
}
function editableEvent(data, id, ownerId) {
  const index = (data.events || []).findIndex(event => event.id === id);
  if (index < 0) throw new NotFoundError("Could not find event for id " + id);
  // Ownerless legacy events stay read-only until an operator verifies their ownership.
  if (!ownerId || data.events[index].ownerId !== ownerId) {
    throw new HttpError(403, "Only the event organizer can change this event.");
  }
  return index;
}
async function add(data, ownerId) {
  return updateData(store => {
    const event = { ...data, id: randomUUID(), ownerId };
    (store.events ||= []).unshift(event);
    return event;
  });
}
async function replace(id, data, ownerId) {
  return updateData(store => {
    const index = editableEvent(store, id, ownerId);
    store.events[index] = { ...data, id, ownerId };
    return store.events[index];
  });
}
async function remove(id, ownerId) {
  return updateData(store => { store.events.splice(editableEvent(store, id, ownerId), 1); });
}
module.exports = { getAll, get, add, replace, remove };
