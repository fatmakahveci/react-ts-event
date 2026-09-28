const production = process.env.NODE_ENV === "production";
const configuredOrigin = process.env.CORS_ORIGIN || (production ? "" : "http://localhost:5173");
let origin;
try {
  const url = new URL(configuredOrigin);
  if (!["http:", "https:"].includes(url.protocol) || url.origin !== configuredOrigin ||
      (production && url.protocol !== "https:")) throw new Error();
  origin = url.origin;
} catch {
  throw new Error("CORS_ORIGIN must be an exact HTTP(S) origin, using HTTPS in production.");
}

const cookieName = production ? "__Host-gather_session" : "gather_session";
// The __Host- prefix requires Secure, Path=/, and no Domain attribute.
const cookieOptions = { httpOnly: true, secure: production, sameSite: "strict", path: "/" };
module.exports = { production, origin, cookieName, cookieOptions };
