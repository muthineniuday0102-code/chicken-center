// components/Topbar.jsx — top header bar with hamburger toggle and date
import React from "react";

const TITLES = {
  dashboard: "Dashboard", history: "History",
  reports: "Reports", profit: "Monthly Profit", ledger: "Daily Ledger", profile: "Profile",
};

export default function Topbar({ page, onHamburger }) {
  return (
    <header className="topbar no-print">
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, color: "#718096", padding: 4, display: "flex" }}
          onClick={onHamburger}
        >
          <i className="bi bi-list" />
        </button>
        <h1 className="tb-title">{TITLES[page]}</h1>
      </div>
      <div className="tb-right">
        <span className="tb-date no-print">
          <i className="bi bi-calendar3" style={{ marginRight: 5 }} />
          {new Date().toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short", year: "numeric" })}
        </span>
      </div>
    </header>
  );
}
