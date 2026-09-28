const { cookieName, cookieOptions } = require("../config/security");
const { createJSONToken, validateJSONToken } = require("./auth.service");
const repository = require("../repositories/session.repository");

function readSessionToken(req) {
  const matches = (req.headers.cookie || "").split(";").map(part => part.trim())
    .filter(part => part.startsWith(`${cookieName}=`));
  // Reject duplicate cookies rather than guessing which credential the browser intended.
  if (matches.length !== 1) return null;
  const token = matches[0].slice(cookieName.length + 1);
  return token && token.length <= 2048 ? token : null;
}
function optionalClaims(req) {
  try { return validateJSONToken(readSessionToken(req)); }
  catch { return null; }
}
async function startSession(req, res, user) {
  const token = createJSONToken(user.id);
  const claims = validateJSONToken(token);
  // Persist the new session and revoke the previous one before issuing the cookie.
  await repository.add(claims, optionalClaims(req)?.jti);
  res.cookie(cookieName, token, { ...cookieOptions, maxAge: 3600000 });
  return { user: { id: user.id, email: user.email }, expiresAt: claims.exp * 1000 };
}
async function endSession(req, res) {
  const claims = optionalClaims(req);
  // If revocation fails, report the failure instead of presenting logout as successful.
  if (claims) await repository.remove(claims.jti);
  res.clearCookie(cookieName, cookieOptions);
}
module.exports = { readSessionToken, startSession, endSession };
