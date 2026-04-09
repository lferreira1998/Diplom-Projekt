import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { WritingZone, type Position, extractText } from "./components/writing-zone";
import {
  ParamPanel,
  DEFAULT_PARAMS,
  type WritingParams,
} from "./components/param-panel";

const FONT_UI = "'Area Inktrap', 'Space Grotesk', sans-serif";
const BG_COLOR = "#F2F3F6";
const TEXT_COLOR = "#313642";

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function lerpColor(a: string, b: string, t: number): string {
  const parse = (hex: string) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
  const ca = parse(a);
  const cb = parse(b);
  const r = Math.round(ca[0] + (cb[0] - ca[0]) * t);
  const g = Math.round(ca[1] + (cb[1] - ca[1]) * t);
  const bl = Math.round(ca[2] + (cb[2] - ca[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

// ── Timer Done Overlay ────────────────────────────────────────────────────────

interface TimerDoneOverlayProps {
  isVisual: boolean;
  onDelete: () => void;
  onReveal: () => void;
  onCopy: () => void;
  copied: boolean;
}

function TimerDoneOverlay({ isVisual, onDelete, onReveal, onCopy, copied }: TimerDoneOverlayProps) {
  const overlayBg = isVisual
    ? "rgba(49,54,66,0.72)"
    : "rgba(242,243,246,0.82)";

  const cardBg = isVisual ? "rgba(49,54,66,0.9)" : "rgba(242,243,246,0.96)";
  const cardBorder = isVisual ? "1.5px dashed rgba(242,243,246,0.25)" : "1.5px dashed #9a9daa";
  const headingColor = isVisual ? "#F2F3F6" : "#313642";
  const subColor = isVisual ? "rgba(242,243,246,0.45)" : "#9a9daa";

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ backgroundColor: overlayBg, backdropFilter: "blur(6px)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 14, scale: 0.97 }}
        transition={{ duration: 0.28, delay: 0.08 }}
        className="flex flex-col items-center gap-6 relative"
        style={{
          backgroundColor: cardBg,
          border: cardBorder,
          borderRadius: "18px",
          padding: "32px 40px",
          maxWidth: "300px",
          width: "90vw",
          backdropFilter: "blur(12px)",
          boxShadow: isVisual
            ? "0 24px 60px rgba(0,0,0,0.35)"
            : "0 24px 60px rgba(49,54,66,0.12)",
        }}
      >
        {/* Heading */}
        <div className="flex flex-col items-center gap-1">
          <span
            style={{
              fontFamily: FONT_UI,
              fontSize: "1rem",
              color: headingColor,
              letterSpacing: "-0.01em",
            }}
          >
            Zeit abgelaufen.
          </span>
          {isVisual && (
            <span
              style={{
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: "0.68rem",
                color: subColor,
                lineHeight: 1.5,
                fontStyle: "italic",
              }}
            >
              Dein Text wartet hinter dem Dunkel.
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {/* Text löschen */}
          <button
            onClick={onDelete}
            className="cursor-pointer"
            style={{
              fontFamily: FONT_UI,
              fontSize: "0.65rem",
              letterSpacing: "0.05em",
              padding: "0.38rem 0.85rem",
              borderRadius: "100px",
              border: isVisual
                ? "1.5px dashed rgba(242,243,246,0.3)"
                : "1.5px dashed #9a9daa",
              backgroundColor: "transparent",
              color: isVisual ? "rgba(242,243,246,0.55)" : "#9a9daa",
              transition: "opacity 0.15s",
            }}
          >
            Text löschen
          </button>

          {/* Text sehen — only for visual timer */}
          {isVisual && (
            <button
              onClick={onReveal}
              className="cursor-pointer"
              style={{
                fontFamily: FONT_UI,
                fontSize: "0.65rem",
                letterSpacing: "0.05em",
                padding: "0.38rem 0.85rem",
                borderRadius: "100px",
                border: "1.5px solid rgba(242,243,246,0.5)",
                backgroundColor: "rgba(242,243,246,0.12)",
                color: "#F2F3F6",
                transition: "opacity 0.15s",
              }}
            >
              Text sehen
            </button>
          )}

          {/* Text kopieren */}
          <button
            onClick={onCopy}
            className="cursor-pointer"
            style={{
              fontFamily: FONT_UI,
              fontSize: "0.65rem",
              letterSpacing: "0.05em",
              padding: "0.38rem 0.85rem",
              borderRadius: "100px",
              border: "none",
              backgroundColor: isVisual ? "#F2F3F6" : "#313642",
              color: isVisual ? "#313642" : "#F2F3F6",
              transition: "opacity 0.15s",
            }}
          >
            {copied ? "Kopiert ✓" : "Text kopieren"}
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}

// ── Revealed action bar (after "Text sehen") ──────────────────────────────────

interface RevealedBarProps {
  onDelete: () => void;
  onCopy: () => void;
  copied: boolean;
}

function RevealedBar({ onDelete, onCopy, copied }: RevealedBarProps) {
  return createPortal(
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.25 }}
      className="fixed bottom-8 left-1/2 z-[200] flex items-center gap-1"
      style={{ transform: "translateX(-50%)" }}
    >
      <div
        className="flex items-center gap-0"
        style={{
          backgroundColor: "rgba(242,243,246,0.1)",
          border: "1.5px dashed rgba(242,243,246,0.25)",
          borderRadius: "100px",
          backdropFilter: "blur(10px)",
          overflow: "hidden",
        }}
      >
        <button
          onClick={onCopy}
          className="cursor-pointer"
          style={{
            fontFamily: FONT_UI,
            fontSize: "0.62rem",
            letterSpacing: "0.05em",
            padding: "0.38rem 1rem",
            background: "transparent",
            border: "none",
            color: "rgba(242,243,246,0.8)",
          }}
        >
          {copied ? "Kopiert ✓" : "Text kopieren"}
        </button>
        <div style={{ width: "1px", height: "14px", backgroundColor: "rgba(242,243,246,0.18)" }} />
        <button
          onClick={onDelete}
          className="cursor-pointer"
          style={{
            fontFamily: FONT_UI,
            fontSize: "0.62rem",
            letterSpacing: "0.05em",
            padding: "0.38rem 1rem",
            background: "transparent",
            border: "none",
            color: "rgba(242,243,246,0.45)",
          }}
        >
          Text löschen
        </button>
      </div>
    </motion.div>,
    document.body
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [params, setParams] = useState<WritingParams>(DEFAULT_PARAMS);
  const [positions, setPositions] = useState<Position[]>([]);
  const [cursor, setCursor] = useState(0);
  const [panelOpen, setPanelOpen] = useState(false);
  const lastKeyPressTimestamp = useRef(0);

  // Timer state
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerDone, setTimerDone] = useState(false);

  // Post-timer state
  const [textRevealed, setTextRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  // Start/reset timer
  useEffect(() => {
    if (!params.timerOn) {
      setTimerRunning(false);
      setTimeLeft(0);
      setTimerDone(false);
      setTextRevealed(false);
      return;
    }
    const totalSeconds = (params.timerMinutes || 1) * 60;
    setTimeLeft(totalSeconds);
    setTimerRunning(true);
    setTimerDone(false);
    setTextRevealed(false);
  }, [params.timerOn, params.timerMode, params.timerMinutes]);

  // Countdown
  useEffect(() => {
    if (!timerRunning || timeLeft <= 0) return;
    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          setTimerDone(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timerRunning]);

  const handleUpdate = useCallback((newPos: Position[], newCursor: number) => {
    setPositions(newPos);
    setCursor(newCursor);
  }, []);

  const handleCopy = useCallback(() => {
    const text = extractText(positions);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [positions]);

  const handleDelete = useCallback(() => {
    setPositions([]);
    setCursor(0);
    setTimerDone(false);
    setTextRevealed(false);
    setTimerRunning(false);
    setTimeLeft(0);
  }, []);

  const handleReveal = useCallback(() => {
    setTextRevealed(true);
  }, []);

  const visibleText = extractText(positions);
  const wordCount = visibleText
    .split(/\s+/)
    .filter(Boolean).length;

  // Visual timer background
  const totalSeconds = (params.timerMinutes || 1) * 60;
  const progress = params.timerOn ? 1 - timeLeft / totalSeconds : 0;

  const bgColor =
    params.timerOn && params.visualTimer && timerRunning
      ? lerpColor(BG_COLOR, TEXT_COLOR, progress)
      : params.timerOn && params.visualTimer && (timerDone || textRevealed)
        ? TEXT_COLOR
        : BG_COLOR;

  // Text color: stays fixed – visual timer darkens the BG, text merges into it naturally.
  // Only flip to BG_COLOR when text is explicitly revealed on the now-dark background.
  const contentTextColor = textRevealed ? BG_COLOR : TEXT_COLOR;

  const showDoneModal = timerDone && !textRevealed;
  const showRevealedBar = timerDone && textRevealed && params.visualTimer;

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap"
        rel="stylesheet"
      />
      <style>{`
        @keyframes cursorBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>

      <div
        className="min-h-screen flex flex-col"
        style={{
          backgroundColor: bgColor,
          transition: "background-color 1s linear",
        }}
      >
        {/* Top bar */}
        <div className="px-6 md:px-10 pt-5 pb-3">
          <div
            className="flex items-center justify-between transition-all duration-300"
            style={{ paddingRight: panelOpen ? "296px" : "0px" }}
          >
            <span
              style={{
                fontFamily: FONT_UI,
                fontSize: "0.68rem",
                color: contentTextColor,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                transition: "color 1s linear",
              }}
            >
              Don't Stop Writing
            </span>

            <div className="flex items-center gap-4">
              {/* Countdown */}
              {params.timerOn && timerRunning && (
                <span
                  className="tabular-nums"
                  style={{
                    fontFamily: FONT_UI,
                    fontSize: "0.6rem",
                    color: timeLeft <= 10 ? "#E05252" : contentTextColor,
                    letterSpacing: "0.08em",
                    opacity: 0.6,
                    transition: "color 0.3s",
                  }}
                >
                  {formatTime(timeLeft)}
                </span>
              )}

              {positions.length > 0 && (
                <>
                  <span
                    className="tabular-nums"
                    style={{
                      fontFamily: FONT_UI,
                      fontSize: "0.6rem",
                      color: contentTextColor,
                      opacity: 0.4,
                      letterSpacing: "0.08em",
                      transition: "color 1s linear",
                    }}
                  >
                    {wordCount} {wordCount === 1 ? "word" : "words"}
                  </span>
                  <span
                    className="tabular-nums"
                    style={{
                      fontFamily: FONT_UI,
                      fontSize: "0.6rem",
                      color: contentTextColor,
                      opacity: 0.4,
                      letterSpacing: "0.08em",
                      transition: "color 1s linear",
                    }}
                  >
                    {visibleText.length} chars
                  </span>
                </>
              )}
            </div>
          </div>
          <div
            className="mt-2 transition-all duration-300"
            style={{
              borderTop: `1px solid ${
                params.timerOn && params.visualTimer && progress > 0.3
                  ? "rgba(242,243,246,0.15)"
                  : "#E0E1E6"
              }`,
              marginRight: panelOpen ? "296px" : "0px",
              transition: "border-color 1s linear, margin-right 0.3s",
            }}
          />
        </div>

        {/* Writing area */}
        <div className="flex-1 flex flex-col px-6 md:px-10 pb-8">
          <WritingZone
            positions={positions}
            cursor={cursor}
            onUpdate={handleUpdate}
            lastKeyPressTimestamp={lastKeyPressTimestamp}
            panelOpen={panelOpen}
            textColor={contentTextColor}
            coverBgColor={bgColor}
            visibility={params.visibility}
            deleteMode={params.deleteMode}
            correctionMode={params.correctionMode}
            cursorLaeuftWeiter={params.cursorLaeuftWeiter}
            driftet={params.driftet}
            driftSaetze={params.driftSaetze}
            driftWoerter={params.driftWoerter}
            driftBuchstaben={params.driftBuchstaben}
            driftDelay={params.driftDelay}
            driftSpeed={params.driftSpeed}
            verblasst={params.verblasst}
            verblassenDelay={params.verblassenDelay}
            verblassenSpeed={params.verblassenSpeed}
          />
        </div>

        {/* Parameter panel */}
        <ParamPanel
          params={params}
          onChange={setParams}
          isOpen={panelOpen}
          onToggle={() => setPanelOpen((o) => !o)}
        />
      </div>

      {/* Timer done overlay (portal, escapes transforms) */}
      <AnimatePresence>
        {showDoneModal && (
          <TimerDoneOverlay
            isVisual={params.visualTimer}
            onDelete={handleDelete}
            onReveal={handleReveal}
            onCopy={handleCopy}
            copied={copied}
          />
        )}
      </AnimatePresence>

      {/* Revealed action bar */}
      <AnimatePresence>
        {showRevealedBar && (
          <RevealedBar
            onDelete={handleDelete}
            onCopy={handleCopy}
            copied={copied}
          />
        )}
      </AnimatePresence>
    </>
  );
}