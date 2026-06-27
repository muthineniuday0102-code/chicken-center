// src/routes/expenses.js
const express = require("express");
const Expense = require("../models/Expense");
const { requireAuth, requireRole } = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();
router.use(requireAuth);

router.get("/", asyncHandler(async (_req, res) => {
  const expenses = await Expense.find().sort({ createdAt: -1 });
  res.json({ expenses });
}));

router.post("/", asyncHandler(async (req, res) => {
  const { date, category, description, amount } = req.body || {};
  if (!date || !category || amount == null) {
    return res.status(400).json({ error: "date, category and amount are required." });
  }
  const expense = await Expense.create({ date, category, description, amount, createdBy: req.user._id });
  res.status(201).json({ expense });
}));

// Owner only — same reasoning as invoices: deletes should be permanent and
// owner-controlled.
router.delete("/:id", requireRole("owner"), asyncHandler(async (req, res) => {
  let result;
  try {
    result = await Expense.deleteOne({ _id: req.params.id });
  } catch {
    return res.status(400).json({ error: "Invalid expense id." });
  }
  if (result.deletedCount === 0) return res.status(404).json({ error: "Expense not found." });
  res.json({ ok: true });
}));

module.exports = router;
