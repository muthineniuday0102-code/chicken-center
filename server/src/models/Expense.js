// src/models/Expense.js
const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    date: { type: String, required: true }, // 'YYYY-MM-DD'
    category: { type: String, required: true },
    description: { type: String, default: "" },
    amount: { type: Number, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

expenseSchema.set("toJSON", {
  transform(_doc, ret) {
    ret.id = ret._id.toString();
    return ret;
  },
});

module.exports = mongoose.model("Expense", expenseSchema);
