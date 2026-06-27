// src/index.js — server entry point
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./db");

const authRoutes = require("./routes/auth");
const invoiceRoutes = require("./routes/invoices");
const expenseRoutes = require("./routes/expenses");
const registerHistoryRoutes = require("./routes/registerHistory");

const app = express();

app.use(express.json({ limit: "2mb" })); // register snapshots can be sizable

const corsOrigins = (process.env.CORS_ORIGIN || "").split(",").map(s => s.trim()).filter(Boolean);
if (corsOrigins.length === 0) {
  // An empty array here means cors() allows NO origins — every browser
  // request would silently fail with a CORS error while curl/Postman still
  // worked fine, which is a confusing thing to debug. Default to allowing
  // any origin instead, with a loud warning to set this properly for
  // production (since allowing "*" with credentials is fine for getting
  // started but should be locked down to your real frontend URL).
  console.warn("⚠ CORS_ORIGIN is not set — allowing all origins. Set it in your .env once you know your frontend's URL.");
}
app.use(
  cors({
    origin: corsOrigins.length > 0 ? corsOrigins : true,
    credentials: true,
  })
);

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/register-history", registerHistoryRoutes);

// Unmatched route — JSON 404 instead of Express's default HTML page
app.use((req, res) => {
  res.status(404).json({ error: `No route: ${req.method} ${req.path}` });
});

// Fallback error handler — keeps a bad request from crashing the process and
// returns JSON instead of an HTML stack trace. Combined with asyncHandler on
// every route, this is what actually receives errors thrown inside async
// handlers (Express 4 doesn't forward those automatically on its own).
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server." });
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`✓ ChickenCenter API listening on port ${PORT}`));
});
