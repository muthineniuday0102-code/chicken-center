// context/AppContext.js — Global app state: auth, invoices, expenses, profile
import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { api, API_ENABLED, getToken, setToken } from "../api";

export const fmtR  = v => "₹" + Math.round(v || 0).toLocaleString("en-IN");
export const fmtN  = v => parseFloat(v) || 0;

// Safely evaluates a simple arithmetic string like "120+560+120" or "800-50*2"
// typed into a payment field. Only digits, + - * / . ( ) and spaces are allowed —
// anything else means it's not a finished expression yet, so we return the
// original string unevaluated (so partial typing like "120+" doesn't break).
export const evalExpr = str => {
  if (typeof str !== "string") return str;
  const trimmed = str.trim();
  if (!trimmed) return trimmed;
  // No operator present — nothing to evaluate, leave as-is (plain number or empty)
  if (!/[+\-*/]/.test(trimmed)) return trimmed;
  // Reject anything that isn't a safe arithmetic character
  if (!/^[\d+\-*/().\s]+$/.test(trimmed)) return trimmed;
  try {
    // eslint-disable-next-line no-new-func
    const result = Function(`"use strict"; return (${trimmed})`)();
    if (typeof result === "number" && isFinite(result)) {
      return String(Math.round(result * 100) / 100);
    }
  } catch (e) {
    /* malformed expression (e.g. "120+" or "120++"), leave unevaluated */
  }
  return trimmed;
};
export const uid   = () => Math.random().toString(36).slice(2, 9);
export const today = () => new Date().toISOString().split("T")[0];
export const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export function dateLabel(d) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

// ── seed data ──────────────────────────────────────────────────────────────
const SEED_INVOICES = [
  { id: "INV001", customer: "Ramesh Kumar", phone: "9876543210", date: today(), status: "Active",
    items: [{ name: "Broiler Chicken", emoji: "🐔", qty: 2.5, rate: 180, total: 450 }, { name: "Eggs", emoji: "🥚", qty: 12, rate: 8, total: 96 }],
    subtotal: 546, paid: 546, method: "Cash" },
  { id: "INV002", customer: "Sunita Devi", phone: "9123456789", date: today(), status: "Active",
    items: [{ name: "Natu Kodi", emoji: "⭐", qty: 1.5, rate: 350, total: 525 }],
    subtotal: 525, paid: 525, method: "GPay" },
  { id: "INV003", customer: "Venkat Rao", phone: "9988776655", date: today(), status: "Cancelled",
    items: [{ name: "Brown Eggs", emoji: "🟤", qty: 30, rate: 9, total: 270 }],
    subtotal: 270, paid: 0, method: "Cash" },
];
for (let i = 1; i <= 20; i++) {
  const d = new Date(); d.setDate(d.getDate() - i);
  const ds = d.toISOString().split("T")[0];
  const qty = +(1 + Math.random() * 4).toFixed(1);
  const total = +(qty * 180).toFixed(0);
  SEED_INVOICES.push({
    id: "INV" + String(100 + i).padStart(3, "0"),
    customer: ["Priya S", "Ravi K", "Anjali M", "Suresh P", "Deepa R", "Kavya T", "Arjun L", "Meera N"][i % 8],
    phone: "98" + String(Math.floor(10000000 + Math.random() * 89999999)),
    date: ds, status: "Active",
    items: [{ name: "Broiler Chicken", emoji: "🐔", qty, rate: 180, total }],
    subtotal: total, paid: total,
    method: ["Cash", "GPay", "Paytm", "UPI"][i % 4],
  });
}

const SEED_EXPENSES = [
  { id: uid(), date: today(), category: "Electricity", description: "Monthly bill", amount: 1200 },
  { id: uid(), date: today(), category: "Transport", description: "Delivery fuel", amount: 400 },
  { id: uid(), date: new Date(Date.now() - 86400000).toISOString().split("T")[0], category: "Staff", description: "Daily wages", amount: 600 },
];

// ── persistence ──────────────────────────────────────────────────────────────
// Without this, every refresh re-seeded invoices/expenses/registerHistory from
// the demo SEED_* arrays — so a deleted invoice (or anything else you changed)
// would silently reappear on reload. We persist the real data to localStorage
// and only fall back to the seed data the very first time the app is opened
// (i.e. when there's nothing saved yet).
const LS_KEY = "chickenCenterAppData_v1";
const loadSaved = () => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null; // corrupted/unavailable storage — fall back to seed data
  }
};

// ── Context ──────────────────────────────────────────────────────────────────
const Ctx = createContext(null);
export function useApp() { return useContext(Ctx); }

export function AppProvider({ children }) {
  // In API mode the backend is the source of truth — don't seed from the
  // local demo blob at all (it'll be overwritten by the load-on-mount effect
  // below anyway, and starting from a stale local copy could flash wrong
  // data for a moment).
  const saved = API_ENABLED ? null : loadSaved();
  const [user, setUser] = useState(saved?.user ?? null);
  const [authLoading, setAuthLoading] = useState(API_ENABLED); // true while we validate a stored token on first load
  const [profile, setProfile] = useState({
    name: "Ram Reddy", shop: "Ram Reddy Chicken Center",
    email: "demo@ramreddy.com", password: "demo123", role: "Owner",
  });
  const [invoices, setInvoices] = useState(API_ENABLED ? [] : (saved?.invoices ?? SEED_INVOICES));
  const [expenses, setExpenses] = useState(API_ENABLED ? [] : (saved?.expenses ?? SEED_EXPENSES));
  const [registerHistory, setRegisterHistory] = useState(API_ENABLED ? {} : (saved?.registerHistory ?? {})); // { 'YYYY-MM-DD': { totalBirds, soldBirds, remaining } }
  const [toasts, setToasts] = useState([]);

  // Persist whenever any of these change — including deletes, so a deleted
  // invoice stays gone after a refresh instead of reappearing from the seed.
  // `user` is included too, so refreshing the page no longer logs you out.
  // Offline mode only — in API mode the backend is the source of truth, and
  // login is tracked via a JWT (see api.js) instead of this blob.
  useEffect(() => {
    if (API_ENABLED) return;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({ user, invoices, expenses, registerHistory }));
    } catch {
      // storage unavailable (e.g. private browsing quota) — fail silently,
      // app still works for the current session
    }
  }, [user, invoices, expenses, registerHistory]);

  // Cross-tab sync: localStorage writes from THIS tab don't fire a "storage"
  // event in this tab (only in other tabs), so if the same app is open in
  // two tabs/windows, a save/delete in one wouldn't show up in the other
  // until refresh. Listen for the browser's storage event and pull in
  // whatever the other tab just wrote, so every open tab stays in sync.
  // Offline mode only — in API mode every tab/device just talks to the same
  // backend directly, which is the real fix for cross-device sync.
  useEffect(() => {
    if (API_ENABLED) return;
    const onStorage = e => {
      if (e.key !== LS_KEY || !e.newValue) return;
      try {
        const data = JSON.parse(e.newValue);
        if ("user" in data) setUser(data.user);
        if (data.invoices) setInvoices(data.invoices);
        if (data.expenses) setExpenses(data.expenses);
        if (data.registerHistory) setRegisterHistory(data.registerHistory);
      } catch {
        // ignore malformed data from another tab
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const toast = useCallback((msg, type = "success") => {
    const id = uid();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000);
  }, []);

  // Pulls invoices/expenses/registerHistory from the backend — called right
  // after login and on app load if a valid token is already stored.
  const loadAllFromApi = useCallback(async () => {
    const [invRes, expRes, rhRes] = await Promise.all([
      api.listInvoices(), api.listExpenses(), api.getRegisterHistory(),
    ]);
    setInvoices(invRes.invoices || []);
    setExpenses(expRes.expenses || []);
    setRegisterHistory(rhRes.registerHistory || {});
  }, []);

  // On first load in API mode: if a token is already saved (from a previous
  // session), validate it and pull real data — this is what lets a refresh
  // (or opening the app on a different device, once you log in there too)
  // pick up exactly where you left off instead of re-seeding demo data.
  useEffect(() => {
    if (!API_ENABLED) return;
    const token = getToken();
    if (!token) { setAuthLoading(false); return; }
    api.me()
      .then(({ user: u }) => { setUser(u); return loadAllFromApi(); })
      .catch(() => { setToken(null); setUser(null); }) // expired/invalid token
      .finally(() => setAuthLoading(false));
  }, [loadAllFromApi]);

  // login/logout — used by Login.jsx and the Sidebar's sign-out button.
  // In offline mode these are simple passthroughs; the actual demo
  // credential check still happens in Login.jsx as before.
  const login = async (email, password) => {
    if (API_ENABLED) {
      const { token, user: u } = await api.login(email, password);
      setToken(token);
      setUser(u);
      await loadAllFromApi();
      return u;
    }
    setUser({ email });
    return { email };
  };

  const logout = () => {
    if (API_ENABLED) {
      setToken(null);
      setInvoices([]);
      setExpenses([]);
      setRegisterHistory({});
    }
    setUser(null);
  };

  const addInvoice = async inv => {
    if (API_ENABLED) {
      const { invoice } = await api.createInvoice({ ...inv, invId: inv.id });
      setInvoices(a => [invoice, ...a]);
      return invoice;
    }
    setInvoices(a => [inv, ...a]);
    return inv;
  };
  const updateInvoice = async (id, patch) => {
    if (API_ENABLED) {
      const { invoice } = await api.updateInvoice(id, patch);
      setInvoices(a => a.map(i => (i.id === id ? invoice : i)));
      return;
    }
    setInvoices(a => a.map(i => (i.id === id ? { ...i, ...patch } : i)));
  };
  const deleteInvoice = async id => {
    if (API_ENABLED) await api.deleteInvoice(id);
    setInvoices(a => a.filter(i => i.id !== id));
  };
  const deleteInvoices = async ids => {
    if (API_ENABLED) await api.bulkDeleteInvoices(ids);
    setInvoices(a => a.filter(i => !ids.includes(i.id)));
  };

  const addExpense = async e => {
    if (API_ENABLED) {
      const { expense } = await api.createExpense(e);
      setExpenses(a => [expense, ...a]);
      return expense;
    }
    const withId = { ...e, id: uid() };
    setExpenses(a => [withId, ...a]);
    return withId;
  };
  const deleteExpense = async id => {
    if (API_ENABLED) await api.deleteExpense(id);
    setExpenses(a => a.filter(e => e.id !== id));
  };

  // ── Daily Sale Register → Invoice + Expense migration ──────────────────────
  // Converts a chicken-reg style register entry (stock sold, payments, cash flow)
  // into one Invoice (so it shows in Dashboard/History/Reports) and, if there's
  // an Expenditure amount, one Expense (so it shows in Ledger/Monthly Profit).
  // Also records the day's bird totals into registerHistory so tomorrow's
  // "Yesterday Birds" field can auto-carry-forward the remaining count.
  // The full register snapshot (`reg`) is stored on the invoice itself as
  // `registerSnapshot`, so History's View action can reconstruct the exact
  // same layout the data was entered in (P.R./B.P., all stock boxes, payments,
  // cash flow) rather than just a flat invoice line-item list.
  const migrateRegisterEntry = async reg => {
    // Build invoice line-items from whichever stock categories had sales
    const items = [];
    // `divisor` lets a category's saved total match the live-preview formula
    // exactly — Birds sold amount is qty÷1.65×rate (see DailySaleRegister/
    // RegisterView), so we must apply the same ÷1.65 here, or the invoice
    // total saved to History/Dashboard/Reports will disagree with what was
    // shown on screen before Save, which is what was causing the "sold birds
    // total changes after save+refresh" bug.
    const pushItem = (name, emoji, sold, sprc, divisor = 1) => {
      const qty = fmtN(sold);
      const rate = fmtN(sprc);
      if (qty > 0 && rate > 0) items.push({ id: uid(), name, emoji, unit: "kg", qty, rate, total: +((qty / divisor) * rate).toFixed(2) });
    };
    pushItem("Birds", "🐔", reg.birds.sold, reg.birds.sprc, 1.65);
    pushItem("Eggs", "🥚", reg.eggs.sold, reg.eggs.sprc);
    pushItem("Natu Kodi", "⭐", reg.natu.sold, reg.natu.sprc);
    pushItem("Brown Eggs", "🟤", reg.brown.sold, reg.brown.sprc);

    const subtotal = items.reduce((s, it) => s + it.total, 0);
    const totalCash = fmtN(reg.pay.order1) + fmtN(reg.pay.order2) + fmtN(reg.pay.cash)
      + fmtN(reg.pay.paytm) + fmtN(reg.pay.gpay) + fmtN(reg.pay.food) + fmtN(reg.pay.exp);

    // ID from max existing numeric suffix (not invoices.length) — length-based
    // IDs would start colliding once deletes are persisted across refreshes,
    // since a deleted slot would "free up" a number that's already been used.
    const maxNum = invoices.reduce((m, i) => {
      const n = parseInt(String(i.id).replace(/\D/g, ""), 10);
      return Number.isFinite(n) && n > m ? n : m;
    }, 100);
    const invId = "INV" + String(maxNum + 1).padStart(3, "0");
    const invoice = {
      id: invId,
      customer: "Daily Register",
      phone: "",
      date: reg.date,
      status: "Active",
      items: items.length ? items : [{ id: uid(), name: "Daily Sale", emoji: "📋", unit: "", qty: 1, rate: subtotal || totalCash, total: subtotal || totalCash }],
      subtotal: subtotal || totalCash,
      paid: totalCash,
      method: "Register",
      registerSnapshot: reg, // full entered data, for the exact-layout View in History
    };
    const savedInvoice = await addInvoice(invoice);

    // If expenditure was logged in the register, mirror it into the Ledger too
    const expAmt = fmtN(reg.pay.exp);
    if (expAmt > 0) {
      await addExpense({ date: reg.date, category: "Miscellaneous", description: "Daily register expenditure", amount: expAmt });
    }

    // Record bird carry-forward for tomorrow: today's stock count + the
    // yesterday-birds the user entered = total birds; minus sold = remaining.
    const todayBirds = fmtN(reg.birds.cnt);
    const yesterdayBirds = fmtN(reg.yBirds);
    const soldBirds = fmtN(reg.birds.sold);
    const totalBirds = todayBirds + yesterdayBirds;
    // Floor at 0 — if everything (today's stock AND the carried-forward
    // yesterday birds) gets sold, or a slight oversell happens, remaining
    // should read exactly 0, never a negative number that would then carry
    // forward as a bogus negative "Yesterday Birds" tomorrow.
    const remaining = Math.max(0, totalBirds - soldBirds);

    // Value carry-forward, parallel to the count carry-forward above, but in
    // ₹ rather than head-count. This is what lets "10 leftover birds from
    // yesterday" stay valued at YESTERDAY's price while today's leftovers are
    // valued at TODAY's price, instead of re-pricing old stock at today's
    // rate (which would silently distort the remaining-stock figure whenever
    // the purchase price changes day to day).
    // carriedInValue = the ₹ value of stock rolled in from previous days
    // (what was shown as "Yesterday Birds Value" when this entry was made).
    // remainingValue = that carried-in value, plus/minus today's own
    // movement (today's stock bought in − today's sold, at today's price).
    const carriedInValue = fmtN(reg.yBirdsVal);
    const todayPrice = fmtN(reg.birds.prc);
    const remainingValue = Math.max(0, carriedInValue + (todayBirds - soldBirds) * todayPrice);

    const dayEntry = { totalBirds, soldBirds, remaining, remainingValue };
    if (API_ENABLED) await api.putRegisterHistoryDay(reg.date, dayEntry);
    setRegisterHistory(h => ({ ...h, [reg.date]: dayEntry }));

    // Return the carry-forward figures directly (not just the saved
    // invoice) — the register form uses these immediately to reset itself,
    // which is more reliable than re-reading `registerHistory` straight
    // back out of context the instant after this returns, since that state
    // update may not have flushed/re-rendered yet.
    return { invoice: savedInvoice || invoice, dayEntry };
  };

  // Looks up what "Yesterday Birds" should auto-fill to for a given date.
  // If THIS date already has a saved register record (e.g. a second entry
  // made later the same day), continue from ITS remaining — not the prior
  // calendar day's — otherwise a same-day re-entry would keep re-pulling
  // yesterday's already-fully-consumed leftover (e.g. showing "15" again
  // even after you already sold all 15 of those birds earlier today).
  const getCarryForwardBirds = forDate => {
    if (registerHistory[forDate]) return registerHistory[forDate].remaining;
    const dates = Object.keys(registerHistory).filter(d => d < forDate).sort();
    if (dates.length === 0) return 0;
    const lastDate = dates[dates.length - 1];
    return registerHistory[lastDate].remaining;
  };

  // Same lookup, but for the ₹ value of that carried-forward stock — used to
  // value "Remaining" stock correctly across day boundaries with price changes.
  const getCarryForwardBirdsValue = forDate => {
    if (registerHistory[forDate]) return registerHistory[forDate].remainingValue || 0;
    const dates = Object.keys(registerHistory).filter(d => d < forDate).sort();
    if (dates.length === 0) return 0;
    const lastDate = dates[dates.length - 1];
    return registerHistory[lastDate].remainingValue || 0;
  };

  const revenueByMonth = year =>
    MONTHS.map((_, mi) => {
      const key = `${year}-${String(mi + 1).padStart(2, "0")}`;
      return invoices.filter(i => i.status === "Active" && i.date.startsWith(key)).reduce((s, i) => s + i.subtotal, 0);
    });

  const expensesByMonth = year =>
    MONTHS.map((_, mi) => {
      const key = `${year}-${String(mi + 1).padStart(2, "0")}`;
      return expenses.filter(e => e.date.startsWith(key)).reduce((s, e) => s + e.amount, 0);
    });

  const todayRevenue = invoices.filter(i => i.status === "Active" && i.date === today()).reduce((s, i) => s + i.subtotal, 0);
  const todayWeight  = invoices.filter(i => i.status === "Active" && i.date === today()).reduce((s, i) => s + i.items.reduce((x, it) => x + it.qty, 0), 0);
  const weekRevenue  = invoices.filter(i => i.status === "Active" && new Date(i.date) >= new Date(Date.now() - 7 * 86400000)).reduce((s, i) => s + i.subtotal, 0);
  const monthRevenue = invoices.filter(i => i.status === "Active" && i.date.startsWith(today().slice(0, 7))).reduce((s, i) => s + i.subtotal, 0);

  return (
    <Ctx.Provider
      value={{
        user, setUser, login, logout, authLoading, profile, setProfile,
        invoices, addInvoice, updateInvoice, deleteInvoice, deleteInvoices,
        expenses, addExpense, deleteExpense,
        migrateRegisterEntry, getCarryForwardBirds, getCarryForwardBirdsValue, registerHistory,
        revenueByMonth, expensesByMonth,
        todayRevenue, todayWeight, weekRevenue, monthRevenue,
        toast, toasts,
        API_ENABLED,
        // Role helpers — in offline (demo) mode everyone behaves as owner,
        // since there's no real multi-user system to restrict.
        isOwner: !API_ENABLED || user?.role === "owner",
        isStaff: API_ENABLED && user?.role === "staff",
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
