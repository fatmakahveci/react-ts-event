const express = require("express");
const repository = require("../repositories/event.repository");
const { checkAuth } = require("../middleware/auth.middleware");
const { isValidText, isValidDate, isValidImageUrl } = require("../lib/validation");
const router = express.Router();
router.get("/", async (req, res, next) => {
  try { res.json({ events: await repository.getAll() }); } catch (error) { next(error); }
});
router.get("/:id", async (req, res, next) => {
  try { res.json({ event: await repository.get(req.params.id) }); } catch (error) { next(error); }
});
router.use(checkAuth);
function validateEvent(req, res, next) {
  const payload = Object.fromEntries(["title", "description", "date", "image"].map(key => [key, typeof req.body[key] === "string" ? req.body[key].trim() : req.body[key]]));
  const errors = {};
  if (!isValidText(payload.title, 1, 160)) errors.title = "Use a title between 1 and 160 characters.";
  if (!isValidText(payload.description, 1, 10000)) errors.description = "Use a description between 1 and 10,000 characters.";
  if (!isValidDate(payload.date)) errors.date = "Choose a valid calendar date.";
  if (!isValidImageUrl(payload.image)) errors.image = "Enter an HTTP or HTTPS image URL without credentials (up to 2,048 characters).";
  if (Object.keys(errors).length) return res.status(422).json({ message: "Please check your event details.", errors });
  req.eventData = payload;
  next();
}
router.post("/", validateEvent, async (req, res, next) => {
  try { res.status(201).json({ message: "Event saved.", event: await repository.add(req.eventData, req.token.sub) }); }
  catch (error) { next(error); }
});
router.patch("/:id", validateEvent, async (req, res, next) => {
  try { res.json({ message: "Event updated.", event: await repository.replace(req.params.id, req.eventData, req.token.sub) }); }
  catch (error) { next(error); }
});
router.delete("/:id", async (req, res, next) => {
  try { await repository.remove(req.params.id, req.token.sub); res.json({ message: "Event deleted." }); }
  catch (error) { next(error); }
});
module.exports = router;
