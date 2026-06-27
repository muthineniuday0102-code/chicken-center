// src/api.js — talks to the ChickenCenter backend (Express + MongoDB Atlas).
// Only used when REACT_APP_API_URL is set (see client/.env.example) — if it's
// not set, the app falls back to its original localStorage-only mode, so
// this is an opt-in upgrade rather than a breaking change.
export const API_ENABLED = !!process.env.REACT_APP_API_URL;
const API_URL = process.env.REACT_APP_API_URL || "";

const TOKEN_KEY = "chickenCenterToken_v1";
export const getToken = () => {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
};
export const setToken = t => {
  try { t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
};

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new Error("Couldn't reach the server — check your internet connection.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export const api = {
  login: (email, password) => request("/api/auth/login", { method: "POST", body: { email, password }, auth: false }),
  me: () => request("/api/auth/me"),
  createStaff: (name, email, password) => request("/api/auth/staff", { method: "POST", body: { name, email, password } }),
  listStaff: () => request("/api/auth/staff"),
  deleteStaff: id => request(`/api/auth/staff/${id}`, { method: "DELETE" }),

  listInvoices: () => request("/api/invoices"),
  createInvoice: inv => request("/api/invoices", { method: "POST", body: inv }),
  updateInvoice: (invId, patch) => request(`/api/invoices/${invId}`, { method: "PATCH", body: patch }),
  deleteInvoice: invId => request(`/api/invoices/${invId}`, { method: "DELETE" }),
  bulkDeleteInvoices: invIds => request("/api/invoices/bulk-delete", { method: "POST", body: { invIds } }),

  listExpenses: () => request("/api/expenses"),
  createExpense: exp => request("/api/expenses", { method: "POST", body: exp }),
  deleteExpense: id => request(`/api/expenses/${id}`, { method: "DELETE" }),

  getRegisterHistory: () => request("/api/register-history"),
  putRegisterHistoryDay: (date, entry) => request(`/api/register-history/${date}`, { method: "PUT", body: entry }),
};
