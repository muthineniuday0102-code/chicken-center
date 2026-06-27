// pages/Reports.jsx — KPI cards, sales-by-item table, 14-day line chart, custom range + bar chart
import React, { useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useApp, fmtR, today } from "../context/AppContext";

const PRESETS = [{ l: "Last 7 days", d: 7 }, { l: "Last 14 days", d: 14 }, { l: "Last 30 days", d: 30 }, { l: "Last 90 days", d: 90 }];

export default function Reports() {
  const { invoices } = useApp();
  const [days, setDays] = useState(14);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [custom, setCustom] = useState(false);

  const now = new Date();
  const fromD = custom && from ? from : new Date(now - days * 86400000).toISOString().split("T")[0];
  const toD   = custom && to ? to : today();

  const active = invoices.filter(i => i.status === "Active");
  const inRange = active.filter(i => i.date >= fromD && i.date <= toD);

  const lineData = Array.from({ length: Math.min(days, 30) }, (_, i) => {
    const d = new Date(now - (Math.min(days, 30) - 1 - i) * 86400000).toISOString().split("T")[0];
    const rev = active.filter(x => x.date === d).reduce((s, x) => s + x.subtotal, 0);
    return { date: new Date(d + "T00:00:00").toLocaleDateString("en-IN", { day: "2-digit", month: "short" }), rev };
  });

  const itemMap = {};
  inRange.forEach(inv => inv.items.forEach(it => {
    if (!itemMap[it.name]) itemMap[it.name] = { name: it.name, qty: 0, revenue: 0, orders: 0 };
    itemMap[it.name].qty += it.qty;
    itemMap[it.name].revenue += it.total;
    itemMap[it.name].orders++;
  }));
  const rows = Object.values(itemMap).sort((a, b) => b.revenue - a.revenue);
  const barData = rows.map(r => ({ name: r.name.split(" ")[0], rev: r.revenue }));

  const totalRev = inRange.reduce((s, i) => s + i.subtotal, 0);
  const avgOrder = inRange.length ? totalRev / inRange.length : 0;

  return (
    <div className="fade-in">
      <div className="ph"><div className="pt-title">Reports</div><div className="pt-sub">Sales analytics & insights</div></div>

      <div className="card" style={{ padding: "12px 18px", marginBottom: 16 }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--gray)" }}>Period:</span>
          {PRESETS.map(p => (
            <button key={p.d} className={`chip ${!custom && days === p.d ? "on" : ""}`} onClick={() => { setDays(p.d); setCustom(false); }}>{p.l}</button>
          ))}
          <button className={`chip ${custom ? "on" : ""}`} onClick={() => setCustom(true)}>Custom</button>
          {custom && (
            <>
              <input type="date" className="inp" style={{ width: 140 }} value={from} onChange={e => setFrom(e.target.value)} />
              <span style={{ fontSize: 13 }}>→</span>
              <input type="date" className="inp" style={{ width: 140 }} value={to} onChange={e => setTo(e.target.value)} />
            </>
          )}
        </div>
      </div>

      <div className="g4" style={{ marginBottom: 16 }}>
        {[
          { l: "Revenue",   v: fmtR(totalRev), icon: "bi-currency-rupee", c: "#c0392b", bg: "#fef3f2" },
          { l: "Invoices",  v: inRange.length, icon: "bi-receipt", c: "#2980b9", bg: "#eff6ff" },
          { l: "Avg Order", v: fmtR(avgOrder), icon: "bi-graph-up", c: "#27ae60", bg: "#f0fdf4" },
          { l: "Top Item",  v: rows[0]?.name.split(" ")[0] || "—", icon: "bi-star-fill", c: "#e67e22", bg: "#fff7ed" },
        ].map(k => (
          <div className="kpi" key={k.l}>
            <div className="kpi-ic" style={{ background: k.bg, color: k.c }}><i className={`bi ${k.icon}`} style={{ fontSize: 20 }} /></div>
            <div className="kpi-v" style={{ fontSize: 20 }}>{k.v}</div>
            <div className="kpi-l">{k.l}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="stitle"><i className="bi bi-graph-up" />Daily Revenue Trend</div>
        {lineData.some(d => d.rev > 0) ? (
          <ResponsiveContainer width="100%" height={210}>
            <LineChart data={lineData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#718096" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#718096" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={v => [fmtR(v), "Revenue"]} />
              <Line type="monotone" dataKey="rev" stroke="#c0392b" strokeWidth={2.5} dot={{ r: 3, fill: "#c0392b" }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ textAlign: "center", padding: "40px 0", color: "var(--gray)", fontSize: 13 }}>No data for this period</div>
        )}
      </div>

      <div className="g2">
        <div className="card">
          <div className="stitle"><i className="bi bi-table" />Sales by Item</div>
          <div className="tw">
            <table>
              <thead><tr><th>Item</th><th>Qty</th><th>Revenue</th><th>Orders</th></tr></thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={4} style={{ textAlign: "center", padding: "24px 0", color: "var(--gray)" }}>No data</td></tr>
                ) : rows.map(r => (
                  <tr key={r.name}>
                    <td style={{ fontWeight: 500 }}>{r.name}</td>
                    <td>{r.qty.toFixed(1)}</td>
                    <td style={{ color: "var(--green)", fontWeight: 600 }}>{fmtR(r.revenue)}</td>
                    <td><span className="bdg bb">{r.orders}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <div className="stitle"><i className="bi bi-bar-chart" />Revenue by Category</div>
          {barData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={barData} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#718096" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#718096" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={v => [fmtR(v), "Revenue"]} />
                <Bar dataKey="rev" fill="#c0392b" radius={[6, 6, 0, 0]} maxBarSize={52} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: "center", padding: "40px 0", color: "var(--gray)", fontSize: 13 }}>No data</div>
          )}
        </div>
      </div>
    </div>
  );
}
