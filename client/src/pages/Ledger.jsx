// pages/Ledger.jsx — Daily expense tracker. Entries here auto-flow into Monthly Profit
// via AppContext.expensesByMonth(), since both read from the same `expenses` state.
import React, { useState } from "react";
import { useApp, fmtR, fmtN, today, dateLabel } from "../context/AppContext";

const CATS_EXP = ["Electricity", "Transport", "Staff", "Rent", "Feed", "Maintenance", "Miscellaneous"];

export default function Ledger() {
  const { expenses, addExpense, deleteExpense, toast, isOwner } = useApp();
  const td = today();
  const [form, setForm] = useState({ date: td, category: "Miscellaneous", description: "", amount: "" });
  const [search, setSearch] = useState("");
  const [fcat, setFcat] = useState("All");
  const [confirmId, setConfirmId] = useState(null);

  const handle = async () => {
    if (!form.amount || fmtN(form.amount) <= 0) { toast("Enter valid amount", "error"); return; }
    try {
      await addExpense({ ...form, amount: fmtN(form.amount) });
      setForm({ date: td, category: "Miscellaneous", description: "", amount: "" });
      toast("Expense logged ✓");
    } catch (err) {
      toast(err.message || "Couldn't log expense", "error");
    }
  };

  const handleDelete = async id => {
    try {
      await deleteExpense(id);
      toast("Deleted", "info");
    } catch (err) {
      toast(err.message || "Couldn't delete that expense", "error");
    }
    setConfirmId(null);
  };

  const filtered = expenses.filter(e => {
    const q = search.toLowerCase();
    return (!search || e.description.toLowerCase().includes(q) || e.category.toLowerCase().includes(q))
      && (fcat === "All" || e.category === fcat);
  });

  const todayT = expenses.filter(e => e.date === td).reduce((s, e) => s + e.amount, 0);
  const monthT = expenses.filter(e => e.date.startsWith(td.slice(0, 7))).reduce((s, e) => s + e.amount, 0);

  return (
    <div className="fade-in">
      <div className="ph"><div className="pt-title">Daily Ledger</div><div className="pt-sub">Log running costs → auto-reflects in Monthly Profit</div></div>

      <div className="g3" style={{ marginBottom: 16 }}>
        {[
          { l: "Today's Expenses", v: fmtR(todayT), icon: "bi-calendar-day", c: "#c0392b", bg: "#fef3f2" },
          { l: "This Month",       v: fmtR(monthT), icon: "bi-calendar-month", c: "#e67e22", bg: "#fff7ed" },
          { l: "Showing",          v: fmtR(filtered.reduce((s, e) => s + e.amount, 0)), icon: "bi-funnel", c: "#2980b9", bg: "#eff6ff" },
        ].map(k => (
          <div className="kpi" key={k.l}>
            <div className="kpi-ic" style={{ background: k.bg, color: k.c }}><i className={`bi ${k.icon}`} style={{ fontSize: 20 }} /></div>
            <div className="kpi-v" style={{ fontSize: 20, color: k.c }}>{k.v}</div>
            <div className="kpi-l">{k.l}</div>
          </div>
        ))}
      </div>

      {/* Add expense form */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="stitle"><i className="bi bi-plus-circle" />Log Expense</div>
        <div style={{ display: "grid", gridTemplateColumns: "130px 150px 1fr 120px auto", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div>
            <label className="fl">Date</label>
            <input type="date" className="inp" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          </div>
          <div>
            <label className="fl">Category</label>
            <select className="inp" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              {CATS_EXP.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="fl">Description</label>
            <input className="inp" placeholder="e.g. Monthly electricity bill" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label className="fl">Amount ₹</label>
            <input
              type="number" className="inp" placeholder="0" value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && handle()}
            />
          </div>
          <button className="btn btn-p" style={{ height: 42 }} onClick={handle}><i className="bi bi-plus-lg" />Add</button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: "12px 16px", marginBottom: 12, display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
        <div className="srch" style={{ flex: 1, minWidth: 180 }}>
          <i className="bi bi-search" />
          <input className="inp" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["All", ...CATS_EXP].map(c => (
            <button key={c} className={`chip ${fcat === c ? "on" : ""}`} onClick={() => setFcat(c)}>{c}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="tw">
          <table>
            <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Amount</th><th></th></tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: "center", padding: "32px 0", color: "var(--gray)" }}>
                  <i className="bi bi-journal-text" style={{ fontSize: 28, display: "block", marginBottom: 8, opacity: 0.3 }} />
                  No expenses logged
                </td></tr>
              ) : filtered.map(e => (
                <tr key={e.id}>
                  <td style={{ color: "var(--gray)", fontSize: 12, whiteSpace: "nowrap" }}>{dateLabel(e.date)}</td>
                  <td><span className="bdg bo">{e.category}</span></td>
                  <td>{e.description || "—"}</td>
                  <td style={{ fontWeight: 700, color: "var(--red)" }}>{fmtR(e.amount)}</td>
                  <td>
                    {isOwner && (
                      confirmId === e.id ? (
                        <div style={{ display: "flex", gap: 5 }}>
                          <button className="btn btn-s btn-sm" onClick={() => setConfirmId(null)}>Keep</button>
                          <button className="btn btn-d btn-sm" onClick={() => handleDelete(e.id)}>Delete</button>
                        </div>
                      ) : (
                        <button className="btn btn-d btn-sm" onClick={() => setConfirmId(e.id)}>
                          <i className="bi bi-trash" />
                        </button>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
