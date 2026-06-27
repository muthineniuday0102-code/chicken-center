// pages/Login.jsx — floating card login. Uses the real backend (email/
// password against MongoDB Atlas, JWT session) when REACT_APP_API_URL is
// set; otherwise falls back to the original offline demo-credential check.
import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import { API_ENABLED } from "../api";

export default function Login() {
  const { login, profile, toast } = useApp();
  const [form, setForm] = useState({ email: "", password: "" });
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const handle = async () => {
    setErr("");
    if (API_ENABLED) {
      if (!form.email || !form.password) { setErr("Email and password are required"); return; }
      setBusy(true);
      try {
        const u = await login(form.email, form.password);
        toast("Welcome back, " + (u.name || u.email) + "! 🎉");
      } catch (e) {
        setErr(e.message || "Couldn't sign in — check your details and connection");
      } finally {
        setBusy(false);
      }
      return;
    }
    // Offline demo mode — unchanged from before
    if (form.email === profile.email && form.password === profile.password) {
      login(form.email, form.password);
      toast("Welcome back, " + profile.name + "! 🎉");
    } else {
      setErr("Invalid email or password");
    }
  };

  return (
    <div className="login-pg">
      <div className="login-card fade-in">
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div className="l-logo-ic">🍗</div>
          <h1 style={{ fontFamily: "Poppins", fontSize: 20, fontWeight: 800, color: "#1a202c", marginTop: 8 }}>
            Welcome Back
          </h1>
          <p style={{ fontSize: 12, color: "#718096", marginTop: 3 }}>Ram Reddy Chicken Center</p>
        </div>

        {!API_ENABLED && (
          /* Offline demo mode hint — not shown once a real backend is connected */
          <div className="demo-hint">
            <p style={{ color: "rgba(255,255,255,.6)", fontSize: 11, marginBottom: 4 }}>🔑 Demo credentials</p>
            <p style={{ color: "#fbbf24", fontSize: 12, fontWeight: 600 }}>Email: demo@ramreddy.com</p>
            <p style={{ color: "#fbbf24", fontSize: 12, fontWeight: 600 }}>Password: demo123</p>
          </div>
        )}

        <div className="fg">
          <label className="fl">Email Address</label>
          <input
            className="inp" type="email" placeholder={API_ENABLED ? "you@example.com" : "demo@ramreddy.com"}
            value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          />
        </div>

        <div className="fg">
          <label className="fl">Password</label>
          <div className="pw-w">
            <input
              className="inp" type={show ? "text" : "password"} placeholder="••••••••"
              value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              onKeyDown={e => e.key === "Enter" && handle()}
            />
            <button className="pw-t" onClick={() => setShow(v => !v)}>
              <i className={`bi ${show ? "bi-eye-slash" : "bi-eye"}`} />
            </button>
          </div>
        </div>

        {err && (
          <p style={{ color: "var(--red)", fontSize: 12, marginBottom: 12, display: "flex", gap: 5, alignItems: "center" }}>
            <i className="bi bi-exclamation-circle" />{err}
          </p>
        )}

        <button className="btn btn-p" style={{ width: "100%", justifyContent: "center", padding: "11px" }} onClick={handle} disabled={busy}>
          <i className={`bi ${busy ? "bi-arrow-repeat" : "bi-box-arrow-in-right"}`} />
          {busy ? "Signing in…" : "Sign In"}
        </button>

        {API_ENABLED && (
          <p style={{ textAlign: "center", marginTop: 14, fontSize: 12, color: "#718096" }}>
            New staff accounts are created by the shop owner from the Profile page —
            there's no self-signup here.
          </p>
        )}
      </div>
    </div>
  );
}
