// pages/Dashboard.jsx — Greeting, 4 KPI cards, Daily Sale register module, 14-day chart, recent sales table
import React, { useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useApp, fmtR } from "../context/AppContext";
import DailySaleRegister from "../components/DailySaleRegister";

export default function Dashboard({ setPage }) {
  const { invoices, todayRevenue, todayWeight, weekRevenue, monthRevenue, profile } = useApp();
  const [registerCollapsed, setRegisterCollapsed] = useState(false);
  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  const active = invoices.filter(i => i.status === "Active");
  const recent = active.slice(0, 7);

  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (13 - i));
    const ds = d.toISOString().split("T")[0];
    const rev = active.filter(x => x.date === ds).reduce((s, x) => s + x.subtotal, 0);
    return { date: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }), rev };
  });

  const kpis = [
    { label: "Today's Revenue", val: fmtR(todayRevenue), icon: "bi-currency-rupee", color: "#c0392b", bg: "#fef3f2", chg: "+12%" },
    { label: "Today's Weight",  val: todayWeight.toFixed(1) + " kg", icon: "bi-box-seam", color: "#2980b9", bg: "#eff6ff", chg: "Sold today" },
    { label: "This Week",       val: fmtR(weekRevenue), icon: "bi-calendar-week", color: "#27ae60", bg: "#f0fdf4", chg: "+8%" },
    { label: "This Month",      val: fmtR(monthRevenue), icon: "bi-calendar-month", color: "#e67e22", bg: "#fff7ed", chg: "Running" },
  ];

  return (
    <div className="fade-in">
      <div className="ph">
        <div className="pt-title">{greet}, {profile.name.split(" ")[0]}! 👋</div>
        <div className="pt-sub">Here's your business summary for today</div>
      </div>

      <div className="g4" style={{ marginBottom: 20 }}>
        {kpis.map(k => (
          <div className="kpi" key={k.label}>
            <div className="kpi-ic" style={{ background: k.bg, color: k.color }}>
              <i className={`bi ${k.icon}`} style={{ fontSize: 20 }} />
            </div>
            <div className="kpi-v">{k.val}</div>
            <div className="kpi-l">{k.label}</div>
            <div className="kpi-c" style={{ color: k.color }}><i className="bi bi-arrow-up-right" />{k.chg}</div>
          </div>
        ))}
      </div>

      {/* ── Daily Sale — Register module ── */}
      <DailySaleRegister collapsed={registerCollapsed} onToggle={() => setRegisterCollapsed(c => !c)} />

      <div className="g2" style={{ marginBottom: 20 }}>
        <div className="card">
          <div className="stitle"><i className="bi bi-graph-up" />14-Day Revenue</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={last14} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#718096" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: "#718096" }} axisLine={false} tickLine={false} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={v => [fmtR(v), "Revenue"]} labelStyle={{ fontWeight: 600 }} />
              <Line type="monotone" dataKey="rev" stroke="#c0392b" strokeWidth={2.5} dot={{ r: 3, fill: "#c0392b" }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div className="stitle"><i className="bi bi-receipt" />Recent Sales</div>
          <div className="tw">
            <table>
              <thead><tr><th>Invoice</th><th>Customer</th><th>Amount</th><th>Status</th></tr></thead>
              <tbody>
                {recent.map(i => (
                  <tr key={i.id}>
                    <td style={{ fontWeight: 600, color: "var(--red)" }}>{i.id}</td>
                    <td>{i.customer}</td>
                    <td style={{ fontWeight: 600 }}>{fmtR(i.subtotal)}</td>
                    <td><span className={`bdg ${i.status === "Active" ? "bg" : "br"}`}>{i.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 14, textAlign: "center" }}>
            <button className="btn btn-s btn-sm" onClick={() => setPage("history")}>
              <i className="bi bi-arrow-right" />View All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
