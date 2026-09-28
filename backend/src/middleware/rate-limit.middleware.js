function createRateLimit({ limit = 30, windowMs = 15 * 60 * 1000, now = Date.now } = {}) {
  const clients = new Map();
  return (req, res, next) => {
    const time = now();
    for (const [key, bucket] of clients) if (bucket.reset <= time) clients.delete(key);
    const key = req.ip;
    let bucket = clients.get(key);
    if (!bucket) {
      // Bound memory without allowing an attacker to evict another client's limit.
      if (clients.size >= 10000) return res.status(429).set("Retry-After", "60").json({ message: "Please try again later." });
      bucket = { count: 0, reset: time + windowMs };
      clients.set(key, bucket);
    }
    if (++bucket.count > limit) {
      return res.status(429).set("Retry-After", String(Math.ceil((bucket.reset - time) / 1000)))
        .json({ message: "Too many attempts. Please try again later." });
    }
    next();
  };
}
module.exports = { createRateLimit };
