const { origin, production } = require("../config/security");

function requestSecurity(req, res, next) {
  if (production) res.set("Strict-Transport-Security", "max-age=31536000");
  const requestOrigin = req.get("Origin");
  res.vary("Origin");
  // Reject hostile origins before parsing request bodies or running route handlers.
  if (requestOrigin && requestOrigin !== origin) {
    return res.status(403).json({ message: "Origin not allowed.", requestId: req.requestId });
  }
  if (requestOrigin === origin) {
    res.set({
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,X-Gather-CSRF",
      "Access-Control-Expose-Headers": "X-Request-Id,Retry-After",
    });
  }
  if (req.method === "OPTIONS") return res.sendStatus(204);
  // Custom headers cannot be sent by HTML forms and force a CORS preflight.
  // Non-browser clients may omit Origin, but must still supply this header.
  if (!["GET", "HEAD"].includes(req.method) && req.get("X-Gather-CSRF") !== "1") {
    return res.status(403).json({ message: "Missing CSRF protection header.", requestId: req.requestId });
  }
  next();
}
module.exports = { requestSecurity };
