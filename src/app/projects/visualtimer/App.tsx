import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";

const BG    = "#f8f7f4";
const INK   = "#222222";
const FONT  = "'general-sans', sans-serif";
const SERIF = "'az-serif', serif";

function lerp(a: string, b: string, t: number): string {
  const p = (h: string) => [
    parseInt(h.slice(1, 3), 16),
    parseInt(h.slice(3, 5), 16),
    parseInt(h.slice(5, 7), 16),
  ];
  const [ar, ag, ab] = p(a);
  const [br, bg, bb] = p(b);
  return `rgb(${Math.round(ar+(br-ar)*t)},${Math.round(ag+(bg-ag)*t)},${Math.round(ab+(bb-ab)*t)})`;
}

function fmt(s: number): string {
  return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;
}

function BtnPrimary({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      fontFamily: FONT, fontSize: "11px", letterSpacing: "0.06em",
      padding: "8px 22px", borderRadius: "100px", cursor: "pointer",
      border: "none", backgroundColor: "#f8f7f4", color: "#222",
    }}>
      {children}
    </button>
  );
}

function BtnSecondary({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      fontFamily: FONT, fontSize: "11px", letterSpacing: "0.06em",
      padding: "8px 22px", borderRadius: "100px", cursor: "pointer",
      border: "1.5px solid rgba(248,247,244,0.3)",
      backgroundColor: "transparent", color: "rgba(248,247,244,0.75)",
    }}>
      {children}
    </button>
  );
}

function BtnGhost({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      fontFamily: FONT, fontSize: "11px", letterSpacing: "0.06em",
      padding: "8px 22px", borderRadius: "100px", cursor: "pointer",
      border: "none", backgroundColor: "transparent",
      color: "rgba(248,247,244,0.35)",
    }}>
      {children}
    </button>
  );
}

type Phase = "setup" | "writing" | "done";

export default function App() {
  const [phase,     setPhase]     = useState<Phase>("setup");
  const [minInput,  setMinInput]  = useState("10");
  const [totalSec,  setTotalSec]  = useState(600);
  const [timeLeft,  setTimeLeft]  = useState(0);
  const [chars,     setChars]     = useState<string[]>([]);
  const [cursor,    setCursor]    = useState(0);
  const [revealed,  setRevealed]  = useState(false);
  const [extending, setExtending] = useState(false);
  const [extMin,    setExtMin]    = useState("5");
  const [blinkOn,   setBlinkOn]   = useState(true);

  const wrapRef   = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const id = setInterval(() => setBlinkOn((v) => !v), 530);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    cursorRef.current?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  useEffect(() => {
    if (phase === "writing") wrapRef.current?.focus();
  }, [phase]);

  // Countdown
  useEffect(() => {
    if (phase !== "writing") return;
    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          setPhase("done");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase]);

  const startWriting = useCallback((minutes: number) => {
    const secs = Math.max(1, minutes) * 60;
    setTotalSec(secs);
    setTimeLeft(secs);
    setRevealed(false);
    setExtending(false);
    setPhase("writing");
  }, []);

  const handleStart = useCallback(() => {
    startWriting(parseInt(minInput) || 10);
  }, [minInput, startWriting]);

  const handleDelete = useCallback(() => {
    setChars([]);
    setCursor(0);
    setRevealed(false);
    setExtending(false);
    setPhase("setup");
  }, []);

  const handleExtend = useCallback(() => {
    startWriting(parseInt(extMin) || 5);
  }, [extMin, startWriting]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (phase !== "writing") return;
      setBlinkOn(true);
      if (e.key === "Backspace") {
        e.preventDefault();
        if (cursor > 0) {
          setChars((p) => [...p.slice(0, cursor - 1), ...p.slice(cursor)]);
          setCursor((c) => c - 1);
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCursor((c) => Math.max(0, c - 1));
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setCursor((c) => Math.min(chars.length, c + 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        setChars((p) => [...p.slice(0, cursor), "\n", ...p.slice(cursor)]);
        setCursor((c) => c + 1);
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setChars((p) => [...p.slice(0, cursor), e.key, ...p.slice(cursor)]);
        setCursor((c) => c + 1);
      }
    },
    [phase, cursor, chars.length]
  );

  const progress   = totalSec > 0 ? 1 - timeLeft / totalSec : 0;
  const bgColor    = phase === "writing" ? lerp(BG, INK, progress) : phase === "done" ? INK : BG;
  const textColor  = phase === "done" && revealed ? BG : INK;
  const dark       = progress > 0.5;

  const renderChars = () => {
    const els: React.ReactNode[] = [];
    for (let i = 0; i <= chars.length; i++) {
      if (i === cursor) {
        els.push(
          <span key="cur" ref={cursorRef} style={{
            display: "inline-block", width: "2px",
            backgroundColor: blinkOn ? textColor : "transparent",
            height: "1.2em", verticalAlign: "text-bottom",
            marginLeft: "-1px", marginRight: "-1px",
            transition: "background-color 1s linear",
          }} />
        );
      }
      if (i >= chars.length) break;
      const ch = chars[i];
      if (ch === "\n") { els.push(<br key={`br${i}`} />); continue; }
      els.push(<span key={`c${i}`} style={{ display: "inline-block" }}>{ch}</span>);
    }
    return els;
  };

  return (
    <>
      <style>{`input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}input[type=number]{-moz-appearance:textfield}`}</style>

      <div style={{
        width: "100vw", height: "100vh",
        backgroundColor: bgColor,
        transition: "background-color 1s linear",
        display: "flex", flexDirection: "column", alignItems: "center",
        overflow: "hidden",
      }}>
        <AnimatePresence mode="wait">

          {/* ── Setup ── */}
          {phase === "setup" && (
            <motion.div key="setup"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
                height: "100vh", gap: "28px",
              }}
            >
              <p style={{ fontFamily: FONT, fontSize: "12px", color: "#bbb", letterSpacing: "0.06em", margin: 0 }}>
                Wie lange möchtest du schreiben?
              </p>
              <div style={{ display: "flex", alignItems: "baseline", gap: "10px" }}>
                <input
                  type="number" min={1} max={120}
                  value={minInput}
                  onChange={(e) => setMinInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleStart()}
                  autoFocus
                  style={{
                    fontFamily: FONT, fontSize: "64px", fontWeight: 400,
                    color: INK, background: "transparent",
                    border: "none", outline: "none",
                    width: "2.5ch", textAlign: "right",
                  }}
                />
                <span style={{ fontFamily: FONT, fontSize: "22px", color: "#ccc" }}>min</span>
              </div>
              <button
                onClick={handleStart}
                style={{
                  fontFamily: FONT, fontSize: "11px", letterSpacing: "0.08em",
                  color: INK, background: "transparent",
                  border: "1px solid #ccc", borderRadius: "2px",
                  padding: "7px 22px", cursor: "pointer",
                }}
              >
                Starten
              </button>
            </motion.div>
          )}

          {/* ── Writing / Done (same surface, overlay handles done state) ── */}
          {(phase === "writing" || phase === "done") && (
            <motion.div key="writing"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}
            >
              {/* Timer display */}
              <div style={{ width: "100%", maxWidth: "672px", padding: "20px 32px 0", display: "flex", justifyContent: "flex-end" }}>
                {phase === "writing" && (
                  <span style={{
                    fontFamily: FONT, fontSize: "11px", letterSpacing: "0.08em",
                    color: timeLeft <= 10
                      ? "#e05252"
                      : dark
                        ? "rgba(248,247,244,0.3)"
                        : "rgba(34,34,34,0.3)",
                    transition: "color 1s linear",
                  }}>
                    {fmt(timeLeft)}
                  </span>
                )}
              </div>

              {/* Writing surface */}
              <div
                ref={wrapRef}
                tabIndex={0}
                onKeyDown={handleKeyDown}
                onClick={() => phase === "writing" && wrapRef.current?.focus()}
                style={{
                  width: "100%", maxWidth: "672px",
                  flex: 1, padding: "24px 32px 64px",
                  outline: "none",
                  cursor: phase === "writing" ? "text" : "default",
                  caretColor: "transparent",
                  overflowY: "auto",
                }}
              >
                <div style={{
                  minHeight: "60vh",
                  whiteSpace: "pre-wrap", wordBreak: "break-words",
                  fontSize: "22px", lineHeight: "1.9",
                  color: textColor, fontFamily: SERIF,
                  transition: "color 1s linear",
                }}>
                  {chars.length === 0 && phase === "writing" ? (
                    <span style={{ position: "relative" }}>
                      <span style={{
                        position: "absolute", pointerEvents: "none", userSelect: "none",
                        fontSize: "22px",
                        color: dark ? "rgba(248,247,244,0.12)" : "rgba(34,34,34,0.18)",
                        transition: "color 1s linear",
                      }}>
                        Beginne zu schreiben…
                      </span>
                      <span ref={cursorRef} style={{
                        display: "inline-block", width: "2px",
                        backgroundColor: blinkOn ? INK : "transparent",
                        height: "1.2em", verticalAlign: "text-bottom",
                        transition: "background-color 1s linear",
                      }} />
                    </span>
                  ) : renderChars()}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── Done overlay (portal) ── */}
      {createPortal(
        <AnimatePresence>
          {phase === "done" && !revealed && (
            <motion.div
              key="done-overlay"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
              style={{
                position: "fixed", inset: 0, zIndex: 200,
                display: "flex", alignItems: "center", justifyContent: "center",
                backgroundColor: "rgba(34,34,34,0.75)", backdropFilter: "blur(6px)",
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: 14, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 14, scale: 0.97 }}
                transition={{ duration: 0.28, delay: 0.08 }}
                style={{
                  backgroundColor: "rgba(30,30,30,0.92)",
                  border: "1.5px dashed rgba(248,247,244,0.18)",
                  borderRadius: "18px",
                  padding: "36px 44px",
                  maxWidth: "320px", width: "90vw",
                  backdropFilter: "blur(14px)",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", gap: "24px",
                  boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
                }}
              >
                <span style={{ fontFamily: FONT, fontSize: "14px", color: "#f8f7f4", letterSpacing: "-0.01em" }}>
                  Zeit abgelaufen.
                </span>
                <span style={{ fontFamily: FONT, fontSize: "11px", color: "rgba(248,247,244,0.35)", fontStyle: "italic", marginTop: "-12px" }}>
                  Dein Text wartet hinter dem Dunkel.
                </span>

                {!extending ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", width: "100%" }}>
                    <BtnPrimary onClick={() => setRevealed(true)}>Anschauen</BtnPrimary>
                    <BtnSecondary onClick={() => setExtending(true)}>Weiterschreiben</BtnSecondary>
                    <BtnGhost onClick={handleDelete}>Löschen</BtnGhost>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "14px" }}>
                    <p style={{ fontFamily: FONT, fontSize: "11px", color: "rgba(248,247,244,0.45)", margin: 0, letterSpacing: "0.04em" }}>
                      Noch wie viele Minuten?
                    </p>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "8px" }}>
                      <input
                        type="number" min={1}
                        value={extMin}
                        onChange={(e) => setExtMin(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleExtend()}
                        autoFocus
                        style={{
                          fontFamily: FONT, fontSize: "42px",
                          width: "2.5ch", textAlign: "right",
                          background: "transparent", border: "none", outline: "none",
                          color: "#f8f7f4",
                        }}
                      />
                      <span style={{ fontFamily: FONT, fontSize: "16px", color: "rgba(248,247,244,0.35)" }}>min</span>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <BtnPrimary onClick={handleExtend}>Weiter</BtnPrimary>
                      <BtnGhost onClick={() => setExtending(false)}>Zurück</BtnGhost>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}

      {/* ── Revealed bottom bar (portal) ── */}
      {createPortal(
        <AnimatePresence>
          {phase === "done" && revealed && (
            <motion.div
              key="revealed-bar"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.25 }}
              style={{
                position: "fixed", bottom: "32px", left: "50%",
                transform: "translateX(-50%)",
                zIndex: 200,
                display: "flex", flexDirection: "column", alignItems: "center", gap: "10px",
              }}
            >
              {extending && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                  transition={{ duration: 0.2 }}
                  style={{
                    display: "flex", alignItems: "baseline", gap: "8px",
                    backgroundColor: "rgba(30,30,30,0.92)",
                    border: "1.5px dashed rgba(248,247,244,0.18)",
                    borderRadius: "12px", padding: "12px 20px",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <span style={{ fontFamily: FONT, fontSize: "11px", color: "rgba(248,247,244,0.4)" }}>Noch</span>
                  <input
                    type="number" min={1}
                    value={extMin}
                    onChange={(e) => setExtMin(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleExtend()}
                    autoFocus
                    style={{
                      fontFamily: FONT, fontSize: "24px", width: "2.5ch", textAlign: "center",
                      background: "transparent", border: "none", outline: "none", color: "#f8f7f4",
                    }}
                  />
                  <span style={{ fontFamily: FONT, fontSize: "11px", color: "rgba(248,247,244,0.4)" }}>min</span>
                  <button onClick={handleExtend} style={{
                    fontFamily: FONT, fontSize: "11px", letterSpacing: "0.05em",
                    padding: "5px 14px", borderRadius: "100px",
                    border: "none", backgroundColor: "#f8f7f4", color: "#222", cursor: "pointer", marginLeft: "4px",
                  }}>
                    Weiter
                  </button>
                  <button onClick={() => setExtending(false)} style={{
                    fontFamily: FONT, fontSize: "11px",
                    background: "none", border: "none",
                    color: "rgba(248,247,244,0.3)", cursor: "pointer",
                  }}>
                    ✕
                  </button>
                </motion.div>
              )}

              <div style={{
                display: "flex", alignItems: "center",
                backgroundColor: "rgba(30,30,30,0.88)",
                border: "1.5px dashed rgba(248,247,244,0.18)",
                borderRadius: "100px",
                backdropFilter: "blur(10px)",
                overflow: "hidden",
              }}>
                <button onClick={() => setExtending((v) => !v)} style={{
                  fontFamily: FONT, fontSize: "11px", letterSpacing: "0.05em",
                  padding: "9px 18px", background: "transparent", border: "none",
                  color: "#f8f7f4", cursor: "pointer",
                }}>
                  Weiterschreiben
                </button>
                <div style={{ width: "1px", height: "14px", backgroundColor: "rgba(248,247,244,0.15)" }} />
                <button onClick={handleDelete} style={{
                  fontFamily: FONT, fontSize: "11px", letterSpacing: "0.05em",
                  padding: "9px 18px", background: "transparent", border: "none",
                  color: "rgba(248,247,244,0.4)", cursor: "pointer",
                }}>
                  Löschen
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
