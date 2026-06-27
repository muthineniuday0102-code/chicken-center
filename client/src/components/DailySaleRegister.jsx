// components/DailySaleRegister.jsx
// "Daily Sale" module — embedded inside Dashboard.jsx below the KPI cards.
// Replicates the paper chicken-reg register: P.R./B.P. entry, stock (count×price),
// payments received, and cash flow. On Save, the entry is migrated into a real
// Invoice (+ Expense if expenditure was logged) via AppContext.migrateRegisterEntry,
// so it automatically flows into Dashboard KPIs, History, Reports, and Monthly Profit.

import React, { useState, useEffect } from "react";
import { useApp, fmtR, fmtN, today } from "../context/AppContext";
import ExprInput from "./ExprInput";

const blankItem = () => ({ cnt: "", prc: "", sold: "", sprc: "" });
// Eggs & Brown Eggs can be entered as individual eggs OR as trays (1 tray = 30 eggs).
// cntUnit/soldUnit are 'eggs' or 'trays' — toggled independently for stock vs sold.
const blankEggItem = () => ({ cnt: "", prc: "", sold: "", sprc: "", cntUnit: "eggs", soldUnit: "eggs" });
const EGGS_PER_TRAY = 30;
// B.P./B.R. row — plain P.R. columns, no separate rate field. The SL column's
// own value is used directly as the default sold price for Birds, Eggs, and
// Brown Eggs below (no extra "SL Rate" box).
const blankPr = () => ({ L: "", Skin: "", SL: "", Eggs: "", Other: "" });
const PR_COLS = ["L", "Skin", "SL", "Eggs", "Other"];

export default function DailySaleRegister({ collapsed, onToggle }) {
  const { migrateRegisterEntry, getCarryForwardBirds, getCarryForwardBirdsValue, toast } = useApp();

  const [date, setDate]   = useState(today());
  const [pr, setPr]       = useState(blankPr());
  const [bp, setBp]       = useState(blankPr());
  const [birds, setBirds] = useState(blankItem());
  const [eggs, setEggs]   = useState(blankEggItem());
  const [natu, setNatu]   = useState(blankItem());
  const [brown, setBrown] = useState(blankEggItem());
  const [cb, setCb]       = useState("");
  const [yBirds, setYBirds] = useState("");
  const [yBirdsAuto, setYBirdsAuto] = useState(true); // true = auto carry-forward, false = user overrode it
  const [pay, setPay] = useState({ order1: "", order2: "", cash: "", paytm: "", gpay: "", food: "", exp: "" });
  const setP = key => val => setPay(p => ({ ...p, [key]: val }));

  // ── Carry forward: auto-fill Yesterday Birds from the most recent saved
  // register's "Birds remaining", whenever the date changes (and the field
  // hasn't been manually overridden by the user for this date).
  useEffect(() => {
    if (yBirdsAuto) {
      const carried = getCarryForwardBirds(date);
      setYBirds(carried > 0 ? String(carried) : "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const handleYBirdsChange = val => {
    setYBirdsAuto(false); // user is typing manually, stop auto-overwriting
    setYBirds(val);
  };

  // B.P./B.R. has separate columns for Birds (SL), Eggs (Eggs), and Brown Eggs
  // (Other) — each is its own default sold price, NOT one shared rate. Prefer
  // B.P./B.R., fall back to P.R. if blank, per category.
  const defaultSoldRate  = fmtN(bp.SL)    || fmtN(pr.SL);    // Birds
  const defaultSoldRateE = fmtN(bp.Eggs)  || fmtN(pr.Eggs);  // Eggs
  const defaultSoldRateB = fmtN(bp.Other) || fmtN(pr.Other); // Brown Eggs

  // ── derived calculations ────────────────────────────────────────────────
  const bStock  = fmtN(birds.cnt) * fmtN(birds.prc);
  // Eggs/Brown Eggs: if entered as trays, effective count = trays × 30, then × price
  const eStockCnt  = fmtN(eggs.cnt)  * (eggs.cntUnit  === "trays" ? EGGS_PER_TRAY : 1);
  const eStock  = eStockCnt * fmtN(eggs.prc);
  const nStock  = fmtN(natu.cnt) * fmtN(natu.prc);
  const brStockCnt = fmtN(brown.cnt) * (brown.cntUnit === "trays" ? EGGS_PER_TRAY : 1);
  const brStock = brStockCnt * fmtN(brown.prc);

  // Effective sold price = what the user typed, or that category's own default
  const bEffRate  = fmtN(birds.sprc) || defaultSoldRate;
  const eEffRate  = fmtN(eggs.sprc)  || defaultSoldRateE;
  const brEffRate = fmtN(brown.sprc) || defaultSoldRateB;
  const eSoldCnt  = fmtN(eggs.sold)  * (eggs.soldUnit  === "trays" ? EGGS_PER_TRAY : 1);
  const brSoldCnt = fmtN(brown.sold) * (brown.soldUnit === "trays" ? EGGS_PER_TRAY : 1);
  const bSold  = fmtN(birds.sold) / 1.65 * bEffRate;
  const eSold  = eSoldCnt * eEffRate;
  const nSold  = fmtN(natu.sold) * fmtN(natu.sprc);
  const brSold = brSoldCnt * brEffRate;

  const bRem  = fmtN(birds.cnt) - fmtN(birds.sold);
  const eRem  = eStockCnt - eSoldCnt;   // compared in actual egg units, not trays
  const nRem  = fmtN(natu.cnt) - fmtN(natu.sold);
  const brRem = brStockCnt - brSoldCnt; // compared in actual egg units, not trays

  const todayBirds = fmtN(birds.cnt);
  const totalBirds = todayBirds + fmtN(yBirds); // today's stock + carried-forward yesterday birds
  const birdsClear = Math.max(0, totalBirds - fmtN(birds.sold)); // what's left after today's sales — carries to tomorrow, floored at 0 so a full sell-out (or slight oversell) never shows negative

  // ₹ value of birds carried forward from previous day(s), valued at the
  // price they were actually bought at (not re-priced at today's rate).
  // Purely derived — not user-editable, since it's bookkeeping, not a count
  // you'd physically recount.
  const yBirdsVal = getCarryForwardBirdsValue(date);

  const totalCash = fmtN(pay.order1) + fmtN(pay.order2) + fmtN(pay.cash) + fmtN(pay.paytm) + fmtN(pay.gpay) + fmtN(pay.food) + fmtN(pay.exp);
  const counter = totalCash - fmtN(pay.exp);
  const remainCash = totalCash - fmtN(pay.food) - fmtN(pay.exp) - fmtN(cb);

  const totalStockIn = bStock + eStock + nStock + brStock;
  const totalSoldAmt = bSold + eSold + nSold + brSold;

  // Remaining stock value (₹) per category — what's left unsold, valued at
  // the same purchase price used for Stock In. Shown for visibility only;
  // it is NOT part of the Profit formula below.
  // Birds is special-cased: bRem here is only TODAY's leftover (today's
  // count − sold), which can go negative once sold dips into yesterday's
  // carried stock — adding yBirdsVal on top nets that out correctly, so the
  // carried-in birds stay valued at their own original price instead of
  // being silently re-priced at today's rate.
  const bRemStock  = Math.max(0, yBirdsVal + bRem * fmtN(birds.prc));
  const eRemStock  = Math.max(0, eRem  * fmtN(eggs.prc));
  const nRemStock  = Math.max(0, nRem  * fmtN(natu.prc));
  const brRemStock = Math.max(0, brRem * fmtN(brown.prc));
  const totalRemStock = bRemStock + eRemStock + nRemStock + brRemStock;

  // Profit = Sold − (Stock In − Remaining). (Stock In − Remaining) is the
  // value of stock actually consumed/sold (cost of goods sold), so this
  // nets out unsold inventory from the cost side instead of ignoring it.
  const profit = totalSoldAmt - (totalStockIn - totalRemStock);

  // ── reset ────────────────────────────────────────────────────────────────
  // `freshCarry` — when called right after a save, this is the just-computed
  // carry-forward from THAT save, used directly instead of re-reading
  // context (which may not have re-rendered with the new registerHistory
  // yet) — this is what fixes "Yesterday Birds" showing a stale prior value
  // immediately after you've just fully sold it off.
  const reset = (freshCarry) => {
    const d = today();
    setDate(d);
    setPr(blankPr()); setBp(blankPr());
    setBirds(blankItem()); setEggs(blankEggItem());
    setNatu(blankItem()); setBrown(blankEggItem());
    setCb("");
    setYBirdsAuto(true);
    const carried = freshCarry ? freshCarry.remaining : getCarryForwardBirds(d);
    setYBirds(carried > 0 ? String(carried) : "");
    setPay({ order1: "", order2: "", cash: "", paytm: "", gpay: "", food: "", exp: "" });
  };

  // ── save & migrate ───────────────────────────────────────────────────────
  const handleSave = async () => {
    if (totalSoldAmt <= 0 && totalCash <= 0) {
      toast("Enter at least one sold item or payment before saving", "error");
      return;
    }
    // Resolve Birds/Eggs/Brown Eggs sold-price down to the effective rate
    // (their own typed price, or the B.P./B.R. SL value as default) before
    // handing off to migration.
    const birdsResolved = { ...birds, sprc: birds.sprc || (defaultSoldRate  ? String(defaultSoldRate)  : "") };
    const eggsResolved  = { ...eggs,  sprc: eggs.sprc  || (defaultSoldRateE ? String(defaultSoldRateE) : "") };
    const brownResolved = { ...brown, sprc: brown.sprc || (defaultSoldRateB ? String(defaultSoldRateB) : "") };
    const reg = { date, pr, bp, birds: birdsResolved, eggs: eggsResolved, natu, brown: brownResolved, cb, yBirds, yBirdsVal, pay };
    try {
      const { invoice, dayEntry } = await migrateRegisterEntry(reg);
      toast(`Register saved as ${invoice.id} — synced to History, Reports & Monthly Profit ✓`);
      reset(dayEntry);
    } catch (err) {
      toast(err.message || "Couldn't save — please try again", "error");
    }
  };

  return (
    <div className="card" style={{ marginBottom: 20 }}>
      <div
        className="stitle"
        style={{ marginBottom: collapsed ? 0 : 14, cursor: "pointer" }}
        onClick={onToggle}
      >
        <i className="bi bi-journal-richtext" />
        Daily Sale — Register
        <span style={{ marginLeft: "auto", color: "var(--gray)", fontWeight: 400, textTransform: "none", letterSpacing: 0, fontSize: 11 }}>
          <i className={`bi ${collapsed ? "bi-chevron-down" : "bi-chevron-up"}`} />
        </span>
      </div>

      {!collapsed && (
        <div>
          {/* Date */}
          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <label className="fl" style={{ marginBottom: 0 }}>Date:</label>
            <input type="date" className="inp" style={{ maxWidth: 160 }} value={date} onChange={e => setDate(e.target.value)} />
          </div>

          {/* P.R. / B.P. entry — plain columns, no separate rate field. The SL
              value entered here directly becomes the default sold price below. */}
          <div className="g2" style={{ marginBottom: 10 }}>
            {[
              { label: "P.R.", data: pr, set: setPr },
              { label: "B.P. / B.R.", data: bp, set: setBp },
            ].map(box => (
              <div key={box.label} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--red)", marginBottom: 8 }}>{box.label}</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 4, marginBottom: 4 }}>
                  {PR_COLS.map(c => (
                    <div key={c} style={{ fontSize: 10, color: "var(--gray)", textAlign: "center" }}>{c}</div>
                  ))}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 4 }}>
                  {PR_COLS.map(c => (
                    <input
                      key={c} type="number" className="inp" placeholder="0"
                      style={{ textAlign: "center", padding: "5px 3px", fontSize: 12 }}
                      value={box.data[c]} onChange={e => box.set({ ...box.data, [c]: e.target.value })}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
          {(defaultSoldRate > 0 || defaultSoldRateE > 0 || defaultSoldRateB > 0) && (
            <p style={{ fontSize: 11, color: "var(--gray)", marginBottom: 16 }}>
              <i className="bi bi-info-circle" /> Using as default sold price (override below if needed):
              {defaultSoldRate  > 0 && ` Birds ₹${defaultSoldRate} (SL)`}
              {defaultSoldRateE > 0 && `${defaultSoldRate > 0 ? " · " : " "}Eggs ₹${defaultSoldRateE} (Eggs)`}
              {defaultSoldRateB > 0 && `${(defaultSoldRate > 0 || defaultSoldRateE > 0) ? " · " : " "}Brown Eggs ₹${defaultSoldRateB} (Other)`}
            </p>
          )}

          {/* Stock entry — count × price */}
          <div className="stitle"><i className="bi bi-box-seam" />Stock Entry — Count × Price = Total</div>
          <div className="g4" style={{ marginBottom: 18, gap: 10 }}>
            {[
              { label: "Birds", emoji: "🐔", data: birds, set: setBirds, effSold: bSold, effStock: bStock, useDefault: true, defaultRate: defaultSoldRate, isTrayable: false },
              { label: "Eggs", emoji: "🥚", data: eggs, set: setEggs, effSold: eSold, effStock: eStock, useDefault: true, defaultRate: defaultSoldRateE, isTrayable: true },
              { label: "Natu Kodi", emoji: "⭐", data: natu, set: setNatu, effSold: nSold, effStock: nStock, useDefault: false, defaultRate: 0, isTrayable: false },
              { label: "Brown Eggs", emoji: "🟤", data: brown, set: setBrown, effSold: brSold, effStock: brStock, useDefault: true, defaultRate: defaultSoldRateB, isTrayable: true },
            ].map(box => {
              const set = key => val => box.set({ ...box.data, [key]: val });
              const sprcPlaceholder = box.useDefault && box.defaultRate ? `₹${box.defaultRate} (default)` : "Price ₹";
              const UnitToggle = ({ field, current }) => (
                <div style={{ display: "flex", gap: 3, marginTop: 3 }}>
                  {["eggs", "trays"].map(u => (
                    <button
                      key={u} type="button"
                      onClick={() => set(field)(u)}
                      style={{
                        fontSize: 9, padding: "2px 7px", borderRadius: 10, border: "1px solid var(--border)",
                        background: current === u ? "var(--red)" : "var(--white)",
                        color: current === u ? "#fff" : "var(--gray)",
                        cursor: "pointer", fontWeight: 600,
                      }}
                    >
                      {u === "trays" ? "Trays (×30)" : "Eggs"}
                    </button>
                  ))}
                </div>
              );
              return (
                <div key={box.label} style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--red)", marginBottom: 8 }}>{box.emoji} {box.label}</div>
                  <div style={{ fontSize: 10, color: "var(--gray)", fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>Stock</div>
                  <div className="g2" style={{ gap: 4, marginBottom: 4 }}>
                    <input type="number" className="inp" placeholder={box.isTrayable ? (box.data.cntUnit === "trays" ? "Trays" : "Eggs") : "Count"} value={box.data.cnt} onChange={e => set("cnt")(e.target.value)} />
                    <input type="number" className="inp" placeholder={box.isTrayable ? "Price ₹/egg" : "Price ₹"} value={box.data.prc} onChange={e => set("prc")(e.target.value)} />
                  </div>
                  {box.isTrayable && <UnitToggle field="cntUnit" current={box.data.cntUnit} />}
                  <div style={{ background: "var(--red-l)", border: "1px solid var(--red-b)", borderRadius: 6, padding: "4px 8px", fontSize: 11, fontWeight: 600, color: "var(--red)", display: "flex", justifyContent: "space-between", marginTop: 8, marginBottom: 8 }}>
                    <span>Total</span><span>{fmtR(box.effStock)}</span>
                  </div>
                  <hr style={{ border: "none", borderTop: "1px dashed var(--border)", margin: "8px 0" }} />
                  <div style={{ fontSize: 10, color: "var(--gray)", fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>Sold</div>
                  <div className="g2" style={{ gap: 4, marginBottom: 4 }}>
                    <input type="number" className="inp" placeholder={box.isTrayable ? (box.data.soldUnit === "trays" ? "Trays" : "Eggs") : "Count"} value={box.data.sold} onChange={e => set("sold")(e.target.value)} />
                    <input type="number" className="inp" placeholder={sprcPlaceholder} value={box.data.sprc} onChange={e => set("sprc")(e.target.value)} />
                  </div>
                  {box.isTrayable && <UnitToggle field="soldUnit" current={box.data.soldUnit} />}
                  <div style={{ background: "var(--green-l)", border: "1px solid var(--green-b)", borderRadius: 6, padding: "4px 8px", fontSize: 11, fontWeight: 600, color: "var(--green)", display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                    <span>Sold Total</span><span>{fmtR(box.effSold)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary + Payments */}
          <div className="g2" style={{ marginBottom: 18 }}>
            {/* Bird & Stock Summary */}
            <div>
              <div className="stitle"><i className="bi bi-clipboard-data" />Bird &amp; Stock Summary</div>
              <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 12 }}>
                <div className="stat-row"><span className="stat-lbl">C.B (Yesterday)</span><input type="number" className="inp" style={{ maxWidth: 90 }} value={cb} onChange={e => setCb(e.target.value)} /></div>
                <div className="stat-row"><span className="stat-lbl">Birds remaining</span><span className="stat-val">{birdsClear}</span></div>
                <div className="stat-row"><span className="stat-lbl">Eggs remaining</span><span className="stat-val">{eRem}</span></div>
                <div className="stat-row"><span className="stat-lbl">Brown Eggs remaining</span><span className="stat-val">{brRem}</span></div>
                <div className="stat-row"><span className="stat-lbl">Natu Kodi remaining</span><span className="stat-val">{nRem}</span></div>
                <div className="stat-row">
                  <span className="stat-lbl">
                    Yesterday Birds
                    {yBirdsAuto && yBirds && <span style={{ marginLeft: 5, fontSize: 9, color: "var(--green)", fontWeight: 600 }}>(auto)</span>}
                  </span>
                  <input type="number" className="inp" style={{ maxWidth: 90 }} value={yBirds} onChange={e => handleYBirdsChange(e.target.value)} />
                </div>
                {yBirdsVal > 0 && (
                  <div className="stat-row">
                    <span className="stat-lbl" style={{ fontSize: 11 }}>↳ valued at (carried from before)</span>
                    <span className="stat-val" style={{ fontSize: 11 }}>{fmtR(yBirdsVal)}</span>
                  </div>
                )}
                <div className="stat-row"><span className="stat-lbl">Total Birds</span><span className="stat-val">{totalBirds}</span></div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, marginTop: 4, borderTop: "2px solid var(--red)" }}>
                  <span style={{ fontWeight: 700, color: "var(--red)", fontSize: 13 }}>Counter (Net)</span>
                  <span style={{ fontWeight: 800, color: "var(--red)", fontSize: 18, fontFamily: "Poppins" }}>{fmtR(counter)}</span>
                </div>
              </div>
            </div>

            {/* Payments Received */}
            <div>
              <div className="stitle"><i className="bi bi-cash-stack" />Payments Received</div>
              <div style={{ border: "1px solid var(--border)", borderRadius: 10, padding: 12 }}>
                {[
                  { label: "Order 1", key: "order1" }, { label: "Order 2", key: "order2" },
                  { label: "Cash", key: "cash" }, { label: "Paytm", key: "paytm" },
                  { label: "G.Pay", key: "gpay" }, { label: "Food", key: "food" },
                  { label: "Expenditure", key: "exp" },
                ].map(row => (
                  <div key={row.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "6px 0", borderBottom: "1px solid #f1f5f9" }}>
                    <span style={{ fontSize: 13, color: "var(--dark2)" }}>{row.label}</span>
                    <ExprInput value={pay[row.key]} onChange={setP(row.key)} style={{ maxWidth: 110, width: 110, textAlign: "right", border: "1.5px solid var(--border)", borderRadius: 8, padding: "8px 11px", fontSize: 13, background: "var(--white)" }} />
                  </div>
                ))}
                <p style={{ fontSize: 10.5, color: "var(--gray)", marginTop: 6, marginBottom: 0 }}>
                  <i className="bi bi-info-circle" /> Tip: type sums like <code>120+560+120</code> — it totals on Tab or click away.
                </p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, marginTop: 4, borderTop: "2px solid var(--red)" }}>
                  <span style={{ fontWeight: 700, color: "var(--red)", fontSize: 13 }}>Total Cash</span>
                  <span style={{ fontWeight: 800, color: "var(--red)", fontSize: 18, fontFamily: "Poppins" }}>{fmtR(totalCash)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cash Flow */}
          <div className="stitle"><i className="bi bi-currency-rupee" />Cash Flow</div>
          <div style={{ border: "2px solid var(--red)", borderRadius: 12, padding: 16, marginBottom: 18 }}>
            <div className="g2" style={{ alignItems: "center", gap: 16 }}>
              <div>
                <div className="stat-row"><span className="stat-lbl">Total Cash</span><span className="stat-val">{fmtR(totalCash)}</span></div>
                <div className="stat-row"><span className="stat-lbl" style={{ color: "var(--red)" }}>− Food</span><span className="stat-val" style={{ color: "var(--red)" }}>−{fmtR(fmtN(pay.food))}</span></div>
                <div className="stat-row"><span className="stat-lbl" style={{ color: "var(--red)" }}>− Expenditure</span><span className="stat-val" style={{ color: "var(--red)" }}>−{fmtR(fmtN(pay.exp))}</span></div>
                <div className="stat-row"><span className="stat-lbl" style={{ color: "var(--red)" }}>− C.B (Yesterday fees)</span><span className="stat-val" style={{ color: "var(--red)" }}>−{fmtR(fmtN(cb))}</span></div>
              </div>
              <div style={{ textAlign: "center", background: remainCash >= 0 ? "var(--green-l)" : "var(--red-l)", border: `2px solid ${remainCash >= 0 ? "var(--green)" : "var(--red)"}`, borderRadius: 10, padding: 16 }}>
                <div style={{ fontSize: 11, color: "var(--gray)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Remaining Cash</div>
                <div style={{ fontSize: 22, fontWeight: 800, fontFamily: "Poppins", color: remainCash >= 0 ? "var(--green)" : "var(--red)" }}>{fmtR(remainCash)}</div>
                <div style={{ fontSize: 11, marginTop: 4, color: remainCash >= 0 ? "var(--green)" : "var(--red)" }}>{remainCash >= 0 ? "✓ Balanced" : "⚠ Deficit"}</div>
              </div>
            </div>
          </div>

          {/* Stock value summary */}
          <div className="g3" style={{ marginBottom: 18, gap: 14 }}>
            <div style={{ background: "var(--red-l)", border: "1px solid var(--red-b)", borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--red)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}><i className="bi bi-box-arrow-in-down" /> Stock In</div>
              <div className="stat-row"><span className="stat-lbl">Birds</span><span className="stat-val">{fmtR(bStock)}</span></div>
              <div className="stat-row"><span className="stat-lbl">Eggs</span><span className="stat-val">{fmtR(eStock)}</span></div>
              <div className="stat-row"><span className="stat-lbl">Natu Kodi</span><span className="stat-val">{fmtR(nStock)}</span></div>
              <div className="stat-row"><span className="stat-lbl">Brown Eggs</span><span className="stat-val">{fmtR(brStock)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, marginTop: 4, borderTop: "1.5px solid var(--red-b)" }}>
                <span style={{ fontWeight: 700, color: "var(--red)" }}>Total In</span><span style={{ fontWeight: 700, color: "var(--red)" }}>{fmtR(totalStockIn)}</span>
              </div>
            </div>
            <div style={{ background: "var(--green-l)", border: "1px solid var(--green-b)", borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--green)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}><i className="bi bi-bag-check" /> Sold</div>
              <div className="stat-row"><span className="stat-lbl">Birds</span><span className="stat-val">{fmtR(bSold)}</span></div>
              <div className="stat-row"><span className="stat-lbl">Eggs</span><span className="stat-val">{fmtR(eSold)}</span></div>
              <div className="stat-row"><span className="stat-lbl">Natu Kodi</span><span className="stat-val">{fmtR(nSold)}</span></div>
              <div className="stat-row"><span className="stat-lbl">Brown Eggs</span><span className="stat-val">{fmtR(brSold)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, marginTop: 4, borderTop: "1.5px solid var(--green-b)" }}>
                <span style={{ fontWeight: 700, color: "var(--green)" }}>Total Sold</span><span style={{ fontWeight: 700, color: "var(--green)" }}>{fmtR(totalSoldAmt)}</span>
              </div>
            </div>
            <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#c2410c", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}><i className="bi bi-archive" /> Remaining</div>
              <div className="stat-row"><span className="stat-lbl">Birds</span><span className="stat-val">{fmtR(bRemStock)}</span></div>
              <div className="stat-row"><span className="stat-lbl">Eggs</span><span className="stat-val">{fmtR(eRemStock)}</span></div>
              <div className="stat-row"><span className="stat-lbl">Natu Kodi</span><span className="stat-val">{fmtR(nRemStock)}</span></div>
              <div className="stat-row"><span className="stat-lbl">Brown Eggs</span><span className="stat-val">{fmtR(brRemStock)}</span></div>
              <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 8, marginTop: 4, borderTop: "1.5px solid #fed7aa" }}>
                <span style={{ fontWeight: 700, color: "#c2410c" }}>Total Remaining</span><span style={{ fontWeight: 700, color: "#c2410c" }}>{fmtR(totalRemStock)}</span>
              </div>
            </div>
          </div>

          {/* Profit = Sold − Stock In (Remaining is shown above for visibility
              only — it deliberately is NOT part of this calculation, since
              unsold stock is inventory on hand, not a profit/loss yet) */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: profit >= 0 ? "var(--green-l)" : "var(--red-l)", border: `2px solid ${profit >= 0 ? "var(--green)" : "var(--red)"}`, borderRadius: 10, padding: "14px 18px", marginBottom: 18 }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, color: profit >= 0 ? "var(--green)" : "var(--red)" }}>Profit (Sold − (Stock In − Remaining))</div>
              <div style={{ fontSize: 11, color: "var(--gray)", marginTop: 2 }}>{fmtR(totalSoldAmt)} − ({fmtR(totalStockIn)} − {fmtR(totalRemStock)})</div>
            </div>
            <span style={{ fontWeight: 800, fontSize: 22, fontFamily: "Poppins", color: profit >= 0 ? "var(--green)" : "var(--red)" }}>{fmtR(profit)}</span>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10 }}>
            <button className="btn btn-s" onClick={reset}><i className="bi bi-arrow-counterclockwise" />Reset</button>
            <button className="btn btn-p" onClick={handleSave}>
              <i className="bi bi-cloud-arrow-up" />Save &amp; Migrate to App
            </button>
          </div>
          <p style={{ fontSize: 11, color: "var(--gray)", marginTop: 8 }}>
            <i className="bi bi-info-circle" /> Saving creates an invoice from sold items and syncs to History, Reports &amp; Monthly Profit automatically.
          </p>
        </div>
      )}
    </div>
  );
}
