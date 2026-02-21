/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef } from "react";

const ACCENT = "#C8FF00";
const BG = "#080808";
const CARD = "#111111";
const BORDER = "rgba(255,255,255,0.08)";

const WORKOUTS = {
  A: {
    label: "DÍA A", subtitle: "TORSO & V-SHAPE", tag: "Empuje", color: "#FF4D1C",
    exercises: [
      { id: "press_hombros",    name: "Press Hombros",      kg: 10, sets: 3, reps: 12, note: "3s bajada — Control excéntrico", muscle: "HOMBROS" },
      { id: "vuelos_laterales", name: "Vuelos Laterales",   kg: 5,  sets: 4, reps: 18, note: "Mantener hombros abajo",          muscle: "HOMBROS" },
      { id: "press_pecho",      name: "Press de Pecho",     kg: 15, sets: 3, reps: 12, note: "Codos a 45° — Evitar ardor",      muscle: "PECHO"   },
      { id: "copa_triceps",     name: "Copa Tríceps",       kg: 12, sets: 3, reps: 15, note: "Codos cerrados al techo",         muscle: "TRÍCEPS" },
    ],
  },
  B: {
    label: "DÍA B", subtitle: "POTENCIA & BASE", tag: "Tracción/Piernas", color: "#00D4FF",
    exercises: [
      { id: "peso_muerto",       name: "Peso Muerto Rumano", kg: 18, sets: 3, reps: 12, note: "Foco en estirar isquios",      muscle: "ISQUIOS"  },
      { id: "remo_serrucho",     name: "Remo (Serrucho)",    kg: 18, sets: 3, reps: 12, note: "Codo al bolsillo",             muscle: "ESPALDA"  },
      { id: "sentadilla_goblet", name: "Sentadilla Goblet",  kg: 18, sets: 3, reps: 12, note: "Romper la paralela",           muscle: "PIERNAS"  },
      { id: "curl_martillo",     name: "Curl Martillo",      kg: 12, sets: 3, reps: 12, note: "Sin balanceo del cuerpo",      muscle: "BÍCEPS"   },
    ],
  },
};

const MUSCLE_COLORS = {
  HOMBROS: "#FF4D1C", PECHO: "#FF6B35", "TRÍCEPS": "#FF8C42",
  ISQUIOS: "#00D4FF", ESPALDA: "#00B8D9", PIERNAS: "#0099B8", "BÍCEPS": "#007A99",
};

// ─── STORAGE ──────────────────────────────────────────────────────────────────
const store = {
  get(k) {
    try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; }
    catch { return null; }
  },
  set(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); return true; }
    catch { return false; }
  },
};

const fmtTime = (s) => {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  if (h > 0) return String(h).padStart(2,"0")+":"+String(m).padStart(2,"0")+":"+String(ss).padStart(2,"0");
  return String(m).padStart(2,"0")+":"+String(ss).padStart(2,"0");
};

const todayStr = () => new Date().toISOString().split("T")[0];

const getHistory = () => store.get("soma_history_v2") || {};
const saveHistory = (h) => {
  const keys = Object.keys(h).sort();
  const pruned = {};
  keys.slice(-120).forEach(k => { pruned[k] = h[k]; });
  store.set("soma_history_v2", pruned);
};

// ─── STREAK CALENDAR ──────────────────────────────────────────────────────────
function StreakCalendar({ history }) {
  const now = new Date();
  const startMonday = new Date(now);
  startMonday.setDate(now.getDate() - ((now.getDay() + 6) % 7) - 9 * 7);

  const weeks = [];
  for (let w = 0; w < 10; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(startMonday);
      date.setDate(startMonday.getDate() + w * 7 + d);
      const key = date.toISOString().split("T")[0];
      const sessions = Object.keys(history).filter(k => k.startsWith(key));
      const dayType = sessions.length > 0 ? (sessions.some(k => k.includes("_A_")) ? "A" : "B") : null;
      week.push({ key, dayType, isToday: key === todayStr(), isFuture: date > now });
    }
    weeks.push(week);
  }

  const DAY_LABELS = ["L","M","X","J","V","S","D"];
  return (
    <div style={{ display: "flex", gap: 2 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, marginRight: 4 }}>
        {DAY_LABELS.map(l => (
          <div key={l} style={{ height: 10, fontSize: 8, color: "rgba(255,255,255,0.2)", lineHeight:"10px", width: 10 }}>{l}</div>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} style={{ display:"flex", flexDirection:"column", gap:2, flex:1 }}>
          {week.map(({ key, dayType, isToday, isFuture }) => (
            <div key={key} style={{
              height: 10, borderRadius: 2,
              background: isFuture ? "transparent"
                : dayType === "A" ? WORKOUTS.A.color
                : dayType === "B" ? WORKOUTS.B.color
                : "rgba(255,255,255,0.07)",
              outline: isToday ? "1.5px solid " + ACCENT : "none",
              outlineOffset: 1,
            }} />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── MINI CHART ───────────────────────────────────────────────────────────────
function MiniChart({ data, color }) {
  if (!data || data.length < 2) {
    return (
      <div style={{ height:60, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <span style={{ fontSize:10, color:"rgba(255,255,255,0.2)" }}>Completá al menos 2 sesiones para ver el gráfico</span>
      </div>
    );
  }
  const vals = data.map(d => d.kg);
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = max - min || 1;
  const W = 300, H = 60;
  const xs = data.map((_, i) => (i / (data.length - 1)) * W);
  const ys = data.map(d => H - ((d.kg - min) / range) * (H - 10) - 5);
  const pts = xs.map((x, i) => x + "," + ys[i]).join(" ");
  const area = "M " + xs.map((x, i) => x + " " + ys[i]).join(" L ") + " L " + W + " " + H + " L 0 " + H + " Z";
  const gid = "g" + color.replace("#","");
  return (
    <svg viewBox={"0 0 " + W + " " + H} style={{ width:"100%", height:60, overflow:"visible" }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={"url(#" + gid + ")"} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={xs[xs.length-1]} cy={ys[ys.length-1]} r="3.5" fill={color} />
    </svg>
  );
}

// ─── SHARED INPUT STYLE ───────────────────────────────────────────────────────
const numInput = (active, color) => ({
  background: active ? color + "15" : "rgba(255,255,255,0.06)",
  border: "1px solid " + (active ? color + "66" : BORDER),
  borderRadius: 8, color: "#fff",
  fontSize: 16, // 16px = no zoom en iOS
  fontWeight: 700, padding: "11px 6px",
  textAlign: "center", outline: "none",
  fontFamily: "'DM Mono', monospace", width: "100%",
  WebkitAppearance: "none", MozAppearance: "textfield",
});

// ─── ACTIVE WORKOUT ───────────────────────────────────────────────────────────
function ActiveWorkout({ dayType, onFinish, onCancel }) {
  const workout = WORKOUTS[dayType];
  const [elapsed, setElapsed] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [sets, setSets] = useState(() =>
    workout.exercises.map(ex =>
      Array.from({ length: ex.sets }, () => ({ kg: String(ex.kg), reps: String(ex.reps), done: false }))
    )
  );
  const [view, setView] = useState("list"); // "list" | "tracking"
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const ex = workout.exercises[currentIdx];
  const curSets = sets[currentIdx];

  const updateSet = (si, field, val) => {
    setSets(prev => {
      const next = prev.map(arr => arr.map(s => ({ ...s })));
      next[currentIdx][si][field] = val;
      return next;
    });
  };

  const addSet = () => {
    setSets(prev => {
      const next = prev.map(arr => arr.map(s => ({ ...s })));
      const last = next[currentIdx][next[currentIdx].length - 1];
      next[currentIdx].push({ ...last, done: false });
      return next;
    });
  };

  const removeSet = (si) => {
    setSets(prev => {
      const next = prev.map(arr => arr.map(s => ({ ...s })));
      if (next[currentIdx].length > 1) next[currentIdx].splice(si, 1);
      return next;
    });
  };

  const finishWorkout = () => {
    const totalKg = sets.reduce((acc, exSets) =>
      acc + exSets.filter(s => s.done).reduce((a, s) =>
        a + (parseFloat(s.kg) || 0) * (parseFloat(s.reps) || 0), 0), 0);

    const session = {
      date: new Date().toISOString(),
      dayType,
      duration: elapsed,
      totalKg: Math.round(totalKg),
      exercises: workout.exercises.map((ex, ei) => ({
        id: ex.id,
        name: ex.name,
        sets: sets[ei].filter(s => s.done).map(s => ({ kg: s.kg, reps: s.reps })),
      })),
    };

    const h = getHistory();
    h[todayStr() + "_" + dayType + "_" + Date.now()] = session;
    saveHistory(h);
    onFinish(session);
  };

  const doneSetsCount = sets.flat().filter(s => s.done).length;
  const totalSetsCount = sets.flat().length;
  const allDone = doneSetsCount === totalSetsCount && totalSetsCount > 0;

  // ── LIST VIEW ──
  if (view === "list") {
    return (
      <div style={{ minHeight:"100vh", background:BG, color:"#fff", fontFamily:"'DM Sans',sans-serif", display:"flex", flexDirection:"column" }}>
        <div style={{ padding:"52px 20px 16px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <button onClick={onCancel} style={{ background:"rgba(255,255,255,0.08)", border:"none", color:"#fff", width:40, height:40, borderRadius:20, fontSize:18, cursor:"pointer" }}>✕</button>
          <div style={{ textAlign:"center" }}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, letterSpacing:2, color:workout.color }}>{workout.label}</div>
            <div style={{ fontSize:26, fontFamily:"'DM Mono',monospace", color:ACCENT, lineHeight:1.1 }}>{fmtTime(elapsed)}</div>
          </div>
          <button onClick={finishWorkout} style={{ background: allDone ? ACCENT : "rgba(255,255,255,0.08)", border:"none", color: allDone ? "#000" : "rgba(255,255,255,0.35)", width:40, height:40, borderRadius:20, fontSize:18, cursor:"pointer", fontWeight:900 }}>✓</button>
        </div>

        {/* Progress bar */}
        <div style={{ height:3, background:"rgba(255,255,255,0.06)", margin:"0 20px 16px" }}>
          <div style={{ height:"100%", width: (doneSetsCount/Math.max(totalSetsCount,1)*100)+ "%", background:workout.color, borderRadius:999, transition:"width 0.4s" }} />
        </div>

        <div style={{ flex:1, overflowY:"auto", padding:"0 20px 120px" }}>
          {workout.exercises.map((exItem, ei) => {
            const exSets = sets[ei];
            const done = exSets.filter(s => s.done).length;
            const isActive = ei === currentIdx;
            return (
              <div key={exItem.id} style={{ marginBottom:10, background:CARD, borderRadius:14, border:"1px solid " + (isActive ? workout.color+"55" : BORDER), overflow:"hidden" }}>
                <div style={{ padding:"13px 14px", display:"flex", alignItems:"center", gap:10 }}>
                  <div style={{ width:36, height:36, borderRadius:8, flexShrink:0, background: done>0 ? workout.color : "rgba(255,255,255,0.06)", display:"flex", alignItems:"center", justifyContent:"center", fontSize: done===exSets.length && done>0 ? 14 : 10, fontWeight:900, color: done>0 ? "#000" : workout.color, border:"1px solid "+workout.color+"33" }}>
                    {done===exSets.length && done>0 ? "✓" : done>0 ? done+"/"+exSets.length : exItem.sets+"×"+exItem.reps}
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, letterSpacing:1 }}>{exItem.name}</div>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginTop:1 }}>{exItem.kg}kg · {exItem.muscle}</div>
                  </div>
                  <button onClick={() => { setCurrentIdx(ei); setView("tracking"); }} style={{ background:workout.color+"22", border:"1px solid "+workout.color+"44", borderRadius:8, color:workout.color, fontSize:10, fontWeight:700, padding:"6px 10px", cursor:"pointer", letterSpacing:1 }}>
                    START ▶
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ position:"fixed", bottom:0, left:0, right:0, padding:"12px 20px 34px", background:"linear-gradient(transparent,"+BG+" 40%)" }}>
          <button onClick={() => setView("tracking")} style={{ width:"100%", padding:16, borderRadius:14, background:workout.color, border:"none", color:"#000", fontFamily:"'Bebas Neue',sans-serif", fontSize:18, letterSpacing:3, cursor:"pointer" }}>
            TRACKEAR EJERCICIO
          </button>
        </div>
      </div>
    );
  }

  // ── TRACKING VIEW ──
  return (
    <div style={{ minHeight:"100vh", background:BG, color:"#fff", fontFamily:"'DM Sans',sans-serif", display:"flex", flexDirection:"column" }}>
      <div style={{ padding:"52px 20px 14px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <button onClick={() => setView("list")} style={{ background:"rgba(255,255,255,0.08)", border:"none", color:"#fff", width:40, height:40, borderRadius:20, fontSize:16, cursor:"pointer" }}>←</button>
        <div style={{ textAlign:"center" }}>
          <div style={{ fontSize:10, color:"rgba(255,255,255,0.35)", letterSpacing:2 }}>{currentIdx+1}/{workout.exercises.length}</div>
          <div style={{ fontFamily:"'DM Mono',monospace", color:ACCENT, fontSize:22 }}>{fmtTime(elapsed)}</div>
        </div>
        <button onClick={finishWorkout} style={{ background: allDone ? ACCENT : "rgba(255,255,255,0.08)", border:"none", color: allDone ? "#000" : "rgba(255,255,255,0.35)", width:40, height:40, borderRadius:20, fontSize:16, cursor:"pointer", fontWeight:900 }}>✓</button>
      </div>

      {/* Exercise card */}
      <div style={{ padding:"0 20px 14px" }}>
        <div style={{ background:workout.color+"12", border:"1px solid "+workout.color+"44", borderRadius:14, padding:"14px 16px" }}>
          <div style={{ fontSize:9, color:workout.color, fontWeight:700, letterSpacing:3, textTransform:"uppercase", marginBottom:4 }}>{ex.muscle}</div>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:26, letterSpacing:1.5 }}>{ex.name}</div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.4)", marginTop:4 }}>💡 {ex.note}</div>
        </div>
      </div>

      {/* Sets */}
      <div style={{ flex:1, overflowY:"auto", padding:"0 20px 140px" }}>
        <div style={{ display:"grid", gridTemplateColumns:"26px 1fr 1fr 46px 34px", gap:6, marginBottom:8, padding:"0 2px" }}>
          {["#","KG","REPS","OK",""].map(h => (
            <div key={h} style={{ fontSize:9, color:"rgba(255,255,255,0.25)", textTransform:"uppercase", letterSpacing:1, textAlign:"center" }}>{h}</div>
          ))}
        </div>
        {curSets.map((set, si) => (
          <div key={si} style={{ display:"grid", gridTemplateColumns:"26px 1fr 1fr 46px 34px", gap:6, alignItems:"center", marginBottom:8 }}>
            <div style={{ textAlign:"center", fontSize:11, color:"rgba(255,255,255,0.3)", fontFamily:"'DM Mono',monospace" }}>{si+1}</div>
            {["kg","reps"].map(field => (
              <input key={field} type="number" inputMode="decimal"
                value={set[field]}
                onChange={e => updateSet(si, field, e.target.value)}
                style={numInput(set.done, workout.color)}
              />
            ))}
            <button onClick={() => updateSet(si, "done", !set.done)} style={{ background: set.done ? workout.color : "rgba(255,255,255,0.06)", border:"1px solid "+(set.done ? workout.color : BORDER), borderRadius:8, color: set.done ? "#000" : "rgba(255,255,255,0.3)", fontSize:16, padding:"11px 0", cursor:"pointer", fontWeight:900, width:"100%" }}>✓</button>
            <button onClick={() => removeSet(si)} style={{ background:"transparent", border:"none", color:"rgba(255,80,80,0.5)", fontSize:15, cursor:"pointer", padding:4 }}>🗑</button>
          </div>
        ))}
        <button onClick={addSet} style={{ width:"100%", padding:"10px", background:"rgba(255,255,255,0.03)", border:"1px dashed rgba(255,255,255,0.12)", borderRadius:10, color:"rgba(255,255,255,0.35)", fontSize:13, cursor:"pointer", marginTop:4 }}>
          + Agregar serie
        </button>
      </div>

      <div style={{ position:"fixed", bottom:0, left:0, right:0, padding:"12px 20px 34px", background:"linear-gradient(transparent,"+BG+" 40%)", display:"flex", gap:10 }}>
        {currentIdx > 0 && (
          <button onClick={() => setCurrentIdx(i => i-1)} style={{ flex:1, padding:14, background:"rgba(255,255,255,0.06)", border:"1px solid "+BORDER, borderRadius:12, color:"#fff", fontFamily:"'Bebas Neue',sans-serif", fontSize:16, letterSpacing:2, cursor:"pointer" }}>← ANTERIOR</button>
        )}
        {currentIdx < workout.exercises.length-1 ? (
          <button onClick={() => setCurrentIdx(i => i+1)} style={{ flex:1, padding:14, background:workout.color, border:"none", borderRadius:12, color:"#000", fontFamily:"'Bebas Neue',sans-serif", fontSize:16, letterSpacing:2, cursor:"pointer" }}>SIGUIENTE →</button>
        ) : (
          <button onClick={() => setView("list")} style={{ flex:1, padding:14, background:ACCENT, border:"none", borderRadius:12, color:"#000", fontFamily:"'Bebas Neue',sans-serif", fontSize:16, letterSpacing:2, cursor:"pointer" }}>VER TODOS ✓</button>
        )}
      </div>
    </div>
  );
}

// ─── SESSION SUMMARY ──────────────────────────────────────────────────────────
function SessionSummary({ session, onClose }) {
  const workout = WORKOUTS[session.dayType];
  const totalSets = session.exercises.reduce((a, e) => a + e.sets.length, 0);
  const kcalEst = Math.round(session.duration / 60 * 6);

  return (
    <div style={{ minHeight:"100vh", background:BG, color:"#fff", fontFamily:"'DM Sans',sans-serif", overflowY:"auto", paddingBottom:40 }}>
      <div style={{ padding:"50px 20px 20px", textAlign:"center" }}>
        <div style={{ fontSize:44 }}>🏆</div>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:30, letterSpacing:3, color:workout.color, marginTop:8 }}>SESIÓN COMPLETADA</div>
        <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginTop:4 }}>
          {new Date(session.date).toLocaleString("es-AR", { weekday:"long", day:"numeric", month:"short", hour:"2-digit", minute:"2-digit" })}
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, padding:"0 20px 20px" }}>
        {[
          { l:"DURACIÓN",    v: fmtTime(session.duration) },
          { l:"SERIES",      v: totalSets },
          { l:"KG MOVIDOS",  v: session.totalKg + " kg" },
        ].map(s => (
          <div key={s.l} style={{ background:CARD, borderRadius:12, padding:"14px 8px", textAlign:"center", border:"1px solid "+BORDER }}>
            <div style={{ fontSize:8, color:"rgba(255,255,255,0.3)", letterSpacing:2, marginBottom:6 }}>{s.l}</div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:18, fontWeight:700, color:ACCENT }}>{s.v}</div>
          </div>
        ))}
      </div>

      <div style={{ margin:"0 20px 20px", background:CARD, borderRadius:12, padding:"12px 16px", border:"1px solid "+BORDER, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
        <span style={{ fontSize:13, color:"rgba(255,255,255,0.5)" }}>Calorías estimadas</span>
        <span style={{ fontFamily:"'DM Mono',monospace", fontSize:18, color:ACCENT, fontWeight:700 }}>{kcalEst} kcal</span>
      </div>

      <div style={{ padding:"0 20px" }}>
        <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", letterSpacing:3, textTransform:"uppercase", marginBottom:12 }}>EJERCICIOS</div>
        {session.exercises.map(ex => ex.sets.length > 0 && (
          <div key={ex.id} style={{ background:CARD, borderRadius:12, padding:"12px 14px", marginBottom:8, border:"1px solid "+BORDER }}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:15, letterSpacing:1, marginBottom:8, color:workout.color }}>{ex.name}</div>
            {ex.sets.map((s, i) => (
              <div key={i} style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"rgba(255,255,255,0.5)", padding:"3px 0", borderBottom:"1px solid rgba(255,255,255,0.04)" }}>
                <span style={{ color:"rgba(255,255,255,0.25)", fontFamily:"'DM Mono',monospace" }}>Serie {i+1}</span>
                <span><strong style={{ color:"#fff" }}>{s.kg}kg</strong><span style={{ color:"rgba(255,255,255,0.4)" }}> × {s.reps} reps</span></span>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div style={{ padding:"20px 20px 0" }}>
        <button onClick={onClose} style={{ width:"100%", padding:16, borderRadius:14, background:ACCENT, border:"none", color:"#000", fontFamily:"'Bebas Neue',sans-serif", fontSize:20, letterSpacing:3, cursor:"pointer" }}>
          VOLVER AL INICIO
        </button>
      </div>
    </div>
  );
}

// ─── EXERCISE DETAIL ──────────────────────────────────────────────────────────
function ExerciseDetail({ exId, dayType, onBack }) {
  const workout = WORKOUTS[dayType];
  const ex = workout.exercises.find(e => e.id === exId);
  const history = getHistory();

  const sessionData = Object.values(history)
    .filter(s => s.dayType === dayType)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .flatMap(s => {
      const exData = s.exercises.find(e => e.id === exId);
      if (!exData || exData.sets.length === 0) return [];
      const maxKg = Math.max(...exData.sets.map(s2 => parseFloat(s2.kg) || 0));
      return [{ date: s.date, kg: maxKg, exData }];
    });

  const latest = sessionData[sessionData.length - 1];
  const prev   = sessionData[sessionData.length - 2];
  const trend  = latest && prev ? (latest.kg - prev.kg) : null;

  return (
    <div style={{ minHeight:"100vh", background:BG, color:"#fff", fontFamily:"'DM Sans',sans-serif", overflowY:"auto", paddingBottom:40 }}>
      <div style={{ padding:"52px 20px 16px", display:"flex", alignItems:"center", gap:14 }}>
        <button onClick={onBack} style={{ background:"rgba(255,255,255,0.08)", border:"none", color:"#fff", width:40, height:40, borderRadius:20, fontSize:16, cursor:"pointer" }}>←</button>
        <div>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, letterSpacing:1.5 }}>{ex.name}</div>
          <div style={{ fontSize:10, color:workout.color, letterSpacing:2, fontWeight:700 }}>{ex.muscle}</div>
        </div>
      </div>

      {trend !== null && (
        <div style={{ margin:"0 20px 14px", background:workout.color+"15", border:"1px solid "+workout.color+"33", borderRadius:12, padding:"12px 14px" }}>
          <div style={{ fontSize:12, color:workout.color, fontWeight:700 }}>
            {trend > 0 ? "📈 +" : trend < 0 ? "📉 " : "➡️ "}{Math.abs(trend).toFixed(1)}kg respecto a la sesión anterior
          </div>
        </div>
      )}

      {latest && (
        <div style={{ padding:"0 20px 14px" }}>
          <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", letterSpacing:3, textTransform:"uppercase", marginBottom:10 }}>MÁS RECIENTE</div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8 }}>
            {[
              { l:"KG",     v: latest.kg },
              { l:"REPS",   v: latest.exData.sets[0]?.reps || "—" },
              { l:"SERIES", v: latest.exData.sets.length },
            ].map(s => (
              <div key={s.l} style={{ background:CARD, borderRadius:10, padding:"12px 8px", textAlign:"center", border:"1px solid "+BORDER }}>
                <div style={{ fontSize:8, color:"rgba(255,255,255,0.3)", letterSpacing:2, marginBottom:4 }}>{s.l}</div>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:22, fontWeight:700, color:ACCENT }}>{s.v}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ margin:"0 20px 14px", background:CARD, borderRadius:12, padding:"14px 16px", border:"1px solid "+BORDER }}>
        <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", letterSpacing:3, textTransform:"uppercase", marginBottom:12 }}>PROGRESIÓN DE PESO MÁXIMO</div>
        <MiniChart data={sessionData} color={workout.color} />
        {sessionData.length > 1 && (
          <div style={{ display:"flex", justifyContent:"space-between", marginTop:4 }}>
            <span style={{ fontSize:9, color:"rgba(255,255,255,0.2)" }}>{new Date(sessionData[0].date).toLocaleDateString("es-AR",{day:"numeric",month:"short"})}</span>
            <span style={{ fontSize:9, color:"rgba(255,255,255,0.2)" }}>{new Date(sessionData[sessionData.length-1].date).toLocaleDateString("es-AR",{day:"numeric",month:"short"})}</span>
          </div>
        )}
      </div>

      <div style={{ padding:"0 20px" }}>
        <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", letterSpacing:3, textTransform:"uppercase", marginBottom:12 }}>HISTORIAL</div>
        {Object.values(history)
          .filter(s => s.dayType === dayType && s.exercises.find(e => e.id === exId)?.sets.length > 0)
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 12)
          .map((s, i) => {
            const exData = s.exercises.find(e => e.id === exId);
            return (
              <div key={i} style={{ background:CARD, borderRadius:12, padding:"12px 14px", marginBottom:8, border:"1px solid "+BORDER }}>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginBottom:8 }}>
                  {new Date(s.date).toLocaleDateString("es-AR",{weekday:"short",day:"numeric",month:"short",year:"numeric"})}
                </div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                  {exData.sets.map((set, si) => (
                    <div key={si} style={{ background:"rgba(255,255,255,0.06)", borderRadius:8, padding:"6px 10px", fontSize:12, fontFamily:"'DM Mono',monospace" }}>
                      <span style={{ color:ACCENT, fontWeight:700 }}>{set.kg}kg</span>
                      <span style={{ color:"rgba(255,255,255,0.4)" }}> × {set.reps}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        {sessionData.length === 0 && (
          <div style={{ textAlign:"center", padding:30, color:"rgba(255,255,255,0.2)", fontSize:13 }}>Sin sesiones registradas aún</div>
        )}
      </div>
    </div>
  );
}

// ─── HISTORY SCREEN ───────────────────────────────────────────────────────────
function HistoryScreen({ onBack }) {
  const history = getHistory();
  const sessions = Object.values(history).sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div style={{ minHeight:"100vh", background:BG, color:"#fff", fontFamily:"'DM Sans',sans-serif", overflowY:"auto", paddingBottom:40 }}>
      <div style={{ padding:"52px 20px 16px", display:"flex", alignItems:"center", gap:14 }}>
        <button onClick={onBack} style={{ background:"rgba(255,255,255,0.08)", border:"none", color:"#fff", width:40, height:40, borderRadius:20, fontSize:16, cursor:"pointer" }}>←</button>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:24, letterSpacing:2 }}>HISTORIAL COMPLETO</div>
      </div>

      {sessions.length === 0 && (
        <div style={{ textAlign:"center", padding:60, color:"rgba(255,255,255,0.2)", fontSize:13 }}>Sin sesiones aún. ¡Empezá tu primer entreno!</div>
      )}

      <div style={{ padding:"0 20px" }}>
        {sessions.map((s, i) => {
          const w = WORKOUTS[s.dayType];
          const totalSets = s.exercises.reduce((a, e) => a + e.sets.length, 0);
          const kcal = Math.round(s.duration / 60 * 6);
          return (
            <div key={i} style={{ background:CARD, borderRadius:14, padding:"14px 16px", marginBottom:10, border:"1px solid "+BORDER }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
                <div>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:16, letterSpacing:1.5, color:w.color }}>{w.label} · {w.subtitle}</div>
                  <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:2 }}>
                    {new Date(s.date).toLocaleDateString("es-AR",{weekday:"long",day:"numeric",month:"short"})} · {new Date(s.date).toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"})}
                  </div>
                </div>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:11, color:"rgba(255,255,255,0.3)" }}>⏱ {fmtTime(s.duration)}</div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:6 }}>
                {[["KCAL EST.", kcal+" kcal"],["SERIES", totalSets],["KG MOVIDOS", s.totalKg+" kg"]].map(([l, v]) => (
                  <div key={l} style={{ background:"rgba(255,255,255,0.04)", borderRadius:8, padding:"8px 6px", textAlign:"center" }}>
                    <div style={{ fontSize:8, color:"rgba(255,255,255,0.25)", letterSpacing:1.5, marginBottom:3 }}>{l}</div>
                    <div style={{ fontFamily:"'DM Mono',monospace", fontSize:13, fontWeight:700, color:"#fff" }}>{v}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── HOME ─────────────────────────────────────────────────────────────────────
function HomeScreen({ onStartWorkout, onViewExercise, onViewHistory }) {
  const history = getHistory();
  const sessions = Object.values(history).sort((a, b) => new Date(b.date) - new Date(a.date));

  // Streak
  const streakDates = new Set(sessions.map(s => s.date.split("T")[0]));
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 366; i++) {
    if (streakDates.has(d.toISOString().split("T")[0])) { streak++; d.setDate(d.getDate()-1); }
    else if (streak > 0) break;
    else d.setDate(d.getDate()-1);
  }

  const totalKgTons = (sessions.reduce((a, s) => a + (s.totalKg || 0), 0) / 1000).toFixed(1);

  return (
    <div style={{ minHeight:"100vh", background:BG, color:"#fff", fontFamily:"'DM Sans',sans-serif", overflowY:"auto", paddingBottom:120 }}>
      {/* Glow */}
      <div style={{ position:"fixed", top:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, height:260, background:"radial-gradient(ellipse at 50% -10%, rgba(200,255,0,0.07) 0%, transparent 70%)", pointerEvents:"none", zIndex:0 }} />

      <div style={{ padding:"52px 20px 16px", position:"relative", zIndex:1 }}>
        <div style={{ fontSize:9, letterSpacing:5, color:"rgba(255,255,255,0.2)", textTransform:"uppercase", marginBottom:4 }}>SOMA · Fase Adaptación</div>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:48, letterSpacing:3, lineHeight:1, color:ACCENT }}>WORKOUT</div>
        <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:48, letterSpacing:3, lineHeight:1, color:"rgba(255,255,255,0.1)" }}>TRACKER</div>
      </div>

      {/* Stats */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:8, padding:"0 20px 16px", position:"relative", zIndex:1 }}>
        {[
          { l:"SESIONES", v: sessions.length, icon:"🏋️" },
          { l:"RACHA",    v: streak+" d",      icon:"🔥" },
          { l:"TONELAJE", v: totalKgTons+"t",  icon:"💪" },
        ].map(s => (
          <div key={s.l} style={{ background:CARD, borderRadius:12, padding:"12px 8px", textAlign:"center", border:"1px solid "+BORDER }}>
            <div style={{ fontSize:18, marginBottom:4 }}>{s.icon}</div>
            <div style={{ fontFamily:"'DM Mono',monospace", fontSize:17, fontWeight:700, color:ACCENT }}>{s.v}</div>
            <div style={{ fontSize:8, color:"rgba(255,255,255,0.25)", letterSpacing:2, marginTop:2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Streak calendar */}
      <div style={{ margin:"0 20px 16px", background:CARD, borderRadius:14, padding:"14px 16px", border:"1px solid "+BORDER }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
          <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", letterSpacing:3, textTransform:"uppercase" }}>TU RACHA</div>
          <div style={{ display:"flex", gap:10 }}>
            {["A","B"].map(t => (
              <div key={t} style={{ display:"flex", alignItems:"center", gap:4 }}>
                <div style={{ width:8, height:8, borderRadius:2, background:WORKOUTS[t].color }} />
                <span style={{ fontSize:9, color:"rgba(255,255,255,0.3)" }}>Día {t}</span>
              </div>
            ))}
          </div>
        </div>
        <StreakCalendar history={history} />
      </div>

      {/* Plans */}
      <div style={{ padding:"0 20px 16px" }}>
        <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", letterSpacing:3, textTransform:"uppercase", marginBottom:12 }}>PLANES</div>
        {["A","B"].map(dayType => {
          const w = WORKOUTS[dayType];
          const lastDaySession = sessions.find(s => s.dayType === dayType);
          return (
            <div key={dayType} style={{ background:CARD, borderRadius:14, padding:"14px 16px", marginBottom:10, border:"1px solid "+BORDER }}>
              <div style={{ marginBottom:10 }}>
                <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:18, letterSpacing:1.5, color:w.color }}>{w.label} — {w.subtitle}</div>
                <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:2 }}>
                  {w.exercises.length} ejercicios · {lastDaySession ? "Última vez: " + new Date(lastDaySession.date).toLocaleDateString("es-AR",{day:"numeric",month:"short"}) : "Sin sesiones aún"}
                </div>
              </div>
              {/* Muscle tags */}
              <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:12 }}>
                {[...new Set(w.exercises.map(e => e.muscle))].map(m => (
                  <div key={m} style={{ fontSize:9, color:MUSCLE_COLORS[m]||"#fff", border:"1px solid "+(MUSCLE_COLORS[m]||"#fff")+"55", borderRadius:999, padding:"3px 9px", letterSpacing:1, fontWeight:700 }}>{m}</div>
                ))}
              </div>
              {/* Exercise rows */}
              <div style={{ marginBottom:12 }}>
                {w.exercises.map(ex => (
                  <div key={ex.id} onClick={() => onViewExercise(ex.id, dayType)} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"7px 0", borderBottom:"1px solid rgba(255,255,255,0.04)", cursor:"pointer" }}>
                    <span style={{ fontSize:13, color:"rgba(255,255,255,0.65)" }}>{ex.name}</span>
                    <span style={{ fontSize:12, color:w.color, fontFamily:"'DM Mono',monospace" }}>{ex.kg}kg ›</span>
                  </div>
                ))}
              </div>
              <button onClick={() => onStartWorkout(dayType)} style={{ width:"100%", padding:"13px", background:w.color, border:"none", borderRadius:10, color:"#000", fontFamily:"'Bebas Neue',sans-serif", fontSize:17, letterSpacing:2, cursor:"pointer" }}>
                INICIAR {w.label}
              </button>
            </div>
          );
        })}
      </div>

      {/* Recent sessions */}
      {sessions.length > 0 && (
        <div style={{ padding:"0 20px" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
            <div style={{ fontSize:9, color:"rgba(255,255,255,0.3)", letterSpacing:3, textTransform:"uppercase" }}>ÚLTIMAS SESIONES</div>
            <button onClick={onViewHistory} style={{ background:"none", border:"none", color:ACCENT, fontSize:11, cursor:"pointer", fontWeight:700, letterSpacing:1 }}>VER TODO ›</button>
          </div>
          {sessions.slice(0, 3).map((s, i) => {
            const w = WORKOUTS[s.dayType];
            return (
              <div key={i} style={{ background:CARD, borderRadius:12, padding:"12px 14px", marginBottom:8, border:"1px solid "+BORDER }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <div style={{ fontSize:13, color:w.color, fontWeight:700, fontFamily:"'DM Mono',monospace" }}>{w.label}</div>
                    <div style={{ fontSize:10, color:"rgba(255,255,255,0.3)", marginTop:2 }}>
                      {new Date(s.date).toLocaleDateString("es-AR",{weekday:"short",day:"numeric",month:"short"})}
                    </div>
                  </div>
                  <div style={{ textAlign:"right" }}>
                    <div style={{ fontSize:11, color:"rgba(255,255,255,0.5)", fontFamily:"'DM Mono',monospace" }}>⏱ {fmtTime(s.duration)}</div>
                    <div style={{ fontSize:11, color:ACCENT, marginTop:2, fontFamily:"'DM Mono',monospace" }}>{s.totalKg} kg</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("home");
  const [workoutDay, setWorkoutDay] = useState(null);
  const [doneSession, setDoneSession] = useState(null);
  const [selectedEx, setSelectedEx] = useState(null);

  if (screen === "workout" && workoutDay) {
    return <ActiveWorkout dayType={workoutDay} onFinish={s => { setDoneSession(s); setScreen("summary"); }} onCancel={() => setScreen("home")} />;
  }
  if (screen === "summary" && doneSession) {
    return <SessionSummary session={doneSession} onClose={() => { setDoneSession(null); setScreen("home"); }} />;
  }
  if (screen === "exercise" && selectedEx) {
    return <ExerciseDetail exId={selectedEx.exId} dayType={selectedEx.dayType} onBack={() => setScreen("home")} />;
  }
  if (screen === "history") {
    return <HistoryScreen onBack={() => setScreen("home")} />;
  }
  return (
    <HomeScreen
      onStartWorkout={d => { setWorkoutDay(d); setScreen("workout"); }}
      onViewExercise={(exId, dayType) => { setSelectedEx({ exId, dayType }); setScreen("exercise"); }}
      onViewHistory={() => setScreen("history")}
    />
  );
}
