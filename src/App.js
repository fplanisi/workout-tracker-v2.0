import { useState, useEffect, useRef, useCallback } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const ACCENT = "#C8FF00";
const BG = "#080808";
const CARD = "#111111";
const BORDER = "rgba(255,255,255,0.08)";

const WORKOUTS = {
  A: {
    label: "DÍA A", subtitle: "TORSO & V-SHAPE", tag: "Empuje", color: "#FF4D1C",
    exercises: [
      { id: "press_hombros", name: "Press Hombros", kg: 10, sets: 3, reps: 12, note: "3s bajada — Control excéntrico", muscle: "HOMBROS" },
      { id: "vuelos_laterales", name: "Vuelos Laterales", kg: 5, sets: 4, reps: 18, note: "Mantener hombros abajo", muscle: "HOMBROS" },
      { id: "press_pecho", name: "Press de Pecho", kg: 15, sets: 3, reps: 12, note: "Codos a 45° — Evitar ardor", muscle: "PECHO" },
      { id: "copa_triceps", name: "Copa Tríceps", kg: 12, sets: 3, reps: 15, note: "Codos cerrados al techo", muscle: "TRÍCEPS" },
    ],
  },
  B: {
    label: "DÍA B", subtitle: "POTENCIA & BASE", tag: "Tracción/Piernas", color: "#00D4FF",
    exercises: [
      { id: "peso_muerto", name: "Peso Muerto Rumano", kg: 18, sets: 3, reps: 12, note: "Foco en estirar isquios", muscle: "ISQUIOS" },
      { id: "remo_serrucho", name: "Remo (Serrucho)", kg: 18, sets: 3, reps: 12, note: "Codo al bolsillo", muscle: "ESPALDA" },
      { id: "sentadilla_goblet", name: "Sentadilla Goblet", kg: 18, sets: 3, reps: 12, note: "Romper la paralela", muscle: "PIERNAS" },
      { id: "curl_martillo", name: "Curl Martillo", kg: 12, sets: 3, reps: 12, note: "Sin balanceo del cuerpo", muscle: "BÍCEPS" },
    ],
  },
};

const MUSCLE_COLORS = {
  HOMBROS: "#FF4D1C", PECHO: "#FF6B35", TRÍCEPS: "#FF8C42",
  ISQUIOS: "#00D4FF", ESPALDA: "#00B8D9", PIERNAS: "#0099B8", BÍCEPS: "#007A99",
};

// ─── STORAGE ──────────────────────────────────────────────────────────────────
const store = {
  get(k) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch { return false; } },
};

// ─── UTILS ────────────────────────────────────────────────────────────────────
const fmt = (s) => {
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
  return h > 0
    ? String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0") + ":" + String(ss).padStart(2, "0")
    : String(m).padStart(2, "0") + ":" + String(ss).padStart(2, "0");
};

const today = () => new Date().toISOString().split("T")[0];

const getHistory = () => store.get("soma_history_v2") || {};
const saveHistory = (h) => {
  const keys = Object.keys(h).sort();
  const pruned = {};
  keys.slice(-120).forEach(k => { pruned[k] = h[k]; });
  store.set("soma_history_v2", pruned);
};

// ─── STREAK CALENDAR ──────────────────────────────────────────────────────────
function StreakCalendar({ history }) {
  const days = [];
  const now = new Date();
  // Show last 10 weeks (Mon–Sun)
  const startMonday = new Date(now);
  startMonday.setDate(now.getDate() - now.getDay() + 1 - 9 * 7);

  for (let w = 0; w < 10; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(startMonday);
      date.setDate(startMonday.getDate() + w * 7 + d);
      const key = date.toISOString().split("T")[0];
      const sessions = Object.keys(history).filter(k => k.startsWith(key));
      const dayType = sessions.length > 0
        ? sessions.some(k => k.endsWith("_A")) ? "A" : "B"
        : null;
      week.push({ key, dayType, isToday: key === today(), isFuture: date > now });
    }
    days.push(week);
  }

  const DAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];

  return (
    <div>
      <div style={{ display: "flex", gap: 3, marginBottom: 4 }}>
        <div style={{ width: 14 }} />
        {days.map((_, wi) => (
          <div key={wi} style={{ flex: 1, textAlign: "center" }} />
        ))}
      </div>
      <div style={{ display: "flex", gap: 2 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, marginRight: 4 }}>
          {DAY_LABELS.map(l => (
            <div key={l} style={{ height: 10, fontSize: 8, color: "rgba(255,255,255,0.2)", lineHeight: "10px", width: 10 }}>{l}</div>
          ))}
        </div>
        {days.map((week, wi) => (
          <div key={wi} style={{ display: "flex", flexDirection: "column", gap: 2, flex: 1 }}>
            {week.map(({ key, dayType, isToday, isFuture }) => (
              <div key={key} style={{
                height: 10, borderRadius: 2,
                background: isFuture ? "transparent"
                  : dayType === "A" ? WORKOUTS.A.color
                  : dayType === "B" ? WORKOUTS.B.color
                  : "rgba(255,255,255,0.06)",
                outline: isToday ? "1px solid " + ACCENT : "none",
                outlineOffset: 1,
              }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MINI CHART ───────────────────────────────────────────────────────────────
function MiniChart({ data, color }) {
  if (!data || data.length < 2) return (
    <div style={{ height: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>Sin datos suficientes</span>
    </div>
  );
  const vals = data.map(d => d.kg);
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = max - min || 1;
  const W = 280, H = 60;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((d.kg - min) / range) * (H - 8) - 4;
    return x + "," + y;
  }).join(" ");

  const areaPath = "M " + data.map((d, i) => {
    const x = (i / (data.length - 1)) * W;
    const y = H - ((d.kg - min) / range) * (H - 8) - 4;
    return x + " " + y;
  }).join(" L ") + " L " + W + " " + H + " L 0 " + H + " Z";

  return (
    <svg viewBox={"0 0 " + W + " " + H} style={{ width: "100%", height: 60, overflow: "visible" }}>
      <defs>
        <linearGradient id={"g" + color.replace("#", "")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={"url(#g" + color.replace("#", "") + ")"} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={(data.length - 1) / (data.length - 1) * W} cy={H - ((vals[vals.length - 1] - min) / range) * (H - 8) - 4} r="3" fill={color} />
    </svg>
  );
}

// ─── ACTIVE WORKOUT SCREEN ────────────────────────────────────────────────────
function ActiveWorkout({ dayType, onFinish, onCancel }) {
  const workout = WORKOUTS[dayType];
  const [elapsed, setElapsed] = useState(0);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [sets, setSets] = useState(() =>
    workout.exercises.map(ex => [{ kg: ex.kg, reps: ex.reps, done: false }])
  );
  const [phase, setPhase] = useState("list"); // "list" | "tracking" | "done"
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  const ex = workout.exercises[currentIdx];
  const currentSets = sets[currentIdx];

  const updateSet = (si, field, val) => {
    setSets(prev => {
      const next = prev.map(s => [...s]);
      next[currentIdx][si] = { ...next[currentIdx][si], [field]: val };
      return next;
    });
  };

  const addSet = () => {
    setSets(prev => {
      const next = prev.map(s => [...s]);
      const last = next[currentIdx][next[currentIdx].length - 1];
      next[currentIdx].push({ ...last, done: false });
      return next;
    });
  };

  const removeSet = (si) => {
    setSets(prev => {
      const next = prev.map(s => [...s]);
      if (next[currentIdx].length > 1) next[currentIdx].splice(si, 1);
      return next;
    });
  };

  const finishWorkout = () => {
    const totalKgMoved = sets.reduce((acc, exSets, ei) => {
      return acc + exSets.filter(s => s.done).reduce((a, s) => a + (parseFloat(s.kg) || 0) * (parseFloat(s.reps) || 0), 0);
    }, 0);

    const session = {
      date: new Date().toISOString(),
      dayType,
      duration: elapsed,
      totalKg: Math.round(totalKgMoved),
      exercises: workout.exercises.map((ex, ei) => ({
        id: ex.id,
        name: ex.name,
        sets: sets[ei].filter(s => s.done),
      })),
    };

    const h = getHistory();
    const key = today() + "_" + dayType + "_" + Date.now();
    h[key] = session;
    saveHistory(h);
    onFinish(session);
  };

  const allDone = sets.every(exSets => exSets.some(s => s.done));

  if (phase === "list") {
    return (
      <div style={{ minHeight: "100vh", background: BG, color: "#fff", fontFamily: "'DM Sans', sans-serif", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ padding: "20px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button onClick={onCancel} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#fff", width: 40, height: 40, borderRadius: 20, fontSize: 18, cursor: "pointer" }}>✕</button>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 2, color: workout.color }}>{workout.label}</div>
            <div style={{ fontSize: 28, fontFamily: "'DM Mono', monospace", color: ACCENT }}>{fmt(elapsed)}</div>
          </div>
          <button
            onClick={finishWorkout}
            style={{ background: allDone ? ACCENT : "rgba(255,255,255,0.08)", border: "none", color: allDone ? "#000" : "rgba(255,255,255,0.4)", width: 40, height: 40, borderRadius: 20, fontSize: 18, cursor: "pointer", fontWeight: 900 }}>
            ✓
          </button>
        </div>

        {/* Exercise list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px 120px" }}>
          {workout.exercises.map((ex, ei) => {
            const exSets = sets[ei];
            const doneSets = exSets.filter(s => s.done).length;
            const isActive = ei === currentIdx;
            return (
              <div key={ex.id} style={{ marginBottom: 12, background: CARD, borderRadius: 14, border: "1px solid " + (isActive ? workout.color + "66" : BORDER), overflow: "hidden" }}>
                <div style={{ padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }} onClick={() => { setCurrentIdx(ei); setPhase("tracking"); }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                    background: doneSets > 0 ? workout.color : "rgba(255,255,255,0.06)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: doneSets > 0 ? 14 : 10, fontWeight: 900,
                    color: doneSets > 0 ? "#000" : workout.color,
                    border: "1px solid " + workout.color + "33",
                  }}>
                    {doneSets > 0 ? (doneSets === exSets.length ? "✓" : doneSets + "/" + exSets.length) : ex.sets + "×" + ex.reps}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, letterSpacing: 1 }}>{ex.name}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>{ex.kg}kg · {ex.note.split("—")[0].trim()}</div>
                  </div>
                  <div style={{ background: workout.color + "22", borderRadius: 6, padding: "4px 10px", fontSize: 10, color: workout.color, fontWeight: 700, letterSpacing: 1 }}>START ▶</div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "12px 20px 30px", background: "linear-gradient(transparent, " + BG + " 40%)" }}>
          <button onClick={() => setPhase("tracking")} style={{
            width: "100%", padding: 16, borderRadius: 14, background: workout.color,
            border: "none", color: "#000", fontFamily: "'Bebas Neue', sans-serif",
            fontSize: 18, letterSpacing: 3, cursor: "pointer",
          }}>
            TRACKEAR EJERCICIO
          </button>
        </div>
      </div>
    );
  }

  // Tracking view
  return (
    <div style={{ minHeight: "100vh", background: BG, color: "#fff", fontFamily: "'DM Sans', sans-serif", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "20px 20px 0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <button onClick={() => setPhase("list")} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#fff", width: 40, height: 40, borderRadius: 20, fontSize: 16, cursor: "pointer" }}>←</button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 2 }}>EJERCICIO {currentIdx + 1}/{workout.exercises.length}</div>
          <div style={{ fontFamily: "'DM Mono', monospace", color: ACCENT, fontSize: 20 }}>{fmt(elapsed)}</div>
        </div>
        <button onClick={finishWorkout} style={{ background: allDone ? ACCENT : "rgba(255,255,255,0.08)", border: "none", color: allDone ? "#000" : "rgba(255,255,255,0.4)", width: 40, height: 40, borderRadius: 20, fontSize: 16, cursor: "pointer", fontWeight: 900 }}>✓</button>
      </div>

      {/* Exercise name */}
      <div style={{ padding: "16px 20px 0" }}>
        <div style={{ background: workout.color + "15", border: "1px solid " + workout.color + "44", borderRadius: 12, padding: "14px 16px" }}>
          <div style={{ fontSize: 9, color: workout.color, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", marginBottom: 4 }}>{ex.muscle}</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 26, letterSpacing: 1.5, color: "#fff" }}>{ex.name}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>💡 {ex.note}</div>
        </div>
      </div>

      {/* Sets */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 20px 120px" }}>
        {/* Column headers */}
        <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 1fr 44px 36px", gap: 6, marginBottom: 8, padding: "0 2px" }}>
          {["#", "KG", "REPS", "OK", ""].map(h => (
            <div key={h} style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", letterSpacing: 1, textAlign: "center" }}>{h}</div>
          ))}
        </div>

        {currentSets.map((set, si) => (
          <div key={si} style={{ display: "grid", gridTemplateColumns: "28px 1fr 1fr 44px 36px", gap: 6, alignItems: "center", marginBottom: 8 }}>
            <div style={{ textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.3)", fontFamily: "'DM Mono', monospace" }}>{si + 1}</div>
            {["kg", "reps"].map(field => (
              <input key={field} type="number" inputMode="decimal" value={set[field] || ""} onChange={e => updateSet(si, field, e.target.value)}
                style={{
                  background: set.done ? workout.color + "22" : "rgba(255,255,255,0.06)",
                  border: "1px solid " + (set.done ? workout.color + "77" : BORDER),
                  borderRadius: 8, color: "#fff", fontSize: 16, fontWeight: 700,
                  padding: "10px 8px", textAlign: "center", outline: "none",
                  fontFamily: "'DM Mono', monospace", width: "100%",
                }}
              />
            ))}
            <button onClick={() => updateSet(si, "done", !set.done)} style={{
              background: set.done ? workout.color : "rgba(255,255,255,0.06)",
              border: "1px solid " + (set.done ? workout.color : BORDER),
              borderRadius: 8, color: set.done ? "#000" : "rgba(255,255,255,0.3)",
              fontSize: 16, padding: "10px 0", cursor: "pointer", fontWeight: 900, width: "100%",
            }}>✓</button>
            <button onClick={() => removeSet(si)} style={{
              background: "transparent", border: "none", color: "rgba(255,60,60,0.5)",
              fontSize: 14, cursor: "pointer", padding: 4,
            }}>🗑</button>
          </div>
        ))}

        <button onClick={addSet} style={{
          width: "100%", padding: "10px", background: "rgba(255,255,255,0.04)",
          border: "1px dashed rgba(255,255,255,0.15)", borderRadius: 10,
          color: "rgba(255,255,255,0.4)", fontSize: 13, cursor: "pointer", marginTop: 4,
        }}>
          + Agregar serie
        </button>
      </div>

      {/* Nav between exercises */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "12px 20px 30px", background: "linear-gradient(transparent, " + BG + " 40%)", display: "flex", gap: 10 }}>
        {currentIdx > 0 && (
          <button onClick={() => setCurrentIdx(i => i - 1)} style={{
            flex: 1, padding: 14, background: "rgba(255,255,255,0.06)", border: "1px solid " + BORDER,
            borderRadius: 12, color: "#fff", fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, letterSpacing: 2, cursor: "pointer",
          }}>← ANTERIOR</button>
        )}
        {currentIdx < workout.exercises.length - 1 ? (
          <button onClick={() => setCurrentIdx(i => i + 1)} style={{
            flex: 1, padding: 14, background: workout.color,
            border: "none", borderRadius: 12, color: "#000",
            fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, letterSpacing: 2, cursor: "pointer",
          }}>SIGUIENTE →</button>
        ) : (
          <button onClick={() => setPhase("list")} style={{
            flex: 1, padding: 14, background: ACCENT,
            border: "none", borderRadius: 12, color: "#000",
            fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, letterSpacing: 2, cursor: "pointer",
          }}>VER TODOS ✓</button>
        )}
      </div>
    </div>
  );
}

// ─── SESSION SUMMARY ──────────────────────────────────────────────────────────
function SessionSummary({ session, onClose }) {
  const workout = WORKOUTS[session.dayType];
  const totalSets = session.exercises.reduce((a, e) => a + e.sets.length, 0);

  return (
    <div style={{ minHeight: "100vh", background: BG, color: "#fff", fontFamily: "'DM Sans', sans-serif", overflowY: "auto", paddingBottom: 40 }}>
      <div style={{ padding: "30px 20px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 40 }}>🏆</div>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 32, letterSpacing: 3, color: workout.color, marginTop: 8 }}>SESIÓN COMPLETADA</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{new Date(session.date).toLocaleString("es-AR", { weekday: "long", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</div>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, padding: "0 20px 20px" }}>
        {[
          { label: "DURACIÓN", value: fmt(session.duration), unit: "" },
          { label: "SERIES", value: totalSets, unit: "" },
          { label: "KG MOVIDOS", value: session.totalKg.toLocaleString(), unit: "kg" },
        ].map(s => (
          <div key={s.label} style={{ background: CARD, borderRadius: 12, padding: "14px 10px", textAlign: "center", border: "1px solid " + BORDER }}>
            <div style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", letterSpacing: 2, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 20, fontWeight: 700, color: ACCENT }}>{s.value}</div>
            {s.unit && <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{s.unit}</div>}
          </div>
        ))}
      </div>

      {/* Exercise breakdown */}
      <div style={{ padding: "0 20px" }}>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>EJERCICIOS</div>
        {session.exercises.map(ex => (
          ex.sets.length > 0 && (
            <div key={ex.id} style={{ background: CARD, borderRadius: 12, padding: "12px 14px", marginBottom: 8, border: "1px solid " + BORDER }}>
              <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 15, letterSpacing: 1, marginBottom: 8, color: workout.color }}>{ex.name}</div>
              {ex.sets.map((s, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "rgba(255,255,255,0.6)", padding: "3px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ color: "rgba(255,255,255,0.3)", fontFamily: "'DM Mono', monospace" }}>Serie {i + 1}</span>
                  <span><strong style={{ color: "#fff" }}>{s.kg}kg</strong> × {s.reps} reps</span>
                </div>
              ))}
            </div>
          )
        ))}
      </div>

      <div style={{ padding: "20px 20px 0" }}>
        <button onClick={onClose} style={{
          width: "100%", padding: 16, borderRadius: 14, background: ACCENT,
          border: "none", color: "#000", fontFamily: "'Bebas Neue', sans-serif",
          fontSize: 20, letterSpacing: 3, cursor: "pointer",
        }}>VOLVER AL INICIO</button>
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
      const maxKg = Math.max(...exData.sets.map(s => parseFloat(s.kg) || 0));
      return [{ date: s.date, kg: maxKg, session: s }];
    });

  const latest = sessionData[sessionData.length - 1];
  const prev = sessionData[sessionData.length - 2];
  const trend = latest && prev ? (latest.kg - prev.kg).toFixed(1) : null;

  return (
    <div style={{ minHeight: "100vh", background: BG, color: "#fff", fontFamily: "'DM Sans', sans-serif", overflowY: "auto", paddingBottom: 40 }}>
      <div style={{ padding: "20px 20px 0", display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#fff", width: 40, height: 40, borderRadius: 20, fontSize: 16, cursor: "pointer" }}>←</button>
        <div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 22, letterSpacing: 1.5 }}>{ex.name}</div>
          <div style={{ fontSize: 10, color: workout.color, letterSpacing: 2 }}>{ex.muscle}</div>
        </div>
      </div>

      {/* Trend */}
      {trend !== null && (
        <div style={{ margin: "0 20px 16px", background: workout.color + "15", border: "1px solid " + workout.color + "33", borderRadius: 12, padding: "12px 14px" }}>
          <div style={{ fontSize: 11, color: workout.color, fontWeight: 700, letterSpacing: 1 }}>
            {parseFloat(trend) > 0 ? "📈 Subiendo" : parseFloat(trend) < 0 ? "📉 Bajando" : "➡️ Estable"} {Math.abs(trend)}kg desde la última sesión
          </div>
        </div>
      )}

      {/* Latest */}
      {latest && (
        <div style={{ padding: "0 20px 16px" }}>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: 3, textTransform: "uppercase", marginBottom: 10 }}>MÁS RECIENTE</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {[
              { label: "KG", value: latest.kg },
              { label: "REPS", value: latest.session.exercises.find(e => e.id === exId)?.sets[0]?.reps || "—" },
              { label: "SERIES", value: latest.session.exercises.find(e => e.id === exId)?.sets.length || "—" },
            ].map(s => (
              <div key={s.label} style={{ background: CARD, borderRadius: 10, padding: "12px 8px", textAlign: "center", border: "1px solid " + BORDER }}>
                <div style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", letterSpacing: 2, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 22, fontWeight: 700, color: ACCENT }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Chart */}
      <div style={{ margin: "0 20px 16px", background: CARD, borderRadius: 12, padding: "14px 16px", border: "1px solid " + BORDER }}>
        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>PROGRESIÓN DE PESO</div>
        <MiniChart data={sessionData} color={workout.color} />
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>{sessionData.length > 0 ? new Date(sessionData[0].date).toLocaleDateString("es-AR", { day: "numeric", month: "short" }) : ""}</span>
          <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)" }}>{sessionData.length > 0 ? new Date(sessionData[sessionData.length - 1].date).toLocaleDateString("es-AR", { day: "numeric", month: "short" }) : ""}</span>
        </div>
      </div>

      {/* History */}
      <div style={{ padding: "0 20px" }}>
        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>HISTORIAL</div>
        {Object.values(history)
          .filter(s => s.dayType === dayType && s.exercises.find(e => e.id === exId)?.sets.length > 0)
          .sort((a, b) => new Date(b.date) - new Date(a.date))
          .slice(0, 10)
          .map((s, i) => {
            const exData = s.exercises.find(e => e.id === exId);
            return (
              <div key={i} style={{ background: CARD, borderRadius: 12, padding: "12px 14px", marginBottom: 8, border: "1px solid " + BORDER }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>
                  {new Date(s.date).toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {exData.sets.map((set, si) => (
                    <div key={si} style={{ background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: "6px 10px", fontSize: 11, fontFamily: "'DM Mono', monospace" }}>
                      <span style={{ color: ACCENT, fontWeight: 700 }}>{set.kg}kg</span>
                      <span style={{ color: "rgba(255,255,255,0.4)" }}> × {set.reps}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        {sessionData.length === 0 && (
          <div style={{ textAlign: "center", padding: 30, color: "rgba(255,255,255,0.2)", fontSize: 13 }}>Sin sesiones registradas aún</div>
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
    <div style={{ minHeight: "100vh", background: BG, color: "#fff", fontFamily: "'DM Sans', sans-serif", overflowY: "auto", paddingBottom: 40 }}>
      <div style={{ padding: "20px 20px 0", display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <button onClick={onBack} style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#fff", width: 40, height: 40, borderRadius: 20, fontSize: 16, cursor: "pointer" }}>←</button>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 24, letterSpacing: 2 }}>HISTORIAL</div>
      </div>

      {sessions.length === 0 && (
        <div style={{ textAlign: "center", padding: 60, color: "rgba(255,255,255,0.2)", fontSize: 13 }}>Sin sesiones aún</div>
      )}

      <div style={{ padding: "0 20px" }}>
        {sessions.map((s, i) => {
          const w = WORKOUTS[s.dayType];
          const totalSets = s.exercises.reduce((a, e) => a + e.sets.length, 0);
          return (
            <div key={i} style={{ background: CARD, borderRadius: 14, padding: "14px 16px", marginBottom: 10, border: "1px solid " + BORDER }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, letterSpacing: 1.5, color: w.color }}>{w.label} — {w.subtitle}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
                    {new Date(s.date).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "short" })} · {new Date(s.date).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "rgba(255,255,255,0.3)" }}>⏱ {fmt(s.duration)}</div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                {[["KCAL EST.", Math.round(s.duration / 60 * 6) + " kcal"], ["SERIES", totalSets], ["KG MOVIDOS", s.totalKg + " kg"]].map(([l, v]) => (
                  <div key={l} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "8px 6px", textAlign: "center" }}>
                    <div style={{ fontSize: 8, color: "rgba(255,255,255,0.25)", letterSpacing: 1.5, marginBottom: 3 }}>{l}</div>
                    <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 13, fontWeight: 700, color: "#fff" }}>{v}</div>
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

// ─── HOME SCREEN ──────────────────────────────────────────────────────────────
function HomeScreen({ onStartWorkout, onViewExercise, onViewHistory }) {
  const history = getHistory();
  const sessions = Object.values(history).sort((a, b) => new Date(b.date) - new Date(a.date));
  const totalSessions = sessions.length;
  const lastSession = sessions[0];

  // Streak
  const streakDates = new Set(sessions.map(s => s.date.split("T")[0]));
  let streak = 0;
  const d = new Date();
  while (streakDates.has(d.toISOString().split("T")[0]) || streak === 0) {
    if (streakDates.has(d.toISOString().split("T")[0])) streak++;
    else if (streak > 0) break;
    d.setDate(d.getDate() - 1);
    if (streak > 365) break;
  }

  const totalKg = sessions.reduce((a, s) => a + (s.totalKg || 0), 0);

  return (
    <div style={{ minHeight: "100vh", background: BG, color: "#fff", fontFamily: "'DM Sans', sans-serif", overflowY: "auto", paddingBottom: 110 }}>
      {/* Header */}
      <div style={{ padding: "50px 20px 20px", position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 50% -20%, rgba(200,255,0,0.08) 0%, transparent 65%)", pointerEvents: "none" }} />
        <div style={{ fontSize: 10, letterSpacing: 5, color: "rgba(255,255,255,0.25)", textTransform: "uppercase", marginBottom: 6 }}>SOMA · Fase Adaptación</div>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 44, letterSpacing: 3, lineHeight: 1, color: ACCENT }}>WORKOUT</div>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 44, letterSpacing: 3, lineHeight: 1, color: "rgba(255,255,255,0.15)" }}>TRACKER</div>
      </div>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, padding: "0 20px 20px" }}>
        {[
          { label: "SESIONES", value: totalSessions, icon: "🏋️" },
          { label: "RACHA", value: streak + " días", icon: "🔥" },
          { label: "TON. TOTAL", value: (totalKg / 1000).toFixed(1) + "t", icon: "💪" },
        ].map(s => (
          <div key={s.label} style={{ background: CARD, borderRadius: 12, padding: "12px 10px", textAlign: "center", border: "1px solid " + BORDER }}>
            <div style={{ fontSize: 16, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 16, fontWeight: 700, color: ACCENT }}>{s.value}</div>
            <div style={{ fontSize: 8, color: "rgba(255,255,255,0.3)", letterSpacing: 2, marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Streak calendar */}
      <div style={{ margin: "0 20px 20px", background: CARD, borderRadius: 14, padding: "14px 16px", border: "1px solid " + BORDER }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: 3, textTransform: "uppercase" }}>TU RACHA</div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: WORKOUTS.A.color }} />
              <span style={{ fontSize: 8, color: "rgba(255,255,255,0.3)" }}>A</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: 2, background: WORKOUTS.B.color }} />
              <span style={{ fontSize: 8, color: "rgba(255,255,255,0.3)" }}>B</span>
            </div>
          </div>
        </div>
        <StreakCalendar history={history} />
      </div>

      {/* Workout plans */}
      <div style={{ padding: "0 20px 16px" }}>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: 3, textTransform: "uppercase", marginBottom: 12 }}>PLANES</div>
        {["A", "B"].map(dayType => {
          const w = WORKOUTS[dayType];
          const lastDaySession = sessions.find(s => s.dayType === dayType);
          return (
            <div key={dayType} style={{ background: CARD, borderRadius: 14, padding: "14px 16px", marginBottom: 10, border: "1px solid " + BORDER }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 18, letterSpacing: 1.5, color: w.color }}>{w.label} — {w.subtitle}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>
                    {w.exercises.length} ejercicios · {lastDaySession ? "Última vez: " + new Date(lastDaySession.date).toLocaleDateString("es-AR", { day: "numeric", month: "short" }) : "Sin sesiones"}
                  </div>
                </div>
              </div>
              {/* Muscle tags */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                {[...new Set(w.exercises.map(e => e.muscle))].map(m => (
                  <div key={m} style={{ fontSize: 9, color: MUSCLE_COLORS[m] || "#fff", border: "1px solid " + (MUSCLE_COLORS[m] || "#fff") + "66", borderRadius: 999, padding: "3px 8px", letterSpacing: 1, fontWeight: 700 }}>{m}</div>
                ))}
              </div>
              {/* Exercise list mini */}
              <div style={{ marginBottom: 12 }}>
                {w.exercises.map(ex => (
                  <div key={ex.id} onClick={() => onViewExercise(ex.id, dayType)} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer" }}>
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{ex.name}</span>
                    <span style={{ fontSize: 11, color: w.color, fontFamily: "'DM Mono', monospace" }}>{ex.kg}kg ›</span>
                  </div>
                ))}
              </div>
              <button onClick={() => onStartWorkout(dayType)} style={{
                width: "100%", padding: "12px", background: w.color,
                border: "none", borderRadius: 10, color: "#000",
                fontFamily: "'Bebas Neue', sans-serif", fontSize: 16, letterSpacing: 2, cursor: "pointer",
              }}>
                INICIAR {w.label}
              </button>
            </div>
          );
        })}
      </div>

      {/* Recent sessions */}
      {sessions.length > 0 && (
        <div style={{ padding: "0 20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: 3, textTransform: "uppercase" }}>ÚLTIMAS SESIONES</div>
            <button onClick={onViewHistory} style={{ background: "none", border: "none", color: ACCENT, fontSize: 11, cursor: "pointer", fontWeight: 700 }}>VER TODO ›</button>
          </div>
          {sessions.slice(0, 3).map((s, i) => {
            const w = WORKOUTS[s.dayType];
            return (
              <div key={i} style={{ background: CARD, borderRadius: 12, padding: "12px 14px", marginBottom: 8, border: "1px solid " + BORDER }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 12, color: w.color, fontWeight: 700, fontFamily: "'DM Mono', monospace" }}>{w.label}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
                      {new Date(s.date).toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" })}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", fontFamily: "'DM Mono', monospace" }}>⏱ {fmt(s.duration)}</div>
                    <div style={{ fontSize: 10, color: ACCENT, marginTop: 2 }}>{s.totalKg} kg movidos</div>
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

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [screen, setScreen] = useState("home");
  const [activeWorkoutDay, setActiveWorkoutDay] = useState(null);
  const [completedSession, setCompletedSession] = useState(null);
  const [selectedExercise, setSelectedExercise] = useState(null); // {exId, dayType}

  const handleStartWorkout = (dayType) => {
    setActiveWorkoutDay(dayType);
    setScreen("workout");
  };

  const handleFinishWorkout = (session) => {
    setCompletedSession(session);
    setScreen("summary");
  };

  const handleViewExercise = (exId, dayType) => {
    setSelectedExercise({ exId, dayType });
    setScreen("exercise");
  };

  if (screen === "workout" && activeWorkoutDay) {
    return (
      <ActiveWorkout
        dayType={activeWorkoutDay}
        onFinish={handleFinishWorkout}
        onCancel={() => setScreen("home")}
      />
    );
  }

  if (screen === "summary" && completedSession) {
    return (
      <SessionSummary
        session={completedSession}
        onClose={() => { setCompletedSession(null); setScreen("home"); }}
      />
    );
  }

  if (screen === "exercise" && selectedExercise) {
    return (
      <ExerciseDetail
        exId={selectedExercise.exId}
        dayType={selectedExercise.dayType}
        onBack={() => setScreen("home")}
      />
    );
  }

  if (screen === "history") {
    return <HistoryScreen onBack={() => setScreen("home")} />;
  }

  return (
    <HomeScreen
      onStartWorkout={handleStartWorkout}
      onViewExercise={handleViewExercise}
      onViewHistory={() => setScreen("history")}
    />
  );
}
