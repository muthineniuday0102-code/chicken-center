// src/models/RegisterHistory.js — one doc per date, used to carry forward
// "Yesterday Birds" (count) and its ₹ value into the next day's register.
const mongoose = require("mongoose");

const registerHistorySchema = new mongoose.Schema(
  {
    date: { type: String, required: true, unique: true }, // 'YYYY-MM-DD'
    totalBirds: { type: Number, default: 0 },
    soldBirds: { type: Number, default: 0 },
    remaining: { type: Number, default: 0 }, // count carried into tomorrow
    remainingValue: { type: Number, default: 0 }, // ₹ value carried into tomorrow
  },
  { timestamps: true }
);

module.exports = mongoose.model("RegisterHistory", registerHistorySchema);
