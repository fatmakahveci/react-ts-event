const { sign, verify } = require("jsonwebtoken");
const { compare } = require("bcryptjs");

const { randomBytes, randomUUID } = require("node:crypto");
const { NotAuthError } = require("../lib/http-errors");
if (process.env.NODE_ENV === "production" && (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)) {
  throw new Error("JWT_SECRET must contain at least 32 characters in production.");
}
const KEY = process.env.JWT_SECRET || randomBytes(32).toString("hex");

function createJSONToken(userId) {
	return sign({}, KEY, { expiresIn: "1h", subject: userId, jwtid: randomUUID(),
    issuer: "gather-api", audience: "gather-browser", algorithm: "HS256" });
}

function validateJSONToken(token) {
	try {
    const claims = verify(token, KEY, { algorithms: ["HS256"], issuer: "gather-api", audience: "gather-browser", maxAge: "1h" });
    // Signature verification is not enough: stateless legacy tokens lack required session claims.
    if (typeof claims.sub !== "string" || !claims.sub || typeof claims.jti !== "string" || !claims.jti ||
        !Number.isFinite(claims.exp) || !Number.isFinite(claims.iat)) throw new Error();
    return claims;
  } catch { throw new NotAuthError(); }
}

function isValidPassword(password, storedPassword) {
	return compare(password, storedPassword);
}

exports.createJSONToken = createJSONToken;
exports.validateJSONToken = validateJSONToken;
exports.isValidPassword = isValidPassword;
