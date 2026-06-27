// src/routes/invoices.js
const express = require("express");
const Invoice = require("../models/Invoice");
const { requireAuth, requireRole } = require("../middleware/auth");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();
router.use(requireAuth); // every route below requires a signed-in user (owner or staff)

// GET /api/invoices — everyone (owner + staff) sees the same shared dataset,
// since it's all one shop's books.
router.get("/", asyncHandler(async (_req, res) => {
  const invoices = await Invoice.find().sort({ createdAt: -1 });
  res.json({ invoices });
}));

// POST /api/invoices — owner or staff can create (e.g. saving a Daily Sale
// Register entry, or a plain walk-in sale).
router.post("/", asyncHandler(async (req, res) => {
  const body = req.body || {};
  if (!body.invId || !body.customer) {
    return res.status(400).json({ error: "invId and customer are required." });
  }
  let invoice;
  try {
    invoice = await Invoice.create({ ...body, createdBy: req.user._id });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: "An invoice with that ID already exists." });
    throw err;
  }
  res.status(201).json({ invoice });
}));

// PATCH /api/invoices/:invId — used for "Cancel" (status update). Owner or
// staff can cancel — useful if staff made the entry and need to correct it.
router.patch("/:invId", asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOneAndUpdate(
    { invId: req.params.invId },
    { $set: req.body || {} },
    { new: true }
  );
  if (!invoice) return res.status(404).json({ error: "Invoice not found." });
  res.json({ invoice });
}));

// DELETE /api/invoices/:invId — owner only. Deleting is permanent and
// staff shouldn't be able to erase the books.
router.delete("/:invId", requireRole("owner"), asyncHandler(async (req, res) => {
  const result = await Invoice.deleteOne({ invId: req.params.invId });
  if (result.deletedCount === 0) return res.status(404).json({ error: "Invoice not found." });
  res.json({ ok: true });
}));

// POST /api/invoices/bulk-delete — owner only.
router.post("/bulk-delete", requireRole("owner"), asyncHandler(async (req, res) => {
  const { invIds } = req.body || {};
  if (!Array.isArray(invIds) || invIds.length === 0) {
    return res.status(400).json({ error: "invIds (array) is required." });
  }
  await Invoice.deleteMany({ invId: { $in: invIds } });
  res.json({ ok: true });
}));

module.exports = router;
