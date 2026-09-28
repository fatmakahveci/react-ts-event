const { validateJSONToken } = require("../services/auth.service");
const { readSessionToken } = require("../services/session.service");
const { getUser } = require("../repositories/session.repository");

async function checkAuthMiddleware(req, res, next) {
  try {
    req.token = validateJSONToken(readSessionToken(req));
    req.user = await getUser(req.token);
    next();
  } catch (error) { next(error); }
}

exports.checkAuth = checkAuthMiddleware;
