// src/routes/auth.js
const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { requireAuth, requireRole } = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "30d",
  });
}

// POST /api/auth/bootstrap-owner
// One-time setup: creates the very first OWNER account. Requires BOOTSTRAP_KEY
// from .env so a stranger can't create themselves an owner account on your
// deployed server. Refuses if an owner already exists — use "create staff"
// (owner-only) or a normal password reset flow after that.
router.post("/bootstrap-owner", asyncHandler(async (req, res) => {
  const { name, email, password, bootstrapKey, shop } = req.body || {};
  if (bootstrapKey !== process.env.BOOTSTRAP_KEY) {
    return res.status(403).json({ error: "Invalid bootstrap key." });
  }
  const existingOwner = await User.findOne({ role: "owner" });
  if (existingOwner) {
    return res.status(409).json({ error: "An owner account already exists." });
  }
  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email and password are required." });
  }
  const user = new User({ name, email, role: "owner", shop: shop || "Ram Reddy Chicken Center" });
  await user.setPassword(password);
  try {
    await user.save();
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: "That email is already in use." });
    throw err;
  }
  res.status(201).json({ token: signToken(user), user });
}));

// POST /api/auth/login
router.post("/login", asyncHandler(async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "email and password are required." });

  const user = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (!user || !(await user.checkPassword(password))) {
    return res.status(401).json({ error: "Incorrect email or password." });
  }
  res.json({ token: signToken(user), user });
}));

// GET /api/auth/me — used on app load to validate the stored token and
// fetch fresh profile/role info (in case it changed since the token issued).
router.get("/me", requireAuth, (req, res) => {
  res.json({ user: req.user });
});

// POST /api/auth/staff — owner-only: create a staff login.
router.post("/staff", requireAuth, requireRole("owner"), asyncHandler(async (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ error: "name, email and password are required." });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters." });
  }
  const exists = await User.findOne({ email: String(email).toLowerCase().trim() });
  if (exists) return res.status(409).json({ error: "That email is already in use." });

  const user = new User({ name, email, role: "staff", shop: req.user.shop, createdBy: req.user._id });
  await user.setPassword(password);
  try {
    await user.save();
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: "That email is already in use." });
    throw err;
  }
  res.status(201).json({ user });
}));

// GET /api/auth/staff — owner-only: list staff accounts.
router.get("/staff", requireAuth, requireRole("owner"), asyncHandler(async (_req, res) => {
  const staff = await User.find({ role: "staff" }).sort({ createdAt: -1 });
  res.json({ staff });
}));

// DELETE /api/auth/staff/:id — owner-only: revoke a staff account.
router.delete("/staff/:id", requireAuth, requireRole("owner"), asyncHandler(async (req, res) => {
  const target = await User.findById(req.params.id);
  if (!target || target.role !== "staff") return res.status(404).json({ error: "Staff account not found." });
  await target.deleteOne();
  res.json({ ok: true });
}));

module.exports = router;
