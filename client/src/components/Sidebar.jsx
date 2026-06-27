// components/Sidebar.jsx — Dark collapsible sidebar with nav links, avatar, sign-out
import React from "react";
import { useApp } from "../context/AppContext";

export const PAGES = {
  dashboard: { label: "Dashboard", icon: "bi-grid-1x2-fill" },
  history:   { label: "History",   icon: "bi-clock-history" },
  reports:   { label: "Reports",   icon: "bi-bar-chart-fill" },
  profit:    { label: "Profit",    icon: "bi-graph-up-arrow" },
  ledger:    { label: "Ledger",    icon: "bi-journal-text" },
  profile:   { label: "Profile",   icon: "bi-person-fill" },
};

export default function Sidebar({ page, setPage, collapsed, mobOpen, setMobOpen }) {
  const { profile, logout, toast, user } = useApp();
  const displayName = user?.name || profile.name;
  const displayRole = user?.role ? (user.role === "owner" ? "Owner" : "Staff") : profile.role;
  const initials = displayName.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <aside className={`sb ${collapsed ? "col" : ""} ${mobOpen ? "mob-open" : ""} no-print`}>
      {/* Logo */}
      <div className="sb-logo">
        <div className="sb-logo-ic">🍗</div>
        <div className="sb-logo-t">
          <div style={{ fontWeight: 700, fontSize: 13, letterSpacing: 0.5 }}>SNEHA</div>
          <div className="sb-logo-s">CHICKEN CENTER</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sb-nav">
        {Object.entries(PAGES).map(([key, p]) => (
          <button
            key={key}
            className={`sb-lnk ${page === key ? "on" : ""}`}
            title={collapsed ? p.label : ""}
            onClick={() => { setPage(key); setMobOpen(false); }}
          >
            <i className={`bi ${p.icon}`} />
            <span className="sb-lt">{p.label}</span>
          </button>
        ))}
      </nav>

      {/* User + sign out */}
      <div className="sb-usr">
        <div className="sb-av">{initials}</div>
        <div className="sb-ui">
          <div className="sb-un">{displayName}</div>
          <span className="sb-role">{displayRole}</span>
        </div>
        <button
          style={{ background: "none", border: "none", color: "rgba(255,255,255,.5)", cursor: "pointer", fontSize: 16, padding: 4, flexShrink: 0 }}
          title="Sign out"
          onClick={() => { logout(); toast("Signed out", "info"); }}
        >
          <i className="bi bi-box-arrow-right" />
        </button>
      </div>
    </aside>
  );
}
