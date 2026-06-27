// components/RegisterView.jsx
// Read-only render of a saved Daily Sale Register entry (registerSnapshot on an
// invoice), shown in History's "View" modal for invoices created via the register.
import React from "react";
import { fmtR, fmtN, dateLabel } from "../context/AppContext";

const EGGS_PER_TRAY = 30;
const PR_COLS = ["L", "Skin", "SL", "Eggs", "Other"];

export default function RegisterView({ reg }) {
  if (!reg) return null;
  const { pr={}, bp={}, birds={}, eggs={}, natu={}, brown={}, cb, yBirds, yBirdsVal, pay={} } = reg;

  const defaultSoldRate  = fmtN(bp.SL)    || fmtN(pr.SL);    // Birds
  const defaultSoldRateE = fmtN(bp.Eggs)  || fmtN(pr.Eggs);  // Eggs
  const defaultSoldRateB = fmtN(bp.Other) || fmtN(pr.Other); // Brown Eggs

  const bStock     = fmtN(birds.cnt) * fmtN(birds.prc);
  const eStockCnt  = fmtN(eggs.cnt)  * (eggs.cntUnit  === "trays" ? EGGS_PER_TRAY : 1);
  const eStock     = eStockCnt * fmtN(eggs.prc);
  const nStock     = fmtN(natu.cnt)  * fmtN(natu.prc);
  const brStockCnt = fmtN(brown.cnt) * (brown.cntUnit === "trays" ? EGGS_PER_TRAY : 1);
  const brStock    = brStockCnt * fmtN(brown.prc);

  const bEffRate   = fmtN(birds.sprc) || defaultSoldRate;
  const eEffRate   = fmtN(eggs.sprc)  || defaultSoldRateE;
  const brEffRate  = fmtN(brown.sprc) || defaultSoldRateB;
  const eSoldCnt   = fmtN(eggs.sold)  * (eggs.soldUnit  === "trays" ? EGGS_PER_TRAY : 1);
  const brSoldCnt  = fmtN(brown.sold) * (brown.soldUnit === "trays" ? EGGS_PER_TRAY : 1);
  const bSold      = fmtN(birds.sold) / 1.65 * bEffRate;
  const eSold      = eSoldCnt  * eEffRate;
  const nSold      = fmtN(natu.sold)  * fmtN(natu.sprc);
  const brSold     = brSoldCnt * brEffRate;

  const bRem  = fmtN(birds.cnt) - fmtN(birds.sold);
  const eRem  = eStockCnt - eSoldCnt;
  const nRem  = fmtN(natu.cnt) - fmtN(natu.sold);
  const brRem = brStockCnt - brSoldCnt;

  const totalBirds    = fmtN(birds.cnt) + fmtN(yBirds);
  const birdsClear    = Math.max(0, totalBirds - fmtN(birds.sold)); // includes carried-forward yesterday birds, floored at 0
  const totalCash     = fmtN(pay.order1)+fmtN(pay.order2)+fmtN(pay.cash)+fmtN(pay.paytm)+fmtN(pay.gpay)+fmtN(pay.food)+fmtN(pay.exp);
  const counter       = totalCash - fmtN(pay.exp);
  const remainCash    = totalCash - fmtN(pay.food) - fmtN(pay.exp) - fmtN(cb);
  const totalStockIn  = bStock + eStock + nStock + brStock;
  const totalSoldAmt  = bSold  + eSold  + nSold  + brSold;

  // Remaining stock value (₹) — shown for visibility only, not part of Profit.
  // Birds: yBirdsVal (carried in at its own original price) + today's own
  // leftover (bRem, can go negative if sold dips into carried stock) at
  // today's price — same formula used live in DailySaleRegister.
  const bRemStock  = Math.max(0, fmtN(yBirdsVal) + bRem * fmtN(birds.prc));
  const eRemStock  = eRem  * fmtN(eggs.prc);
  const nRemStock  = nRem  * fmtN(natu.prc);
  const brRemStock = brRem * fmtN(brown.prc);
  const totalRemStock = bRemStock + eRemStock + nRemStock + brRemStock;

  // Profit = Sold − (Stock In − Remaining)
  const profit = totalSoldAmt - (totalStockIn - totalRemStock);

  // Read-only field pill
  const RF = ({ value }) => (
    <div style={{ textAlign:"center", padding:"5px 3px", fontSize:12, fontWeight:600, color:"var(--dark2)", background:"var(--light)", borderRadius:6, border:"1px solid var(--border)", minHeight:28 }}>
      {value || "—"}
    </div>
  );

  const SR = ({ label, value, accent, danger }) => (
    <div className="stat-row">
      <span className="stat-lbl" style={danger?{color:"var(--red)"}:{}}>{label}</span>
      <span className="stat-val" style={accent?{color:"var(--red)"}:danger?{color:"var(--red)"}:{}}>{value}</span>
    </div>
  );

  return (
    <div>
      {/* Date */}
      <div style={{display:"flex",justifyContent:"flex-end",marginBottom:14}}>
        <span style={{fontSize:12,color:"var(--gray)",fontWeight:600}}>
          <i className="bi bi-calendar3" style={{marginRight:5}}/>{dateLabel(reg.date)}
        </span>
      </div>

      {/* P.R. / B.P. */}
      <div className="g2" style={{marginBottom:10}}>
        {[{label:"P.R.",data:pr},{label:"B.P. / B.R.",data:bp}].map(box=>(
          <div key={box.label} style={{border:"1px solid var(--border)",borderRadius:10,padding:12}}>
            <div style={{fontSize:12,fontWeight:700,color:"var(--red)",marginBottom:8}}>{box.label}</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:4,marginBottom:4}}>
              {PR_COLS.map(c=><div key={c} style={{fontSize:10,color:"var(--gray)",textAlign:"center"}}>{c}</div>)}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:4}}>
              {PR_COLS.map(c=><RF key={c} value={box.data[c]}/>)}
            </div>
          </div>
        ))}
      </div>
      {(defaultSoldRate > 0 || defaultSoldRateE > 0 || defaultSoldRateB > 0) && (
        <p style={{fontSize:11,color:"var(--gray)",marginBottom:14}}>
          <i className="bi bi-info-circle"/> Default sold price used:
          {defaultSoldRate  > 0 && ` Birds ₹${defaultSoldRate}`}
          {defaultSoldRateE > 0 && `${defaultSoldRate > 0 ? " · " : " "}Eggs ₹${defaultSoldRateE}`}
          {defaultSoldRateB > 0 && `${(defaultSoldRate > 0 || defaultSoldRateE > 0) ? " · " : " "}Brown Eggs ₹${defaultSoldRateB}`}
        </p>
      )}

      {/* Stock entry */}
      <div className="stitle"><i className="bi bi-box-seam"/>Stock Entry</div>
      <div className="g4" style={{marginBottom:18,gap:10}}>
        {[
          {label:"Birds",      emoji:"🐔", data:birds, effSold:bSold,  effStock:bStock,  isTrayable:false, defaultRate:defaultSoldRate},
          {label:"Eggs",       emoji:"🥚", data:eggs,  effSold:eSold,  effStock:eStock,  isTrayable:true,  defaultRate:defaultSoldRateE},
          {label:"Natu Kodi",  emoji:"⭐", data:natu,  effSold:nSold,  effStock:nStock,  isTrayable:false, defaultRate:0},
          {label:"Brown Eggs", emoji:"🟤", data:brown, effSold:brSold, effStock:brStock, isTrayable:true,  defaultRate:defaultSoldRateB},
        ].map(box=>{
          const cntLabel  = box.isTrayable && box.data.cntUnit  === "trays" ? "trays" : "eggs";
          const soldLabel = box.isTrayable && box.data.soldUnit === "trays" ? "trays" : "eggs";
          return (
            <div key={box.label} style={{border:"1px solid var(--border)",borderRadius:10,padding:10}}>
              <div style={{fontSize:12,fontWeight:700,color:"var(--red)",marginBottom:8}}>{box.emoji} {box.label}</div>

              <div style={{fontSize:10,color:"var(--gray)",fontWeight:600,textTransform:"uppercase",marginBottom:4}}>Stock</div>
              <div className="g2" style={{gap:4,marginBottom:4}}>
                <RF value={box.data.cnt ? `${box.data.cnt}${box.isTrayable?" "+cntLabel:""}` : ""}/>
                <RF value={box.data.prc ? `₹${box.data.prc}` : ""}/>
              </div>
              <div style={{background:"var(--red-l)",border:"1px solid var(--red-b)",borderRadius:6,padding:"4px 8px",fontSize:11,fontWeight:600,color:"var(--red)",display:"flex",justifyContent:"space-between",marginTop:8,marginBottom:8}}>
                <span>Total</span><span>{fmtR(box.effStock)}</span>
              </div>

              <hr style={{border:"none",borderTop:"1px dashed var(--border)",margin:"8px 0"}}/>

              <div style={{fontSize:10,color:"var(--gray)",fontWeight:600,textTransform:"uppercase",marginBottom:4}}>Sold</div>
              <div className="g2" style={{gap:4,marginBottom:4}}>
                <RF value={box.data.sold ? `${box.data.sold}${box.isTrayable?" "+soldLabel:""}` : ""}/>
                <RF value={box.data.sprc ? `₹${box.data.sprc}` : (box.defaultRate ? `₹${box.defaultRate}` : "")}/>
              </div>
              <div style={{background:"var(--green-l)",border:"1px solid var(--green-b)",borderRadius:6,padding:"4px 8px",fontSize:11,fontWeight:600,color:"var(--green)",display:"flex",justifyContent:"space-between",marginTop:8}}>
                <span>Sold Total</span><span>{fmtR(box.effSold)}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary + Payments */}
      <div className="g2" style={{marginBottom:18}}>
        <div>
          <div className="stitle"><i className="bi bi-clipboard-data"/>Bird &amp; Stock Summary</div>
          <div style={{border:"1px solid var(--border)",borderRadius:10,padding:12}}>
            <SR label="C.B (Yesterday)"      value={fmtR(fmtN(cb))}/>
            <SR label="Birds remaining"       value={birdsClear}/>
            <SR label="Eggs remaining"        value={eRem}/>
            <SR label="Brown Eggs remaining"  value={brRem}/>
            <SR label="Natu Kodi remaining"   value={nRem}/>
            <SR label="Yesterday Birds"       value={fmtN(yBirds)}/>
            <SR label="Total Birds"           value={totalBirds}/>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:10,marginTop:4,borderTop:"2px solid var(--red)"}}>
              <span style={{fontWeight:700,color:"var(--red)",fontSize:13}}>Counter (Net)</span>
              <span style={{fontWeight:800,color:"var(--red)",fontSize:18,fontFamily:"Poppins"}}>{fmtR(counter)}</span>
            </div>
          </div>
        </div>
        <div>
          <div className="stitle"><i className="bi bi-cash-stack"/>Payments Received</div>
          <div style={{border:"1px solid var(--border)",borderRadius:10,padding:12}}>
            {[
              {label:"Order 1",key:"order1"},{label:"Order 2",key:"order2"},
              {label:"Cash",key:"cash"},{label:"Paytm",key:"paytm"},
              {label:"G.Pay",key:"gpay"},{label:"Food",key:"food"},
              {label:"Expenditure",key:"exp"},
            ].map(row=>(
              <SR key={row.key} label={row.label} value={fmtR(fmtN(pay[row.key]))}/>
            ))}
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:10,marginTop:4,borderTop:"2px solid var(--red)"}}>
              <span style={{fontWeight:700,color:"var(--red)",fontSize:13}}>Total Cash</span>
              <span style={{fontWeight:800,color:"var(--red)",fontSize:18,fontFamily:"Poppins"}}>{fmtR(totalCash)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Cash Flow */}
      <div className="stitle"><i className="bi bi-currency-rupee"/>Cash Flow</div>
      <div style={{border:"2px solid var(--red)",borderRadius:12,padding:16,marginBottom:18}}>
        <div className="g2" style={{alignItems:"center",gap:16}}>
          <div>
            <SR label="Total Cash"            value={fmtR(totalCash)}/>
            <SR label="− Food"                value={"−"+fmtR(fmtN(pay.food))} danger/>
            <SR label="− Expenditure"         value={"−"+fmtR(fmtN(pay.exp))}  danger/>
            <SR label="− C.B (Yesterday)"     value={"−"+fmtR(fmtN(cb))}       danger/>
          </div>
          <div style={{textAlign:"center",background:remainCash>=0?"var(--green-l)":"var(--red-l)",border:`2px solid ${remainCash>=0?"var(--green)":"var(--red)"}`,borderRadius:10,padding:16}}>
            <div style={{fontSize:11,color:"var(--gray)",fontWeight:600,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>Remaining Cash</div>
            <div style={{fontSize:22,fontWeight:800,fontFamily:"Poppins",color:remainCash>=0?"var(--green)":"var(--red)"}}>{fmtR(remainCash)}</div>
            <div style={{fontSize:11,marginTop:4,color:remainCash>=0?"var(--green)":"var(--red)"}}>{remainCash>=0?"✓ Balanced":"⚠ Deficit"}</div>
          </div>
        </div>
      </div>

      {/* Stock value summary */}
      <div className="g3" style={{gap:14}}>
        <div style={{background:"var(--red-l)",border:"1px solid var(--red-b)",borderRadius:10,padding:14}}>
          <div style={{fontSize:12,fontWeight:700,color:"var(--red)",marginBottom:8,textTransform:"uppercase",letterSpacing:1}}><i className="bi bi-box-arrow-in-down"/> Stock In</div>
          <SR label="Birds"      value={fmtR(bStock)}/>
          <SR label="Eggs"       value={fmtR(eStock)}/>
          <SR label="Natu Kodi"  value={fmtR(nStock)}/>
          <SR label="Brown Eggs" value={fmtR(brStock)}/>
          <div style={{display:"flex",justifyContent:"space-between",paddingTop:8,marginTop:4,borderTop:"1.5px solid var(--red-b)"}}>
            <span style={{fontWeight:700,color:"var(--red)"}}>Total In</span>
            <span style={{fontWeight:700,color:"var(--red)"}}>{fmtR(totalStockIn)}</span>
          </div>
        </div>
        <div style={{background:"var(--green-l)",border:"1px solid var(--green-b)",borderRadius:10,padding:14}}>
          <div style={{fontSize:12,fontWeight:700,color:"var(--green)",marginBottom:8,textTransform:"uppercase",letterSpacing:1}}><i className="bi bi-bag-check"/> Sold</div>
          <SR label="Birds"      value={fmtR(bSold)}/>
          <SR label="Eggs"       value={fmtR(eSold)}/>
          <SR label="Natu Kodi"  value={fmtR(nSold)}/>
          <SR label="Brown Eggs" value={fmtR(brSold)}/>
          <div style={{display:"flex",justifyContent:"space-between",paddingTop:8,marginTop:4,borderTop:"1.5px solid var(--green-b)"}}>
            <span style={{fontWeight:700,color:"var(--green)"}}>Total Sold</span>
            <span style={{fontWeight:700,color:"var(--green)"}}>{fmtR(totalSoldAmt)}</span>
          </div>
        </div>
        <div style={{background:"#fff7ed",border:"1px solid #fed7aa",borderRadius:10,padding:14}}>
          <div style={{fontSize:12,fontWeight:700,color:"#c2410c",marginBottom:8,textTransform:"uppercase",letterSpacing:1}}><i className="bi bi-archive"/> Remaining</div>
          <SR label="Birds"      value={fmtR(bRemStock)}/>
          <SR label="Eggs"       value={fmtR(eRemStock)}/>
          <SR label="Natu Kodi"  value={fmtR(nRemStock)}/>
          <SR label="Brown Eggs" value={fmtR(brRemStock)}/>
          <div style={{display:"flex",justifyContent:"space-between",paddingTop:8,marginTop:4,borderTop:"1.5px solid #fed7aa"}}>
            <span style={{fontWeight:700,color:"#c2410c"}}>Total Remaining</span>
            <span style={{fontWeight:700,color:"#c2410c"}}>{fmtR(totalRemStock)}</span>
          </div>
        </div>
      </div>

      {/* Profit = Sold − (Stock In − Remaining) */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:profit>=0?"var(--green-l)":"var(--red-l)",border:`2px solid ${profit>=0?"var(--green)":"var(--red)"}`,borderRadius:10,padding:"14px 18px",marginTop:14}}>
        <div>
          <div style={{fontWeight:700,fontSize:13,color:profit>=0?"var(--green)":"var(--red)"}}>Profit (Sold − (Stock In − Remaining))</div>
          <div style={{fontSize:11,color:"var(--gray)",marginTop:2}}>{fmtR(totalSoldAmt)} − ({fmtR(totalStockIn)} − {fmtR(totalRemStock)})</div>
        </div>
        <span style={{fontWeight:800,fontSize:22,fontFamily:"Poppins",color:profit>=0?"var(--green)":"var(--red)"}}>{fmtR(profit)}</span>
      </div>
    </div>
  );
}
