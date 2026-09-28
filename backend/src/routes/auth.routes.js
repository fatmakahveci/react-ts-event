const express = require("express");
const { add, get, normalizeEmail } = require("../repositories/user.repository");
const { isValidPassword } = require("../services/auth.service");
const { startSession, endSession } = require("../services/session.service");
const { checkAuth } = require("../middleware/auth.middleware");
const { isValidEmail, isValidText } = require("../lib/validation");
const { createRateLimit } = require("../middleware/rate-limit.middleware");
const router = express.Router();
const limit = createRateLimit();
// bcrypt truncates after 72 bytes; count UTF-8 bytes so longer passwords are not silently shortened.
const validPassword = value => isValidText(value, 8) && Buffer.byteLength(value, "utf8") <= 72;
// A cost-12 hash makes missing-account login attempts do the same password work.
const dummyPassword = "$2b$12$zrcJByqaWkhSVYioVS7Wi.4A75spcfI6LtmuJqDS9j08a24s7ZnVi";

router.post("/signup", limit, async (req, res, next) => {
  const email = normalizeEmail(req.body.email);
  const errors = {};
  if (!isValidEmail(email)) errors.email = "Enter a valid email address.";
  if (!validPassword(req.body.password)) errors.password = "Use at least 8 characters and at most 72 UTF-8 bytes.";
  if (Object.keys(errors).length) return res.status(422).json({ message: "Please check your details.", errors });
  try {
    const user = await add({ email, password: req.body.password });
    res.status(201).json({ message: "Account created.", ...await startSession(req, res, user) });
  } catch (error) { next(error); }
});
router.post("/login", limit, async (req, res, next) => {
  const email = normalizeEmail(req.body.email);
  const password = req.body.password;
  const invalid = () => res.status(401).json({ message: "Invalid email or password." });
  if (!isValidEmail(email) || !isValidText(password) || Buffer.byteLength(password, "utf8") > 72) return invalid();
  try {
    const user = await get(email).catch(error => { if (error.status === 404) return null; throw error; });
    const matches = await isValidPassword(password, user?.password || dummyPassword);
    if (!user || !matches) return invalid();
    res.json(await startSession(req, res, user));
  } catch (error) {
    next(error);
  }
});
router.get("/session", checkAuth, (req, res) => res.json({ user: req.user, expiresAt: req.token.exp * 1000 }));
router.post("/logout", async (req, res, next) => {
  try { await endSession(req, res); res.sendStatus(204); }
  catch (error) { next(error); }
});
module.exports = router;
