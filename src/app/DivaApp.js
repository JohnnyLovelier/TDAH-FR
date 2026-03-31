"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { INATTENTION, HYPERACTIVITY, IMPAIRMENT } from "./data";

/* ─── localStorage helpers ─── */
const KEY = "diva2";
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
const save = (s) => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {} };

/* ─── default state factory ─── */
function init() {
  const mkSymptoms = (items) => items.map((it) => ({
    ac: Array(it.adult.length).fill(false),
    cc: Array(it.child.length).fill(false),
    ap: null, cp: null,
  }));
  const mkDomains = (obj) => Object.fromEntries(Object.keys(obj).map((k) => [k, { checks: Array(obj[k].items.length).fill(false), present: null }]));
  return {
    inatt: mkSymptoms(INATTENTION),
    hyper: mkSymptoms(HYPERACTIVITY),
    impAdult: mkDomains(IMPAIRMENT.adult),
    impChild: mkDomains(IMPAIRMENT.child),
    onsetBefore7: null,
    onsetAge: "",
    criterionE: null,
    criterionEDetail: "",
  };
}

/* ─── tiny components ─── */
function Pill({ active, color, onClick, children }) {
  const bg = active ? (color === "yes" ? "var(--c-yes)" : color === "no" ? "var(--c-no)" : "var(--c-accent)") : "var(--c-border)";
  const fg = active ? "#fff" : "var(--c-text-soft)";
  return (
    <button onClick={onClick} style={{ padding:"6px 18px", borderRadius:24, background:bg, color:fg, fontSize:13, fontWeight:600, transition:"all .15s" }}>
      {children}
    </button>
  );
}

function Check({ on, onChange, label }) {
  return (
    <label style={{ display:"flex", alignItems:"flex-start", gap:10, padding:"7px 10px", borderRadius:8, cursor:"pointer", background: on ? "var(--c-accent-soft)" : "transparent", transition:"background .15s", fontSize:14, lineHeight:1.5, userSelect:"none" }}>
      <span style={{ display:"inline-flex", alignItems:"center", justifyContent:"center", width:20, height:20, minWidth:20, borderRadius:6, border: on ? "2px solid var(--c-check)" : "2px solid var(--c-border)", background: on ? "var(--c-check)" : "#fff", marginTop:1, transition:"all .12s", flexShrink:0 }}>
        {on && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5L9.5 3.5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
      </span>
      <span>{label}</span>
      <input type="checkbox" checked={on} onChange={onChange} style={{ display:"none" }} />
    </label>
  );
}

function ProgressBar({ value, max, label }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div style={{ marginBottom:4 }}>
      {label && <div style={{ fontSize:11, color:"var(--c-text-soft)", marginBottom:4, fontWeight:500 }}>{label}</div>}
      <div style={{ height:6, borderRadius:3, background:"var(--c-border)", overflow:"hidden" }}>
        <div style={{ height:"100%", width:`${pct}%`, borderRadius:3, background:"var(--c-progress)", transition:"width .4s ease" }} />
      </div>
    </div>
  );
}

/* ─── Symptom Card ─── */
function SymptomCard({ item, data, onToggle, onPresent }) {
  const [open, setOpen] = useState(false);
  const statusColor = data.ap === true && data.cp === true ? "var(--c-yes)" : (data.ap === true || data.cp === true) ? "var(--c-accent)" : data.ap === false && data.cp === false ? "var(--c-no)" : "var(--c-border)";

  return (
    <div style={{ background:"var(--c-card)", borderRadius:"var(--radius)", boxShadow:"var(--shadow)", marginBottom:12, overflow:"hidden", border:`1.5px solid ${open ? "var(--c-accent)" : "var(--c-border)"}`, transition:"border-color .2s" }}>
      <button onClick={() => setOpen(!open)} style={{ width:"100%", display:"flex", alignItems:"center", padding:"14px 16px", textAlign:"left", gap:12 }}>
        <span style={{ width:32, height:32, minWidth:32, borderRadius:9, background:statusColor, color:"#fff", display:"inline-flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:11, fontFamily:"var(--font-display)", transition:"background .2s" }}>{item.id}</span>
        <span style={{ flex:1, fontSize:14, fontWeight:500, lineHeight:1.4, color:"var(--c-text)" }}>{item.q}</span>
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ transform: open ? "rotate(180deg)" : "", transition:"transform .2s", flexShrink:0 }}><path d="M4.5 6.75L9 11.25L13.5 6.75" stroke="var(--c-text-faint)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
      {open && (
        <div style={{ padding:"0 16px 16px" }}>
          {["adult","child"].map((age) => {
            const examples = age === "adult" ? item.adult : item.child;
            const checks = age === "adult" ? data.ac : data.cc;
            const present = age === "adult" ? data.ap : data.cp;
            const pKey = age === "adult" ? "ap" : "cp";
            return (
              <div key={age} style={{ marginBottom: age === "adult" ? 16 : 0, ...(age === "child" ? { borderTop:"1px solid var(--c-border)", paddingTop:14 } : {}) }}>
                <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:.8, color: age === "adult" ? "var(--c-accent)" : "var(--c-text-soft)", marginBottom:8, display:"flex", alignItems:"center", gap:6 }}>
                  <span style={{ width:7, height:7, borderRadius:"50%", background: age === "adult" ? "var(--c-accent)" : "var(--c-text-faint)" }} />
                  {age === "adult" ? "Âge adulte" : "Enfance (5–12 ans)"}
                </div>
                {examples.map((ex, i) => (
                  <Check key={i} on={checks[i]} label={ex} onChange={() => onToggle(age, i)} />
                ))}
                <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:10 }}>
                  <span style={{ fontSize:12, color:"var(--c-text-soft)" }}>Symptôme présent :</span>
                  <Pill active={present === true} color="yes" onClick={() => onPresent(pKey, true)}>Oui</Pill>
                  <Pill active={present === false} color="no" onClick={() => onPresent(pKey, false)}>Non</Pill>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── Impairment Domain ─── */
function Domain({ domain, data, onToggleCheck, onPresent }) {
  const [showEx, setShowEx] = useState(false);
  const borderColor = data.present === true ? "var(--c-yes)" : data.present === false ? "var(--c-no)" : "var(--c-border)";
  return (
    <div style={{ border:`1.5px solid ${borderColor}`, borderRadius:"var(--radius-sm)", padding:"12px 14px", marginBottom:10, background: data.present === true ? "var(--c-yes-soft)" : data.present === false ? "var(--c-no-soft)" : "var(--c-card)", transition:"all .2s" }}>
      <div style={{ fontWeight:700, fontSize:14, color:"var(--c-text)", marginBottom:8 }}>{domain.label}</div>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
        <span style={{ fontSize:12, color:"var(--c-text-soft)" }}>Domaine impacté :</span>
        <Pill active={data.present === true} color="yes" onClick={() => onPresent(true)}>Oui</Pill>
        <Pill active={data.present === false} color="no" onClick={() => onPresent(false)}>Non</Pill>
      </div>
      <button onClick={() => setShowEx(!showEx)} style={{ fontSize:12, color:"var(--c-text-faint)", padding:"4px 12px", borderRadius:20, border:"1px solid var(--c-border)", background:"var(--c-card)" }}>
        {showEx ? "Masquer les exemples ▴" : "Voir les exemples ▾"}
      </button>
      {showEx && (
        <div style={{ marginTop:8 }}>
          {domain.items.map((it, i) => (
            <Check key={i} on={data.checks[i]} label={it} onChange={() => onToggleCheck(i)} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Score Badge ─── */
function Badge({ value, max, label }) {
  const pct = max > 0 ? value / max : 0;
  const color = value >= 6 ? "var(--c-yes)" : value >= 4 ? "var(--c-accent)" : "var(--c-no)";
  return (
    <div style={{ textAlign:"center", flex:1 }}>
      <div style={{ width:56, height:56, borderRadius:"50%", margin:"0 auto 4px", position:"relative", background:`conic-gradient(${color} ${pct*360}deg, var(--c-border) 0deg)`, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ width:42, height:42, borderRadius:"50%", background:"var(--c-card)", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:18, color, fontFamily:"var(--font-display)" }}>{value}</div>
      </div>
      <div style={{ fontSize:10, color:"var(--c-text-soft)", fontWeight:600 }}>{label}</div>
    </div>
  );
}

/* ═══════════════════ MAIN APP ═══════════════════ */
const TABS = ["Symptômes", "Retentissement", "Résultats"];

export default function DivaApp() {
  const [s, setS] = useState(init);
  const [tab, setTab] = useState(0);
  const [sub, setSub] = useState(0);
  const [ready, setReady] = useState(false);
  const topRef = useRef(null);

  useEffect(() => { const d = load(); if (d) { /* migrate old */
    if (!d.impAdult || !d.impChild) { setReady(true); return; }
    setS(d);
  } setReady(true); }, []);

  useEffect(() => { if (ready) save(s); }, [s, ready]);
  useEffect(() => { topRef.current?.scrollIntoView({ behavior:"smooth" }); }, [tab, sub]);

  /* ─ updaters ─ */
  const toggleEx = useCallback((cat, idx, age, exIdx) => {
    setS((p) => {
      const next = { ...p, [cat]: [...p[cat]] };
      const field = age === "adult" ? "ac" : "cc";
      const pField = age === "adult" ? "ap" : "cp";
      const arr = [...p[cat][idx][field]]; arr[exIdx] = !arr[exIdx];
      const updated = { ...p[cat][idx], [field]: arr };
      const cnt = arr.filter(Boolean).length;
      if (cnt > arr.length / 2) updated[pField] = true;
      else if (cnt === 0 && updated[pField] === true) updated[pField] = null;
      next[cat][idx] = updated;
      return next;
    });
  }, []);

  const setPresent = useCallback((cat, idx, field, val) => {
    setS((p) => { const next = { ...p, [cat]: [...p[cat]] }; next[cat][idx] = { ...p[cat][idx], [field]: val }; return next; });
  }, []);

  const toggleImpCheck = useCallback((ageKey, domKey, idx) => {
    setS((p) => {
      const next = { ...p, [ageKey]: { ...p[ageKey] } };
      const d = { ...p[ageKey][domKey] };
      const arr = [...d.checks]; arr[idx] = !arr[idx]; d.checks = arr;
      if (arr.some(Boolean)) d.present = true;
      else if (d.present === true) d.present = null;
      next[ageKey][domKey] = d;
      return next;
    });
  }, []);

  const setImpPresent = useCallback((ageKey, domKey, val) => {
    setS((p) => { const next = { ...p, [ageKey]: { ...p[ageKey] } }; next[ageKey][domKey] = { ...p[ageKey][domKey], present: val }; return next; });
  }, []);

  /* ─ scoring ─ */
  const aA = s.inatt.filter((d) => d.ap === true).length;
  const aC = s.inatt.filter((d) => d.cp === true).length;
  const hA = s.hyper.filter((d) => d.ap === true).length;
  const hC = s.hyper.filter((d) => d.cp === true).length;

  const impADoms = Object.values(s.impAdult).filter((d) => d.present === true).length;
  const impCDoms = Object.values(s.impChild).filter((d) => d.present === true).length;
  const impADone = Object.values(s.impAdult).every((d) => d.present !== null);
  const impCDone = Object.values(s.impChild).every((d) => d.present !== null);

  const aMet = aA >= 6 && aC >= 6;
  const hMet = hA >= 6 && hC >= 6;
  const impMet = impADoms >= 2 && impCDoms >= 2;
  const onsetOk = s.onsetBefore7 === true || (s.onsetBefore7 === false && s.onsetAge !== "");
  const notE = s.criterionE === false;

  let dx = null;
  if (aMet && hMet && impMet && notE) dx = { code:"314.01", label:"Type combiné" };
  else if (aMet && !hMet && impMet && notE) dx = { code:"314.00", label:"Type inattentif prédominant" };
  else if (!aMet && hMet && impMet && notE) dx = { code:"314.01", label:"Type hyperactif/impulsif prédominant" };

  /* progress for motivation */
  const totalSymptoms = 18;
  const answeredSymptoms = [...s.inatt, ...s.hyper].filter((d) => d.ap !== null && d.cp !== null).length;
  const totalDomains = Object.keys(IMPAIRMENT.adult).length + Object.keys(IMPAIRMENT.child).length;
  const answeredDomains = [...Object.values(s.impAdult), ...Object.values(s.impChild)].filter((d) => d.present !== null).length;
  const totalSteps = totalSymptoms + totalDomains + 2; // +onset +criterionE
  const doneSteps = answeredSymptoms + answeredDomains + (onsetOk ? 1 : 0) + (s.criterionE !== null ? 1 : 0);

  const handleReset = () => {
    if (confirm("Réinitialiser toutes les réponses ?")) { setS(init()); setTab(0); setSub(0); try { localStorage.removeItem(KEY); } catch {} }
  };

  if (!ready) return <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center" }}><p style={{ color:"var(--c-text-soft)" }}>Chargement…</p></div>;

  const items = sub === 0 ? INATTENTION : HYPERACTIVITY;
  const cat = sub === 0 ? "inatt" : "hyper";

  return (
    <div style={{ minHeight:"100vh", paddingBottom:100 }}>
      <div ref={topRef} />

      {/* ── HEADER ── */}
      <div style={{ background:"linear-gradient(135deg, #3a2f1e 0%, #5c3d1e 50%, #7a4e22 100%)", padding:"28px 20px 20px", color:"#fff", position:"relative" }}>
        <div style={{ position:"absolute", top:-40, right:-40, width:120, height:120, borderRadius:"50%", background:"rgba(255,255,255,0.04)" }} />
        <div style={{ fontFamily:"var(--font-display)", fontSize:26, fontWeight:800 }}>DIVA 2.0</div>
        <div style={{ fontSize:13, opacity:.7, marginTop:2 }}>Entretien diagnostique pour le TDAH chez l'adulte</div>
        <div style={{ fontSize:10, opacity:.35, marginTop:6 }}>Kooij & Francken, 2010 — DIVA Foundation</div>

        {/* Global progress */}
        <div style={{ marginTop:16 }}>
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, opacity:.6, marginBottom:4 }}>
            <span>Progression globale</span>
            <span>{doneSteps}/{totalSteps}</span>
          </div>
          <div style={{ height:5, borderRadius:3, background:"rgba(255,255,255,0.15)", overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${Math.round(doneSteps/totalSteps*100)}%`, borderRadius:3, background:"var(--c-accent)", transition:"width .4s ease" }} />
          </div>
        </div>

        {/* Mini scores */}
        <div style={{ display:"flex", gap:8, marginTop:14, flexWrap:"wrap" }}>
          {[{l:"A adulte",v:aA,ok:aA>=6},{l:"A enfance",v:aC,ok:aC>=6},{l:"H/I adulte",v:hA,ok:hA>=6},{l:"H/I enfance",v:hC,ok:hC>=6}].map(({l,v,ok}) => (
            <div key={l} style={{ background: ok ? "rgba(61,160,109,.25)" : "rgba(255,255,255,.1)", borderRadius:7, padding:"4px 10px", fontSize:11, fontWeight:600, display:"flex", alignItems:"center", gap:5 }}>
              <span style={{ fontFamily:"monospace", fontSize:14, fontWeight:800 }}>{v}</span>
              <span style={{ opacity:.5, fontSize:9 }}>/9</span>
              <span style={{ opacity:.8 }}>{l}</span>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div style={{ marginTop:14, padding:"8px 12px", background:"rgba(255,255,255,0.07)", borderRadius:8, fontSize:10, lineHeight:1.5, color:"rgba(255,255,255,0.55)", borderLeft:"3px solid rgba(255,255,255,0.18)" }}>
          ⚠️ Cet outil est une aide à la passation de la DIVA 2.0 et ne remplace pas le jugement clinique d'un professionnel de santé qualifié. Le diagnostic de TDAH doit être posé par un clinicien formé, en prenant en compte l'ensemble du tableau clinique.
        </div>
      </div>

      {/* ── TABS ── */}
      <div style={{ display:"flex", background:"var(--c-card)", borderBottom:"1px solid var(--c-border)", position:"sticky", top:0, zIndex:100, boxShadow:"var(--shadow)" }}>
        {TABS.map((t, i) => (
          <button key={i} onClick={() => { setTab(i); if (i===0) setSub(0); }} style={{ flex:1, padding:"13px 6px", borderBottom: tab===i ? "3px solid var(--c-accent)" : "3px solid transparent", color: tab===i ? "var(--c-accent)" : "var(--c-text-faint)", fontWeight:700, fontSize:13, transition:"all .15s" }}>{t}</button>
        ))}
      </div>

      <div style={{ maxWidth:620, margin:"0 auto", padding:"14px 12px" }}>
        {/* ══ SYMPTOMS ══ */}
        {tab === 0 && (<>
          <div style={{ display:"flex", gap:8, marginBottom:14 }}>
            {["Inattention (A1–A9)","Hyperactivité-Impulsivité (H/I 1–9)"].map((l,i) => (
              <button key={i} onClick={() => setSub(i)} style={{ flex:1, padding:"9px 6px", borderRadius:"var(--radius-sm)", fontSize:12, fontWeight:700, background: sub===i ? "var(--c-accent)" : "var(--c-border)", color: sub===i ? "#fff" : "var(--c-text-soft)", transition:"all .15s" }}>{l}</button>
            ))}
          </div>

          <ProgressBar value={s[cat].filter(d => d.ap !== null && d.cp !== null).length} max={items.length} label={`${s[cat].filter(d => d.ap !== null && d.cp !== null).length}/${items.length} critères complétés`} />

          <div style={{ fontSize:12, color:"var(--c-text-soft)", margin:"10px 0 14px", padding:"9px 12px", background:"var(--c-card)", borderRadius:"var(--radius-sm)", lineHeight:1.5, border:"1px solid var(--c-border)" }}>
            Touchez chaque critère pour le déplier. Cochez les exemples reconnus, puis indiquez <strong>Oui / Non</strong> à l'âge adulte et durant l'enfance. Lorsque la majorité des exemples est cochée, « Oui » est défini automatiquement (modifiable).
          </div>

          {items.map((it, idx) => (
            <SymptomCard key={it.id} item={it} data={s[cat][idx]}
              onToggle={(age, exIdx) => toggleEx(cat, idx, age, exIdx)}
              onPresent={(field, val) => setPresent(cat, idx, field, val)} />
          ))}
        </>)}

        {/* ══ IMPAIRMENT ══ */}
        {tab === 1 && (<>
          <div style={{ fontSize:12, color:"var(--c-text-soft)", marginBottom:14, padding:"9px 12px", background:"var(--c-card)", borderRadius:"var(--radius-sm)", lineHeight:1.5, border:"1px solid var(--c-border)" }}>
            Pour chaque domaine, indiquez s'il est impacté via <strong>Oui / Non</strong>. Les exemples sont facultatifs, dépliez-les si besoin.
          </div>

          {/* Criterion B */}
          <div style={{ background:"var(--c-card)", borderRadius:"var(--radius)", padding:16, marginBottom:14, border:"1px solid var(--c-border)", boxShadow:"var(--shadow)" }}>
            <div style={{ fontFamily:"var(--font-display)", fontSize:15, fontWeight:700, color:"var(--c-text)", marginBottom:10 }}>Critère B — Âge de début</div>
            <div style={{ fontSize:13, color:"var(--c-text-soft)", marginBottom:10, lineHeight:1.5 }}>Quelques symptômes étaient-ils présents avant l'âge de 7 ans ?</div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <Pill active={s.onsetBefore7===true} color="yes" onClick={() => setS(p => ({...p, onsetBefore7:true}))}>Oui</Pill>
              <Pill active={s.onsetBefore7===false} color="no" onClick={() => setS(p => ({...p, onsetBefore7:false}))}>Non</Pill>
            </div>
            {s.onsetBefore7 === false && (
              <div style={{ marginTop:10, display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:13, color:"var(--c-text-soft)" }}>Âge de début :</span>
                <input type="number" min="0" max="99" value={s.onsetAge} onChange={(e) => setS(p => ({...p, onsetAge:e.target.value}))}
                  style={{ width:56, padding:"5px 8px", borderRadius:8, border:"1px solid var(--c-border)", fontSize:14, fontWeight:600, textAlign:"center" }} />
                <span style={{ fontSize:13, color:"var(--c-text-soft)" }}>ans</span>
              </div>
            )}
          </div>

          {/* Adult impairment */}
          <div style={{ background:"var(--c-card)", borderRadius:"var(--radius)", padding:16, marginBottom:14, border:"1px solid var(--c-border)", boxShadow:"var(--shadow)" }}>
            <div style={{ fontFamily:"var(--font-display)", fontSize:15, fontWeight:700, color:"var(--c-accent)", marginBottom:2 }}>Critères C/D — Retentissement à l'âge adulte</div>
            <div style={{ fontSize:11, color: impADoms >= 2 ? "var(--c-yes)" : "var(--c-text-faint)", fontWeight:600, marginBottom:12 }}>{impADoms}/5 domaines impactés (≥ 2 requis)</div>
            {Object.entries(IMPAIRMENT.adult).map(([k, dom]) => (
              <Domain key={k} domain={dom} data={s.impAdult[k]}
                onToggleCheck={(i) => toggleImpCheck("impAdult", k, i)}
                onPresent={(v) => setImpPresent("impAdult", k, v)} />
            ))}
          </div>

          {/* Child impairment */}
          <div style={{ background:"var(--c-card)", borderRadius:"var(--radius)", padding:16, marginBottom:14, border:"1px solid var(--c-border)", boxShadow:"var(--shadow)" }}>
            <div style={{ fontFamily:"var(--font-display)", fontSize:15, fontWeight:700, color:"var(--c-text-soft)", marginBottom:2 }}>Critères C/D — Retentissement dans l'enfance</div>
            <div style={{ fontSize:11, color: impCDoms >= 2 ? "var(--c-yes)" : "var(--c-text-faint)", fontWeight:600, marginBottom:12 }}>{impCDoms}/5 domaines impactés (≥ 2 requis)</div>
            {Object.entries(IMPAIRMENT.child).map(([k, dom]) => (
              <Domain key={k} domain={dom} data={s.impChild[k]}
                onToggleCheck={(i) => toggleImpCheck("impChild", k, i)}
                onPresent={(v) => setImpPresent("impChild", k, v)} />
            ))}
          </div>

          {/* Criterion E */}
          <div style={{ background:"var(--c-card)", borderRadius:"var(--radius)", padding:16, marginBottom:14, border:"1px solid var(--c-border)", boxShadow:"var(--shadow)" }}>
            <div style={{ fontFamily:"var(--font-display)", fontSize:15, fontWeight:700, color:"var(--c-text)", marginBottom:10 }}>Critère E — Diagnostic différentiel</div>
            <div style={{ fontSize:13, color:"var(--c-text-soft)", marginBottom:10, lineHeight:1.5 }}>Les symptômes peuvent-ils être mieux expliqués par un autre trouble psychiatrique ?</div>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <Pill active={s.criterionE===true} color="no" onClick={() => setS(p => ({...p, criterionE:true}))}>Oui</Pill>
              <Pill active={s.criterionE===false} color="yes" onClick={() => setS(p => ({...p, criterionE:false}))}>Non</Pill>
            </div>
            {s.criterionE === true && (
              <input type="text" placeholder="Précisez le trouble…" value={s.criterionEDetail}
                onChange={(e) => setS(p => ({...p, criterionEDetail:e.target.value}))}
                style={{ marginTop:10, width:"100%", padding:"9px 12px", borderRadius:"var(--radius-sm)", border:"1px solid var(--c-border)", fontSize:13 }} />
            )}
          </div>
        </>)}

        {/* ══ RESULTS ══ */}
        {tab === 2 && (<>
          <div style={{ background:"var(--c-card)", borderRadius:"var(--radius)", padding:20, marginBottom:14, border:"1px solid var(--c-border)", boxShadow:"var(--shadow)" }}>
            <div style={{ fontFamily:"var(--font-display)", fontSize:17, fontWeight:800, color:"var(--c-text)", marginBottom:18, textAlign:"center" }}>Résumé des symptômes</div>
            <div style={{ display:"flex", marginBottom:20 }}>
              <Badge value={aA} max={9} label="A adulte" />
              <Badge value={aC} max={9} label="A enfance" />
              <Badge value={hA} max={9} label="H/I adulte" />
              <Badge value={hC} max={9} label="H/I enfance" />
            </div>

            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12 }}>
              <thead><tr style={{ borderBottom:"2px solid var(--c-border)" }}>
                <th style={{ textAlign:"left", padding:"6px 4px", color:"var(--c-text-soft)" }}>Critère</th>
                <th style={{ textAlign:"center", padding:"6px 4px", color:"var(--c-accent)" }}>Adulte</th>
                <th style={{ textAlign:"center", padding:"6px 4px", color:"var(--c-text-soft)" }}>Enfance</th>
              </tr></thead>
              <tbody>
                {INATTENTION.map((it,i) => <tr key={it.id} style={{ borderBottom:"1px solid var(--c-border)" }}><td style={{ padding:"5px 4px", fontWeight:600 }}>{it.id}</td><td style={{ textAlign:"center" }}>{s.inatt[i].ap===true?"✅":s.inatt[i].ap===false?"—":"·"}</td><td style={{ textAlign:"center" }}>{s.inatt[i].cp===true?"✅":s.inatt[i].cp===false?"—":"·"}</td></tr>)}
                <tr style={{ background:"var(--c-bg)" }}><td style={{ padding:"6px 4px", fontWeight:700 }}>Total A</td><td style={{ textAlign:"center", fontWeight:800, color: aA>=6?"var(--c-yes)":"var(--c-no)" }}>{aA}/9</td><td style={{ textAlign:"center", fontWeight:800, color: aC>=6?"var(--c-yes)":"var(--c-no)" }}>{aC}/9</td></tr>
                {HYPERACTIVITY.map((it,i) => <tr key={it.id} style={{ borderBottom:"1px solid var(--c-border)" }}><td style={{ padding:"5px 4px", fontWeight:600 }}>{it.id}</td><td style={{ textAlign:"center" }}>{s.hyper[i].ap===true?"✅":s.hyper[i].ap===false?"—":"·"}</td><td style={{ textAlign:"center" }}>{s.hyper[i].cp===true?"✅":s.hyper[i].cp===false?"—":"·"}</td></tr>)}
                <tr style={{ background:"var(--c-bg)" }}><td style={{ padding:"6px 4px", fontWeight:700 }}>Total H/I</td><td style={{ textAlign:"center", fontWeight:800, color: hA>=6?"var(--c-yes)":"var(--c-no)" }}>{hA}/9</td><td style={{ textAlign:"center", fontWeight:800, color: hC>=6?"var(--c-yes)":"var(--c-no)" }}>{hC}/9</td></tr>
              </tbody>
            </table>
          </div>

          {/* Criteria checklist */}
          <div style={{ background:"var(--c-card)", borderRadius:"var(--radius)", padding:18, marginBottom:14, border:"1px solid var(--c-border)", boxShadow:"var(--shadow)" }}>
            <div style={{ fontFamily:"var(--font-display)", fontSize:17, fontWeight:800, color:"var(--c-text)", marginBottom:14, textAlign:"center" }}>Formulaire de cotation</div>
            {[
              { l:"Critère A : ≥ 6 Inattention (adulte)", ok:aA>=6 },
              { l:"Critère A : ≥ 6 Inattention (enfance)", ok:aC>=6 },
              { l:"Critère A : ≥ 6 H/I (adulte)", ok:hA>=6 },
              { l:"Critère A : ≥ 6 H/I (enfance)", ok:hC>=6 },
              { l:"Critère B : Début avant 7 ans ou âge précisé", ok:onsetOk },
              { l:"Critères C/D : Retentissement ≥ 2 domaines (adulte)", ok:impADoms>=2 },
              { l:"Critères C/D : Retentissement ≥ 2 domaines (enfance)", ok:impCDoms>=2 },
              { l:"Critère E : Non mieux expliqué par un autre trouble", ok:notE },
            ].map(({l,ok},i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", gap:10, padding:"9px 0", borderBottom: i<7 ? "1px solid var(--c-border)" : "none" }}>
                <span style={{ width:22, height:22, minWidth:22, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", background: ok ? "var(--c-yes)" : "var(--c-border)", color:"#fff", fontSize:12, fontWeight:700 }}>{ok ? "✓" : ""}</span>
                <span style={{ fontSize:13, color: ok ? "var(--c-text)" : "var(--c-text-faint)", fontWeight: ok ? 600 : 400 }}>{l}</span>
              </div>
            ))}
          </div>

          {/* Diagnosis */}
          <div style={{ background: dx ? "linear-gradient(135deg, #3a2f1e 0%, #5c3d1e 50%, #7a4e22 100%)" : "var(--c-card)", borderRadius:"var(--radius)", padding:22, marginBottom:14, border: dx ? "none" : "1px solid var(--c-border)", boxShadow:"var(--shadow-lg)", textAlign:"center" }}>
            <div style={{ fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:2, color: dx ? "rgba(255,255,255,.45)" : "var(--c-text-faint)", marginBottom:10 }}>Diagnostic TDAH</div>
            {dx ? (<>
              <div style={{ fontFamily:"var(--font-display)", fontSize:22, fontWeight:800, color:"#fff", marginBottom:6 }}>{dx.label}</div>
              <div style={{ fontSize:14, color:"rgba(255,255,255,.55)", fontFamily:"monospace" }}>DSM-IV {dx.code}</div>
            </>) : (<>
              <div style={{ fontSize:15, fontWeight:700, color:"var(--c-text)", marginBottom:6 }}>
                {(aMet || hMet) && !impMet && !(impADone && impCDone) ? "Complétez le retentissement pour obtenir le résultat"
                  : (aMet || hMet) && !impMet && impADone && impCDone ? "Diagnostic TDAH non retenu"
                  : s.criterionE === true ? "Diagnostic TDAH non retenu"
                  : "Diagnostic TDAH non retenu"}
              </div>
              <div style={{ fontSize:12, color:"var(--c-text-soft)", lineHeight:1.5 }}>
                {!aMet && !hMet ? "Le seuil de 6 symptômes n'est atteint dans aucun domaine pour les deux âges de vie."
                  : !impMet && !(impADone && impCDone) ? "Répondez Oui ou Non pour chaque domaine dans l'onglet Retentissement."
                  : !impMet && impADone && impCDone ? "Les critères symptomatiques sont atteints, mais le retentissement n'est pas présent dans au moins 2 domaines de vie aux deux âges."
                  : s.criterionE === true ? `Les symptômes sont mieux expliqués par un autre trouble${s.criterionEDetail ? ` (${s.criterionEDetail})` : ""}.`
                  : s.criterionE === null ? "Complétez le critère E (diagnostic différentiel) dans l'onglet Retentissement."
                  : ""}
              </div>
            </>)}
          </div>

          {/* Disclaimer */}
          <div style={{ padding:"12px 14px", background:"#fef6ee", borderRadius:"var(--radius-sm)", fontSize:11, color:"#8a5a2c", lineHeight:1.5, marginBottom:14, border:"1px solid #f0dcc4" }}>
            ⚠️ Cet outil est une aide à la passation de la DIVA 2.0 et ne remplace pas le jugement clinique d'un professionnel de santé qualifié. Le diagnostic de TDAH doit être posé par un clinicien formé, en prenant en compte l'ensemble du tableau clinique.
          </div>

          <button onClick={handleReset} style={{ width:"100%", padding:"13px", borderRadius:"var(--radius-sm)", border:"1px solid var(--c-no)", background:"var(--c-card)", color:"var(--c-no)", fontWeight:700, fontSize:14 }}>Réinitialiser tout</button>
        </>)}
      </div>
    </div>
  );
}
