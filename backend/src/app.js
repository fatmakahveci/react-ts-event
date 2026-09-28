const express = require("express");
const { randomUUID } = require("node:crypto");
const { requestSecurity } = require("./middleware/request-security.middleware");
const eventRoutes = require("./routes/events.routes");
const authRoutes = require("./routes/auth.routes");
const newsletterRoutes = require("./routes/newsletter.routes");
const app = express();
app.disable("x-powered-by");
app.use((req, res, next) => {
  req.requestId = randomUUID();
  res.set({
    "X-Request-Id": req.requestId,
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "no-referrer",
    "Content-Security-Policy": "default-src 'none'; frame-ancestors 'none'",
    "Cache-Control": "no-store",
  });
  next();
});
app.use(requestSecurity);
app.use(express.json({ limit: "100kb", inflate: false }));
app.use((req, res, next) => {
  if (["POST", "PATCH"].includes(req.method) && (!req.body || Array.isArray(req.body) || typeof req.body !== "object")) {
    return res.status(400).json({ message: "Send a JSON object.", requestId: req.requestId });
  }
  next();
});
app.get("/health", (req, res) => res.json({ status: "ok" }));
app.use(authRoutes);
app.use("/events", eventRoutes);
app.use("/newsletter", newsletterRoutes);
app.use((req, res) => res.status(404).json({ message: "Endpoint not found.", requestId: req.requestId }));
app.use((error, req, res, next) => {
  const status = error.status >= 400 && error.status <= 599 ? error.status : 500;
  const message = status >= 500 ? "Something went wrong. Please try again." : error.type === "entity.parse.failed" ? "Invalid JSON body." : error.message;
  res.status(status).json({ message, ...(error.errors && status < 500 ? { errors: error.errors } : {}), requestId: req.requestId });
});
module.exports = app;
