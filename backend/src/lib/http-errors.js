class HttpError extends Error {
  constructor(status, message, errors) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.errors = errors;
  }
}
class NotFoundError extends HttpError {
  constructor(message = "Resource not found.") { super(404, message); }
}
class NotAuthError extends HttpError {
  constructor(message = "Not authenticated.") { super(401, message); }
}
module.exports = { HttpError, NotFoundError, NotAuthError };
