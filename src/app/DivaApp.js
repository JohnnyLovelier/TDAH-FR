"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { INATTENTION, HYPERACTIVITY, IMPAIRMENT } from "./data";

// ── Colors (hardcoded for reliable rendering) ──
const C = {
  bg: "#f0f5f3", card: "#ffffff", text: "#1e3a34", muted: "#5c7a72", faint: "#9bb0a8",
  border: "#d4e4de", accent: "#2e8b6e", accentSoft: "#e2f2ec", accentDark: "#1f6b52",
  yes: "#2e8b5a", yesBg: "#e2f5eb", no: "#c0524a", noBg: "#fce8e6",
  hdr1: "#143830", hdr2: "#1f6b52", progress: "#4ec9a0",
};
const S = { r: 16, rs: 12, shadow: "0 2px 8px rgba(20,56,48,.07)", shadowLg: "0 6px 20px rgba(20,56,48,.10)" };

// ── Storage ──
const KEY = "diva2v4";
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
const save = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} };

function init() {
  const mkS = (a) => a.map((x) => ({ ac: Array(x.adult.length).fill(false), cc: Array(x.child.length).fill(false), ap: null, cp: null }));
  const mkD = (o) => Object.fromEntries(Object.keys(o).map((k) => [k, { checks: Array(o[k].items.length).fill(false), present: null }]));
  return { inatt: mkS(INATTENTION), hyper: mkS(HYPERACTIVITY), impA: mkD(IMPAIRMENT.adult), impC: mkD(IMPAIRMENT.child), onset7: null, onsetAge: "", critE: null, critEDetail: "" };
}

// ── Pill button ──
function Pill({ on, yes, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      padding: "8px 22px", borderRadius: 50, fontSize: 14, fontWeight: 600, minWidth: 68,
      background: on ? (yes ? C.yes : C.no) : C.border,
      color: on ? "#fff" : C.muted, transition: "all .15s",
      boxShadow: on ? `0 2px 8px ${yes ? "rgba(46,139,90,.25)" : "rgba(192,82,74,.2)"}` : "none",
    }}>{children}</button>
  );
}

// ── Checkbox ──
function Tick({ on, onChange, label }) {
  return (
    <label style={{
      display: "flex", alignItems: "flex-start", gap: 10, padding: "9px 12px",
      borderRadius: 10, cursor: "pointer", fontSize: 14, lineHeight: 1.55,
      background: on ? C.accentSoft : "transparent", transition: "background .15s", userSelect: "none",
    }}>
      <span style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 22, height: 22, minWidth: 22, borderRadius: 7, flexShrink: 0, marginTop: 1,
        border: on ? `2px solid ${C.accent}` : `2px solid ${C.border}`,
        background: on ? C.accent : "#fff", transition: "all .12s",
      }}>
        {on && <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5L9.5 3.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </span>
      <span>{label}</span>
      <input type="checkbox" checked={on} onChange={onChange} hidden />
    </label>
  );
}

// ── Progress bar ──
function Bar({ n, of, label, done }) {
  const p = of > 0 ? Math.round((n / of) * 100) : 0;
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.muted, marginBottom: 5, fontWeight: 500 }}>
        <span>{label}</span>
        {n === of && of > 0 && <span style={{ color: C.yes, fontWeight: 700 }}>{done || "✓ Terminé"}</span>}
      </div>
      <div style={{ height: 6, borderRadius: 4, background: C.border, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${p}%`, borderRadius: 4, background: C.accent, transition: "width .4s ease" }} />
      </div>
    </div>
  );
}

// ── Symptom Card ──
function SCard({ item, data, onTick, onSet }) {
  const [open, setOpen] = useState(false);
  const done = data.ap !== null && data.cp !== null;
  const both = data.ap === true && data.cp === true;
  const col = both ? C.yes : (data.ap === true || data.cp === true) ? C.accent : done ? C.no : C.border;

  return (
    <div style={{
      background: C.card, borderRadius: S.r, boxShadow: S.shadow, marginBottom: 12,
      overflow: "hidden", border: `2px solid ${open ? C.accent : C.border}`, transition: "border-color .2s",
    }}>
      <button onClick={() => setOpen(!open)} style={{
        width: "100%", display: "flex", alignItems: "center", padding: "15px 16px", textAlign: "left", gap: 12,
      }}>
        <span style={{
          width: 36, height: 36, minWidth: 36, borderRadius: 10,
          background: col, color: "#fff",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: 12, transition: "background .2s",
          boxShadow: `0 2px 6px ${col}33`,
        }}>
          {done ? "✓" : item.id}
        </span>
        <span style={{ flex: 1, fontSize: 14, fontWeight: 500, lineHeight: 1.5 }}>{item.q}</span>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ transform: open ? "rotate(180deg)" : "", transition: "transform .2s", flexShrink: 0 }}>
          <path d="M4.5 6.75L9 11.25L13.5 6.75" stroke={C.faint} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div style={{ padding: "0 16px 18px" }}>
          {["adult", "child"].map((age) => {
            const ex = age === "adult" ? item.adult : item.child;
            const ch = age === "adult" ? data.ac : data.cc;
            const pr = age === "adult" ? data.ap : data.cp;
            const pk = age === "adult" ? "ap" : "cp";
            return (
              <div key={age} style={{ marginBottom: age === "adult" ? 20 : 0, ...(age === "child" ? { borderTop: `1px solid ${C.border}`, paddingTop: 16 } : {}) }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: .8, color: age === "adult" ? C.accent : C.muted, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: age === "adult" ? C.accent : C.faint }} />
                  {age === "adult" ? "Âge adulte" : "Enfance (5–12 ans)"}
                </div>
                {ex.map((e, i) => <Tick key={i} on={ch[i]} label={e} onChange={() => onTick(age, i)} />)}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 13, color: C.muted }}>Symptôme présent :</span>
                  <Pill on={pr === true} yes onClick={() => onSet(pk, true)}>Oui</Pill>
                  <Pill on={pr === false} yes={false} onClick={() => onSet(pk, false)}>Non</Pill>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Domain Card ──
function DCard({ dom, data, onTick, onSet }) {
  const [show, setShow] = useState(false);
  const bc = data.present === true ? C.yes : data.present === false ? C.no : C.border;
  const bg = data.present === true ? C.yesBg : data.present === false ? C.noBg : C.card;
  return (
    <div style={{ border: `2px solid ${bc}`, borderRadius: S.rs, padding: "14px 16px", marginBottom: 12, background: bg, transition: "all .2s", boxShadow: S.shadow }}>
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>{dom.label}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: C.muted }}>Domaine impacté :</span>
        <Pill on={data.present === true} yes onClick={() => onSet(true)}>Oui</Pill>
        <Pill on={data.present === false} yes={false} onClick={() => onSet(false)}>Non</Pill>
      </div>
      <button onClick={() => setShow(!show)} style={{ fontSize: 13, color: C.faint, padding: "5px 14px", borderRadius: 50, border: `1px solid ${C.border}`, background: C.card, fontWeight: 500 }}>
        {show ? "Masquer les exemples ▴" : "Voir les exemples ▾"}
      </button>
      {show && <div style={{ marginTop: 10 }}>{dom.items.map((x, i) => <Tick key={i} on={data.checks[i]} label={x} onChange={() => onTick(i)} />)}</div>}
    </div>
  );
}

// ── Score Badge ──
function Badge({ v, label }) {
  const c = v >= 6 ? C.yes : v >= 4 ? C.accent : C.no;
  const p = (v / 9) * 360;
  return (
    <div style={{ textAlign: "center", flex: 1 }}>
      <div style={{ width: 58, height: 58, borderRadius: "50%", margin: "0 auto 5px", background: `conic-gradient(${c} ${p}deg, ${C.border} 0deg)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 18, color: c }}>{v}</div>
      </div>
      <div style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>{label}</div>
    </div>
  );
}

// ═══════════════════ MAIN ═══════════════════
const TABS = ["Symptômes", "Retentissement", "Résultats"];

export default function DivaApp() {
  const [s, setS] = useState(init);
  const [tab, setTab] = useState(0);
  const [sub, setSub] = useState(0);
  const [ok, setOk] = useState(false);
  const topRef = useRef(null);

  useEffect(() => { const d = load(); if (d?.inatt && d?.hyper && d?.impA && d?.impC) setS(d); setOk(true); }, []);
  useEffect(() => { if (ok) save(s); }, [s, ok]);
  useEffect(() => { topRef.current?.scrollIntoView({ behavior: "smooth" }); }, [tab, sub]);

  const tickEx = useCallback((cat, i, age, ei) => {
    setS((p) => {
      const n = { ...p, [cat]: [...p[cat]] };
      const fk = age === "adult" ? "ac" : "cc", pk = age === "adult" ? "ap" : "cp";
      const a = [...p[cat][i][fk]]; a[ei] = !a[ei];
      const u = { ...p[cat][i], [fk]: a };
      if (a.filter(Boolean).length > a.length / 2) u[pk] = true;
      else if (a.filter(Boolean).length === 0 && u[pk] === true) u[pk] = null;
      n[cat][i] = u; return n;
    });
  }, []);

  const setP = useCallback((cat, i, f, v) => {
    setS((p) => { const n = { ...p, [cat]: [...p[cat]] }; n[cat][i] = { ...p[cat][i], [f]: v }; return n; });
  }, []);

  const tickImp = useCallback((ak, dk, i) => {
    setS((p) => {
      const n = { ...p, [ak]: { ...p[ak] } }, d = { ...p[ak][dk] };
      const a = [...d.checks]; a[i] = !a[i]; d.checks = a;
      if (a.some(Boolean)) d.present = true; else if (d.present === true) d.present = null;
      n[ak][dk] = d; return n;
    });
  }, []);

  const setImp = useCallback((ak, dk, v) => {
    setS((p) => { const n = { ...p, [ak]: { ...p[ak] } }; n[ak][dk] = { ...p[ak][dk], present: v }; return n; });
  }, []);

  // Scores
  const aA = s.inatt.filter(d => d.ap === true).length, aC = s.inatt.filter(d => d.cp === true).length;
  const hA = s.hyper.filter(d => d.ap === true).length, hC = s.hyper.filter(d => d.cp === true).length;
  const iAD = Object.values(s.impA).filter(d => d.present === true).length;
  const iCD = Object.values(s.impC).filter(d => d.present === true).length;
  const iAOk = Object.values(s.impA).every(d => d.present !== null);
  const iCOk = Object.values(s.impC).every(d => d.present !== null);
  const aM = aA >= 6 && aC >= 6, hM = hA >= 6 && hC >= 6, iM = iAD >= 2 && iCD >= 2;
  const bOk = s.onset7 === true || (s.onset7 === false && s.onsetAge !== "");
  const eOk = s.critE === false;

  let dx = null;
  if (aM && hM && iM && eOk) dx = { c: "314.01", l: "Type combiné" };
  else if (aM && !hM && iM && eOk) dx = { c: "314.00", l: "Type inattentif prédominant" };
  else if (!aM && hM && iM && eOk) dx = { c: "314.01", l: "Type hyperactif/impulsif prédominant" };

  const syDone = [...s.inatt, ...s.hyper].filter(d => d.ap !== null && d.cp !== null).length;
  const dmDone = [...Object.values(s.impA), ...Object.values(s.impC)].filter(d => d.present !== null).length;
  const total = 30, done = syDone + dmDone + (bOk ? 1 : 0) + (s.critE !== null ? 1 : 0);
  const pct = Math.round(done / total * 100);

  const reset = () => { if (confirm("Réinitialiser toutes les réponses ?")) { setS(init()); setTab(0); setSub(0); try { localStorage.removeItem(KEY); } catch {} } };

  if (!ok) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><p style={{ color: C.muted }}>Chargement…</p></div>;

  const items = sub === 0 ? INATTENTION : HYPERACTIVITY;
  const cat = sub === 0 ? "inatt" : "hyper";
  const catN = s[cat].filter(d => d.ap !== null && d.cp !== null).length;

  const cardStyle = { background: C.card, borderRadius: S.r, padding: 18, marginBottom: 14, border: `1px solid ${C.border}`, boxShadow: S.shadow };
  const hintStyle = { fontSize: 13, color: C.muted, marginBottom: 14, padding: "10px 14px", background: C.card, borderRadius: S.rs, lineHeight: 1.6, border: `1px solid ${C.border}` };

  return (
    <div style={{ minHeight: "100vh", paddingBottom: 100 }}>
      <div ref={topRef} />

      {/* ═══ HEADER ═══ */}
      <div style={{
        background: `linear-gradient(135deg, ${C.hdr1} 0%, ${C.hdr2} 100%)`,
        padding: "28px 20px 22px", color: "#fff", position: "relative", overflow: "hidden",
      }}>
        {/* Deco circles */}
        <div style={{ position: "absolute", top: -40, right: -40, width: 140, height: 140, borderRadius: "50%", background: "rgba(255,255,255,.04)" }} />
        <div style={{ position: "absolute", bottom: -30, left: 30, width: 90, height: 90, borderRadius: "50%", background: "rgba(255,255,255,.03)" }} />

        <div style={{ fontSize: 26, fontWeight: 800, position: "relative" }}>DIVA 2.0</div>
        <div style={{ fontSize: 14, opacity: .75, marginTop: 3, position: "relative" }}>Entretien diagnostique pour le TDAH chez l'adulte</div>
        <div style={{ fontSize: 11, opacity: .35, marginTop: 6, position: "relative" }}>Kooij & Francken, 2010 — DIVA Foundation</div>

        {/* Progress */}
        <div style={{ marginTop: 18, position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, opacity: .65, marginBottom: 5 }}>
            <span>Progression : {pct} %</span><span>{done}/{total}</span>
          </div>
          <div style={{ height: 7, borderRadius: 4, background: "rgba(255,255,255,.15)", overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${pct}%`, borderRadius: 4, background: C.progress, transition: "width .4s ease" }} />
          </div>
        </div>

        {/* Mini scores */}
        <div style={{ display: "flex", gap: 8, marginTop: 16, flexWrap: "wrap", position: "relative" }}>
          {[{ l: "A adulte", v: aA, g: aA >= 6 }, { l: "A enfance", v: aC, g: aC >= 6 }, { l: "H/I adulte", v: hA, g: hA >= 6 }, { l: "H/I enfance", v: hC, g: hC >= 6 }].map(({ l, v, g }) => (
            <div key={l} style={{ background: g ? "rgba(78,201,160,.28)" : "rgba(255,255,255,.1)", borderRadius: 8, padding: "5px 12px", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 5, backdropFilter: "blur(4px)" }}>
              <span style={{ fontFamily: "monospace", fontSize: 16, fontWeight: 800 }}>{v}</span>
              <span style={{ opacity: .5, fontSize: 10 }}>/9</span>
              <span style={{ opacity: .85 }}>{l}</span>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div style={{ marginTop: 16, padding: "9px 13px", background: "rgba(255,255,255,.08)", borderRadius: 10, fontSize: 11, lineHeight: 1.55, color: "rgba(255,255,255,.55)", borderLeft: "3px solid rgba(255,255,255,.2)", position: "relative" }}>
          ⚠️ Cet outil est une aide à la passation de la DIVA 2.0 et ne remplace pas le jugement clinique d'un professionnel de santé qualifié. Le diagnostic de TDAH doit être posé par un clinicien formé.
        </div>
      </div>

      {/* ═══ TABS ═══ */}
      <div style={{ display: "flex", background: C.card, borderBottom: `1px solid ${C.border}`, position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 8px rgba(20,56,48,.05)" }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => { setTab(i); if (i === 0) setSub(0); }} style={{ flex: 1, padding: "14px 6px", borderBottom: tab === i ? `3px solid ${C.accent}` : "3px solid transparent", color: tab === i ? C.accent : C.faint, fontWeight: 700, fontSize: 14, transition: "all .15s" }}>{t}</button>
        ))}
      </div>

      <div style={{ maxWidth: 620, margin: "0 auto", padding: "16px 12px" }}>

        {/* ── SYMPTOMS ── */}
        {tab === 0 && (<>
          <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
            {["Inattention (A1–A9)", "Hyperactivité / Impulsivité (H/I 1–9)"].map((l, i) => (
              <button key={i} onClick={() => setSub(i)} style={{ flex: 1, padding: "10px 6px", borderRadius: 50, fontSize: 13, fontWeight: 700, background: sub === i ? C.accent : C.border, color: sub === i ? "#fff" : C.muted, transition: "all .15s", boxShadow: sub === i ? `0 2px 8px ${C.accent}33` : "none" }}>{l}</button>
            ))}
          </div>
          <Bar n={catN} of={items.length} label={`${catN}/${items.length} critères complétés`} />
          <div style={hintStyle}>Touchez chaque critère pour le déplier. Cochez les exemples reconnus, puis indiquez <strong>Oui / Non</strong> à l'âge adulte et durant l'enfance. Lorsque la majorité des exemples est cochée, « Oui » est défini automatiquement (modifiable).</div>
          {items.map((it, i) => <SCard key={it.id} item={it} data={s[cat][i]} onTick={(age, ei) => tickEx(cat, i, age, ei)} onSet={(f, v) => setP(cat, i, f, v)} />)}
        </>)}

        {/* ── IMPAIRMENT ── */}
        {tab === 1 && (<>
          <div style={hintStyle}>Pour chaque domaine, indiquez s'il est impacté via <strong>Oui / Non</strong>. Les exemples sont facultatifs, dépliez-les si besoin.</div>

          <div style={cardStyle}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 10 }}>Critère B — Âge de début</div>
            <div style={{ fontSize: 14, color: C.muted, marginBottom: 12, lineHeight: 1.55 }}>Quelques symptômes étaient-ils présents avant l'âge de 7 ans ?</div>
            <div style={{ display: "flex", gap: 8 }}>
              <Pill on={s.onset7 === true} yes onClick={() => setS(p => ({ ...p, onset7: true }))}>Oui</Pill>
              <Pill on={s.onset7 === false} yes={false} onClick={() => setS(p => ({ ...p, onset7: false }))}>Non</Pill>
            </div>
            {s.onset7 === false && (
              <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14, color: C.muted }}>Âge de début :</span>
                <input type="number" min="0" max="99" value={s.onsetAge} onChange={(e) => setS(p => ({ ...p, onsetAge: e.target.value }))} style={{ width: 56, padding: "7px 8px", borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 15, fontWeight: 600, textAlign: "center" }} />
                <span style={{ fontSize: 14, color: C.muted }}>ans</span>
              </div>
            )}
          </div>

          <div style={cardStyle}>
            <div style={{ fontWeight: 700, fontSize: 16, color: C.accent, marginBottom: 3 }}>Critères C/D — Retentissement à l'âge adulte</div>
            <div style={{ fontSize: 12, color: iAD >= 2 ? C.yes : C.faint, fontWeight: 600, marginBottom: 14 }}>{iAD}/5 domaines impactés (≥ 2 requis)</div>
            {Object.entries(IMPAIRMENT.adult).map(([k, d]) => <DCard key={k} dom={d} data={s.impA[k]} onTick={(i) => tickImp("impA", k, i)} onSet={(v) => setImp("impA", k, v)} />)}
          </div>

          <div style={cardStyle}>
            <div style={{ fontWeight: 700, fontSize: 16, color: C.muted, marginBottom: 3 }}>Critères C/D — Retentissement dans l'enfance</div>
            <div style={{ fontSize: 12, color: iCD >= 2 ? C.yes : C.faint, fontWeight: 600, marginBottom: 14 }}>{iCD}/5 domaines impactés (≥ 2 requis)</div>
            {Object.entries(IMPAIRMENT.child).map(([k, d]) => <DCard key={k} dom={d} data={s.impC[k]} onTick={(i) => tickImp("impC", k, i)} onSet={(v) => setImp("impC", k, v)} />)}
          </div>

          <div style={cardStyle}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 10 }}>Critère E — Diagnostic différentiel</div>
            <div style={{ fontSize: 14, color: C.muted, marginBottom: 12, lineHeight: 1.55 }}>Les symptômes peuvent-ils être mieux expliqués par un autre trouble psychiatrique ?</div>
            <div style={{ display: "flex", gap: 8 }}>
              <Pill on={s.critE === true} yes={false} onClick={() => setS(p => ({ ...p, critE: true }))}>Oui</Pill>
              <Pill on={s.critE === false} yes onClick={() => setS(p => ({ ...p, critE: false }))}>Non</Pill>
            </div>
            {s.critE === true && <input type="text" placeholder="Précisez le trouble…" value={s.critEDetail} onChange={(e) => setS(p => ({ ...p, critEDetail: e.target.value }))} style={{ marginTop: 12, width: "100%", padding: "10px 14px", borderRadius: S.rs, border: `1px solid ${C.border}`, fontSize: 14 }} />}
          </div>
        </>)}

        {/* ── RESULTS ── */}
        {tab === 2 && (<>
          <div style={cardStyle}>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 18, textAlign: "center" }}>Résumé des symptômes</div>
            <div style={{ display: "flex", marginBottom: 22 }}>
              <Badge v={aA} label="A adulte" /><Badge v={aC} label="A enfance" /><Badge v={hA} label="H/I adulte" /><Badge v={hC} label="H/I enfance" />
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead><tr style={{ borderBottom: `2px solid ${C.border}` }}>
                <th style={{ textAlign: "left", padding: "7px 4px", color: C.muted }}>Critère</th>
                <th style={{ textAlign: "center", padding: "7px 4px", color: C.accent }}>Adulte</th>
                <th style={{ textAlign: "center", padding: "7px 4px", color: C.muted }}>Enfance</th>
              </tr></thead>
              <tbody>
                {INATTENTION.map((x, i) => <tr key={x.id} style={{ borderBottom: `1px solid ${C.border}` }}><td style={{ padding: "6px 4px", fontWeight: 600 }}>{x.id}</td><td style={{ textAlign: "center" }}>{s.inatt[i].ap === true ? "✅" : s.inatt[i].ap === false ? "—" : "·"}</td><td style={{ textAlign: "center" }}>{s.inatt[i].cp === true ? "✅" : s.inatt[i].cp === false ? "—" : "·"}</td></tr>)}
                <tr style={{ background: C.bg }}><td style={{ padding: "7px 4px", fontWeight: 700 }}>Total A</td><td style={{ textAlign: "center", fontWeight: 800, color: aA >= 6 ? C.yes : C.no }}>{aA}/9</td><td style={{ textAlign: "center", fontWeight: 800, color: aC >= 6 ? C.yes : C.no }}>{aC}/9</td></tr>
                {HYPERACTIVITY.map((x, i) => <tr key={x.id} style={{ borderBottom: `1px solid ${C.border}` }}><td style={{ padding: "6px 4px", fontWeight: 600 }}>{x.id}</td><td style={{ textAlign: "center" }}>{s.hyper[i].ap === true ? "✅" : s.hyper[i].ap === false ? "—" : "·"}</td><td style={{ textAlign: "center" }}>{s.hyper[i].cp === true ? "✅" : s.hyper[i].cp === false ? "—" : "·"}</td></tr>)}
                <tr style={{ background: C.bg }}><td style={{ padding: "7px 4px", fontWeight: 700 }}>Total H/I</td><td style={{ textAlign: "center", fontWeight: 800, color: hA >= 6 ? C.yes : C.no }}>{hA}/9</td><td style={{ textAlign: "center", fontWeight: 800, color: hC >= 6 ? C.yes : C.no }}>{hC}/9</td></tr>
              </tbody>
            </table>
          </div>

          <div style={cardStyle}>
            <div style={{ fontWeight: 800, fontSize: 18, marginBottom: 16, textAlign: "center" }}>Formulaire de cotation</div>
            {[
              { l: "Critère A : ≥ 6 Inattention (adulte)", g: aA >= 6 },
              { l: "Critère A : ≥ 6 Inattention (enfance)", g: aC >= 6 },
              { l: "Critère A : ≥ 6 H/I (adulte)", g: hA >= 6 },
              { l: "Critère A : ≥ 6 H/I (enfance)", g: hC >= 6 },
              { l: "Critère B : Début avant 7 ans ou âge précisé", g: bOk },
              { l: "Critères C/D : Retentissement ≥ 2 domaines (adulte)", g: iAD >= 2 },
              { l: "Critères C/D : Retentissement ≥ 2 domaines (enfance)", g: iCD >= 2 },
              { l: "Critère E : Non mieux expliqué par un autre trouble", g: eOk },
            ].map(({ l, g }, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: i < 7 ? `1px solid ${C.border}` : "none" }}>
                <span style={{ width: 24, height: 24, minWidth: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: g ? C.yes : C.border, color: "#fff", fontSize: 13, fontWeight: 700, boxShadow: g ? `0 2px 6px ${C.yes}33` : "none" }}>{g ? "✓" : ""}</span>
                <span style={{ fontSize: 14, color: g ? C.text : C.faint, fontWeight: g ? 600 : 400 }}>{l}</span>
              </div>
            ))}
          </div>

          <div style={{
            background: dx ? `linear-gradient(135deg, ${C.hdr1}, ${C.hdr2})` : C.card,
            borderRadius: S.r, padding: 24, marginBottom: 14,
            border: dx ? "none" : `1px solid ${C.border}`, boxShadow: S.shadowLg, textAlign: "center",
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, color: dx ? "rgba(255,255,255,.45)" : C.faint, marginBottom: 12 }}>Diagnostic TDAH</div>
            {dx ? (<>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#fff", marginBottom: 6 }}>{dx.l}</div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,.55)", fontFamily: "monospace" }}>DSM-IV {dx.c}</div>
            </>) : (<>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
                {(aM || hM) && !iM && !(iAOk && iCOk) ? "Complétez le retentissement pour obtenir le résultat"
                  : (aM || hM) && !iM ? "Diagnostic TDAH non retenu"
                  : s.critE === true ? "Diagnostic TDAH non retenu"
                  : "Diagnostic TDAH non retenu"}
              </div>
              <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.55 }}>
                {!aM && !hM ? "Le seuil de 6 symptômes n'est atteint dans aucun domaine pour les deux âges de vie."
                  : !iM && !(iAOk && iCOk) ? "Répondez Oui ou Non pour chaque domaine dans l'onglet Retentissement."
                  : !iM ? "Les critères symptomatiques sont atteints, mais le retentissement n'est pas présent dans au moins 2 domaines aux deux âges."
                  : s.critE === true ? `Symptômes mieux expliqués par un autre trouble${s.critEDetail ? ` (${s.critEDetail})` : ""}.`
                  : s.critE === null ? "Complétez le critère E (diagnostic différentiel) dans l'onglet Retentissement."
                  : ""}
              </div>
            </>)}
          </div>

          <div style={{ padding: "12px 14px", background: "#e8f3ee", borderRadius: S.rs, fontSize: 12, color: C.accentDark, lineHeight: 1.55, marginBottom: 14, border: `1px solid ${C.border}` }}>
            ⚠️ Cet outil est une aide à la passation de la DIVA 2.0 et ne remplace pas le jugement clinique d'un professionnel de santé qualifié. Le diagnostic de TDAH doit être posé par un clinicien formé, en prenant en compte l'ensemble du tableau clinique.
          </div>

          <button onClick={reset} style={{ width: "100%", padding: "14px", borderRadius: 50, border: `2px solid ${C.no}`, background: C.card, color: C.no, fontWeight: 700, fontSize: 14 }}>Réinitialiser tout</button>
        </>)}
      </div>
    </div>
  );
}
