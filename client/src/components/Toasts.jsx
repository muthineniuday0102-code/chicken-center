// components/Toasts.jsx — floating toast notification stack (top-right)
import React from "react";
import { useApp } from "../context/AppContext";

export default function Toasts() {
  const { toasts } = useApp();
  return (
    <div className="tc no-print">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-in ${t.type === "success" ? "ts" : t.type === "error" ? "te" : "ti"}`}>
          <i className={`bi ${t.type === "success" ? "bi-check-circle" : t.type === "error" ? "bi-exclamation-circle" : "bi-info-circle"}`} />
          {t.msg}
        </div>
      ))}
    </div>
  );
}
