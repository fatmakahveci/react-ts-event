const express = require("express");
const { updateData } = require("../storage/json-store");
const { normalizeEmail } = require("../repositories/user.repository");
const { isValidEmail } = require("../lib/validation");
const { createRateLimit } = require("../middleware/rate-limit.middleware");
const router = express.Router();
router.post("/", createRateLimit({ limit: 10 }), async (req, res, next) => {
  const email = normalizeEmail(req.body.email);
  if (!isValidEmail(email)) return res.status(422).json({ message: "Enter a valid email address." });
  try {
    await updateData(store => {
      const subscriptions = store.subscriptions ||= [];
      if (!subscriptions.some(entry => entry.email === email)) subscriptions.push({ email, createdAt: new Date().toISOString() });
    });
    res.json({ message: "Your subscription has been saved." });
  } catch (error) { next(error); }
});
module.exports = router;
