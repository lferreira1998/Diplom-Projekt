import { useState, useRef, useCallback, useEffect } from "react";
import { WritingZone, type CharData } from "./components/neural-flow/writing-zone";
import { motion, AnimatePresence } from "motion/react";

type Phase = "start" | "writing" | "done";

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function App() {
  const [phase, setPhase] = useState<Phase>("start");
  const [selectedMinutes, setSelectedMinutes] = useState(3);
  const [timeLeft, setTimeLeft] = useState(0);
  const [chars, setChars] = useState<CharData[]>([]);
  const lastKeyPressTimestamp = useRef(0);

  // Timer
  useEffect(() => {
    if (phase !== "writing") return;

    let remaining = selectedMinutes * 60;
    setTimeLeft(remaining);

    const id = setInterval(() => {
      remaining -= 1;
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(id);
        setPhase("done");
      }
    }, 1000);

    return () => clearInterval(id);
  }, [phase, selectedMinutes]);

  const handleStart = useCallback(() => {
    setChars([]);
    lastKeyPressTimestamp.current = 0;
    setPhase("writing");
  }, []);

  const handleCharsChange = useCallback((newChars: CharData[]) => {
    setChars(newChars);
  }, []);

  const handleRestart = useCallback(() => {
    setPhase("start");
    setChars([]);
    lastKeyPressTimestamp.current = 0;
  }, []);

  const totalDuration = selectedMinutes * 60;
  const progress = phase === "writing" ? 1 - timeLeft / totalDuration : 0;

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@300;400;500&display=swap"
        rel="stylesheet"
      />
      <style>{`
        @keyframes cursorBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>

      <div
        className="min-h-screen flex flex-col"
        style={{ backgroundColor: "#F2F3F6" }}
      >
        <AnimatePresence mode="wait">
          {/* ── START SCREEN ── */}
          {phase === "start" && (
            <motion.div
              key="start"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="flex-1 flex flex-col items-center justify-center px-6"
            >
              <div className="w-full max-w-lg flex flex-col items-center">
                {/* Title */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.6 }}
                  className="mb-12 text-center"
                >
                  <h1
                    style={{
                      fontFamily: "'az-sans', sans-serif",
                      fontSize: "clamp(2rem, 6vw, 3.5rem)",
                      color: "#313642",
                      letterSpacing: "-0.02em",
                      lineHeight: 1.1,
                    }}
                  >
                    Don't Stop Writing
                  </h1>
                </motion.div>

                {/* Explanation */}
                <motion.p
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="text-center mb-12 max-w-sm"
                  style={{
                    fontFamily: "'az-sans', sans-serif",
                    fontSize: "0.95rem",
                    color: "#6B6F7B",
                    lineHeight: 1.7,
                  }}
                >
                  Write without stopping. When you pause, the cursor keeps drifting, creating visible gaps in your text. Fast typing produces dense clusters, hesitation leaves space. Your rhythm becomes the typography.
                </motion.p>

                {/* Time Selection */}
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  className="mb-10 w-full"
                >
                  <p
                    className="text-center mb-4"
                    style={{
                      fontFamily: "'az-sans', sans-serif",
                      fontSize: "0.7rem",
                      color: "#9A9DAA",
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                    }}
                  >
                    Duration
                  </p>

                  <div className="flex items-center justify-center px-[100px] py-[0px]">
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.5rem 1.1rem",
                        borderRadius: "100px",
                        border: "1.5px dashed #D0D1D6",
                        backgroundColor: "transparent",
                      }}
                    >
                  <input
  type="text"
  inputMode="numeric"
  pattern="[0-9]*"
  value={selectedMinutes === 0 ? "" : selectedMinutes}
  onChange={(e) => {
    const value = e.target.value;

    if (value === "") {
      setSelectedMinutes(0);
      return;
    }

    if (/^\d+$/.test(value)) {
      setSelectedMinutes(Number(value));
    }
  }}
  placeholder="3"
  style={{
    fontFamily: "'az-sans', sans-serif",
    fontSize: "0.85rem",
    letterSpacing: "0.05em",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#6B6F7B",
    width: "50px",
    textAlign: "center",
  }}
/>
                      <span
                        style={{
                          fontFamily: "'az-sans', sans-serif",
                          fontSize: "0.85rem",
                          letterSpacing: "0.05em",
                          color: "#6B6F7B",
                        }}
                      >
                        min
                      </span>
                    </div>
                  </div>
                </motion.div>

                {/* Start Button */}
                <motion.button
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.6 }}
                  onClick={handleStart}
                  className="group cursor-pointer"
                  style={{
                    fontFamily: "'az-sans', sans-serif",
                    fontSize: "0.8rem",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                    padding: "0.9rem 3rem",
                    borderRadius: "100px",
                    border: "none",
                    backgroundColor: "#313642",
                    color: "#F2F3F6",
                    transition: "transform 0.2s, box-shadow 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.03)";
                    e.currentTarget.style.boxShadow =
                      "0 8px 30px rgba(49,54,66,0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  Begin
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ── WRITING PHASE ── */}
          {phase === "writing" && (
            <motion.div
              key="writing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="flex-1 flex flex-col"
            >
              {/* Header */}
              <div className="px-6 md:px-12 pt-5 pb-3">
                <div className="flex items-center justify-between w-full max-w-4xl mx-auto">
                  <span
                    style={{
                      fontFamily: "'az-sans', sans-serif",
                      fontSize: "0.7rem",
                      color: "#313642",
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                    }}
                  >
                    Don't Stop Writing
                  </span>

                  <div className="flex items-center gap-3">
                    <div
                      className="w-24 h-[3px] rounded-full overflow-hidden"
                      style={{ backgroundColor: "#E0E1E6" }}
                    >
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          backgroundColor:
                            timeLeft <= 10 ? "#E05252" : "#313642",
                          width: `${progress * 100}%`,
                          transition: "width 1s linear, background-color 0.3s",
                        }}
                      />
                    </div>
                    <span
                      className="tabular-nums"
                      style={{
                        fontFamily: "'az-sans', sans-serif",
                        fontSize: "0.8rem",
                        color: timeLeft <= 10 ? "#E05252" : "#9A9DAA",
                        letterSpacing: "0.1em",
                        transition: "color 0.3s ease",
                      }}
                    >
                      {formatTime(timeLeft)}
                    </span>
                  </div>
                </div>
                <div
                  className="w-full max-w-4xl mx-auto mt-2"
                  style={{ borderTop: "1px solid #E0E1E6" }}
                />
              </div>

              {/* Writing Zone */}
              <div className="flex-1 flex flex-col px-6 md:px-12 pb-8">
                <WritingZone
                  chars={chars}
                  onCharsChange={handleCharsChange}
                  disabled={false}
                  lastKeyPressTimestamp={lastKeyPressTimestamp}
                />
              </div>
            </motion.div>
          )}

          {/* ── DONE SCREEN ── */}
          {phase === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="flex-1 flex flex-col"
            >
              {/* Header */}
              <div className="px-6 md:px-12 pt-5 pb-3">
                <div className="flex items-center justify-between w-full max-w-4xl mx-auto">
                  <span
                    style={{
                      fontFamily: "'az-sans', sans-serif",
                      fontSize: "0.7rem",
                      color: "#313642",
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                    }}
                  >
                    Don't Stop Writing
                  </span>
                  <button
                    onClick={handleRestart}
                    className="cursor-pointer"
                    style={{
                      fontFamily: "'az-sans', sans-serif",
                      fontSize: "0.7rem",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color: "#9A9DAA",
                      background: "none",
                      border: "none",
                      padding: "0.4rem 0.8rem",
                      borderRadius: "100px",
                      transition: "color 0.2s",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "#313642")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "#9A9DAA")
                    }
                  >
                    Again ↻
                  </button>
                </div>
                <div
                  className="w-full max-w-4xl mx-auto mt-2"
                  style={{ borderTop: "1px solid #E0E1E6" }}
                />
              </div>

              {/* Stats */}
              <div className="px-6 md:px-12 pt-6">
                <div className="w-full max-w-4xl mx-auto flex items-center gap-8 mb-6">
                  <div>
                    <p
                      style={{
                        fontFamily: "'az-sans', sans-serif",
                        fontSize: "0.6rem",
                        color: "#9A9DAA",
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        marginBottom: "0.2rem",
                      }}
                    >
                      Characters
                    </p>
                    <p
                      style={{
                        fontFamily: "'az-sans', sans-serif",
                        fontSize: "1.5rem",
                        color: "#313642",
                      }}
                    >
                      {chars.length}
                    </p>
                  </div>
                  <div>
                    <p
                      style={{
                        fontFamily: "'az-sans', sans-serif",
                        fontSize: "0.6rem",
                        color: "#9A9DAA",
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        marginBottom: "0.2rem",
                      }}
                    >
                      Words
                    </p>
                    <p
                      style={{
                        fontFamily: "'az-sans', sans-serif",
                        fontSize: "1.5rem",
                        color: "#313642",
                      }}
                    >
                      {
                        chars
                          .map((c) => c.char)
                          .join("")
                          .split(/\s+/)
                          .filter(Boolean).length
                      }
                    </p>
                  </div>
                  <div>
                    <p
                      style={{
                        fontFamily: "'az-sans', sans-serif",
                        fontSize: "0.6rem",
                        color: "#9A9DAA",
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        marginBottom: "0.2rem",
                      }}
                    >
                      Duration
                    </p>
                    <p
                      style={{
                        fontFamily: "'az-sans', sans-serif",
                        fontSize: "1.5rem",
                        color: "#313642",
                      }}
                    >
                      {selectedMinutes} min
                    </p>
                  </div>
                </div>
              </div>

              {/* Writing Artifact */}
              <div className="flex-1 px-6 md:px-12 pb-8 overflow-auto">
                <div className="w-full max-w-4xl mx-auto">
                  <p
                    className="mb-4"
                    style={{
                      fontFamily: "'az-sans', sans-serif",
                      fontSize: "0.6rem",
                      color: "#9A9DAA",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                    }}
                  >
                    Your Writing Artifact
                  </p>
                  <div
                    style={{
                      fontFamily: "'az-sans', sans-serif",
                      fontSize: "clamp(1rem, 2.5vw, 1.35rem)",
                      lineHeight: 1.9,
                      color: "#313642",
                      wordBreak: "break-all",
                      overflowWrap: "anywhere",
                    }}
                  >
                    {chars.map((c, i) => {
                      if (c.char === "\n") {
                        return (
                          <span key={i}>
                            {c.gapBefore > 1 && (
                              <span
                                className="inline-block"
                                style={{
                                  width: `${c.gapBefore}px`,
                                  height: "1em",
                                }}
                              />
                            )}
                            <br />
                          </span>
                        );
                      }
                      return (
                        <span key={i}>
                          {c.gapBefore > 1 && (
                            <span
                              className="inline-block"
                              style={{
                                width: `${c.gapBefore}px`,
                                height: "1em",
                              }}
                            />
                          )}
                          <span
                            className="inline"
                            style={
                              c.char === " "
                                ? { display: "inline-block", width: "0.6em" }
                                : undefined
                            }
                          >
                            {c.char}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
