import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";

type Phase = "start" | "playing" | "done";

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function App() {
  const [phase, setPhase] = useState<Phase>("start");
  const [selectedMinutes, setSelectedMinutes] = useState(3);
  const [timeLeft, setTimeLeft] = useState(0);

  const [cursorPos, setCursorPos] = useState({ x: 50, y: 50 });
  const [isTyping, setIsTyping] = useState(false);
  const [currentText, setCurrentText] = useState("");
  const [submittedTexts, setSubmittedTexts] = useState<
    Array<{ id: number; text: string; x: number; y: number }>
  >([]);

  const animationFrameRef = useRef<number>();
  const textIdRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const timerRef = useRef<number>();

  // Original experiment refs
  const posRef = useRef({ x: 50, y: 50 });
  const velRef = useRef({ vx: 0.15, vy: 0.1 });
  const typingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const trailPointsRef = useRef<Array<{ x: number; y: number }>>([]);

  useEffect(() => {
    typingRef.current = isTyping;
  }, [isTyping]);

  const drawTrail = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, rect.width, rect.height);

    const points = trailPointsRef.current;
    if (points.length < 2) return;

    ctx.beginPath();
    ctx.strokeStyle = "rgba(49, 54, 66, 0.15)";
    ctx.lineWidth = 0.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const toPixel = (p: { x: number; y: number }) => ({
      x: (p.x / 100) * rect.width,
      y: (p.y / 100) * rect.height,
    });

    const first = toPixel(points[0]);
    ctx.moveTo(first.x, first.y);

    for (let i = 1; i < points.length; i++) {
      const p = toPixel(points[i]);
      ctx.lineTo(p.x, p.y);
    }

    ctx.stroke();
  }, []);

  // Original animation loop, only gated by phase
  useEffect(() => {
    if (phase !== "playing") return;

    const animate = () => {
      if (!containerRef.current) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const rect = containerRef.current.getBoundingClientRect();
      const pos = posRef.current;
      const vel = velRef.current;

      const speed = Math.sqrt(vel.vx * vel.vx + vel.vy * vel.vy);
      let angle = Math.atan2(vel.vy, vel.vx);

      angle += (Math.random() - 0.5) * 0.04;

      const newSpeed = speed + (Math.random() - 0.5) * 0.002;
      const clampedSpeed = Math.max(0.08, Math.min(0.2, newSpeed));

      vel.vx = Math.cos(angle) * clampedSpeed;
      vel.vy = Math.sin(angle) * clampedSpeed;

      const speedMultiplier = typingRef.current ? 0.08 : 1;
      const dx = vel.vx * speedMultiplier;
      const dy = vel.vy * speedMultiplier;

      let newX = pos.x + dx;
      let newY = pos.y + dy;

      const margin = 3;
      if (newX <= margin) {
        newX = margin;
        vel.vx = Math.abs(vel.vx);
      } else if (newX >= 100 - margin) {
        newX = 100 - margin;
        vel.vx = -Math.abs(vel.vx);
      }

      if (newY <= margin) {
        newY = margin;
        vel.vy = Math.abs(vel.vy);
      } else if (newY >= 100 - margin) {
        newY = 100 - margin;
        vel.vy = -Math.abs(vel.vy);
      }

      pos.x = newX;
      pos.y = newY;

      const last = lastPointRef.current;
      if (!last) {
        trailPointsRef.current.push({ x: newX, y: newY });
        lastPointRef.current = { x: newX, y: newY };
      } else {
        const distPx = Math.sqrt(
          Math.pow(((newX - last.x) / 100) * rect.width, 2) +
            Math.pow(((newY - last.y) / 100) * rect.height, 2)
        );
        if (distPx > 2) {
          trailPointsRef.current.push({ x: newX, y: newY });
          lastPointRef.current = { x: newX, y: newY };
        }
      }

      drawTrail();
      setCursorPos({ x: newX, y: newY });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [drawTrail, phase]);

  useEffect(() => {
    if (phase !== "playing") return;

    let remaining = selectedMinutes * 60;
    setTimeLeft(remaining);

    timerRef.current = window.setInterval(() => {
      remaining -= 1;
      setTimeLeft(remaining);

      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        setPhase("done");
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, selectedMinutes]);

  const handleStart = useCallback(() => {
    setSubmittedTexts([]);
    setCurrentText("");
    setIsTyping(false);
    setCursorPos({ x: 50, y: 50 });

    posRef.current = { x: 50, y: 50 };
    velRef.current = { vx: 0.15, vy: 0.1 };
    lastPointRef.current = null;
    trailPointsRef.current = [];
    textIdRef.current = 0;

    setPhase("playing");
  }, []);

  const handleRestart = useCallback(() => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (timerRef.current) clearInterval(timerRef.current);

    setPhase("start");
    setTimeLeft(0);
    setCursorPos({ x: 50, y: 50 });
    setIsTyping(false);
    setCurrentText("");
    setSubmittedTexts([]);

    posRef.current = { x: 50, y: 50 };
    velRef.current = { vx: 0.15, vy: 0.1 };
    lastPointRef.current = null;
    trailPointsRef.current = [];
    textIdRef.current = 0;
  }, []);

  // Original typing logic
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (currentText.trim().length > 0) {
        const pos = posRef.current;
        setSubmittedTexts((prev) => [
          ...prev,
          {
            id: textIdRef.current++,
            text: currentText,
            x: pos.x,
            y: pos.y,
          },
        ]);
        setCurrentText("");
        setIsTyping(false);
      }
    } else if (e.key === "Backspace") {
      if (currentText.length > 0) {
        setCurrentText((prev) => prev.slice(0, -1));
      }
    } else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey) {
      if (!isTyping) {
        setIsTyping(true);
      }
      setCurrentText((prev) => prev + e.key);
    }
  };

  // Original focus behavior, gated by phase
  useEffect(() => {
    if (phase !== "playing") return;
    const textarea = document.querySelector("textarea");
    if (textarea) (textarea as HTMLTextAreaElement).focus();
  }, [phase]);

  const handleContainerClick = () => {
    const textarea = document.querySelector("textarea");
    if (textarea) (textarea as HTMLTextAreaElement).focus();
  };

  const totalDuration = selectedMinutes * 60;
  const progress = phase === "playing" ? 1 - timeLeft / totalDuration : 0;

  return (
    <>
      <div
        className="h-screen flex flex-col"
        style={{ backgroundColor: "#F2F3F6" }}
      >
        <AnimatePresence mode="wait">
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
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.6 }}
                  className="mb-12 text-center"
                >
                  <h1
                    style={{
                      fontFamily: "'Area Inktrap', 'Space Grotesk', sans-serif",
                      fontSize: "clamp(2rem, 6vw, 3.5rem)",
                      color: "#313642",
                      letterSpacing: "-0.02em",
                      lineHeight: 1.1,
                    }}
                  >
                    Uninvited Thoughts
                  </h1>
                </motion.div>

                <motion.p
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="text-center mb-12 max-w-md"
                  style={{
                    fontFamily: "'IBM Plex Sans', sans-serif",
                    fontSize: "0.95rem",
                    color: "#6B6F7B",
                    lineHeight: 1.7,
                  }}
                >
                  A dot moves across the screen. Follow it with your full
                  attention. Thoughts will arise on their own. Instead of
                  pushing them away, write them down and press Enter. Then
                  return your full attention to the dot. The next thought will
                  appear.
                </motion.p>

                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.6 }}
                  className="mb-10 w-full"
                >
                  <p
                    className="text-center mb-4"
                    style={{
                      fontFamily: "'Area Inktrap', 'Space Grotesk', sans-serif",
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
                          fontFamily:
                            "'Area Inktrap', 'Space Grotesk', sans-serif",
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
                          fontFamily:
                            "'Area Inktrap', 'Space Grotesk', sans-serif",
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

                <motion.button
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7, duration: 0.6 }}
                  onClick={() => {
                    if (!selectedMinutes || selectedMinutes < 1) {
                      setSelectedMinutes(3);
                    }
                    handleStart();
                  }}
                  className="group cursor-pointer"
                  style={{
                    fontFamily: "'Area Inktrap', 'Space Grotesk', sans-serif",
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

          {phase === "playing" && (
            <motion.div
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="flex-1 flex flex-col"
            >
              <div className="px-6 md:px-12 pt-5 pb-3 bg-[#ffffff00]">
                <div className="flex items-center justify-between w-full max-w-4xl mx-auto">
                  <span className="font-bold"
                    style={{
                      fontFamily: "'Area Inktrap', 'Space Grotesk', sans-serif",
                      fontSize: "0.7rem",
                      color: "#313642",
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                    }}
                  >Uninvited Thoughts</span>

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
                        fontFamily: "'Area Inktrap', 'Space Grotesk', sans-serif",
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

              <div className="flex-1 px-6 md:px-12 pb-8 bg-[#00000000]">
                <div
                  ref={containerRef}
                  className="size-full relative overflow-hidden"
                  style={{
                    backgroundColor: "#F2F3F6",
                    cursor: "none",
                  }}
                  onClick={handleContainerClick}
                >
                  <canvas
                    ref={canvasRef}
                    className="absolute inset-0 pointer-events-none"
                  />

                  {submittedTexts.map((item) => (
                    <div
                      key={item.id}
                      className="absolute whitespace-nowrap pointer-events-none"
                      style={{
                        left: `${item.x}%`,
                        top: `${item.y}%`,
                        transform: "translate(-50%, -50%)",
                        fontFamily: "'IBM Plex Sans', sans-serif",
                        fontSize: "0.95rem",
                        color: "#6B6F7B",
                        letterSpacing: "0.01em",
                      }}
                    >
                      {item.text}
                    </div>
                  ))}

                  <div
                    className="absolute pointer-events-none"
                    style={{
                      left: `${cursorPos.x}%`,
                      top: `${cursorPos.y}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    {currentText ? (
                      <div
                        className="whitespace-nowrap"
                        style={{
                          fontFamily: "'IBM Plex Sans', sans-serif",
                          fontSize: "0.95rem",
                          color: "#313642",
                          letterSpacing: "0.01em",
                        }}
                      >
                        {currentText}
                        <span
                          className="inline-block ml-[1px] animate-pulse"
                          style={{
                            width: "1.5px",
                            height: "1em",
                            backgroundColor: "#313642",
                          }}
                        />
                      </div>
                    ) : (
                      <div
                        style={{
                          width: "6px",
                          height: "6px",
                          backgroundColor: "#000000",
                          borderRadius: "999px",
                        }}
                      />
                    )}
                  </div>

                  <textarea
                    onKeyDown={handleKeyDown}
                    className="absolute inset-0 w-full h-full bg-transparent resize-none outline-none border-none text-transparent caret-transparent selection:bg-transparent"
                    style={{ caretColor: "transparent" }}
                    autoFocus
                  />
                </div>
              </div>
            </motion.div>
          )}

          {phase === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="flex-1 flex flex-col"
            >
              <div className="px-6 md:px-12 pt-5 pb-3">
                <div className="flex items-center justify-between w-full max-w-4xl mx-auto">
                  <span
                    style={{
                      fontFamily: "'Area Inktrap', 'Space Grotesk', sans-serif",
                      fontSize: "0.7rem",
                      color: "#313642",
                      letterSpacing: "0.2em",
                      textTransform: "uppercase",
                    }}
                  >
                    Uninvited Thoughts
                  </span>
                  <button
                    onClick={handleRestart}
                    className="cursor-pointer"
                    style={{
                      fontFamily: "'Area Inktrap', 'Space Grotesk', sans-serif",
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

              <div className="px-6 md:px-12 pt-6">
                <div className="w-full max-w-4xl mx-auto flex items-center gap-8 mb-6">
                  <div>
                    <p
                      style={{
                        fontFamily: "'Area Inktrap', 'Space Grotesk', sans-serif",
                        fontSize: "0.6rem",
                        color: "#9A9DAA",
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        marginBottom: "0.2rem",
                      }}
                    >
                      Thoughts
                    </p>
                    <p
                      style={{
                        fontFamily: "'Area Inktrap', 'Space Grotesk', sans-serif",
                        fontSize: "1.5rem",
                        color: "#313642",
                      }}
                    >
                      {submittedTexts.length}
                    </p>
                  </div>

                  <div>
                    <p
                      style={{
                        fontFamily: "'Area Inktrap', 'Space Grotesk', sans-serif",
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
                        fontFamily: "'Area Inktrap', 'Space Grotesk', sans-serif",
                        fontSize: "1.5rem",
                        color: "#313642",
                      }}
                    >
                      {selectedMinutes} min
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 px-6 md:px-12 pb-8 overflow-auto">
                <div className="w-full max-w-4xl mx-auto">
                  <p
                    className="mb-4"
                    style={{
                      fontFamily: "'Hurensohn', 'Space Grotesk', sans-serif",
                      fontSize: "0.6rem",
                      color: "#9A9DAA",
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                    }}
                  >
                    Captured Thoughts
                  </p>

                  <div className="flex flex-col gap-4">
                    {submittedTexts.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          fontFamily: "'IBM Plex Sans', sans-serif",
                          fontSize: "1rem",
                          lineHeight: 1.7,
                          color: "#313642",
                          paddingBottom: "0.75rem",
                          borderBottom: "1px solid #E0E1E6",
                        }}
                      >
                        {item.text}
                      </div>
                    ))}
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