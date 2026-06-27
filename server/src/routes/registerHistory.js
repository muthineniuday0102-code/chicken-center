// src/routes/registerHistory.js — bird carry-forward records (count + ₹ value)
const express = require("express");
const RegisterHistory = require("../models/RegisterHistory");
const { requireAuth } = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();
router.use(requireAuth);

// GET /api/register-history — returns the whole map as { 'YYYY-MM-DD': {...} }
// to match the shape the frontend already keeps in memory.
router.get("/", asyncHandler(async (_req, res) => {
  const docs = await RegisterHistory.find();
  const map = {};
  for (const d of docs) {
    map[d.date] = {
      totalBirds: d.totalBirds,
      soldBirds: d.soldBirds,
      remaining: d.remaining,
      remainingValue: d.remainingValue,
    };
  }
  res.json({ registerHistory: map });
}));

// PUT /api/register-history/:date — upsert one day's carry-forward record.
// Called right after an invoice/register entry is saved.
router.put("/:date", asyncHandler(async (req, res) => {
  const { totalBirds, soldBirds, remaining, remainingValue } = req.body || {};
  const doc = await RegisterHistory.findOneAndUpdate(
    { date: req.params.date },
    { $set: { totalBirds, soldBirds, remaining, remainingValue } },
    { upsert: true, new: true }
  );
  res.json({ entry: doc });
}));

module.exports = router;
