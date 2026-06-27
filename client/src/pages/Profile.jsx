// pages/Profile.jsx — offline mode: original demo profile editor, unchanged.
// API mode: real account info (read-only here) + Staff Account management,
// since that's the only place owner/staff logins can actually be created.
import React, { useState, useEffect } from "react";
import { useApp } from "../context/AppContext";
import { api, API_ENABLED } from "../api";

function StaffPanel({ toast }) {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [confirmId, setConfirmId] = useState(null);

  const load = () => {
    setLoading(true);
    api.listStaff()
      .then(({ staff }) => setStaff(staff))
      .catch(err => toast(err.message || "Couldn't load staff accounts", "error"))
      .finally(() => setLoading(false));
  };
  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const createStaff = async () => {
    if (!form.name.trim() || !form.email.trim() || form.password.length < 6) {
      toast("Name, email and a password (6+ chars) are required", "error");
      return;
    }
    setBusy(true);
    try {
      await api.createStaff(form.name.trim(), form.email.trim(), form.password);
      toast(`Staff account created for ${form.name} ✓`);
      setForm({ name: "", email: "", password: "" });
      load();
    } catch (err) {
      toast(err.message || "Couldn't create staff account", "error");
    } finally {
      setBusy(false);
    }
  };

  const revoke = async id => {
    try {
      await api.deleteStaff(id);
      toast("Staff account revoked", "info");
      setStaff(s => s.filter(s2 => s2._id !== id));
    } catch (err) {
      toast(err.message || "Couldn't revoke that account", "error");
    }
    setConfirmId(null);
  };

  return (
    <div className="card">
      <div className="stitle"><i className="bi bi-people-fill" />Staff Accounts</div>
      <p style={{ fontSize: 12, color: "var(--gray)", marginBottom: 14 }}>
        Staff logins can record sales and view reports, but can't delete invoices/expenses
        or create other staff accounts — only you (the owner) can do that.
      </p>

      <div className="fg"><label className="fl">Full Name</label>
        <input className="inp" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Staff member's name" />
      </div>
      <div className="fg"><label className="fl">Email</label>
        <input className="inp" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="their@email.com" />
      </div>
      <div className="fg"><label className="fl">Temporary Password</label>
        <input className="inp" type="text" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 6 characters — share with them" />
      </div>
      <button className="btn btn-p" style={{ width: "100%", justifyContent: "center", marginBottom: 18 }} onClick={createStaff} disabled={busy}>
        <i className="bi bi-person-plus" />{busy ? "Creating…" : "Create Staff Login"}
      </button>

      <div className="stitle" style={{ fontSize: 12 }}><i className="bi bi-list-ul" />Current Staff</div>
      {loading ? (
        <p style={{ fontSize: 12, color: "var(--gray)" }}>Loading…</p>
      ) : staff.length === 0 ? (
        <p style={{ fontSize: 12, color: "var(--gray)" }}>No staff accounts yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {staff.map(s => (
            <div key={s._id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", background: "var(--light)", borderRadius: 8 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{s.name}</div>
                <div style={{ fontSize: 11, color: "var(--gray)" }}>{s.email}</div>
              </div>
              {confirmId === s._id ? (
                <div style={{ display: "flex", gap: 6 }}>
                  <button className="btn btn-s btn-sm" onClick={() => setConfirmId(null)}>Keep</button>
                  <button className="btn btn-d btn-sm" onClick={() => revoke(s._id)}>Revoke</button>
                </div>
              ) : (
                <button className="btn btn-d btn-sm" onClick={() => setConfirmId(s._id)}><i className="bi bi-trash" />Revoke</button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Profile() {
  const { profile, setProfile, toast, user, isOwner } = useApp();

  // All hooks declared unconditionally (rules of hooks) — branching happens
  // only in the JSX below. API_ENABLED never changes during the app's
  // lifetime, so these offline-mode fields are simply unused in API mode.
  const [form, setForm] = useState({ name: profile.name, shop: profile.shop, email: profile.email });
  const [pw, setPw] = useState({ cur: "", new: "", confirm: "" });
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);

  if (API_ENABLED) {
    const initials = (user?.name || "?").split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);
    return (
      <div className="fade-in">
        <div className="ph"><div className="pt-title">Profile</div><div className="pt-sub">Account & staff management</div></div>
        <div className="g2" style={{ maxWidth: 860 }}>
          <div className="card">
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg,#c0392b,#922b21)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 26, margin: "0 auto 10px", boxShadow: "0 4px 16px rgba(192,57,43,.3)" }}>
                {initials}
              </div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{user?.name}</div>
              <div style={{ fontSize: 12, color: "var(--gray)" }}>{user?.email}</div>
              <span className="bdg br" style={{ marginTop: 6 }}>{user?.role === "owner" ? "Owner" : "Staff"}</span>
            </div>
            <p style={{ fontSize: 12, color: "var(--gray)", textAlign: "center" }}>
              {user?.shop}
            </p>
          </div>
          {isOwner ? <StaffPanel toast={toast} /> : (
            <div className="card">
              <div className="stitle"><i className="bi bi-shield-lock" />Limited Access</div>
              <p style={{ fontSize: 12, color: "var(--gray)" }}>
                You're signed in as staff. Deleting invoices/expenses and managing other
                staff accounts is restricted to the owner.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Offline demo mode — original editable profile, unchanged ──────────────
  const saveProfile = () => {
    if (!form.name.trim()) { toast("Name required", "error"); return; }
    setProfile(p => ({ ...p, ...form }));
    toast("Profile updated ✓");
  };

  const changePw = () => {
    if (pw.cur !== profile.password) { toast("Current password incorrect", "error"); return; }
    if (pw.new.length < 6) { toast("Min 6 characters", "error"); return; }
    if (pw.new !== pw.confirm) { toast("Passwords do not match", "error"); return; }
    setProfile(p => ({ ...p, password: pw.new }));
    setPw({ cur: "", new: "", confirm: "" });
    toast("Password changed ✓");
  };

  const initials = profile.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="fade-in">
      <div className="ph"><div className="pt-title">Profile</div><div className="pt-sub">Manage account & shop settings</div></div>
      <div className="g2" style={{ maxWidth: 860 }}>

        {/* Edit profile */}
        <div className="card">
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg,#c0392b,#922b21)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 26, margin: "0 auto 10px", boxShadow: "0 4px 16px rgba(192,57,43,.3)" }}>
              {initials}
            </div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{profile.name}</div>
            <div style={{ fontSize: 12, color: "var(--gray)" }}>{profile.email}</div>
            <span className="bdg br" style={{ marginTop: 6 }}>{profile.role}</span>
          </div>
          <div className="stitle"><i className="bi bi-person-fill" />Edit Info</div>
          <div className="fg"><label className="fl">Full Name</label><input className="inp" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div className="fg"><label className="fl">Shop Name</label><input className="inp" value={form.shop} onChange={e => setForm(f => ({ ...f, shop: e.target.value }))} /></div>
          <div className="fg"><label className="fl">Email</label><input className="inp" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} /></div>
          <button className="btn btn-p" style={{ width: "100%", justifyContent: "center" }} onClick={saveProfile}>
            <i className="bi bi-check2-circle" />Save Profile
          </button>
        </div>

        {/* Change password */}
        <div className="card">
          <div className="stitle"><i className="bi bi-shield-lock" />Change Password</div>
          <div className="fg">
            <label className="fl">Current Password</label>
            <div className="pw-w">
              <input className="inp" type={showCur ? "text" : "password"} value={pw.cur} onChange={e => setPw(p => ({ ...p, cur: e.target.value }))} placeholder="Current password" />
              <button className="pw-t" onClick={() => setShowCur(v => !v)}><i className={`bi ${showCur ? "bi-eye-slash" : "bi-eye"}`} /></button>
            </div>
          </div>
          <div className="fg">
            <label className="fl">New Password</label>
            <div className="pw-w">
              <input className="inp" type={showNew ? "text" : "password"} value={pw.new} onChange={e => setPw(p => ({ ...p, new: e.target.value }))} placeholder="Min 6 characters" />
              <button className="pw-t" onClick={() => setShowNew(v => !v)}><i className={`bi ${showNew ? "bi-eye-slash" : "bi-eye"}`} /></button>
            </div>
          </div>
          <div className="fg">
            <label className="fl">Confirm Password</label>
            <input className="inp" type="password" value={pw.confirm} onChange={e => setPw(p => ({ ...p, confirm: e.target.value }))} placeholder="Re-enter new password" />
          </div>
          {pw.new && pw.confirm && pw.new !== pw.confirm && (
            <p style={{ fontSize: 12, color: "var(--red)", marginBottom: 10 }}><i className="bi bi-exclamation-circle" /> Passwords do not match</p>
          )}
          <button className="btn btn-p" style={{ width: "100%", justifyContent: "center" }} onClick={changePw}>
            <i className="bi bi-lock" />Update Password
          </button>
          <div style={{ background: "var(--dark)", borderRadius: 10, padding: "12px 14px", marginTop: 18 }}>
            <p style={{ color: "rgba(255,255,255,.6)", fontSize: 11, marginBottom: 4 }}>🔑 Demo credentials</p>
            <p style={{ color: "#fbbf24", fontSize: 12, fontWeight: 600 }}>demo@ramreddy.com / demo123</p>
          </div>
        </div>
      </div>
    </div>
  );
}
