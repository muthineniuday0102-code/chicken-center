// components/ExprInput.jsx
// A number-style input that also accepts arithmetic expressions like "120+560+120".
// While the user is typing, the raw text (including operators) is shown as-is.
// On blur (tab-out, click-away) or pressing Enter, the expression is evaluated
// down to a final number via evalExpr() from AppContext.
// Used for Payments Received fields (Order 1/2, Cash, Paytm, G.Pay, Food, Expenditure).

import { useState, useEffect } from "react";
import { evalExpr } from "../context/AppContext";

export default function ExprInput({ value, onChange, placeholder = "0", style = {}, className = "inp" }) {
  // Local draft state lets the user type "120+560" without it being evaluated
  // mid-keystroke; only commits (and evaluates) on blur/Enter.
  const [draft, setDraft] = useState(value ?? "");

  // Keep local draft in sync if the parent value changes externally (e.g. Reset)
  useEffect(() => {
    setDraft(value ?? "");
  }, [value]);

  const commit = () => {
    const evaluated = evalExpr(draft);
    setDraft(evaluated);
    onChange(evaluated);
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      className={className}
      style={style}
      placeholder={placeholder}
      value={draft}
      onChange={e => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={e => {
        if (e.key === "Enter") {
          commit();
          e.target.blur();
        }
      }}
    />
  );
}
