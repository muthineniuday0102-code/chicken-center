// App.js — root component: auth gate, sidebar/topbar shell, page routing (no react-router needed)
import React, { useState, useEffect } from "react";
import { AppProvider, useApp } from "./context/AppContext";
import Toasts from "./components/Toasts";
import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import History from "./pages/History";
import Reports from "./pages/Reports";
import MonthlyProfit from "./pages/MonthlyProfit";
import Ledger from "./pages/Ledger";
import Profile from "./pages/Profile";

// Which nav tab you're on — persisted so a refresh lands back on the same
// page instead of always resetting to Dashboard.
const PAGE_LS_KEY = "chickenCenterAppPage_v1";
const VALID_PAGES = ["dashboard", "history", "reports", "profit", "ledger", "profile"];
const loadSavedPage = () => {
  try {
    const p = localStorage.getItem(PAGE_LS_KEY);
    return VALID_PAGES.includes(p) ? p : "dashboard";
  } catch {
    return "dashboard";
  }
};

function Shell() {
  const { user, authLoading } = useApp();
  const [page, setPage] = useState(loadSavedPage);
  const [collapsed, setCollapsed] = useState(false);
  const [mobOpen, setMobOpen] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(PAGE_LS_KEY, page); } catch { /* ignore */ }
  }, [page]);

  // Validating a stored login token against the backend takes a moment —
  // show a quiet loading state instead of flashing the Login screen first.
  if (authLoading) {
    return (
      <div className="login-pg">
        <div style={{ textAlign: "center" }}>
          <div className="l-logo-ic">🍗</div>
          <p style={{ color: "#718096", fontSize: 13, marginTop: 10 }}>Loading…</p>
        </div>
      </div>
    );
  }

  if (!user) return <Login />;

  const PAGE_COMPONENTS = {
    dashboard: <Dashboard setPage={setPage} />,
    history: <History />,
    reports: <Reports />,
    profit: <MonthlyProfit />,
    ledger: <Ledger />,
    profile: <Profile />,
  };

  return (
    <div className="shell">
      {mobOpen && <div className="mob-ov show" onClick={() => setMobOpen(false)} />}
      <Sidebar
        page={page} setPage={setPage}
        collapsed={collapsed} mobOpen={mobOpen} setMobOpen={setMobOpen}
      />
      <div className="main">
        <Topbar
          page={page}
          onHamburger={() => {
            if (window.innerWidth <= 768) setMobOpen(v => !v);
            else setCollapsed(v => !v);
          }}
        />
        <div className="body">
          {PAGE_COMPONENTS[page]}
        </div>
      </div>
      <Toasts />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
