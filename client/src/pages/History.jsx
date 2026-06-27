// pages/History.jsx — invoice list, search, status filter, date range, view/cancel/delete actions
import React, { useState, useEffect } from "react";
import { useApp, fmtR, dateLabel } from "../context/AppContext";
import RegisterView from "../components/RegisterView";

export default function History() {
  const { invoices, updateInvoice, deleteInvoice, deleteInvoices, toast, isOwner } = useApp();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [view, setView] = useState(null);
  const [selected, setSelected] = useState([]); // array of invoice ids checked
  // confirm = { type: 'cancel'|'delete'|'delete-bulk', id?, count? }
  const [confirm, setConfirm] = useState(null);

  // Lock background scroll while a modal is open — otherwise the page behind
  // can keep scrolling/reflowing under the fixed overlay. Also compensate for
  // the scrollbar disappearing: without this, locking scroll removes the
  // scrollbar's width and the whole page visibly shifts a few pixels the
  // instant the modal opens — the background should look exactly the same
  // as it did right before clicking View, just dimmed behind the overlay.
  useEffect(() => {
    if (view || confirm) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [view, confirm]);

  const filtered = invoices.filter(inv => {
    const q = search.toLowerCase();
    const ms  = !search || inv.customer.toLowerCase().includes(q) || inv.id.toLowerCase().includes(q) || (inv.phone || "").includes(q);
    const mst = status === "All" || inv.status === status;
    const mf  = !from || inv.date >= from;
    const mt  = !to || inv.date <= to;
    return ms && mst && mf && mt;
  });

  const allChecked = filtered.length > 0 && filtered.every(inv => selected.includes(inv.id));
  const toggleAll = () => {
    if (allChecked) setSelected(s => s.filter(id => !filtered.some(inv => inv.id === id)));
    else setSelected(s => [...new Set([...s, ...filtered.map(inv => inv.id)])]);
  };
  const toggleOne = id => setSelected(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]));

  // ── confirmation-modal driven actions (replaces window.confirm popups) ──
  const askCancel     = id => setConfirm({ type: "cancel", id });
  const askDelete     = id => setConfirm({ type: "delete", id });
  const askDeleteBulk = () => setConfirm({ type: "delete-bulk", count: selected.length });

  const runConfirm = async () => {
    if (!confirm) return;
    try {
      if (confirm.type === "cancel") {
        await updateInvoice(confirm.id, { status: "Cancelled", paid: 0 });
        toast("Invoice cancelled", "info");
      } else if (confirm.type === "delete") {
        await deleteInvoice(confirm.id);
        setSelected(s => s.filter(x => x !== confirm.id));
        toast("Invoice deleted", "info");
      } else if (confirm.type === "delete-bulk") {
        await deleteInvoices(selected);
        toast(`${selected.length} invoice${selected.length > 1 ? "s" : ""} deleted`, "info");
        setSelected([]);
      }
    } catch (err) {
      toast(err.message || "Couldn't complete that action", "error");
    }
    setConfirm(null);
  };

  return (
    <div className="fade-in">
      <div className="ph"><div className="pt-title">History</div><div className="pt-sub">All invoices with search, filter & actions</div></div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 16, padding: "14px 18px" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          <div className="srch" style={{ flex: 1, minWidth: 200 }}>
            <i className="bi bi-search" />
            <input className="inp" placeholder="Search by name, invoice, phone…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {["All", "Active", "Cancelled"].map(s => (
            <button key={s} className={`chip ${status === s ? "on" : ""}`} onClick={() => setStatus(s)}>{s}</button>
          ))}
          <input type="date" className="inp" style={{ width: 140 }} value={from} onChange={e => setFrom(e.target.value)} placeholder="From" />
          <input type="date" className="inp" style={{ width: 140 }} value={to} onChange={e => setTo(e.target.value)} placeholder="To" />
          {(from || to || search || status !== "All") && (
            <button className="btn btn-s btn-sm" onClick={() => { setSearch(""); setStatus("All"); setFrom(""); setTo(""); }}>
              <i className="bi bi-x" />Clear
            </button>
          )}
          {isOwner && selected.length > 0 && (
            <button className="btn btn-d btn-sm" onClick={askDeleteBulk}>
              <i className="bi bi-trash" />Delete Selected ({selected.length})
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <div style={{ fontSize: 12, color: "var(--gray)", marginBottom: 12 }}>{filtered.length} invoices found</div>
        <div className="tw">
          <table>
            <thead>
              <tr>
                {isOwner && (
                  <th style={{ width: 30 }}>
                    <input type="checkbox" checked={allChecked} onChange={toggleAll} />
                  </th>
                )}
                <th>Invoice</th><th>Customer</th><th>Phone</th><th>Date</th><th>Items</th><th>Amount</th><th>Method</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={isOwner ? 10 : 9} style={{ textAlign: "center", padding: "32px 0", color: "var(--gray)" }}>
                  <i className="bi bi-inbox" style={{ fontSize: 28, display: "block", marginBottom: 8, opacity: 0.3 }} />No invoices found
                </td></tr>
              ) : filtered.map(inv => (
                <tr key={inv.id}>
                  {isOwner && (
                    <td>
                      <input type="checkbox" checked={selected.includes(inv.id)} onChange={() => toggleOne(inv.id)} />
                    </td>
                  )}
                  <td style={{ fontWeight: 700, color: "var(--red)" }}>{inv.id}</td>
                  <td style={{ fontWeight: 500 }}>{inv.customer}</td>
                  <td style={{ color: "var(--gray)", fontSize: 12 }}>{inv.phone || "—"}</td>
                  <td style={{ color: "var(--gray)", fontSize: 12, whiteSpace: "nowrap" }}>{dateLabel(inv.date)}</td>
                  <td style={{ fontSize: 12 }}>{inv.items.map(i => i.name).join(", ")}</td>
                  <td style={{ fontWeight: 700, color: "var(--green)" }}>{fmtR(inv.subtotal)}</td>
                  <td><span className="bdg bgr">{inv.method}</span></td>
                  <td><span className={`bdg ${inv.status === "Active" ? "bg" : "br"}`}>{inv.status}</span></td>
                  <td>
                    <div style={{ display: "flex", gap: 5 }}>
                      <button className="btn btn-s btn-sm" title="View" onClick={() => setView(inv)}><i className="bi bi-eye" /></button>
                      {inv.status === "Active" && (
                        <button className="btn btn-d btn-sm" title="Cancel" onClick={() => askCancel(inv.id)}><i className="bi bi-x-circle" /></button>
                      )}
                      {isOwner && (
                        <button className="btn btn-d btn-sm" title="Delete" onClick={() => askDelete(inv.id)}><i className="bi bi-trash" /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View modal — shows full register layout for register entries,
          plain invoice list for regular sales */}
      {view && (
        <div className="ov" onClick={() => setView(null)}>
          <div
            className="mb modal-in"
            onClick={e => e.stopPropagation()}
            style={{ maxWidth: view.registerSnapshot ? 720 : 560 }}
          >
            <div className="mh">
              <div>
                <h3>
                  {view.registerSnapshot
                    ? <><i className="bi bi-journal-richtext" style={{ marginRight: 8, color: "var(--red)" }} />Daily Sale Register — {view.id}</>
                    : <>Invoice {view.id}</>
                  }
                </h3>
                <div style={{ fontSize: 12, color: "var(--gray)", marginTop: 3 }}>
                  {view.customer} &nbsp;·&nbsp; <span className={`bdg ${view.status === "Active" ? "bg" : "br"}`}>{view.status}</span>
                </div>
              </div>
              <button className="btn btn-s btn-sm" onClick={() => setView(null)}>
                <i className="bi bi-x-lg" />
              </button>
            </div>

            <div className="mbody">
              {view.registerSnapshot
                ? /* ── Full register layout (same as entry form) ── */
                  <RegisterView reg={view.registerSnapshot} />
                : /* ── Plain invoice view for regular sales ── */
                  <>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{view.customer}</div>
                        <div style={{ fontSize: 12, color: "var(--gray)" }}>{view.phone || "No phone"}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span className={`bdg ${view.status === "Active" ? "bg" : "br"}`}>{view.status}</span>
                        <div style={{ fontSize: 12, color: "var(--gray)", marginTop: 4 }}>{dateLabel(view.date)}</div>
                      </div>
                    </div>
                    <table className="bill-t">
                      <thead><tr><th>Item</th><th>Qty</th><th>Rate</th><th>Total</th></tr></thead>
                      <tbody>
                        {view.items.map(it => (
                          <tr key={it.name}>
                            <td>{it.emoji} {it.name}</td>
                            <td>{it.qty}</td>
                            <td>{fmtR(it.rate)}</td>
                            <td style={{ fontWeight: 600 }}>{fmtR(it.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div style={{ borderTop: "2px solid var(--border)", marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontSize: 12, color: "var(--gray)" }}>Method: {view.method}</div>
                        <div style={{ fontSize: 12, color: "var(--green)", fontWeight: 600 }}>Paid: {fmtR(view.paid)}</div>
                      </div>
                      <div style={{ fontFamily: "Poppins", fontSize: 22, fontWeight: 800, color: "var(--red)" }}>{fmtR(view.subtotal)}</div>
                    </div>
                  </>
              }
            </div>

            <div className="mf">
              <button className="btn btn-s" onClick={() => setView(null)}>Close</button>
              <button className="btn btn-p" onClick={() => window.print()}><i className="bi bi-printer" />Print</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation modal — replaces window.confirm for cancel/delete/bulk-delete */}
      {confirm && (
        <div className="ov" onClick={() => setConfirm(null)}>
          <div className="mb modal-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 380 }}>
            <div className="mh">
              <h3>
                <i className="bi bi-exclamation-triangle" style={{ marginRight: 8, color: "var(--red)" }} />
                {confirm.type === "cancel" ? "Cancel Invoice?" : "Delete Invoice?"}
              </h3>
              <button className="btn btn-s btn-sm" onClick={() => setConfirm(null)}><i className="bi bi-x-lg" /></button>
            </div>
            <div className="mbody">
              <p style={{ fontSize: 13.5, color: "var(--dark2)", margin: 0 }}>
                {confirm.type === "cancel" && "This will mark the invoice as Cancelled and clear its paid amount. This can't be undone automatically."}
                {confirm.type === "delete" && "This will permanently remove this invoice from History. This can't be undone."}
                {confirm.type === "delete-bulk" && `This will permanently remove ${confirm.count} selected invoice${confirm.count > 1 ? "s" : ""} from History. This can't be undone.`}
              </p>
            </div>
            <div className="mf">
              <button className="btn btn-s" onClick={() => setConfirm(null)}>Keep</button>
              <button className="btn btn-d" onClick={runConfirm}>
                <i className={`bi ${confirm.type === "cancel" ? "bi-x-circle" : "bi-trash"}`} />
                {confirm.type === "cancel" ? "Cancel It" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
