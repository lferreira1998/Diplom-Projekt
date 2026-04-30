import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { upsertTool } from "../../../utils/storage";

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
  bgNoise: number;
  toolName: string;
  toolDescription: string;
  toolPrompts: string[];
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
  bgNoise: 0,
  toolName: "Write and think...",
  toolDescription: "",
  toolPrompts: [""],
};

interface ParamPanelProps {
  params: WritingParams;
  onChange: (params: WritingParams) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const FONT_SEMI   = "'Area Inktrap', 'Space Grotesk', sans-serif";
const FONT_EXT    = "'Area Inktrap Extended', 'Area Inktrap', sans-serif";
const FONT_REG    = "'Area Inktrap', 'Space Grotesk', sans-serif";
const FONT_MONO   = "'IBM Plex Mono', 'Courier New', monospace";
const FONT_COURIER = "'Courier Prime', 'Courier New', monospace";

const sLabel: React.CSSProperties = {
  fontFamily: FONT_SEMI, fontSize: "11.52px", fontWeight: 600,
  letterSpacing: "0.1152px", lineHeight: "17.28px", color: "#313642", margin: 0,
};
const sHint: React.CSSProperties = {
  fontFamily: FONT_REG, fontSize: "9.6px", letterSpacing: "0.768px",
  lineHeight: "14.4px", color: "#7a7d89", margin: 0,
};
const fieldBase: React.CSSProperties = {
  backgroundColor: "#f8f8f8", border: "1px dashed #b4b3b3",
  fontFamily: FONT_COURIER, fontSize: "12px", color: "#11112d",
  letterSpacing: "0.3264px", outline: "none", boxSizing: "border-box",
};

function ToolInfoModal({
  toolName, toolDescription, toolPrompts, onSave, onClose,
}: {
  toolName: string; toolDescription: string; toolPrompts: string[];
  onSave: (name: string, desc: string, prompts: string[]) => void;
  onClose: () => void;
}) {
  const [name,    setName]    = useState("");
  const [desc,    setDesc]    = useState(toolDescription);
  const [prompts, setPrompts] = useState<string[]>(toolPrompts.length ? toolPrompts : [""]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const updatePrompt = (i: number, val: string) =>
    setPrompts(prev => prev.map((p, idx) => idx === i ? val : p));
  const addPrompt    = () => setPrompts(prev => [...prev, ""]);
  const removePrompt = (i: number) =>
    setPrompts(prev => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev);

  return createPortal(
    /* dark overlay — no blur, no animation */
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 45, backgroundColor: "rgba(0,0,0,0.2)" }}
    >
      {/* centered card */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          width: "458px", backgroundColor: "#F5F5F6",
          border: "1px dashed #11112d", backdropFilter: "blur(4px)",
          boxSizing: "border-box", padding: "24px",
          display: "flex", flexDirection: "column", gap: "32px",
          maxHeight: "90vh", overflowY: "auto", scrollbarWidth: "none",
        }}
      >
        {/* ── Name ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <p style={sLabel}>Name</p>
            {/* side-by-side: readonly chip + editable input */}
            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              <div style={{ ...fieldBase, height: "40px", padding: "0 8px", display: "flex", alignItems: "center", flexShrink: 0, overflow: "hidden" }}>
                <span style={{ fontFamily: FONT_COURIER, fontSize: "12px", color: "#11112d", letterSpacing: "-0.6px", whiteSpace: "nowrap" }}>
                  Write and think...
                </span>
              </div>
              <input
                type="text"
                placeholder="Name eingeben"
                value={name}
                onChange={e => setName(e.target.value)}
                style={{ ...fieldBase, flex: 1, height: "40px", padding: "0 12px" }}
              />
            </div>
          </div>
          <p style={sHint}>Beende den Satz &ldquo;Write and think...&rdquo;</p>
        </div>

        {/* ── Schreibanstoß ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <p style={sLabel}>Schreibanstoß oder Aufgabe</p>
            {prompts.map((p, i) => (
              <div key={i} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  type="text"
                  placeholder="Beispiel: Schreibe etwas über dich..."
                  value={p}
                  onChange={e => updatePrompt(i, e.target.value)}
                  style={{ ...fieldBase, flex: 1, height: "40px", padding: "0 12px" }}
                />
                {prompts.length > 1 && (
                  <button onClick={() => removePrompt(i)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: FONT_COURIER, fontSize: "16px", color: "#b4b3b3", padding: "0 2px", lineHeight: 1, flexShrink: 0 }}>×</button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={addPrompt}
            style={{ alignSelf: "flex-start", background: "none", border: "none", cursor: "pointer", fontFamily: FONT_COURIER, fontSize: "12px", color: "#11112d", letterSpacing: "0.3264px", lineHeight: "16.32px", padding: 0 }}
          >+ Weiteren hinzufügen</button>
          <p style={{ ...sHint, whiteSpace: "pre-wrap" }}>{"Das hilft Menschen beim Schreiben. Von allgemein bis sehr spezifisch. \nDu kannst auch mehrere anlegen."}</p>
        </div>

        {/* ── Beschreibung ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <p style={sLabel}>Beschreibung oder Regel</p>
          <textarea
            placeholder="Beispiel: Dieses Tool hilft anonym in öffentlichen Plätzen zu schreiben"
            value={desc}
            onChange={e => setDesc(e.target.value)}
            style={{ ...fieldBase, width: "100%", height: "114px", padding: "12px", lineHeight: "16.32px", resize: "none" }}
          />
        </div>

        {/* ── Speichern ── */}
        <button
          onClick={() => { onSave(name.trim() ? `Write and think ${name.trim()}` : toolName, desc, prompts.filter(p => p.trim())); onClose(); }}
          style={{
            width: "100%", height: "48px", flexShrink: 0,
            backgroundColor: "#F5F5F6", border: "1px dashed #11112d",
            cursor: "pointer", fontFamily: FONT_SEMI, fontSize: "12px",
            fontWeight: 600, color: "#11112d", letterSpacing: "0.1152px",
            lineHeight: "17.28px",
          }}
        >
          Speichern
        </button>
      </div>
    </div>,
    document.body
  );
}

function formatDelay(seconds: number): string {
  if (seconds === 0) return "Sofort";
  if (seconds < 60) return `Nach ${seconds}s`;
  return `Nach ${Math.round(seconds / 60)}min`;
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const catBtnStyle: React.CSSProperties = {
  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
  padding: "16px 24px", background: "#F5F5F6", border: "1px dashed #b4b3b3",
  cursor: "pointer", minHeight: "64px", boxSizing: "border-box", outline: "none",
};
const catLabelStyle: React.CSSProperties = {
  fontFamily: FONT_SEMI, fontSize: "13px", color: "#11112d", lineHeight: "17.28px",
};
const plusStyle: React.CSSProperties = {
  fontSize: "24px", color: "#11112d", fontFamily: FONT_REG, lineHeight: 1, letterSpacing: "0.1152px",
};
const expandedStyle: React.CSSProperties = {
  borderLeft: "1px dashed #b4b3b3", borderRight: "1px dashed #b4b3b3",
  borderBottom: "1px dashed #b4b3b3", padding: "16px 24px",
  display: "flex", flexDirection: "column", gap: "8px",
  backgroundColor: "#F5F5F6", marginTop: "-1px",
};
const subLabelStyle: React.CSSProperties = {
  fontFamily: FONT_SEMI, fontSize: "11.52px", color: "#11112d", letterSpacing: "0.1152px",
};

// ── Sub-components ────────────────────────────────────────────────────────────

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{ width: "36px", height: "15px", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: FONT_MONO, fontSize: "16px", color: "#11112d", letterSpacing: "0.768px", lineHeight: "14.4px", textAlign: "right" }}
    >
      {checked ? "[●]" : "[○]"}
    </button>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: "flex", height: "36px", alignItems: "center", justifyContent: "space-between" }}>
      <span style={subLabelStyle}>{label}</span>
      <ToggleSwitch checked={checked} onChange={onChange} />
    </div>
  );
}

function OptionBtn({ label, active, onClick, full }: { label: string; active: boolean; onClick: () => void; full?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{ ...(full ? { width: "100%" } : { flex: 1 }), display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 8px 8px 12px", border: `1px dashed ${active ? "#11112d" : "#b4b3b3"}`, background: "transparent", cursor: "pointer", outline: "none", overflow: "hidden" }}
    >
      <span style={{ fontFamily: FONT_REG, fontSize: "10.88px", color: "#11112d", letterSpacing: "0.3264px", lineHeight: "16.32px" }}>{label}</span>
      <span style={{ fontFamily: FONT_MONO, fontSize: "16px", color: "#11112d", letterSpacing: "0.768px", lineHeight: "14.4px" }}>{active ? "●" : "○"}</span>
    </button>
  );
}

function Sep() {
  return <div style={{ borderTop: "1px dashed #b4b3b3", margin: "4px 0" }} />;
}

function SliderRow({ value, min, max, step, onChange, displayValue }: {
  value: number; min: number; max: number; step: number; onChange: (v: number) => void; displayValue: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
      <div style={{ position: "relative", height: "32px", display: "flex", alignItems: "center" }}>
        <div style={{ position: "absolute", left: 0, right: 0, top: "50%", transform: "translateY(-50%)", height: "1px", pointerEvents: "none" }}>
          <div style={{ position: "absolute", left: 0, width: `${pct}%`, height: "100%", borderBottom: "1.5px dashed #11112d" }} />
          <div style={{ position: "absolute", left: `${pct}%`, right: 0, height: "100%", borderBottom: "1.5px dashed #b4b3b3" }} />
        </div>
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="dsw-range" style={{ width: "100%", position: "relative", zIndex: 1 }} />
      </div>
      <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", height: "29px", border: "1px dashed #b4b3b3" }}>
        <span style={{ fontFamily: FONT_REG, fontSize: "10.88px", color: "#9a9daa", letterSpacing: "0.3264px" }}>{displayValue}</span>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ParamPanel({ params, onChange, isOpen, onToggle }: ParamPanelProps) {
  const [zeitCardOpen,       setZeitCardOpen]       = useState(false);
  const [sichtbarkeitOpen,   setSichtbarkeitOpen]   = useState(false);
  const [korrigierenOpen,    setKorrigierenOpen]    = useState(false);
  const [bestaendigkeitOpen, setBestaendigkeitOpen] = useState(false);
  const [spaceOrderOpen,     setSpaceOrderOpen]     = useState(false);
  const [lookFeelOpen,       setLookFeelOpen]       = useState(false);
  const [showToolInfoModal,  setShowToolInfoModal]  = useState(false);
  const [saving,             setSaving]             = useState(false);
  const [savedToolId,        setSavedToolId]        = useState<string | null>(null);
  const [linkCopied,         setLinkCopied]         = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);

  const update = <K extends keyof WritingParams>(key: K, value: WritingParams[K]) => {
    onChange({ ...params, [key]: value });
  };

  const expandMotion = {
    initial: { height: 0, opacity: 0 },
    animate: { height: "auto", opacity: 1 },
    exit:    { height: 0, opacity: 0 },
    transition: { duration: 0.22 },
    style: { overflow: "hidden" },
  };

  return (
    <>
      <style>{`
        .dsw-range { -webkit-appearance:none; appearance:none; background:transparent; cursor:pointer; }
        .dsw-range::-webkit-slider-thumb { -webkit-appearance:none; width:14px; height:14px; border-radius:50%; background:#F5F5F6; border:1px dashed #11112d; cursor:pointer; }
        .dsw-range::-moz-range-thumb { width:14px; height:14px; border-radius:50%; background:#F5F5F6; border:1px dashed #11112d; cursor:pointer; }
        .dsw-range::-webkit-slider-runnable-track { height:1px; background:transparent; }
        .dsw-range::-moz-range-track { height:1px; background:transparent; }
      `}</style>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={panelRef}
            initial={{ x: 343 }}
            animate={{ x: 0 }}
            exit={{ x: 343 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            style={{
              position: "fixed", top: "80px", right: 0,
              height: "calc(100% - 80px)", width: "343px",
              zIndex: 40, display: "flex", flexDirection: "column",
              backgroundColor: "#F5F5F6", padding: "0 48px 24px 24px",
              boxSizing: "border-box",
            }}
          >
            {/* Scrollable list */}
            <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none", display: "flex", flexDirection: "column" }}>

              {/* ── ZEIT ── */}
              <div>
                <button onClick={() => setZeitCardOpen(o => !o)} style={catBtnStyle}>
                  <span style={catLabelStyle}>Zeit</span>
                  <span style={plusStyle}>{zeitCardOpen ? "−" : "+"}</span>
                </button>
                <AnimatePresence>
                  {zeitCardOpen && (
                    <motion.div key="zeit" {...expandMotion}>
                      <div style={expandedStyle}>
                        <ToggleRow label="Timer" checked={params.timerOn} onChange={(v) => update("timerOn", v)} />
                        <AnimatePresence>
                          {params.timerOn && (
                            <motion.div key="timer-opts" {...expandMotion}>
                              <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingTop: "4px" }}>
                                <div style={{ display: "flex", gap: "8px" }}>
                                  <OptionBtn label="Feste Zeit"  active={params.timerMode === "fixed"} onClick={() => update("timerMode", "fixed")} />
                                  <OptionBtn label="Freie Wahl"  active={params.timerMode === "free"}  onClick={() => update("timerMode", "free")}  />
                                </div>
                                <div style={{ position: "relative", border: "1px dashed #b4b3b3", display: "flex", alignItems: "center", justifyContent: "flex-end", padding: "8px 12px", overflow: "hidden" }}>
                                  <input
                                    type="text" inputMode="numeric" pattern="[0-9]*"
                                    value={params.timerMinutes === 0 ? "" : params.timerMinutes}
                                    onChange={(e) => { const v = e.target.value; if (v === "") { update("timerMinutes", 0); return; } if (/^\d+$/.test(v)) update("timerMinutes", Number(v)); }}
                                    style={{ position: "absolute", inset: 0, textAlign: "center", background: "transparent", border: "none", outline: "none", fontFamily: FONT_REG, fontSize: "11.52px", color: "#11112d", letterSpacing: "0.576px" }}
                                  />
                                  <span style={{ fontFamily: FONT_REG, fontSize: "10.88px", color: "#11112d", letterSpacing: "0.3264px", lineHeight: "16.32px" }}>min</span>
                                </div>
                                <ToggleRow label="Visueller Timer" checked={params.visualTimer} onChange={(v) => update("visualTimer", v)} />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <Sep />
                        <ToggleRow label="Cursor läuft weiter" checked={params.cursorLaeuftWeiter} onChange={(v) => update("cursorLaeuftWeiter", v)} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── SICHTBARKEIT ── */}
              <div style={{ marginTop: "-1px" }}>
                <button onClick={() => setSichtbarkeitOpen(o => !o)} style={catBtnStyle}>
                  <span style={catLabelStyle}>Sichtbarkeit</span>
                  <span style={plusStyle}>{sichtbarkeitOpen ? "−" : "+"}</span>
                </button>
                <AnimatePresence>
                  {sichtbarkeitOpen && (
                    <motion.div key="sicht" {...expandMotion}>
                      <div style={expandedStyle}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <OptionBtn label="Sichtbar"   active={params.visibility === "visible"} onClick={() => update("visibility", "visible")} />
                          <OptionBtn label="Unsichtbar" active={params.visibility === "hidden"}  onClick={() => update("visibility", "hidden")}  />
                        </div>
                        <OptionBtn label="Nur aktueller Satz sichtbar"    active={params.visibility === "sentence"} onClick={() => update("visibility", "sentence")} full />
                        <OptionBtn label="Nur aktuelles Wort sichtbar"    active={params.visibility === "word"}     onClick={() => update("visibility", "word")}     full />
                        <OptionBtn label="Nur aktl. Buchstabe sichtbar"   active={params.visibility === "char"}     onClick={() => update("visibility", "char")}     full />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── KORRIGIEREN ── */}
              <div style={{ marginTop: "-1px" }}>
                <button onClick={() => setKorrigierenOpen(o => !o)} style={catBtnStyle}>
                  <span style={catLabelStyle}>Korrigieren</span>
                  <span style={plusStyle}>{korrigierenOpen ? "−" : "+"}</span>
                </button>
                <AnimatePresence>
                  {korrigierenOpen && (
                    <motion.div key="korr" {...expandMotion}>
                      <div style={expandedStyle}>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <OptionBtn label="Löschbar"     active={params.deleteMode === "deletable"} onClick={() => update("deleteMode", "deletable")} />
                          <OptionBtn label="Kein Löschen" active={params.deleteMode === "no-delete"} onClick={() => update("deleteMode", "no-delete")} />
                        </div>
                        <OptionBtn label="Nur aktl. Satz löschbar" active={params.deleteMode === "sentence"} onClick={() => update("deleteMode", "sentence")} full />
                        <OptionBtn label="Nur aktl. Wort löschbar" active={params.deleteMode === "word"}     onClick={() => update("deleteMode", "word")}     full />
                        <Sep />
                        <OptionBtn label="Nicht sichtbar"   active={params.correctionMode === "hidden"}  onClick={() => update("correctionMode", "hidden")}  full />
                        <OptionBtn label="Tipp-Ex-Schicht"  active={params.correctionMode === "tippex"}  onClick={() => update("correctionMode", "tippex")}  full />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── BESTÄNDIGKEIT ── */}
              <div style={{ marginTop: "-1px" }}>
                <button onClick={() => setBestaendigkeitOpen(o => !o)} style={catBtnStyle}>
                  <span style={catLabelStyle}>Beständigkeit</span>
                  <span style={plusStyle}>{bestaendigkeitOpen ? "−" : "+"}</span>
                </button>
                <AnimatePresence>
                  {bestaendigkeitOpen && (
                    <motion.div key="best" {...expandMotion}>
                      <div style={expandedStyle}>
                        <ToggleRow label="Text driftet" checked={params.driftet} onChange={(v) => update("driftet", v)} />
                        <AnimatePresence>
                          {params.driftet && (
                            <motion.div key="drift" {...expandMotion}>
                              <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingTop: "4px" }}>
                                <div style={{ display: "flex", gap: "8px" }}>
                                  <OptionBtn label="Sätze"  active={params.driftSaetze}   onClick={() => update("driftSaetze",   !params.driftSaetze)}   />
                                  <OptionBtn label="Wörter" active={params.driftWoerter}  onClick={() => update("driftWoerter",  !params.driftWoerter)}  />
                                </div>
                                <OptionBtn label="Buchstaben" active={params.driftBuchstaben} onClick={() => update("driftBuchstaben", !params.driftBuchstaben)} full />
                                <span style={subLabelStyle}>Wann fängt es an?</span>
                                <SliderRow value={params.driftDelay} min={0} max={600} step={10} onChange={(v) => update("driftDelay", v)} displayValue={formatDelay(params.driftDelay)} />
                                <span style={subLabelStyle}>Wie schnell driftet es?</span>
                                <SliderRow value={params.driftSpeed} min={10} max={500} step={10} onChange={(v) => update("driftSpeed", v)} displayValue={`×${(params.driftSpeed / 100).toFixed(1)}`} />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                        <Sep />
                        <ToggleRow label="Text verblasst" checked={params.verblasst} onChange={(v) => update("verblasst", v)} />
                        <AnimatePresence>
                          {params.verblasst && (
                            <motion.div key="verbl" {...expandMotion}>
                              <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingTop: "4px" }}>
                                <span style={subLabelStyle}>Wann fängt es an?</span>
                                <SliderRow value={params.verblassenDelay} min={0} max={600} step={10} onChange={(v) => update("verblassenDelay", v)} displayValue={formatDelay(params.verblassenDelay)} />
                                <span style={subLabelStyle}>Wie schnell verblasst es?</span>
                                <SliderRow value={params.verblassenSpeed} min={10} max={500} step={10} onChange={(v) => update("verblassenSpeed", v)} displayValue={`×${(params.verblassenSpeed / 100).toFixed(1)}`} />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── SPACE & ORDER ── */}
              <div style={{ marginTop: "-1px" }}>
                <button onClick={() => setSpaceOrderOpen(o => !o)} style={catBtnStyle}>
                  <span style={catLabelStyle}>Space &amp; Order</span>
                  <span style={plusStyle}>{spaceOrderOpen ? "−" : "+"}</span>
                </button>
                <AnimatePresence>
                  {spaceOrderOpen && (
                    <motion.div key="space" {...expandMotion}>
                      <div style={expandedStyle}>
                        <ToggleRow label="Spiraling Text"      checked={params.spiralModus}      onChange={(v) => update("spiralModus", v)}      />
                        <Sep />
                        <ToggleRow label="Text appears Random" checked={params.textAppearsRandom} onChange={(v) => update("textAppearsRandom", v)} />
                        <AnimatePresence>
                          {params.textAppearsRandom && (
                            <motion.div key="rand" {...expandMotion}>
                              <div style={{ display: "flex", gap: "8px", paddingTop: "4px" }}>
                                <OptionBtn label="Wörter" active={params.randomMode === "words"}     onClick={() => update("randomMode", "words")}     />
                                <OptionBtn label="Sätze"  active={params.randomMode === "sentences"} onClick={() => update("randomMode", "sentences")} />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ── LOOK & FEEL ── */}
              <div style={{ marginTop: "-1px" }}>
                <button onClick={() => setLookFeelOpen(o => !o)} style={catBtnStyle}>
                  <span style={catLabelStyle}>Look &amp; Feel</span>
                  <span style={plusStyle}>{lookFeelOpen ? "−" : "+"}</span>
                </button>
                <AnimatePresence>
                  {lookFeelOpen && (
                    <motion.div key="lookfeel" {...expandMotion}>
                      <div style={expandedStyle}>
                        <span style={subLabelStyle}>Textured Background</span>
                        <SliderRow
                          value={params.bgNoise}
                          min={0} max={100} step={1}
                          onChange={(v) => update("bgNoise", v)}
                          displayValue={params.bgNoise === 0 ? "Kein Rauschen" : `${params.bgNoise}%`}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>

            {/* Bottom bar */}
            <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", marginTop: "16px" }}>
              {savedToolId ? (
                <>
                  <div style={{ height: "64px", border: "1px dashed #b4b3b3", backgroundColor: "#11112d", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px" }}>
                    <span style={{ fontFamily: FONT_SEMI, fontSize: "12px", color: "#F5F5F6", letterSpacing: "0.1152px", lineHeight: "17.28px" }}>
                      Tool wurde gespeichert ✓
                    </span>
                  </div>
                  <div style={{ display: "flex", border: "1px dashed #b4b3b3", borderTop: "none" }}>
                    <button
                      onClick={() => { window.location.href = `${window.location.origin}/Diplom-Projekt/parametrisches-tool?tool=${savedToolId}`; }}
                      style={{ flex: 1, height: "48px", border: "none", borderRight: "1px dashed #b4b3b3", backgroundColor: "#F5F5F6", cursor: "pointer", fontFamily: FONT_SEMI, fontSize: "11px", color: "#11112d", letterSpacing: "0.1152px", outline: "none" }}
                    >
                      Tool benutzen
                    </button>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/Diplom-Projekt/parametrisches-tool?tool=${savedToolId}`)
                          .then(() => { setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000); });
                      }}
                      style={{ flex: 1, height: "48px", border: "none", backgroundColor: "#F5F5F6", cursor: "pointer", fontFamily: FONT_SEMI, fontSize: "11px", color: "#11112d", letterSpacing: "0.1152px", outline: "none" }}
                    >
                      {linkCopied ? "Kopiert ✓" : "Link kopieren"}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div
                    onClick={() => setShowToolInfoModal(true)}
                    style={{ height: "64px", border: "1px dashed #b4b3b3", backgroundColor: "#F5F5F6", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px", cursor: "pointer" }}
                  >
                    <span style={{ fontFamily: FONT_SEMI, fontSize: "12px", color: "#11112d", textAlign: "center", letterSpacing: "0.1152px", lineHeight: "17.28px" }}>
                      {params.toolName && params.toolName !== "Write and think..." ? `"${params.toolName}"` : "Name, Description & Writing Prompt"}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      if (!params.toolName || params.toolName === "Write and think...") {
                        setShowToolInfoModal(true);
                        return;
                      }
                      setSaving(true);
                      upsertTool(params.toolName, params.toolDescription, params)
                        .then((id) => { setSaving(false); setSavedToolId(id); })
                        .catch(() => setSaving(false));
                    }}
                    style={{ height: "64px", border: "1px dashed #b4b3b3", borderTop: "none", backgroundColor: "#F5F5F6", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px", cursor: "pointer", outline: "none" }}
                  >
                    <span style={{ fontFamily: FONT_SEMI, fontSize: "12px", color: "#11112d", letterSpacing: "0.1152px", lineHeight: "17.28px" }}>
                      {saving ? "Speichern..." : "Tool speichern"}
                    </span>
                  </button>
                </>
              )}
            </div>

            {showToolInfoModal && (
              <ToolInfoModal
                toolName={params.toolName}
                toolDescription={params.toolDescription}
                toolPrompts={params.toolPrompts}
                onSave={(name, desc, prompts) => {
                  const updated = { ...params, toolName: name, toolDescription: desc, toolPrompts: prompts.length ? prompts : [""] };
                  onChange(updated);
                  upsertTool(name, desc, updated).catch(console.error);
                }}
                onClose={() => setShowToolInfoModal(false)}
              />
            )}

          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
