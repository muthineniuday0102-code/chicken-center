// pages/MonthlyProfit.jsx — Year selector, color-coded bar chart, per-month expense inputs → net profit
import React, { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";
import { useApp, fmtR, fmtN, MONTHS } from "../context/AppContext";

export default function MonthlyProfit() {
  const { revenueByMonth, expensesByMonth } = useApp();
  const yr = new Date().getFullYear();
  const [year, setYear] = useState(yr);
  const [extra, setExtra] = useState(Array(12).fill(""));

  const rev = revenueByMonth(year);
  const autoExp = expensesByMonth(year); // ← automatically pulled from the Daily Ledger
  const manExp = extra.map(e => fmtN(e));
  const totExp = autoExp.map((a, i) => a + manExp[i]);
  const net = rev.map((r, i) => r - totExp[i]);

  const chartData = MONTHS.map((m, i) => ({ month: m, Revenue: rev[i], Expense: totExp[i], Profit: net[i] }));
  const totalRev = rev.reduce((a, b) => a + b, 0);
  const totalExp = totExp.reduce((a, b) => a + b, 0);
  const totalNet = net.reduce((a, b) => a + b, 0);

  return (
    <div className="fade-in">
      <div className="ph"><div className="pt-title">Monthly Profit Returns</div><div className="pt-sub">Revenue, expenses (incl. ledger) & net profit by month</div></div>

      <div className="card" style={{ padding: "12px 18px", marginBottom: 16, display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--gray)" }}>Year:</span>
        {[yr - 1, yr, yr + 1].map(y => (
          <button key={y} className={`chip ${year === y ? "on" : ""}`} onClick={() => setYear(y)}>{y}</button>
        ))}
      </div>

      <div className="g3" style={{ marginBottom: 16 }}>
        {[
          { l: "Total Revenue",  v: fmtR(totalRev), c: "var(--green)", bg: "var(--green-l)", icon: "bi-cash-coin" },
          { l: "Total Expenses", v: fmtR(totalExp), c: "var(--red)", bg: "var(--red-l)", icon: "bi-wallet2" },
          { l: "Net Profit",     v: fmtR(totalNet), c: totalNet >= 0 ? "var(--blue)" : "var(--red)", bg: totalNet >= 0 ? "var(--blue-l)" : "var(--red-l)", icon: "bi-graph-up-arrow" },
        ].map(k => (
          <div className="kpi" key={k.l}>
            <div className="kpi-ic" style={{ background: k.bg, color: k.c }}><i className={`bi ${k.icon}`} style={{ fontSize: 20 }} /></div>
            <div className="kpi-v" style={{ color: k.c }}>{k.v}</div>
            <div className="kpi-l">{k.l} — {year}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="stitle"><i className="bi bi-bar-chart-fill" />Monthly Overview — {year}</div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#718096" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "#718096" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v, n) => [fmtR(v), n]} labelStyle={{ fontWeight: 600 }} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="Revenue" fill="#27ae60" radius={[4, 4, 0, 0]} maxBarSize={24} />
            <Bar dataKey="Expense" fill="#c0392b" radius={[4, 4, 0, 0]} maxBarSize={24} />
            <Bar dataKey="Profit" radius={[4, 4, 0, 0]} maxBarSize={24}>
              {chartData.map((_, i) => <Cell key={i} fill={net[i] >= 0 ? "#2980b9" : "#e74c3c"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <div className="stitle"><i className="bi bi-table" />Monthly Breakdown</div>
        <div style={{ overflowX: "auto" }}>
          <table className="pt">
            <thead>
              <tr>
                <th>Month</th>
                <th>Revenue</th>
                <th>Auto Exp<br /><span style={{ fontWeight: 400, textTransform: "none", fontSize: 10 }}>(Ledger)</span></th>
                <th>Manual Exp<br /><span style={{ fontWeight: 400, textTransform: "none", fontSize: 10 }}>(Extra)</span></th>
                <th>Total Exp</th>
                <th>Net Profit</th>
              </tr>
            </thead>
            <tbody>
              {MONTHS.map((m, i) => (
                <tr key={m}>
                  <td style={{ fontWeight: 600 }}>{m} {year}</td>
                  <td style={{ color: "var(--green)", fontWeight: 600 }}>{fmtR(rev[i])}</td>
                  <td style={{ color: "var(--gray)" }}>{fmtR(autoExp[i])}</td>
                  <td>
                    <input
                      type="number" placeholder="0" value={extra[i]}
                      onChange={e => { const a = [...extra]; a[i] = e.target.value; setExtra(a); }}
                      style={{ width: "100%", border: "1px solid var(--border)", borderRadius: 6, padding: "5px 8px", fontSize: 12, outline: "none" }}
                    />
                  </td>
                  <td style={{ color: "var(--red)", fontWeight: 600 }}>{fmtR(totExp[i])}</td>
                  <td className={net[i] >= 0 ? "pp" : "pn"}>{net[i] >= 0 ? "▲" : "▼"} {fmtR(Math.abs(net[i]))}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td>TOTAL</td>
                <td>{fmtR(totalRev)}</td>
                <td>{fmtR(autoExp.reduce((a, b) => a + b, 0))}</td>
                <td>{fmtR(manExp.reduce((a, b) => a + b, 0))}</td>
                <td>{fmtR(totalExp)}</td>
                <td style={{ color: totalNet >= 0 ? "#4ade80" : "#f87171" }}>{fmtR(totalNet)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
