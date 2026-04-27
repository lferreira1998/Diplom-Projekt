import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { ChevronRight, Info } from "lucide-react";

export interface WritingParams {
  timerOn: boolean;
  timerMode: "fixed" | "free";
  timerMinutes: number;
  visualTimer: boolean;
  visibility: "visible" | "hidden" | "sentence" | "word" | "char";
  deleteMode: "deletable" | "no-delete" | "sentence" | "word";
  correctionMode: "hidden" | "tippex";
  cursorLaeuftWeiter: boolean;
  driftet: boolean;
  driftSaetze: boolean;
  driftWoerter: boolean;
  driftBuchstaben: boolean;
  driftDelay: number;
  driftSpeed: number;
  verblasst: boolean;
  verblassenDelay: number;
  verblassenSpeed: number;
  spiralModus: boolean;
  textAppearsRandom: boolean;
  randomMode: "words" | "sentences";
}

export const DEFAULT_PARAMS: WritingParams = {
  timerOn: false,
  timerMode: "fixed",
  timerMinutes: 10,
  visualTimer: false,
  visibility: "visible",
  deleteMode: "deletable",
  correctionMode: "hidden",
  cursorLaeuftWeiter: false,
  driftet: false,
  driftSaetze: true,
  driftWoerter: true,
  driftBuchstaben: false,
  driftDelay: 120,
  driftSpeed: 100,
  verblasst: false,
  verblassenDelay: 120,
  verblassenSpeed: 100,
  spiralModus: false,
  textAppearsRandom: false,
  randomMode: "words",
};

interface ParamPanelProps {
  params: WritingParams;
  onChange: (params: WritingParams) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const FONT_SEMI = "'Area Inktrap', 'Space Grotesk', sans-serif";
const FONT_REG  = "'Area Inktrap', 'Space Grotesk', sans-serif";

function formatDelay(seconds: number): string {
  if (seconds === 0) return "Sofort";
  if (seconds < 60) return `Nach ${seconds}s`;
  return `Nach ${Math.round(seconds / 60)}min`;
}

/** PillSwitch: OFF = #dddee3 knob left, ON = #313642 knob right */
function PillSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      className="relative shrink-0 cursor-pointer select-none"
      style={{ width: "64px", height: "20px" }}
      onClick={() => onChange(!checked)}
    >
      {/* Label */}
      <div className="absolute" style={{ left: 0, top: "2.8px", height: "14.398px", width: "20px" }}>
        <p
          className="-translate-x-full absolute text-right whitespace-nowrap"
          style={{
            fontFamily: FONT_REG,
            fontSize: "9.6px",
            lineHeight: "14.4px",
            left: "20.32px",
            top: "0.5px",
            color: "#9a9daa",
            letterSpacing: "0.768px",
          }}
        >
          {checked ? "An" : "Aus"}
        </p>
      </div>
      {/* Pill */}
      <div
        className="absolute flex flex-col"
        style={{
          left: "28px",
          top: 0,
          width: "36px",
          height: "20px",
          borderRadius: "100px",
          backgroundColor: checked ? "#313642" : "#dddee3",
          paddingTop: "3px",
          paddingLeft: checked ? "19px" : "3px",
          paddingRight: checked ? "3px" : "19px",
          transition: "background-color 0.2s, padding-left 0.2s, padding-right 0.2s",
        }}
      >
        <div style={{ backgroundColor: "white", height: "14px", borderRadius: "7px", width: "100%" }} />
      </div>
    </div>
  );
}

export function ParamPanel({ params, onChange, isOpen, onToggle }: ParamPanelProps) {
  const [weitereOpen, setWeitereOpen] = useState(false);
  const [sichtbarkeitOpen, setSichtbarkeitOpen] = useState(false);
  const [textSubOpen, setTextSubOpen] = useState(true);
  const [zeitCardOpen, setZeitCardOpen] = useState(false);
  const [timerSubOpen, setTimerSubOpen] = useState(true);
  const [korrigierenOpen, setKorrigierenOpen] = useState(false);
  const [textLoeschenOpen, setTextLoeschenOpen] = useState(true);
  const [korrekturSichtbarOpen, setKorrekturSichtbarOpen] = useState(true);
  const [bestaendigkeitOpen, setBestaendigkeitOpen] = useState(false);
  const [spaceOrderOpen, setSpaceOrderOpen] = useState(false);

  // ── Tooltip state — managed at panel level ─────────────────────────────────��
  // The bubble is rendered inside the panel's root div (outside overflow containers)
  // using position:absolute with panel-relative coords. This is the only approach
  // that works correctly regardless of CSS transforms or iframe scaling.
  const panelRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  const showTooltip = (iconEl: HTMLElement, text: string) => {
    const rect = iconEl.getBoundingClientRect();
    setTooltip({
      text,
      // center of icon in viewport coords (for fixed positioning)
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  };
  const hideTooltip = () => setTooltip(null);

  const update = <K extends keyof WritingParams>(key: K, value: WritingParams[K]) => {
    onChange({ ...params, [key]: value });
  };

  return (
    <>
      {/* ── Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ x: 319 }}
            animate={{ x: 0 }}
            exit={{ x: 319 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              height: "100%",
              width: "319px",
              zIndex: 40,
              display: "flex",
              flexDirection: "column",
              backgroundColor: "#f5f5f6",
              padding: "24px",
              gap: "16px",
              boxSizing: "border-box",
            }}
          >
            {/* Dark header */}
            <div
              style={{
                flexShrink: 0,
                height: "64px",
                backgroundColor: "#11112d",
                border: "1px dashed #11112d",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "0 24px",
              }}
            >
              <span style={{ fontFamily: FONT_SEMI, fontSize: "15.87px", color: "#f2f3f6", letterSpacing: "-0.03em", fontWeight: 700 }}>
                Parameters
              </span>
              <button
                onClick={onToggle}
                style={{ background: "none", border: "none", cursor: "pointer", fontFamily: FONT_SEMI, fontSize: "13px", color: "#ebeef3", lineHeight: "17.28px" }}
              >
                Close
              </button>
            </div>

            {/* Scrollable category list */}
            <div
              style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none", backgroundColor: "#f7f7f7", display: "flex", flexDirection: "column" }}
            >
              {/* ── Zeit ── */}
              <div>
                <button
                  onClick={() => setZeitCardOpen((o) => !o)}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", background: "rgba(255,255,255,0.1)", border: "1px dashed #11112d", cursor: "pointer", minHeight: "64px", boxSizing: "border-box", outline: "none" }}
                >
                  <span style={{ fontFamily: FONT_SEMI, fontSize: "13px", color: "#11112d", lineHeight: "17.28px" }}>Zeit</span>
                  <motion.span animate={{ rotate: zeitCardOpen ? 45 : 0 }} transition={{ duration: 0.18 }} style={{ fontSize: "24px", color: "#11112d", fontFamily: FONT_REG, lineHeight: 1 }}>+</motion.span>
                </button>
                  <AnimatePresence>
                    {zeitCardOpen && (
                      <motion.div
                        key="zeit-card-content"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22 }}
                        style={{ overflow: "hidden" }}
                      >
                      <div style={{ borderLeft: "1px dashed #11112d", borderRight: "1px dashed #11112d", borderBottom: "1px dashed #11112d", padding: "16px 24px", display: "flex", flexDirection: "column", gap: "16px", backgroundColor: "rgba(255,255,255,0.1)", marginTop: "-1px" }}>

                        {/* ── Timer sub-section ── */}
                        <div className="flex flex-col gap-[8px]">
                          <button
                            onClick={() => setTimerSubOpen((o) => !o)}
                            className="flex items-center gap-[6px] cursor-pointer w-full"
                            style={{ background: "none", border: "none", outline: "none", padding: 0, height: "20px" }}
                          >
                            <motion.span
                              animate={{ rotate: timerSubOpen ? 90 : 0 }}
                              transition={{ duration: 0.15 }}
                              style={{ display: "inline-flex", color: "#B0B3BC" }}
                            >
                              <ChevronRight size={12} />
                            </motion.span>
                            <span style={{ fontFamily: FONT_SEMI, fontSize: "11.52px", color: "#313642", letterSpacing: "0.1152px" }}>
                              Timer
                            </span>
                          </button>

                          <AnimatePresence>
                            {timerSubOpen && (
                              <motion.div
                                key="timer-sub-content"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.15 }}
                                style={{ overflow: "hidden" }}
                                className="flex flex-col gap-[8px]"
                              >
                                {/* Timer on/off */}
                                <div className="flex items-center justify-between" style={{ height: "36px" }}>
                                  <span style={{ fontFamily: FONT_SEMI, fontSize: "11.52px", color: "#313642", letterSpacing: "0.1152px" }}>
                                    Timer aktiv
                                  </span>
                                  <PillSwitch
                                    checked={params.timerOn}
                                    onChange={(v) => { update("timerOn", v); if (!v) setWeitereOpen(false); }}
                                  />
                                </div>

                                <AnimatePresence>
                                  {params.timerOn && (
                                    <motion.div
                                      key="time-options"
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: "auto" }}
                                      exit={{ opacity: 0, height: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="flex flex-col gap-[8px]"
                                      style={{ overflow: "hidden" }}
                                    >
                                      {/* Feste Zeit | Frei wählbar */}
                                      <div className="flex gap-[8px]">
                                        {(["fixed", "free"] as const).map((mode) => {
                                          const label  = mode === "fixed" ? "Feste Zeit" : "Frei wählbar";
                                          const active = params.timerMode === mode;
                                          return (
                                            <button
                                              key={mode}
                                              onClick={() => update("timerMode", mode)}
                                              className="flex-1 cursor-pointer flex items-center justify-center"
                                              style={{
                                                height: "29px",
                                                borderRadius: "100px",
                                                backgroundColor: active ? "#313642" : "transparent",
                                                border: active ? "1.5px solid transparent" : "1.5px dashed #9a9daa",
                                                outline: "none",
                                              }}
                                            >
                                              <span style={{ fontFamily: FONT_REG, fontSize: "10.88px", color: active ? "#ecedf0" : "#9a9daa", letterSpacing: "0.3264px" }}>
                                                {label}
                                              </span>
                                            </button>
                                          );
                                        })}
                                      </div>

                                      {/* Time input */}
                                      <div
                                        className="relative w-full flex items-center"
                                        style={{ height: "29px", borderRadius: "100px", backgroundColor: "transparent", border: "1.5px dashed #9a9daa" }}
                                      >
                                        <div className="absolute right-[12px] flex items-center">
                                          <span style={{ fontFamily: FONT_REG, fontSize: "10.88px", color: "#9a9daa", letterSpacing: "0.3264px" }}>
                                            min
                                          </span>
                                        </div>
                                        <input
                                          type="text"
                                          inputMode="numeric"
                                          pattern="[0-9]*"
                                          value={params.timerMinutes === 0 ? "" : params.timerMinutes}
                                          onChange={(e) => {
                                            const v = e.target.value;
                                            if (v === "") { update("timerMinutes", 0); return; }
                                            if (/^\d+$/.test(v)) update("timerMinutes", Number(v));
                                          }}
                                          className="absolute inset-0 text-center bg-transparent outline-none"
                                          style={{ fontFamily: FONT_REG, fontSize: "11.52px", color: "rgba(107,111,123,0.7)", letterSpacing: "0.576px", border: "none" }}
                                        />
                                      </div>

                                      {/* Note for Frei wählbar */}
                                      <AnimatePresence>
                                        {params.timerMode === "free" && (
                                          <motion.p
                                            key="free-note"
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.15 }}
                                            style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontSize: "9.5px", color: "#A0A3AD", lineHeight: 1.5, fontStyle: "italic", overflow: "hidden", margin: 0 }}
                                          >
                                            Diese Zeit gilt nur für jetzt.
                                          </motion.p>
                                        )}
                                      </AnimatePresence>

                                      {/* Weitere Optionen */}
                                      <div className="flex flex-col gap-[4px]">
                                        <button
                                          onClick={() => setWeitereOpen((o) => !o)}
                                          className="flex items-center gap-[6px] cursor-pointer"
                                          style={{ background: "none", border: "none", outline: "none", padding: 0, height: "13.922px" }}
                                        >
                                          <motion.span
                                            animate={{ rotate: weitereOpen ? 90 : 0 }}
                                            transition={{ duration: 0.15 }}
                                            style={{ display: "inline-flex", color: "#B0B3BC" }}
                                          >
                                            <ChevronRight size={11} />
                                          </motion.span>
                                          <span className="capitalize" style={{ fontFamily: FONT_REG, fontSize: "9.28px", color: "#a0a3ad", letterSpacing: "1.1136px" }}>
                                            weitere optionen
                                          </span>
                                        </button>

                                        <AnimatePresence>
                                          {weitereOpen && (
                                            <motion.div
                                              key="vis-timer"
                                              initial={{ opacity: 0, height: 0 }}
                                              animate={{ opacity: 1, height: "auto" }}
                                              exit={{ opacity: 0, height: 0 }}
                                              transition={{ duration: 0.15 }}
                                              style={{ overflow: "hidden" }}
                                            >
                                              <div className="flex items-center justify-between" style={{ height: "36px" }}>
                                                <div className="flex items-center gap-[6px]">
                                                  <span style={{ fontFamily: FONT_SEMI, fontSize: "11.52px", color: "#313642", letterSpacing: "0.1152px" }}>
                                                    Visueller Timer
                                                  </span>
                                                  <div
                                                    className="flex items-center cursor-help"
                                                    onMouseEnter={(e) => showTooltip(e.currentTarget, "Der Hintergrund wird langsam zur Textfarbe.\nMan sieht visuell, wie viel Zeit man noch hat.")}
                                                    onMouseLeave={hideTooltip}
                                                  >
                                                    <Info size={11} style={{ color: "#B0B3BC" }} />
                                                  </div>
                                                </div>
                                                <PillSwitch
                                                  checked={params.visualTimer}
                                                  onChange={(v) => update("visualTimer", v)}
                                                />
                                              </div>
                                            </motion.div>
                                          )}
                                        </AnimatePresence>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <div style={{ borderTop: "1.5px dashed #9a9daa" }} />

                        {/* ── Cursor läuft weiter ── */}
                        <div className="flex flex-col gap-[4px]">
                          <div className="flex items-center justify-between" style={{ height: "36px" }}>
                            <span style={{ fontFamily: FONT_SEMI, fontSize: "11.52px", color: "#313642", letterSpacing: "0.1152px" }}>
                              Cursor läuft weiter
                            </span>
                            <PillSwitch
                              checked={params.cursorLaeuftWeiter}
                              onChange={(v) => update("cursorLaeuftWeiter", v)}
                            />
                          </div>
                          <p style={{ fontFamily: FONT_REG, fontSize: "9.6px", lineHeight: "14.4px", color: "#9a9daa", letterSpacing: "0.768px", margin: 0 }}>
                            Pausen werden zu Leerzeichen.{"\n"}
                            <br />
                            Zeit wird räumlich sichtbar.
                          </p>
                        </div>

                      </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
              </div>

              {/* ── Sichtbarkeit ── */}
              <div style={{ marginTop: "-1px" }}>
                <button
                  onClick={() => setSichtbarkeitOpen((o) => !o)}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", background: "rgba(255,255,255,0.1)", border: "1px dashed #11112d", cursor: "pointer", minHeight: "64px", boxSizing: "border-box", outline: "none" }}
                >
                  <span style={{ fontFamily: FONT_SEMI, fontSize: "13px", color: "#11112d", lineHeight: "17.28px" }}>Sichtbarkeit</span>
                  <motion.span animate={{ rotate: sichtbarkeitOpen ? 45 : 0 }} transition={{ duration: 0.18 }} style={{ fontSize: "24px", color: "#11112d", fontFamily: FONT_REG, lineHeight: 1 }}>+</motion.span>
                </button>
                  <AnimatePresence>
                    {sichtbarkeitOpen && (
                      <motion.div
                        key="sicht-content"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22 }}
                        style={{ overflow: "hidden" }}
                      >
                      <div style={{ borderLeft: "1px dashed #11112d", borderRight: "1px dashed #11112d", borderBottom: "1px dashed #11112d", padding: "16px 24px", display: "flex", flexDirection: "column", gap: "16px", backgroundColor: "rgba(255,255,255,0.1)", marginTop: "-1px" }}>
                        <div style={{ borderTop: "1.5px dashed #9a9daa" }} />

                        {/* Text sub-section */}
                        <div className="flex flex-col gap-[8px]">
                          {/* "Text" collapsible header */}
                          <button
                            onClick={() => setTextSubOpen((o) => !o)}
                            className="flex items-center gap-[6px] cursor-pointer w-full"
                            style={{ background: "none", border: "none", outline: "none", padding: 0, height: "20px" }}
                          >
                            <motion.span
                              animate={{ rotate: textSubOpen ? 90 : 0 }}
                              transition={{ duration: 0.15 }}
                              style={{ display: "inline-flex", color: "#B0B3BC" }}
                            >
                              <ChevronRight size={12} />
                            </motion.span>
                            <span style={{ fontFamily: FONT_SEMI, fontSize: "11.52px", color: "#313642", letterSpacing: "0.1152px" }}>
                              Text
                            </span>
                          </button>

                          {/* Visibility pills */}
                          <AnimatePresence>
                            {textSubOpen && (
                              <motion.div
                                key="vis-pills"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.15 }}
                                style={{ overflow: "hidden" }}
                                className="flex flex-col gap-[8px]"
                              >
                                {/* Row 1: Sichtbar | Unsichtbar */}
                                <div className="flex gap-[8px]">
                                  {(["visible", "hidden"] as const).map((mode) => {
                                    const label = mode === "visible" ? "Sichtbar" : "Unsichtbar";
                                    const active = params.visibility === mode;
                                    return (
                                      <button
                                        key={mode}
                                        onClick={() => update("visibility", mode)}
                                        className="flex-1 cursor-pointer flex items-center justify-center"
                                        style={{
                                          height: "29px",
                                          borderRadius: "100px",
                                          backgroundColor: active ? "#313642" : "transparent",
                                          border: active ? "1.5px solid transparent" : "1.5px dashed #9a9daa",
                                          outline: "none",
                                        }}
                                      >
                                        <span style={{ fontFamily: FONT_REG, fontSize: "10.88px", color: active ? "#ecedf0" : "#9a9daa", letterSpacing: "0.3264px" }}>
                                          {label}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>

                                {/* Rows 2-4: full-width pills */}
                                {([
                                  { mode: "sentence", label: "Nur aktueller Satz sichtbar" },
                                  { mode: "word",     label: "Nur aktuelles Wort sichtbar" },
                                  { mode: "char",     label: "Nur aktl. Buchstabe sichtbar" },
                                ] as const).map(({ mode, label }) => {
                                  const active = params.visibility === mode;
                                  return (
                                    <button
                                      key={mode}
                                      onClick={() => update("visibility", mode)}
                                      className="w-full cursor-pointer flex items-center justify-center"
                                      style={{
                                        height: "29px",
                                        borderRadius: "100px",
                                        backgroundColor: active ? "#313642" : "transparent",
                                        border: active ? "1.5px solid transparent" : "1.5px dashed #9a9daa",
                                        outline: "none",
                                      }}
                                    >
                                      <span style={{ fontFamily: FONT_REG, fontSize: "10.88px", color: active ? "#ecedf0" : "#9a9daa", letterSpacing: "0.3264px" }}>
                                        {label}
                                      </span>
                                    </button>
                                  );
                                })}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                      </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
              </div>

              {/* ── Korrigieren ── */}
              <div style={{ marginTop: "-1px" }}>
                <button
                  onClick={() => setKorrigierenOpen((o) => !o)}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", background: "rgba(255,255,255,0.1)", border: "1px dashed #11112d", cursor: "pointer", minHeight: "64px", boxSizing: "border-box", outline: "none" }}
                >
                  <span style={{ fontFamily: FONT_SEMI, fontSize: "13px", color: "#11112d", lineHeight: "17.28px" }}>Korrigieren</span>
                  <motion.span animate={{ rotate: korrigierenOpen ? 45 : 0 }} transition={{ duration: 0.18 }} style={{ fontSize: "24px", color: "#11112d", fontFamily: FONT_REG, lineHeight: 1 }}>+</motion.span>
                </button>
                  <AnimatePresence>
                    {korrigierenOpen && (
                      <motion.div
                        key="korrigieren-content"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22 }}
                        style={{ overflow: "hidden" }}
                      >
                      <div style={{ borderLeft: "1px dashed #11112d", borderRight: "1px dashed #11112d", borderBottom: "1px dashed #11112d", padding: "16px 24px", display: "flex", flexDirection: "column", gap: "16px", backgroundColor: "rgba(255,255,255,0.1)", marginTop: "-1px" }}>

                        {/* ── Text löschen sub-section ── */}
                        <div className="flex flex-col gap-[8px]">
                          <button
                            onClick={() => setTextLoeschenOpen((o) => !o)}
                            className="flex items-center gap-[6px] cursor-pointer w-full"
                            style={{ background: "none", border: "none", outline: "none", padding: 0, height: "20px" }}
                          >
                            <motion.span
                              animate={{ rotate: textLoeschenOpen ? 90 : 0 }}
                              transition={{ duration: 0.15 }}
                              style={{ display: "inline-flex", color: "#B0B3BC" }}
                            >
                              <ChevronRight size={12} />
                            </motion.span>
                            <span style={{ fontFamily: FONT_SEMI, fontSize: "11.52px", color: "#313642", letterSpacing: "0.1152px" }}>
                              Text löschen
                            </span>
                          </button>

                          <AnimatePresence>
                            {textLoeschenOpen && (
                              <motion.div
                                key="text-loeschen-pills"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.15 }}
                                style={{ overflow: "hidden" }}
                                className="flex flex-col gap-[8px]"
                              >
                                {/* Row: Löschbar | Kein Löschen */}
                                <div className="flex gap-[8px]">
                                  {(["deletable", "no-delete"] as const).map((mode) => {
                                    const label = mode === "deletable" ? "Löschbar" : "Kein Löschen";
                                    const active = params.deleteMode === mode;
                                    return (
                                      <button key={mode} onClick={() => update("deleteMode", mode)}
                                        className="flex-1 cursor-pointer flex items-center justify-center"
                                        style={{ height: "29px", borderRadius: "100px", backgroundColor: active ? "#313642" : "transparent", border: active ? "1.5px solid transparent" : "1.5px dashed #9a9daa", outline: "none" }}
                                      >
                                        <span style={{ fontFamily: FONT_REG, fontSize: "10.88px", color: active ? "#ecedf0" : "#9a9daa", letterSpacing: "0.3264px" }}>{label}</span>
                                      </button>
                                    );
                                  })}
                                </div>
                                {/* Full-width rows */}
                                {([
                                  { mode: "sentence", label: "Nur aktl. Satz löschbar" },
                                  { mode: "word",     label: "Nur aktl. Wort löschbar" },
                                ] as const).map(({ mode, label }) => {
                                  const active = params.deleteMode === mode;
                                  return (
                                    <button key={mode} onClick={() => update("deleteMode", mode)}
                                      className="w-full cursor-pointer flex items-center justify-center"
                                      style={{ height: "29px", borderRadius: "100px", backgroundColor: active ? "#313642" : "transparent", border: active ? "1.5px solid transparent" : "1.5px dashed #9a9daa", outline: "none" }}
                                    >
                                      <span style={{ fontFamily: FONT_REG, fontSize: "10.88px", color: active ? "#ecedf0" : "#9a9daa", letterSpacing: "0.3264px" }}>{label}</span>
                                    </button>
                                  );
                                })}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <div style={{ borderTop: "1.5px dashed #9a9daa" }} />

                        {/* ── Korrektur sichtbar sub-section ── */}
                        <div className="flex flex-col gap-[8px]">
                          <button
                            onClick={() => setKorrekturSichtbarOpen((o) => !o)}
                            className="flex items-center gap-[6px] cursor-pointer w-full"
                            style={{ background: "none", border: "none", outline: "none", padding: 0, height: "20px" }}
                          >
                            <motion.span
                              animate={{ rotate: korrekturSichtbarOpen ? 90 : 0 }}
                              transition={{ duration: 0.15 }}
                              style={{ display: "inline-flex", color: "#B0B3BC" }}
                            >
                              <ChevronRight size={12} />
                            </motion.span>
                            <span style={{ fontFamily: FONT_SEMI, fontSize: "11.52px", color: "#313642", letterSpacing: "0.1152px" }}>
                              Korrektur sichtbar
                            </span>
                          </button>

                          <AnimatePresence>
                            {korrekturSichtbarOpen && (
                              <motion.div
                                key="korrektur-pills"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.15 }}
                                style={{ overflow: "hidden" }}
                                className="flex flex-col gap-[8px]"
                              >
                                {([
                                  { mode: "hidden", label: "Nicht sichtbar" },
                                  { mode: "tippex", label: "Tipp-Ex-Schicht" },
                                ] as const).map(({ mode, label }) => {
                                  const active = params.correctionMode === mode;
                                  return (
                                    <button key={mode} onClick={() => update("correctionMode", mode)}
                                      className="w-full cursor-pointer flex items-center justify-center"
                                      style={{ height: "29px", borderRadius: "100px", backgroundColor: active ? "#313642" : "transparent", border: active ? "1.5px solid transparent" : "1.5px dashed #9a9daa", outline: "none" }}
                                    >
                                      <span style={{ fontFamily: FONT_REG, fontSize: "10.88px", color: active ? "#ecedf0" : "#9a9daa", letterSpacing: "0.3264px" }}>{label}</span>
                                    </button>
                                  );
                                })}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                      </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
              </div>

              {/* ── Beständigkeit ── */}
              <>
                <style>{`\n                  .dsw-range { -webkit-appearance:none; appearance:none; background:transparent; cursor:pointer; }\n                  .dsw-range::-webkit-slider-thumb { -webkit-appearance:none; appearance:none; width:20px; height:20px; border-radius:50%; background:#ecedf0; border:1.5px solid #9a9daa; cursor:pointer; }\n                  .dsw-range::-moz-range-thumb { width:20px; height:20px; border-radius:50%; background:#ecedf0; border:1.5px solid #9a9daa; cursor:pointer; }\n                  .dsw-range::-webkit-slider-runnable-track { height:1px; background:transparent; }\n                  .dsw-range::-moz-range-track { height:1px; background:transparent; }\n                `}</style>
              </>
              <div style={{ marginTop: "-1px" }}>
                <button
                  onClick={() => setBestaendigkeitOpen((o) => !o)}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", background: "rgba(255,255,255,0.1)", border: "1px dashed #11112d", cursor: "pointer", minHeight: "64px", boxSizing: "border-box", outline: "none" }}
                >
                  <span style={{ fontFamily: FONT_SEMI, fontSize: "13px", color: "#11112d", lineHeight: "17.28px" }}>Beständigkeit</span>
                  <motion.span animate={{ rotate: bestaendigkeitOpen ? 45 : 0 }} transition={{ duration: 0.18 }} style={{ fontSize: "24px", color: "#11112d", fontFamily: FONT_REG, lineHeight: 1 }}>+</motion.span>
                </button>
                  <AnimatePresence>
                    {bestaendigkeitOpen && (
                      <motion.div
                        key="bestaendigkeit-content"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22 }}
                        style={{ overflow: "hidden" }}
                      >
                      <div style={{ borderLeft: "1px dashed #11112d", borderRight: "1px dashed #11112d", borderBottom: "1px dashed #11112d", padding: "16px 24px", display: "flex", flexDirection: "column", gap: "16px", backgroundColor: "rgba(255,255,255,0.1)", marginTop: "-1px" }}>

                        {/* ── Text driftet ── */}
                        <div className="flex flex-col gap-[8px]">
                          <div className="flex items-center justify-between" style={{ height: "36px" }}>
                            <span style={{ fontFamily: FONT_SEMI, fontSize: "11.52px", color: "#313642", letterSpacing: "0.1152px" }}>
                              Text driftet
                            </span>
                            <PillSwitch checked={params.driftet} onChange={(v) => update("driftet", v)} />
                          </div>

                          <AnimatePresence>
                            {params.driftet && (
                              <motion.div
                                key="drift-options"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.18 }}
                                style={{ overflow: "hidden" }}
                                className="flex flex-col gap-[8px] pb-[8px]"
                              >
                                {/* Sätze + Wörter row */}
                                <div className="flex gap-[8px]">
                                  {([
                                    { k: "driftSaetze"  as const, label: "Sätze" },
                                    { k: "driftWoerter" as const, label: "Wörter" },
                                  ]).map(({ k, label }) => {
                                    const active = params[k];
                                    return (
                                      <button key={k} onClick={() => update(k, !active)}
                                        className="flex-1 h-[29px] relative rounded-[100px] cursor-pointer flex items-center justify-between px-[12px]"
                                        style={{ backgroundColor: "rgba(244,245,247,0.2)", outline: "none", border: "none" }}
                                      >
                                        <span style={{ fontFamily: FONT_REG, fontSize: "10.88px", color: active ? "#313642" : "#9a9daa", letterSpacing: "0.3264px" }}>{label}</span>
                                        {active && (
                                          <div className="shrink-0 size-[20px] rounded-[100px] flex items-center justify-center" style={{ backgroundColor: "#313642" }}>
                                            <svg width="10" height="8" viewBox="0 0 9.595 7.023" fill="none"><path d="M0.29 3.583L3.152 6.444L9.305 0.29" stroke="white" strokeWidth="0.82" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                          </div>
                                        )}
                                        <div className="absolute pointer-events-none rounded-[101px]" style={{ inset: "-1px", border: `1px dashed ${active ? "#d0d1d6" : "#9a9daa"}` }} />
                                      </button>
                                    );
                                  })}
                                </div>
                                {/* Buchstaben row */}
                                {(() => {
                                  const active = params.driftBuchstaben;
                                  return (
                                    <button onClick={() => update("driftBuchstaben", !active)}
                                      className="w-full h-[29px] relative rounded-[100px] cursor-pointer flex items-center justify-between px-[12px]"
                                      style={{ backgroundColor: "rgba(244,245,247,0.2)", outline: "none", border: "none" }}
                                    >
                                      <span style={{ fontFamily: FONT_REG, fontSize: "10.88px", color: active ? "#313642" : "#9a9daa", letterSpacing: "0.3264px" }}>Buchstaben</span>
                                      {active && (
                                        <div className="shrink-0 size-[20px] rounded-[100px] flex items-center justify-center" style={{ backgroundColor: "#313642" }}>
                                          <svg width="10" height="8" viewBox="0 0 9.595 7.023" fill="none"><path d="M0.29 3.583L3.152 6.444L9.305 0.29" stroke="white" strokeWidth="0.82" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                        </div>
                                      )}
                                      <div className="absolute pointer-events-none rounded-[101px]" style={{ inset: "-1px", border: `1px dashed ${active ? "#d0d1d6" : "#9a9daa"}` }} />
                                    </button>
                                  );
                                })()}

                                {/* Schnelligkeit des Driftens */}
                                <div className="flex flex-col gap-[8px] pt-[4px]">
                                  <span style={{ fontFamily: FONT_SEMI, fontSize: "11.52px", color: "#313642", letterSpacing: "0.1152px" }}>Wann fängt es an?</span>
                                  <div style={{ position: "relative", height: "32px", display: "flex", alignItems: "center" }}>
                                    <div style={{ position: "absolute", left: 0, right: 0, top: "50%", transform: "translateY(-50%)", height: "1px", pointerEvents: "none" }}>
                                      <div style={{ position: "absolute", left: 0, width: `${(params.driftDelay / 600) * 100}%`, height: "100%", borderBottom: "1.5px dashed #060613" }} />
                                      <div style={{ position: "absolute", left: `${(params.driftDelay / 600) * 100}%`, right: 0, height: "100%", borderBottom: "1.5px dashed #a8b3bb" }} />
                                    </div>
                                    <input type="range" min={0} max={600} step={10} value={params.driftDelay}
                                      onChange={(e) => update("driftDelay", Number(e.target.value))}
                                      className="dsw-range" style={{ width: "100%", position: "relative", zIndex: 1 }} />
                                  </div>
                                  <div className="w-full flex items-center justify-center" style={{ height: "29px", borderRadius: "100px", backgroundColor: "rgba(244,245,247,0.2)", border: "1.5px dashed #d0d1d6" }}>
                                    <span style={{ fontFamily: FONT_REG, fontSize: "10.88px", color: "#9a9daa", letterSpacing: "0.3264px" }}>{formatDelay(params.driftDelay)}</span>
                                  </div>
                                </div>
                                {/* Wie schnell driftet es? */}
                                <div className="flex flex-col gap-[8px]">
                                  <span style={{ fontFamily: FONT_SEMI, fontSize: "11.52px", color: "#313642", letterSpacing: "0.1152px" }}>Wie schnell driftet es?</span>
                                  <div style={{ position: "relative", height: "32px", display: "flex", alignItems: "center" }}>
                                    <div style={{ position: "absolute", left: 0, right: 0, top: "50%", transform: "translateY(-50%)", height: "1px", pointerEvents: "none" }}>
                                      <div style={{ position: "absolute", left: 0, width: `${((params.driftSpeed - 10) / 490) * 100}%`, height: "100%", borderBottom: "1.5px dashed #060613" }} />
                                      <div style={{ position: "absolute", left: `${((params.driftSpeed - 10) / 490) * 100}%`, right: 0, height: "100%", borderBottom: "1.5px dashed #a8b3bb" }} />
                                    </div>
                                    <input type="range" min={10} max={500} step={10} value={params.driftSpeed}
                                      onChange={(e) => update("driftSpeed", Number(e.target.value))}
                                      className="dsw-range" style={{ width: "100%", position: "relative", zIndex: 1 }} />
                                  </div>
                                  <div className="w-full flex items-center justify-center" style={{ height: "29px", borderRadius: "100px", backgroundColor: "rgba(244,245,247,0.2)", border: "1.5px dashed #d0d1d6" }}>
                                    <span style={{ fontFamily: FONT_REG, fontSize: "10.88px", color: "#9a9daa", letterSpacing: "0.3264px" }}>×{(params.driftSpeed / 100).toFixed(1)}</span>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <div style={{ borderTop: "1.5px dashed #9a9daa" }} />

                        {/* ── Text verblasst ── */}
                        <div className="flex flex-col gap-[8px]">
                          <div className="flex items-center justify-between" style={{ height: "36px" }}>
                            <span style={{ fontFamily: FONT_SEMI, fontSize: "11.52px", color: "#313642", letterSpacing: "0.1152px" }}>
                              Text verblasst
                            </span>
                            <PillSwitch checked={params.verblasst} onChange={(v) => update("verblasst", v)} />
                          </div>

                          <AnimatePresence>
                            {params.verblasst && (
                              <motion.div
                                key="verblassen-options"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.18 }}
                                style={{ overflow: "hidden" }}
                                className="flex flex-col gap-[8px] pb-[8px]"
                              >
                                {/* Wann fängt es an? */}
                                <span style={{ fontFamily: FONT_SEMI, fontSize: "11.52px", color: "#313642", letterSpacing: "0.1152px" }}>Wann fängt es an?</span>
                                <div style={{ position: "relative", height: "32px", display: "flex", alignItems: "center" }}>
                                  <div style={{ position: "absolute", left: 0, right: 0, top: "50%", transform: "translateY(-50%)", height: "1px", pointerEvents: "none" }}>
                                    <div style={{ position: "absolute", left: 0, width: `${(params.verblassenDelay / 600) * 100}%`, height: "100%", borderBottom: "1.5px dashed #060613" }} />
                                    <div style={{ position: "absolute", left: `${(params.verblassenDelay / 600) * 100}%`, right: 0, height: "100%", borderBottom: "1.5px dashed #a8b3bb" }} />
                                  </div>
                                  <input type="range" min={0} max={600} step={10} value={params.verblassenDelay}
                                    onChange={(e) => update("verblassenDelay", Number(e.target.value))}
                                    className="dsw-range" style={{ width: "100%", position: "relative", zIndex: 1 }} />
                                </div>
                                <div className="w-full flex items-center justify-center" style={{ height: "29px", borderRadius: "100px", backgroundColor: "rgba(244,245,247,0.2)", border: "1.5px dashed #d0d1d6" }}>
                                  <span style={{ fontFamily: FONT_REG, fontSize: "10.88px", color: "#9a9daa", letterSpacing: "0.3264px" }}>{formatDelay(params.verblassenDelay)}</span>
                                </div>
                                {/* Wie schnell verblasst es? */}
                                <span style={{ fontFamily: FONT_SEMI, fontSize: "11.52px", color: "#313642", letterSpacing: "0.1152px" }}>Wie schnell verblasst es?</span>
                                <div style={{ position: "relative", height: "32px", display: "flex", alignItems: "center" }}>
                                  <div style={{ position: "absolute", left: 0, right: 0, top: "50%", transform: "translateY(-50%)", height: "1px", pointerEvents: "none" }}>
                                    <div style={{ position: "absolute", left: 0, width: `${((params.verblassenSpeed - 10) / 490) * 100}%`, height: "100%", borderBottom: "1.5px dashed #060613" }} />
                                    <div style={{ position: "absolute", left: `${((params.verblassenSpeed - 10) / 490) * 100}%`, right: 0, height: "100%", borderBottom: "1.5px dashed #a8b3bb" }} />
                                  </div>
                                  <input type="range" min={10} max={500} step={10} value={params.verblassenSpeed}
                                    onChange={(e) => update("verblassenSpeed", Number(e.target.value))}
                                    className="dsw-range" style={{ width: "100%", position: "relative", zIndex: 1 }} />
                                </div>
                                <div className="w-full flex items-center justify-center" style={{ height: "29px", borderRadius: "100px", backgroundColor: "rgba(244,245,247,0.2)", border: "1.5px dashed #d0d1d6" }}>
                                  <span style={{ fontFamily: FONT_REG, fontSize: "10.88px", color: "#9a9daa", letterSpacing: "0.3264px" }}>×{(params.verblassenSpeed / 100).toFixed(1)}</span>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                      </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
              </div>

              {/* ── Space & Order ── */}
              <div style={{ marginTop: "-1px" }}>
                <button
                  onClick={() => setSpaceOrderOpen((o) => !o)}
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", background: "rgba(255,255,255,0.1)", border: "1px dashed #11112d", cursor: "pointer", minHeight: "64px", boxSizing: "border-box", outline: "none" }}
                >
                  <span style={{ fontFamily: FONT_SEMI, fontSize: "13px", color: "#11112d", lineHeight: "17.28px" }}>Space &amp; Order</span>
                  <motion.span animate={{ rotate: spaceOrderOpen ? 45 : 0 }} transition={{ duration: 0.18 }} style={{ fontSize: "24px", color: "#11112d", fontFamily: FONT_REG, lineHeight: 1 }}>+</motion.span>
                </button>
                  <AnimatePresence>
                    {spaceOrderOpen && (
                      <motion.div
                        key="space-order-content"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22 }}
                        style={{ overflow: "hidden" }}
                      >
                      <div style={{ borderLeft: "1px dashed #11112d", borderRight: "1px dashed #11112d", borderBottom: "1px dashed #11112d", padding: "16px 24px", display: "flex", flexDirection: "column", gap: "16px", backgroundColor: "rgba(255,255,255,0.1)", marginTop: "-1px" }}>

                        {/* ── Spirale ── */}
                        <div className="flex flex-col gap-[8px]">
                          <div className="flex items-center justify-between" style={{ height: "36px" }}>
                            <div className="flex items-center gap-[6px]">
                              <span style={{ fontFamily: FONT_SEMI, fontSize: "11.52px", color: "#313642", letterSpacing: "0.1152px" }}>
                                Spiraling Text
                              </span>
                              <div
                                className="flex items-center cursor-help"
                                onMouseEnter={(e) => showTooltip(e.currentTarget, "Text ordnet sich spiralförmig an.\nNeue Zeichen erscheinen außen,\nältere driften nach innen.")}
                                onMouseLeave={hideTooltip}
                              >
                                <Info size={11} style={{ color: "#B0B3BC" }} />
                              </div>
                            </div>
                            <PillSwitch
                              checked={params.spiralModus}
                              onChange={(v) => update("spiralModus", v)}
                            />
                          </div>
                          <p style={{ fontFamily: FONT_REG, fontSize: "9.6px", lineHeight: "14.4px", color: "#9a9daa", letterSpacing: "0.768px", margin: 0 }}>
                            Linearität aufheben.{"\n"}
                            <br />
                            Der Text formt sich im Raum.
                          </p>
                        </div>

                        <div style={{ borderTop: "1.5px dashed #9a9daa" }} />

                        {/* ── Text appears Random ── */}
                        <div className="flex flex-col gap-[8px]">
                          <div className="flex items-center justify-between" style={{ height: "36px" }}>
                            <div className="flex items-center gap-[6px]">
                              <span style={{ fontFamily: FONT_SEMI, fontSize: "11.52px", color: "#313642", letterSpacing: "0.1152px" }}>
                                Text appears Random
                              </span>
                              <div
                                className="flex items-center cursor-help"
                                onMouseEnter={(e) => showTooltip(e.currentTarget, "Wörter oder Sätze erscheinen\nan zufälligen Positionen\nim Raum.")}
                                onMouseLeave={hideTooltip}
                              >
                                <Info size={11} style={{ color: "#B0B3BC" }} />
                              </div>
                            </div>
                            <PillSwitch
                              checked={params.textAppearsRandom}
                              onChange={(v) => update("textAppearsRandom", v)}
                            />
                          </div>

                          <AnimatePresence>
                            {params.textAppearsRandom && (
                              <motion.div
                                key="random-mode"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.15 }}
                                style={{ overflow: "hidden" }}
                                className="flex flex-col gap-[8px]"
                              >
                                <div className="flex gap-[8px]">
                                  {(["words", "sentences"] as const).map((mode) => {
                                    const label = mode === "words" ? "Wörter" : "Sätze";
                                    const active = params.randomMode === mode;
                                    return (
                                      <button
                                        key={mode}
                                        onClick={() => update("randomMode", mode)}
                                        className="flex-1 cursor-pointer flex items-center justify-center"
                                        style={{
                                          height: "29px",
                                          borderRadius: "100px",
                                          backgroundColor: active ? "#313642" : "transparent",
                                          border: active ? "1.5px solid transparent" : "1.5px dashed #9a9daa",
                                          outline: "none",
                                        }}
                                      >
                                        <span style={{ fontFamily: FONT_REG, fontSize: "10.88px", color: active ? "#ecedf0" : "#9a9daa", letterSpacing: "0.3264px" }}>
                                          {label}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                      </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
              </div>

            </div>

            {/* Bottom: Name, Description & Writing Prompt */}
            <div
              style={{
                flexShrink: 0,
                height: "64px",
                border: "1px dashed #11112d",
                backgroundColor: "#f8f8f8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 24px",
              }}
            >
              <span style={{ fontFamily: FONT_SEMI, fontSize: "12px", color: "#11112d", textAlign: "center", letterSpacing: "0.1152px", lineHeight: "17.28px" }}>
                Name, Description &amp; Writing Prompt
              </span>
            </div>

          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Tooltip bubble (portal — never clipped by panel edge) ── */}
      {tooltip && createPortal(
        <div
          className="pointer-events-none"
          style={{
            position: "fixed",
            left: Math.min(tooltip.x - 91, window.innerWidth - 198),
            top: tooltip.y,
            transform: "translateY(calc(-100% - 8px))",
            zIndex: 9999,
            width: "182px",
            padding: "8px 10px",
            borderRadius: "8px",
            backgroundColor: "#313642",
            color: "#E8E9ED",
            fontFamily: "'IBM Plex Sans', sans-serif",
            fontSize: "10px",
            lineHeight: 1.55,
            boxShadow: "0 6px 20px rgba(49,54,66,0.22)",
            whiteSpace: "pre-line",
          }}
        >
          {tooltip.text}
          <div
            style={{
              position: "absolute",
              left: `${tooltip.x - Math.min(tooltip.x - 91, window.innerWidth - 198)}px`,
              top: "100%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderTop: "5px solid #313642",
            }}
          />
        </div>,
        document.body
      )}
    </>
  );
}