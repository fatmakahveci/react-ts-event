const ipaddr = require("ipaddr.js");

function clientKey(req) {
  try {
    // Dual-stack sockets can report IPv4 clients as IPv4-mapped IPv6 addresses.
    const address = ipaddr.process(req.ip);
    // Group IPv6 by /56 so rotating addresses within an allocation does not reset the budget.
    return address.kind() === "ipv6"
      ? `ipv6:${Buffer.from(address.toByteArray().slice(0, 7)).toString("hex")}`
      : `ipv4:${address.toString()}`;
  } catch { return "unknown"; }
}

function createRateLimit({ limit = 30, windowMs = 15 * 60 * 1000, now = Date.now, keyGenerator = clientKey } = {}) {
  const clients = new Map();
  return (req, res, next) => {
    const time = now();
    for (const [key, bucket] of clients) if (bucket.reset <= time) clients.delete(key);
    const key = keyGenerator(req);
    let bucket = clients.get(key);
    if (!bucket) {
      // Bound memory without allowing an attacker to evict another client's limit.
      if (clients.size >= 10000) return res.status(429).set("Retry-After", "60").json({ message: "Please try again later.", requestId: req.requestId });
      bucket = { count: 0, reset: time + windowMs };
      clients.set(key, bucket);
    }
    if (++bucket.count > limit) {
      return res.status(429).set("Retry-After", String(Math.ceil((bucket.reset - time) / 1000)))
        .json({ message: "Too many attempts. Please try again later.", requestId: req.requestId });
    }
    next();
  };
}
module.exports = { createRateLimit };
