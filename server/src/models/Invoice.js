// src/models/Invoice.js
const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    name: String,
    emoji: String,
    unit: String,
    qty: Number,
    rate: Number,
    total: Number,
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    // Human-facing invoice number shown in the UI (e.g. "INV101") — separate
    // from Mongo's own _id so the existing frontend display logic doesn't
    // need to change.
    invId: { type: String, required: true, unique: true },
    date: { type: String, required: true }, // 'YYYY-MM-DD'
    customer: { type: String, required: true },
    phone: { type: String, default: "" },
    items: { type: [itemSchema], default: [] },
    subtotal: { type: Number, default: 0 },
    method: { type: String, default: "Cash" },
    paid: { type: Number, default: 0 },
    status: { type: String, enum: ["Active", "Cancelled"], default: "Active" },
    // Full Daily Sale Register snapshot, when this invoice came from the
    // register form rather than a plain sale — shape is flexible/evolving on
    // the frontend, so it's stored as-is rather than modeled field-by-field.
    registerSnapshot: { type: mongoose.Schema.Types.Mixed, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

invoiceSchema.set("toJSON", {
  transform(_doc, ret) {
    ret.id = ret.invId; // frontend keys everything off `id`
    return ret;
  },
});

module.exports = mongoose.model("Invoice", invoiceSchema);
