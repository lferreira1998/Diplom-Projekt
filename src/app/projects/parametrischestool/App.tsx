import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { useSearchParams } from "react-router";
import { WritingZone, type Position, extractText } from "./components/writing-zone";
import {
  ParamPanel,
  DEFAULT_PARAMS,
  type WritingParams,
} from "./components/param-panel";
import { getToolById } from "../../utils/storage";

const FONT_UI = "'az-sans', sans-serif";
const FONT_UI_EXT = "'az-sans', sans-serif";
const BG_COLOR = "#F5F5F6";
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
        <div className="flex flex-col items-center gap-1">
          <span style={{ fontFamily: FONT_UI, fontSize: "1rem", color: headingColor, letterSpacing: "-0.01em" }}>
            Zeit abgelaufen.
          </span>
          {isVisual && (
            <span style={{ fontFamily: "'az-sans', sans-serif", fontSize: "0.68rem", color: subColor, lineHeight: 1.5, fontStyle: "italic" }}>
              Dein Text wartet hinter dem Dunkel.
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-center">
          <button
            onClick={onDelete}
            className="cursor-pointer"
            style={{ fontFamily: FONT_UI, fontSize: "0.65rem", letterSpacing: "0.05em", padding: "0.38rem 0.85rem", borderRadius: "100px", border: isVisual ? "1.5px dashed rgba(242,243,246,0.3)" : "1.5px dashed #9a9daa", backgroundColor: "transparent", color: isVisual ? "rgba(242,243,246,0.55)" : "#9a9daa", transition: "opacity 0.15s" }}
          >
            Text löschen
          </button>

          {isVisual && (
            <button
              onClick={onReveal}
              className="cursor-pointer"
              style={{ fontFamily: FONT_UI, fontSize: "0.65rem", letterSpacing: "0.05em", padding: "0.38rem 0.85rem", borderRadius: "100px", border: "1.5px solid rgba(242,243,246,0.5)", backgroundColor: "rgba(242,243,246,0.12)", color: "#F2F3F6", transition: "opacity 0.15s" }}
            >
              Text sehen
            </button>
          )}

          <button
            onClick={onCopy}
            className="cursor-pointer"
            style={{ fontFamily: FONT_UI, fontSize: "0.65rem", letterSpacing: "0.05em", padding: "0.38rem 0.85rem", borderRadius: "100px", border: "none", backgroundColor: isVisual ? "#F2F3F6" : "#313642", color: isVisual ? "#313642" : "#F2F3F6", transition: "opacity 0.15s" }}
          >
            {copied ? "Kopiert ✓" : "Text kopieren"}
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}

// ── Revealed action bar ───────────────────────────────────────────────────────

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
        style={{ backgroundColor: "rgba(242,243,246,0.1)", border: "1.5px dashed rgba(242,243,246,0.25)", borderRadius: "100px", backdropFilter: "blur(10px)", overflow: "hidden" }}
      >
        <button
          onClick={onCopy}
          className="cursor-pointer"
          style={{ fontFamily: FONT_UI, fontSize: "0.62rem", letterSpacing: "0.05em", padding: "0.38rem 1rem", background: "transparent", border: "none", color: "rgba(242,243,246,0.8)" }}
        >
          {copied ? "Kopiert ✓" : "Text kopieren"}
        </button>
        <div style={{ width: "1px", height: "14px", backgroundColor: "rgba(242,243,246,0.18)" }} />
        <button
          onClick={onDelete}
          className="cursor-pointer"
          style={{ fontFamily: FONT_UI, fontSize: "0.62rem", letterSpacing: "0.05em", padding: "0.38rem 1rem", background: "transparent", border: "none", color: "rgba(242,243,246,0.45)" }}
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
  const [searchParams] = useSearchParams();
  const [params, setParams] = useState<WritingParams>(DEFAULT_PARAMS);
  const [positions, setPositions] = useState<Position[]>([]);
  const [cursor, setCursor] = useState(0);
  const [panelOpen, setPanelOpen] = useState(true);
  const [locked, setLocked] = useState(false);
  const lastKeyPressTimestamp = useRef(0);

  useEffect(() => {
    const toolId = searchParams.get("tool");
    if (!toolId) return;
    getToolById(toolId)
      .then((tool) => { if (tool) { setParams(tool.params); setLocked(true); setPanelOpen(false); } })
      .catch(console.error);
  }, [searchParams]);

  const [timerRunning, setTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timerDone, setTimerDone] = useState(false);
  const [textRevealed, setTextRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

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

  useEffect(() => {
    if (!timerRunning || timeLeft <= 0) return;
    const id = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) { setTimerRunning(false); setTimerDone(true); return 0; }
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

  const handleReveal = useCallback(() => { setTextRevealed(true); }, []);

  const visibleText = extractText(positions);
  const wordCount = visibleText.split(/\s+/).filter(Boolean).length;

  const totalSeconds = (params.timerMinutes || 1) * 60;
  const progress = params.timerOn ? 1 - timeLeft / totalSeconds : 0;

  const bgColor =
    params.timerOn && params.visualTimer && timerRunning
      ? lerpColor(BG_COLOR, TEXT_COLOR, progress)
      : params.timerOn && params.visualTimer && (timerDone || textRevealed)
        ? TEXT_COLOR
        : BG_COLOR;

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
        style={{ backgroundColor: bgColor, transition: "background-color 1s linear" }}
      >
        {/* Noise overlay — static SVG feTurbulence, opacity only changes */}
        {params.bgNoise > 0 && (
          <div
            aria-hidden
            style={{
              position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none",
              opacity: params.bgNoise / 100 * 0.18,
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E")`,
              backgroundRepeat: "repeat",
              backgroundSize: "300px 300px",
            }}
          />
        )}
        {/* Top bar */}
        <div style={{ padding: "24px 48px 16px 48px" }}>
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>

            {/* Zurück */}
            <button
              onClick={() => window.history.back()}
              style={{ width: "271px", height: "40px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed #b4b3b3", backgroundColor: "transparent", cursor: "pointer", fontFamily: FONT_UI_EXT, fontSize: "12px", color: contentTextColor, letterSpacing: "-0.48px", fontWeight: 600, transition: "color 1s linear", whiteSpace: "nowrap" }}
            >
              Zurück
            </button>

            {/* Title */}
            <div style={{ flex: 1, height: "40px", display: "flex", alignItems: "center", padding: "0 24px", border: "1px dashed #b4b3b3", backgroundColor: "transparent", boxSizing: "border-box", gap: "16px" }}>
              <span style={{ fontFamily: FONT_UI_EXT, fontSize: "12px", color: contentTextColor, letterSpacing: "-0.48px", fontWeight: 600, transition: "color 1s linear" }}>
                {params.toolName || "Don't Stop Writing"}
              </span>
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "16px" }}>
                {params.timerOn && timerRunning && (
                  <span className="tabular-nums" style={{ fontFamily: FONT_UI, fontSize: "0.6rem", color: timeLeft <= 10 ? "#E05252" : contentTextColor, letterSpacing: "0.08em", opacity: 0.6, transition: "color 0.3s" }}>
                    {formatTime(timeLeft)}
                  </span>
                )}
                {positions.length > 0 && (
                  <>
                    <span className="tabular-nums" style={{ fontFamily: FONT_UI, fontSize: "0.6rem", color: contentTextColor, opacity: 0.4, letterSpacing: "0.08em", transition: "color 1s linear" }}>
                      {wordCount} {wordCount === 1 ? "word" : "words"}
                    </span>
                    <span className="tabular-nums" style={{ fontFamily: FONT_UI, fontSize: "0.6rem", color: contentTextColor, opacity: 0.4, letterSpacing: "0.08em", transition: "color 1s linear" }}>
                      {visibleText.length} chars
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Reset + Open/Close Parameters */}
            {!locked && (
              <div style={{ width: "271px", display: "flex", gap: "8px", flexShrink: 0, alignItems: "center" }}>
                <AnimatePresence>
                  {panelOpen && (
                    <motion.button
                      key="reset-btn"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "40px" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.18 }}
                      onClick={() => setParams(DEFAULT_PARAMS)}
                      title="Parameter zurücksetzen"
                      style={{ height: "40px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed #b4b3b3", backgroundColor: "transparent", cursor: "pointer", color: "#11112d", fontSize: "17px", overflow: "hidden", padding: 0, outline: "none" }}
                    >
                      ↺
                    </motion.button>
                  )}
                </AnimatePresence>
                <button
                  onClick={() => setPanelOpen((o) => !o)}
                  style={{ flex: 1, height: "40px", display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed #b4b3b3", backgroundColor: "transparent", cursor: "pointer", fontFamily: FONT_UI_EXT, fontSize: "12px", color: "#11112d", letterSpacing: "-0.48px", fontWeight: 600, whiteSpace: "nowrap" }}
                >
                  {panelOpen ? "Close Parameters" : "Open Parameters"}
                </button>
              </div>
            )}

          </div>
        </div>

        {/* Writing area */}
        <div className="flex-1 flex flex-col pb-8" style={{ paddingLeft: panelOpen ? "48px" : "335px", paddingRight: panelOpen ? "343px" : "48px", transition: "padding-left 0.42s cubic-bezier(0.16,1,0.3,1), padding-right 0.42s cubic-bezier(0.16,1,0.3,1)" }}>
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
            spiralModus={params.spiralModus}
            textAppearsRandom={params.textAppearsRandom}
            randomMode={params.randomMode}
            writingPrompt={params.toolPrompts[0] || ""}
          />
        </div>

        {!locked && (
          <ParamPanel
            params={params}
            onChange={setParams}
            isOpen={panelOpen}
            onToggle={() => setPanelOpen((o) => !o)}
          />
        )}
      </div>

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
