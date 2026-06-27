// src/middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verifies the JWT in the Authorization header and attaches req.user.
// This is what makes login sessions survive a refresh — the frontend stores
// this token and sends it on every request instead of re-logging-in.
async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Not signed in." });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ error: "Account no longer exists." });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Session expired — please sign in again." });
  }
}

// Usage: requireRole('owner') — restricts a route to owners only.
// Staff accounts get a clear 403 instead of silently failing.
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "You don't have permission to do that — ask the owner." });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
