import { useState } from "react";

const INITIAL_GOALS = [
  { id: 1, title: "Morning meditation", frequency: "daily", type: "binary", streak: 12 },
  { id: 2, title: "Read 20 pages", frequency: "daily", type: "binary", streak: 4 },
  { id: 3, title: "Meal prep", frequency: "weekly", type: "count", target: 3, streak: 6, label: "meals" },
  { id: 4, title: "Deep work session", frequency: "daily", type: "binary", streak: 8 },
  { id: 5, title: "Weekly review", frequency: "weekly", type: "binary", streak: 6 },
  { id: 6, title: "Monthly planning", frequency: "monthly", type: "binary", streak: 3 }
];

const WEEK = ["M", "T", "W", "T", "F", "S", "S"];
const TODAY_IDX = 2;

// Dot history per goal — for count goals, value is count per day
const HISTORY = {
  1: [1, 1, 1, 1, 1, 0, 1],
  2: [1, 0, 1, 1, 0, 0, 1],
  3: [0, 1, 0, 1, 0, 0, 0], // meal prep: done on Mon + Wed
  4: [1, 1, 0, 1, 1, 0, 0],
  5: [0, 0, 0, 0, 1, 0, 0],
  6: [0, 0, 0, 0, 0, 0, 0]
};

const GROUP_ORDER = ["daily", "weekly", "monthly"];

export default function App() {
  const [view, setView] = useState("today");
  const [goals, setGoals] = useState(INITIAL_GOALS);
  const [binary, setBinary] = useState({ 1: false, 2: true, 4: true, 5: false, 6: false });
  const [counts, setCounts] = useState({ 3: 1 }); // meal prep: 1/3 so far
  const [showAdd, setShowAdd] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: "", frequency: "weekly", type: "binary", target: 3, label: "" });
  const [reminderEmail, setReminderEmail] = useState("");
  const [showReminder, setShowReminder] = useState(null);

  const isComplete = g => {
    if (g.type === "binary") return !!binary[g.id];
    if (g.type === "count") return (counts[g.id] ?? 0) >= g.target;
    return false;
  };

  const toggleBinary = id => setBinary(p => ({ ...p, [id]: !p[id] }));
  const increment = (id, target) => setCounts(p => ({ ...p, [id]: Math.min((p[id] ?? 0) + 1, target) }));
  const decrement = id => setCounts(p => ({ ...p, [id]: Math.max((p[id] ?? 0) - 1, 0) }));

  const completedCount = goals.filter(isComplete).length;
  const totalGoals = goals.length;

  const addGoal = () => {
    if (!newGoal.title.trim()) return;
    const id = Date.now();
    setGoals(p => [
      ...p,
      {
        id,
        title: newGoal.title,
        frequency: newGoal.frequency,
        type: newGoal.type,
        target: newGoal.type === "count" ? Number(newGoal.target) : undefined,
        label: newGoal.label || undefined,
        streak: 0
      }
    ]);
    if (newGoal.type === "count") setCounts(p => ({ ...p, [id]: 0 }));
    setNewGoal({ title: "", frequency: "weekly", type: "binary", target: 3, label: "" });
    setShowAdd(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#fafaf8",
        fontFamily: "'DM Mono', 'Courier New', monospace",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "0 16px"
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Playfair+Display:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        button { cursor: pointer; border: none; background: none; font-family: inherit; }
        input, select { font-family: inherit; }

        .goal-row { transition: opacity 0.15s; }
        .goal-row:hover { opacity: 0.8; }

        .check-btn {
          width: 22px; height: 22px;
          border: 1.5px solid #111;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
          transition: all 0.15s ease;
        }
        .check-btn.done { background: #111; border-color: #111; }
        .check-btn:hover { transform: scale(1.08); }

        .nav-btn {
          font-size: 11px; letter-spacing: 0.12em; text-transform: uppercase;
          color: #bbb; padding: 6px 0; border-bottom: 1.5px solid transparent;
          transition: all 0.15s;
        }
        .nav-btn.active { color: #111; border-bottom-color: #111; }
        .nav-btn:hover { color: #444; }

        .freq-tag {
          font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase;
          color: #ccc; padding: 2px 6px; border: 1px solid #e8e8e8; border-radius: 2px;
        }

        .dot { width: 7px; height: 7px; border-radius: 50%; }
        .dot.filled { background: #111; }
        .dot.partial { background: #bbb; }
        .dot.empty { background: #e5e5e5; }

        .slide-in { animation: slideUp 0.2s ease; }
        @keyframes slideUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }

        input[type="text"], input[type="number"], input[type="email"], select {
          background: transparent; border: none;
          border-bottom: 1px solid #ddd; outline: none;
          font-size: 13px; color: #111; padding: 4px 0; width: 100%;
          transition: border-color 0.15s;
        }
        input[type="text"]:focus, input[type="number"]:focus, input[type="email"]:focus, select:focus { border-bottom-color: #111; }
        select { appearance: none; cursor: pointer; }
        input[type="number"] { width: 48px; }

        .progress-bar-bg { background: #ebebeb; border-radius: 1px; height: 2px; }
        .progress-bar-fill { background: #111; height: 2px; border-radius: 1px; transition: width 0.4s ease; }

        /* Count stepper */
        .stepper { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .step-btn {
          width: 18px; height: 18px; border-radius: 50%;
          border: 1px solid #ccc !important;
          color: #999; font-size: 14px; line-height: 1;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.12s;
        }
        .step-btn:hover { border-color: #111 !important; color: #111; }
        .step-btn:disabled { opacity: 0.25; cursor: not-allowed; }
        .count-pips { display: flex; gap: 4px; align-items: center; }
        .pip {
          width: 6px; height: 6px; border-radius: 50%;
          transition: background 0.2s;
        }
        .pip.filled { background: #111; }
        .pip.empty  { background: #e0e0e0; }
      `}</style>

      <div style={{ width: "100%", maxWidth: 420, paddingTop: 48 }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.15em", textTransform: "uppercase", color: "#bbb", marginBottom: 6 }}>
              Wednesday, Mar 4
            </div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: "#111", letterSpacing: "-0.01em" }}>
              {completedCount === totalGoals ? "All done." : `${completedCount} of ${totalGoals}`}
            </div>
          </div>
          <button
            onClick={() => setShowAdd(!showAdd)}
            style={{
              width: 32,
              height: 32,
              border: "1.5px solid #111",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              color: "#111"
            }}
          >
            {showAdd ? "×" : "+"}
          </button>
        </div>

        <div style={{ marginBottom: 32 }}>
          <div className="progress-bar-bg">
            <div className="progress-bar-fill" style={{ width: `${(completedCount / totalGoals) * 100}%` }} />
          </div>
        </div>

        {/* Add goal form */}
        {showAdd && (
          <div className="slide-in" style={{ marginBottom: 28, padding: "18px 0", borderTop: "1px solid #e8e8e8", borderBottom: "1px solid #e8e8e8" }}>
            <div style={{ marginBottom: 14 }}>
              <input
                type="text"
                placeholder="Goal title"
                value={newGoal.title}
                onChange={e => setNewGoal(p => ({ ...p, title: e.target.value }))}
                onKeyDown={e => e.key === "Enter" && addGoal()}
                autoFocus
              />
            </div>
            <div style={{ display: "flex", gap: 16, marginBottom: 14, flexWrap: "wrap" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "#bbb", marginBottom: 6 }}>Frequency</div>
                <select value={newGoal.frequency} onChange={e => setNewGoal(p => ({ ...p, frequency: e.target.value }))} style={{ fontSize: 12, color: "#555" }}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "#bbb", marginBottom: 6 }}>Type</div>
                <select value={newGoal.type} onChange={e => setNewGoal(p => ({ ...p, type: e.target.value }))} style={{ fontSize: 12, color: "#555" }}>
                  <option value="binary">Once (done/not done)</option>
                  <option value="count">Count-based</option>
                </select>
              </div>
            </div>

            {newGoal.type === "count" && (
              <div className="slide-in" style={{ display: "flex", gap: 16, marginBottom: 14 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "#bbb", marginBottom: 6 }}>Target</div>
                  <input
                    type="number"
                    min={2}
                    max={99}
                    value={newGoal.target}
                    onChange={e => setNewGoal(p => ({ ...p, target: e.target.value }))}
                    style={{ width: 48 }}
                  />
                </div>
                <div style={{ flex: 2 }}>
                  <div style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "#bbb", marginBottom: 6 }}>Unit (optional)</div>
                  <input
                    type="text"
                    placeholder="e.g. meals, pages, km"
                    value={newGoal.label}
                    onChange={e => setNewGoal(p => ({ ...p, label: e.target.value }))}
                  />
                </div>
              </div>
            )}

            <button onClick={addGoal} style={{ fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "#111", borderBottom: "1px solid #111", paddingBottom: 1 }}>
              Add goal
            </button>
          </div>
        )}

        {/* Nav */}
        <div style={{ display: "flex", gap: 24, marginBottom: 28, borderBottom: "1px solid #ebebeb" }}>
          {["today", "progress", "reminders"].map(v => (
            <button key={v} className={`nav-btn ${view === v ? "active" : ""}`} onClick={() => setView(v)}>
              {v}
            </button>
          ))}
        </div>

        {/* ── TODAY ── */}
        {view === "today" && (
          <div className="slide-in">
            {GROUP_ORDER.map(freq => {
              const group = goals.filter(g => g.frequency === freq);
              if (!group.length) return null;
              return (
                <div key={freq} style={{ marginBottom: 32 }}>
                  <div style={{ fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "#ccc", marginBottom: 14 }}>{freq}</div>
                  {group.map((g, i) => {
                    const done = isComplete(g);
                    return (
                      <div key={g.id}>
                        <div
                          className="goal-row"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 14,
                            padding: "14px 0",
                            borderBottom: i < group.length - 1 ? "1px solid #f0f0f0" : "none"
                          }}
                        >
                          {/* Check / circle for binary */}
                          {g.type === "binary" && (
                            <button className={`check-btn ${done ? "done" : ""}`} onClick={() => toggleBinary(g.id)}>
                              {done && (
                                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </button>
                          )}

                          {/* Count goal: pip indicator as the "check" area */}
                          {g.type === "count" && (
                            <div
                              style={{
                                width: 22,
                                height: 22,
                                flexShrink: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center"
                              }}
                            >
                              {done ? (
                                <div className="check-btn done" style={{ width: 22, height: 22 }}>
                                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </div>
                              ) : (
                                <div style={{ width: 22, height: 22, border: "1.5px solid #ddd", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                                  <span style={{ fontSize: 9, color: "#bbb" }}>{counts[g.id] ?? 0}</span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Title */}
                          <span
                            style={{
                              fontSize: 14,
                              flex: 1,
                              color: done ? "#bbb" : "#111",
                              textDecoration: done ? "line-through" : "none",
                              letterSpacing: "-0.01em",
                              transition: "all 0.2s"
                            }}
                          >
                            {g.title}
                          </span>

                          {/* Right side */}
                          {g.type === "binary" && <span style={{ fontSize: 10, color: "#ccc" }}>{g.streak}d</span>}

                          {g.type === "count" && (
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              {/* pip track */}
                              <div className="count-pips">
                                {Array.from({ length: g.target }).map((_, pi) => (
                                  <div key={pi} className={`pip ${pi < (counts[g.id] ?? 0) ? "filled" : "empty"}`} />
                                ))}
                              </div>
                              {/* stepper */}
                              <div className="stepper">
                                <button className="step-btn" onClick={() => decrement(g.id)} disabled={(counts[g.id] ?? 0) === 0} style={{ fontSize: 16, paddingBottom: 1 }}>
                                  −
                                </button>
                                <span style={{ fontSize: 11, color: done ? "#bbb" : "#111", minWidth: 28, textAlign: "center" }}>
                                  {counts[g.id] ?? 0}/{g.target}
                                  {g.label ? <span style={{ fontSize: 9, color: "#ccc", marginLeft: 2 }}>{g.label}</span> : null}
                                </span>
                                <button className="step-btn" onClick={() => increment(g.id, g.target)} disabled={(counts[g.id] ?? 0) >= g.target}>
                                  +
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Reminder toggle */}
                          <button onClick={() => setShowReminder(showReminder === g.id ? null : g.id)} style={{ fontSize: 12, color: "#ddd", padding: 2, flexShrink: 0 }} title="Reminder">
                            ○
                          </button>
                        </div>

                        {/* Inline reminder */}
                        {showReminder === g.id && (
                          <div className="slide-in" style={{ padding: "12px 0 12px 36px", background: "#f7f7f5", marginBottom: 2 }}>
                            <div style={{ fontSize: 9, letterSpacing: "0.1em", textTransform: "uppercase", color: "#aaa", marginBottom: 8 }}>Reminder for "{g.title}"</div>
                            <input type="email" placeholder="email@example.com" value={reminderEmail} onChange={e => setReminderEmail(e.target.value)} style={{ marginBottom: 8, fontSize: 12 }} />
                            <select style={{ fontSize: 11, color: "#666", width: "auto" }}>
                              <option>No reminder</option>
                              <option>Morning (9am)</option>
                              <option>Evening (6pm)</option>
                              <option>Weekly digest</option>
                            </select>
                            <button
                              onClick={() => setShowReminder(null)}
                              style={{ display: "block", marginTop: 10, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "#111", borderBottom: "1px solid #111", paddingBottom: 1 }}
                            >
                              Save
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* ── PROGRESS ── */}
        {view === "progress" && (
          <div className="slide-in">
            <div style={{ fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "#ccc", marginBottom: 20 }}>This week</div>
            <div style={{ display: "flex", gap: 0, marginBottom: 4, paddingLeft: 180 }}>
              {WEEK.map((d, i) => (
                <div key={i} style={{ width: 28, textAlign: "center", fontSize: 9, letterSpacing: "0.1em", color: i === TODAY_IDX ? "#111" : "#ccc", fontWeight: i === TODAY_IDX ? "500" : "300" }}>
                  {d}
                </div>
              ))}
            </div>

            {goals.map((g, gi) => (
              <div key={g.id} style={{ display: "flex", alignItems: "center", padding: "12px 0", borderBottom: gi < goals.length - 1 ? "1px solid #f0f0f0" : "none" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: "#111", letterSpacing: "-0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 168 }}>{g.title}</div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 3 }}>
                    <span className="freq-tag">{g.frequency}</span>
                    {g.type === "count" && <span style={{ fontSize: 9, color: "#bbb" }}>goal: {g.target} {g.label}</span>}
                    {g.type === "binary" && <span style={{ fontSize: 10, color: "#bbb" }}>{g.streak}d streak</span>}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 0 }}>
                  {WEEK.map((_, i) => {
                    const val = HISTORY[g.id]?.[i] ?? 0;
                    let cls = "empty";
                    if (g.type === "binary" && val === 1) cls = "filled";
                    if (g.type === "count" && val > 0) cls = val >= g.target ? "filled" : "partial";
                    return (
                      <div key={i} style={{ width: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div className={`dot ${cls}`} style={{ opacity: i > TODAY_IDX ? 0.25 : 1 }} />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Count goal weekly summary callout */}
            <div style={{ marginTop: 28, padding: "16px", background: "#f3f3f0", borderRadius: 2 }}>
              <div style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "#aaa", marginBottom: 10 }}>Meal prep this week</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} style={{ flex: 1, height: 3, borderRadius: 1, background: i < (counts[3] ?? 0) ? "#111" : "#ddd", transition: "background 0.2s" }} />
                ))}
              </div>
              <div style={{ fontSize: 13, color: "#111" }}>
                {counts[3] ?? 0} of 3 meals prepped
                <span style={{ color: "#bbb", fontSize: 11, marginLeft: 8 }}>— {3 - (counts[3] ?? 0)} remaining</span>
              </div>
            </div>

            <div style={{ marginTop: 28, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0 }}>
              {[
                { label: "Best streak", value: "12d" },
                { label: "This week", value: "73%" },
                { label: "This month", value: "68%" }
              ].map(s => (
                <div key={s.label} style={{ padding: "16px 0", borderTop: "1px solid #ebebeb" }}>
                  <div style={{ fontSize: 20, fontFamily: "'Playfair Display', serif", color: "#111", marginBottom: 4 }}>{s.value}</div>
                  <div style={{ fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: "#bbb" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── REMINDERS ── */}
        {view === "reminders" && (
          <div className="slide-in">
            <div style={{ fontSize: 9, letterSpacing: "0.16em", textTransform: "uppercase", color: "#ccc", marginBottom: 24 }}>Email reminders</div>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "#aaa", marginBottom: 8 }}>Address</div>
              <input type="email" placeholder="your@email.com" value={reminderEmail} onChange={e => setReminderEmail(e.target.value)} />
            </div>
            {goals.map((g, gi) => (
              <div key={g.id} style={{ padding: "14px 0", borderBottom: gi < goals.length - 1 ? "1px solid #f0f0f0" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <div>
                    <span style={{ fontSize: 13, color: "#111" }}>{g.title}</span>
                    {g.type === "count" && <span style={{ fontSize: 10, color: "#bbb", marginLeft: 8 }}>{g.target} {g.label}</span>}
                  </div>
                  <span className="freq-tag">{g.frequency}</span>
                </div>
                <select style={{ fontSize: 11, color: "#888", width: "auto" }}>
                  <option>No reminder</option>
                  <option>Morning (9am)</option>
                  <option>Evening (6pm)</option>
                  <option>Weekly digest</option>
                </select>
              </div>
            ))}
            <button
              style={{ marginTop: 32, width: "100%", padding: "12px", border: "1.5px solid #111", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "#111", transition: "all 0.15s" }}
              onMouseEnter={e => {
                e.target.style.background = "#111";
                e.target.style.color = "#fafaf8";
              }}
              onMouseLeave={e => {
                e.target.style.background = "transparent";
                e.target.style.color = "#111";
              }}
            >
              Save preferences
            </button>
          </div>
        )}

        <div style={{ height: 64 }} />
      </div>
    </div>
  );
}
