import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";

// ── Design tokens ─────────────────────────────────────────────────────────────
const LIGHT_BG     = "#fcf6ef";
const PANEL_BG     = "#f8efe5";
const DARK_BG      = "#484848";
const BORDER_COL   = "#a4a4a4";
const DARK_BORDER  = "rgba(252,246,239,0.16)";
const LIGHT_BTN_BG = "rgba(241,235,228,0.2)";
const LIGHT_TEXT   = "#555555";
const DARK_TEXT    = "#f0e8dc";
const DARK_MUTED   = "rgba(240,232,220,0.5)";
const PROMPT_COL   = "rgba(155,155,155,0.8)";
const SIDEBAR_BG   = "rgba(248,239,229,0.7)";

const FONT_SERIF = "'freight-text-pro', 'EB Garamond', Georgia, serif";
const FONT_SANS  = "'general-sans', 'Space Grotesk', sans-serif";

const NAV_ROUTES: Record<string, string> = {
  Create: "/new",
  Playground: "/parametrisches-tool",
  About: "/about-the-project",
};

const SIDEBAR_CATS = [
  { en: "Time",        de: "Zeit",         h: "104px", br: "100px" },
  { en: "Visibility",  de: "Sichtbarkeit", h: "63px",  br: "4px" },
  { en: "Correction",  de: "Korrigieren",  h: "60px",  br: "40px 4px 40px 4px" },
  { en: "Stability",   de: "Stabilität",   h: "46px",  br: "4px" },
  { en: "Position",    de: "Position",     h: "68px",  br: "4px", bottom: true as const },
  { en: "Look & Feel", de: "Look & Feel",  h: "60px",  br: "100px" },
];

const CAT_DESC: Record<string, string> = {
  "Time":        "In üblichen Schreibtools spielt Zeit keine Rolle, doch unser Denken und Sprechen sind zeitlich.",
  "Visibility":  "In üblichen Schreibtools ist der Text jederzeit sichtbar, doch was passiert, wenn wir damit spielen?",
  "Correction":  "In üblichen Schreibtools kann man den Text jederzeit editieren, löschen etc. Hier wird löschen unmöglich...oder sichtbar.",
  "Stability":   "In üblichen Schreibtools ist der Text stabil und permanent. Doch Gedanken sind flüchtig und vergehen.",
  "Position":    "In üblichen Schreibtools ist der Text linear und wird von links nach rechts geschrieben. Hier ändert sich das.",
  "Look & Feel": "Moderne Schreibtools sind glatt, sauber und statisch. Eigenschaften, die in unserem Denken unmöglich sind.",
};

const DELETE_OPTS = [
  { value: "all",      label: "Text ist löschbar" },
  { value: "none",     label: "Kein Löschen" },
  { value: "sentence", label: "Nur aktl. Satz löschbar" },
  { value: "word",     label: "Nur aktl. Wort löschbar" },
] as const;

type DeleteMode = typeof DELETE_OPTS[number]["value"];

const BTN_CLOSED = { dark: 24, rules: 65 };
const BTN_OPEN   = { dark: 371, rules: 412 };
const SPRING = { type: "spring" as const, stiffness: 300, damping: 30 };

// ── Icons ─────────────────────────────────────────────────────────────────────
function IconEyeOpen({ color }: { color: string }) {
  return (
    <svg width="18" height="13" viewBox="0 0 18 13" fill="none">
      <path d="M1 6.33C1 6.33 3.8 1 9 1C14.2 1 17 6.33 17 6.33C17 6.33 14.2 11.66 9 11.66C3.8 11.66 1 6.33 1 6.33Z" stroke={color} strokeWidth="1.1" fill="none" />
      <circle cx="9" cy="6.33" r="2.3" fill={color} />
    </svg>
  );
}

function IconEyeClosed({ color }: { color: string }) {
  return (
    <svg width="18" height="13" viewBox="0 0 18 13" fill="none">
      <path d="M1 6.33C1 6.33 3.8 1 9 1C14.2 1 17 6.33 17 6.33C17 6.33 14.2 11.66 9 11.66C3.8 11.66 1 6.33 1 6.33Z" stroke={color} strokeWidth="1.1" fill="none" />
      <circle cx="9" cy="6.33" r="2.3" fill={color} />
      <line x1="2" y1="0.5" x2="16" y2="12.5" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

function IconHalfCircle({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke={color} strokeWidth="1.1" />
      <path d="M8 1.5 A6.5 6.5 0 0 0 8 14.5 Z" fill={color} />
    </svg>
  );
}

// ── Radio circle ──────────────────────────────────────────────────────────────
function RadioCircle({ selected, dark }: { selected: boolean; dark: boolean }) {
  return (
    <div style={{
      width: "18px", height: "18px",
      border: `1.5px solid ${dark ? DARK_MUTED : BORDER_COL}`,
      borderRadius: "50%",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      {selected && (
        <div style={{
          width: "10px", height: "10px", borderRadius: "50%",
          background: dark ? DARK_TEXT : LIGHT_TEXT,
        }} />
      )}
    </div>
  );
}

// ── Toggle button ─────────────────────────────────────────────────────────────
function ToggleBtn({ on, onToggle, dark = false }: { on: boolean; onToggle: () => void; dark?: boolean }) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: "36px", height: "20px",
        background: on
          ? (dark ? "rgba(240,232,220,0.28)" : "#555555")
          : "transparent",
        border: on
          ? "none"
          : `1px dashed ${dark ? "rgba(240,232,220,0.3)" : BORDER_COL}`,
        borderRadius: "100px",
        cursor: "pointer", outline: "none",
        padding: "3px",
        display: "flex", alignItems: "center", justifyContent: "flex-start",
        boxSizing: "border-box", flexShrink: 0,
      }}
    >
      <motion.div
        animate={{ x: on ? 16 : 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 28 }}
        style={{
          width: "14px", height: "14px",
          background: on ? "transparent" : (dark ? "rgba(240,232,220,0.55)" : BORDER_COL),
          border: on ? `1.5px dashed ${dark ? "rgba(240,232,220,0.9)" : "white"}` : "none",
          borderRadius: "7px", flexShrink: 0, boxSizing: "border-box",
        }}
      />
    </button>
  );
}

// ── Double slider ─────────────────────────────────────────────────────────────
function DoubleSlider({ value, min, max, onChange, dark }: {
  value: number; min: number; max: number;
  onChange: (v: number) => void; dark: boolean;
}) {
  const pct     = ((value - min) / (max - min)) * 100;
  const filled  = dark ? DARK_TEXT : LIGHT_TEXT;
  const unfilled = dark ? "rgba(240,232,220,0.25)" : "rgba(164,164,164,0.45)";
  return (
    <div style={{ position: "relative", height: "16px", display: "flex", alignItems: "center" }}>
      <div style={{ position: "absolute", left: 0, right: 0 }}>
        <div style={{ position: "absolute", left: 0, width: `${pct}%`, height: "2px", background: filled, top: "3px", borderRadius: "1px" }} />
        <div style={{ position: "absolute", left: 0, width: `${pct}%`, height: "2px", background: filled, top: "8px", borderRadius: "1px" }} />
        <div style={{ position: "absolute", left: `${pct}%`, right: 0, height: "1px", background: unfilled, top: "6px" }} />
      </div>
      <input
        type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ position: "absolute", width: "100%", opacity: 0, cursor: "pointer", height: "100%", margin: 0, padding: 0 }}
      />
    </div>
  );
}

// ── Style helpers ─────────────────────────────────────────────────────────────
function btnStyle(dark: boolean, extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: dark ? "rgba(240,232,220,0.06)" : LIGHT_BTN_BG,
    border: `1px dashed ${BORDER_COL}`,
    borderRadius: "4px",
    cursor: "pointer",
    outline: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    color: dark ? DARK_TEXT : LIGHT_TEXT,
    fontFamily: FONT_SANS,
    fontSize: "14px",
    fontWeight: 400,
    lineHeight: "normal",
    height: "31px",
    padding: "0 12px",
    ...extra,
  };
}

function navItemStyle(dark: boolean, active: boolean): React.CSSProperties {
  return {
    background: active
      ? (dark ? "rgba(240,232,220,0.12)" : "rgba(85,85,85,0.1)")
      : (dark ? "rgba(240,232,220,0.06)" : LIGHT_BTN_BG),
    border: `1px dashed ${active ? (dark ? DARK_TEXT : LIGHT_TEXT) : BORDER_COL}`,
    borderRadius: "4px",
    cursor: "pointer",
    outline: "none",
    display: "flex",
    alignItems: "center",
    justifyContent: "flex-start",
    color: dark ? DARK_TEXT : LIGHT_TEXT,
    fontFamily: FONT_SANS,
    fontSize: "14px",
    fontWeight: 400,
    lineHeight: "normal",
    height: "31px",
    padding: "0 12px",
    whiteSpace: "nowrap",
  };
}

// ── Motion variants ───────────────────────────────────────────────────────────
const NAV_CONTAINER = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
  exit:   { transition: { staggerChildren: 0.04, staggerDirection: -1 as const } },
};
const NAV_ITEM = {
  hidden:  { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.18, ease: "easeOut" } },
  exit:    { opacity: 0, y: -10, transition: { duration: 0.1 } },
};

// ── Component ─────────────────────────────────────────────────────────────────
export default function New() {
  const navigate = useNavigate();

  const [dark, setDark]               = useState(false);
  const [visible, setVisible]         = useState(true);
  const [menuOpen, setMenuOpen]       = useState(false);
  const [menuHovered, setMenuHovered] = useState(false);
  const [rulesOpen, setRulesOpen]     = useState(false);
  const [activeCategory, setActiveCategory] = useState("Time");

  // Time
  const [timerEnabled, setTimerEnabled]     = useState(false);
  const [timerMode, setTimerMode]           = useState<"fixed" | "free">("fixed");
  const [timerMinutes, setTimerMinutes]     = useState(10);
  const [visualTimer, setVisualTimer]       = useState(false);
  const [timerUserReset, setTimerUserReset] = useState(false);
  const [cursorRunning, setCursorRunning]   = useState(false);

  // Visibility
  const [visibility, setVisibility] = useState<"visible" | "invisible" | "sentence" | "word" | "char">("visible");

  // Correction
  const [deleteMode, setDeleteMode]               = useState<DeleteMode>("all");
  const [correctionVisible, setCorrectionVisible] = useState(false);

  // Stability
  const [textFliegtEnabled, setTextFliegtEnabled]         = useState(true);
  const [fliegtUnit, setFliegtUnit]                       = useState<"Sätze" | "Wörter" | "Buchstabe">("Sätze");
  const [fliegtZeitpunkt, setFliegtZeitpunkt]             = useState(5);
  const [fliegtSchnelligkeit, setFliegtSchnelligkeit]     = useState(3);
  const [textVerblassEnabled, setTextVerblassEnabled]     = useState(false);
  const [verblassZeitpunkt, setVerblassZeitpunkt]         = useState(5);
  const [verblassSchnelligkeit, setVerblassSchnelligkeit] = useState(3);

  // Position
  const [positionMode, setPositionMode] = useState<"spiral" | "random" | "custom">("spiral");

  // Look & Feel
  const [grainLevel, setGrainLevel]     = useState(40);
  const [textSizeLevel, setTextSizeLevel] = useState(20);
  const [bgHue, setBgHue]               = useState<number | null>(null);

  // Identity panel
  const [identityOpen, setIdentityOpen]       = useState(false);
  const [toolImage, setToolImage]             = useState<string | null>(null);
  const [imageDragOver, setImageDragOver]     = useState(false);
  const [toolName, setToolName]               = useState("");
  const [prompts, setPrompts]                 = useState<string[]>([""]);
  const [toolDescription, setToolDescription] = useState("");

  const [text, setText]   = useState("");
  const [scrollY, setScrollY] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { textareaRef.current?.focus(); }, []);
  useEffect(() => {
    const fn = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const computedFontSize = 16 + Math.round(textSizeLevel / 100 * 24);
  const bg = dark
    ? DARK_BG
    : bgHue !== null
      ? `oklch(95% 0.035 ${bgHue})`
      : LIGHT_BG;

  const textColor      = dark ? DARK_TEXT : LIGHT_TEXT;
  const iconColor      = dark ? DARK_TEXT : LIGHT_TEXT;
  const sidebarBg      = dark ? "#1c1b19"               : SIDEBAR_BG;
  const catActiveBg    = dark ? "#3c3a37"               : LIGHT_BG;
  const catInactiveBg  = dark ? "#252321"               : "#f9f1e8";
  const settingsCardBg = dark ? "#2d2b28"               : LIGHT_BG;
  const descColor      = dark ? DARK_MUTED              : "#7c7c7c";
  const innerBorder    = dark ? DARK_BORDER             : BORDER_COL;

  const darkBtnBg  = rulesOpen ? (dark ? "rgba(240,232,220,0.1)" : PANEL_BG) : (dark ? "rgba(240,232,220,0.06)" : LIGHT_BTN_BG);
  const rulesBtnBg = rulesOpen ? (dark ? "rgba(240,232,220,0.1)" : PANEL_BG) : (dark ? "rgba(240,232,220,0.06)" : LIGHT_BTN_BG);

  return (
    <div
      style={{ minHeight: "100vh", background: bg, position: "relative", transition: "background 0.3s" }}
      onClick={() => textareaRef.current?.focus()}
    >
      {/* ── Floating ◑ button ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {visible && (
          <motion.button
            key="float-dark"
            initial={false}
            animate={{ x: rulesOpen ? BTN_OPEN.dark - BTN_CLOSED.dark : 0 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            transition={SPRING}
            style={{
              position: "fixed", top: "24px", left: BTN_CLOSED.dark,
              width: "31px", height: "31px",
              background: darkBtnBg,
              border: `1px dashed ${BORDER_COL}`,
              borderRadius: "4px",
              cursor: "pointer", outline: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 25, transition: "background 0.2s",
            }}
            onClick={(e) => { e.stopPropagation(); setDark(d => !d); }}
          >
            <IconHalfCircle color={iconColor} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Floating Rules/× button ──────────────────────────────────────────── */}
      <AnimatePresence>
        {visible && (
          <motion.button
            key="float-rules"
            initial={false}
            animate={{ x: rulesOpen ? BTN_OPEN.rules - BTN_CLOSED.rules : 0 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            transition={SPRING}
            style={{
              position: "fixed", top: "24px", left: BTN_CLOSED.rules,
              height: "31px", width: rulesOpen ? "31px" : "60px",
              background: rulesBtnBg,
              border: `1px dashed ${BORDER_COL}`,
              borderRadius: "4px",
              cursor: "pointer", outline: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: FONT_SANS, color: dark ? DARK_TEXT : LIGHT_TEXT,
              lineHeight: "normal", zIndex: 25, overflow: "hidden",
              transition: "background 0.2s, width 0.2s ease",
            }}
            onClick={(e) => { e.stopPropagation(); setRulesOpen(o => { if (o) setIdentityOpen(false); return !o; }); }}
          >
            <AnimatePresence mode="wait">
              {rulesOpen ? (
                <motion.span key="x" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }} style={{ fontSize: "18px", lineHeight: "1" }}>×</motion.span>
              ) : (
                <motion.span key="r" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }} style={{ fontSize: "14px" }}>Rules</motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {visible && rulesOpen && (
          <motion.div
            key="sidebar"
            initial={{ x: -153, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -153, opacity: 0, transition: { duration: 0.22, ease: "easeIn" } }}
            transition={SPRING}
            style={{
              position: "fixed", top: 0, left: 0,
              width: "153px", height: "100vh",
              background: sidebarBg,
              borderRight: `1px dashed ${BORDER_COL}`,
              borderRadius: "4px",
              padding: "24px",
              display: "flex", flexDirection: "column", justifyContent: "space-between",
              boxSizing: "border-box", zIndex: 20,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontFamily: FONT_SERIF, fontSize: "22px", color: dark ? DARK_TEXT : LIGHT_TEXT, lineHeight: "normal" }}>Rules</span>
                <span style={{ fontFamily: FONT_SANS, fontSize: "14px", color: descColor, lineHeight: "normal" }}>Change them.</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {SIDEBAR_CATS.map(cat => (
                  <button
                    key={cat.en}
                    onClick={() => { setActiveCategory(cat.en); setIdentityOpen(false); }}
                    style={{
                      width: "105px", height: cat.h,
                      borderRadius: cat.br,
                      background: !identityOpen && cat.en === activeCategory ? catActiveBg : catInactiveBg,
                      border: `1px dashed ${!identityOpen && cat.en === activeCategory ? innerBorder : innerBorder}`,
                      cursor: "pointer", outline: "none",
                      display: "flex",
                      alignItems: cat.bottom ? "flex-end" : "center",
                      justifyContent: cat.bottom ? "flex-start" : "center",
                      padding: cat.bottom ? "12px" : "6px 12px",
                      boxSizing: "border-box",
                      fontFamily: FONT_SANS, fontSize: "16px", fontWeight: 400,
                      color: dark ? DARK_TEXT : LIGHT_TEXT,
                      whiteSpace: "nowrap", lineHeight: "normal",
                      flexShrink: 0, transition: "background 0.15s",
                    }}
                  >{cat.en}</button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <button
                onClick={() => setIdentityOpen(o => !o)}
                style={{
                  width: "105px", height: "105px",
                  borderRadius: "4px",
                  background: identityOpen ? catActiveBg : "transparent",
                  border: `1px dashed ${innerBorder}`,
                  cursor: "pointer", outline: "none",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: FONT_SANS, fontSize: "16px", fontWeight: 400,
                  color: dark ? DARK_TEXT : LIGHT_TEXT,
                  letterSpacing: "-0.16px", lineHeight: "22px",
                  textAlign: "center", whiteSpace: "pre-line",
                }}>{"Name,\nDescription\n& more"}</button>
              <button style={{
                width: "105px", borderRadius: "4px", background: "transparent",
                border: `1px dashed ${innerBorder}`,
                cursor: "pointer", outline: "none",
                padding: "6px 12px",
                fontFamily: FONT_SANS, fontSize: "16px", fontWeight: 400,
                color: dark ? DARK_TEXT : LIGHT_TEXT,
                lineHeight: "22px", textAlign: "center",
              }}>Save</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Detail panel ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {visible && rulesOpen && (
          <motion.div
            key="detail"
            initial={{ x: -314, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -314, opacity: 0, transition: { duration: 0.22, ease: "easeIn" } }}
            transition={SPRING}
            style={{
              position: "fixed", top: 0, left: "153px",
              width: "314px", height: "100vh",
              background: sidebarBg,
              borderRight: `1px dashed ${BORDER_COL}`,
              borderRadius: "0 4px 4px 0",
              display: "flex", flexDirection: "column",
              boxSizing: "border-box",
              overflow: "hidden",
              zIndex: 20,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {identityOpen ? (
              /* ── Identity panel ─────────────────────────────────────────── */
              <>
                <style>{`
                  .identity-input::placeholder, .identity-textarea::placeholder {
                    color: ${dark ? "rgba(240,232,220,0.35)" : "rgba(85,85,85,0.38)"};
                    font-family: ${FONT_SANS};
                  }
                `}</style>
                <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
                  <span style={{ fontFamily: FONT_SERIF, fontSize: "22px", color: dark ? DARK_TEXT : LIGHT_TEXT, lineHeight: "normal" }}>Identity.</span>
                  <span style={{ fontFamily: FONT_SANS, fontSize: "14px", color: descColor, lineHeight: "1.45" }}>
                    Gib deinem Tool ein Bild, einen Namen, Beschreibung und Schreibanstöße.
                  </span>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => setToolImage(ev.target?.result as string);
                      reader.readAsDataURL(f);
                    }}
                  />

                  {/* Photo drop zone */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setImageDragOver(true); }}
                    onDragLeave={() => setImageDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault(); setImageDragOver(false);
                      const f = e.dataTransfer.files?.[0];
                      if (!f || !f.type.startsWith("image/")) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => setToolImage(ev.target?.result as string);
                      reader.readAsDataURL(f);
                    }}
                    style={{
                      border: `1px dashed ${imageDragOver ? (dark ? DARK_TEXT : LIGHT_TEXT) : innerBorder}`,
                      borderRadius: "8px", height: "148px",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", overflow: "hidden",
                      background: imageDragOver ? (dark ? "rgba(240,232,220,0.06)" : "rgba(85,85,85,0.04)") : "transparent",
                      transition: "border-color 0.15s, background 0.15s", flexShrink: 0,
                    }}
                  >
                    {toolImage ? (
                      <img src={toolImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: descColor, textAlign: "center", lineHeight: "1.55", whiteSpace: "pre-line" }}>
                        {"Foto hinzufügen\noder Drag'n'Drop"}
                      </span>
                    )}
                  </div>

                  {/* Name section */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <span style={{ fontFamily: FONT_SERIF, fontSize: "19px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>Name</span>
                    <span style={{ fontFamily: FONT_SANS, fontSize: "13px", color: descColor, lineHeight: "1.45" }}>
                      Beende mit dem Namen den Satz &ldquo;Write and think&hellip;&rdquo;
                    </span>
                    <div style={{ border: `1px dashed ${innerBorder}`, borderRadius: "8px", padding: "10px 14px", background: settingsCardBg }}>
                      <span style={{ fontFamily: FONT_SANS, fontSize: "15px", color: dark ? "rgba(240,232,220,0.38)" : "rgba(85,85,85,0.38)" }}>
                        Write and think&hellip;
                      </span>
                    </div>
                    <input
                      className="identity-input"
                      placeholder="Name eingeben"
                      value={toolName}
                      onChange={(e) => setToolName(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        width: "100%", boxSizing: "border-box",
                        border: `1px dashed ${innerBorder}`, borderRadius: "8px",
                        padding: "10px 14px", background: settingsCardBg,
                        fontFamily: FONT_SANS, fontSize: "15px",
                        color: dark ? DARK_TEXT : LIGHT_TEXT,
                        outline: "none", transition: "color 0.3s, background 0.3s",
                      }}
                    />
                  </div>

                  {/* Prompts section */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <span style={{ fontFamily: FONT_SERIF, fontSize: "19px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>Schreibanstoß oder Aufgabe</span>
                    <span style={{ fontFamily: FONT_SANS, fontSize: "13px", color: descColor, lineHeight: "1.45" }}>
                      Das hilft Menschen beim Schreiben. Du kannst auch mehrere anlegen.
                    </span>
                    {prompts.map((p, i) => (
                      <textarea
                        key={i}
                        className="identity-textarea"
                        placeholder="Beispiel: Schreibe etwas über dich…"
                        value={p}
                        onChange={(e) => setPrompts(ps => ps.map((x, j) => j === i ? e.target.value : x))}
                        onClick={(e) => e.stopPropagation()}
                        rows={3}
                        style={{
                          width: "100%", boxSizing: "border-box",
                          border: `1px dashed ${innerBorder}`, borderRadius: "8px",
                          padding: "10px 14px", background: settingsCardBg,
                          fontFamily: FONT_SANS, fontSize: "15px",
                          color: dark ? DARK_TEXT : LIGHT_TEXT,
                          outline: "none", resize: "none", lineHeight: "1.5",
                          transition: "color 0.3s, background 0.3s",
                        }}
                      />
                    ))}
                    <button
                      onClick={() => setPrompts(ps => [...ps, ""])}
                      style={{
                        background: "transparent", border: "none", outline: "none",
                        cursor: "pointer", padding: 0, textAlign: "left",
                        fontFamily: FONT_SANS, fontSize: "14px",
                        color: dark ? "rgba(240,232,220,0.6)" : "rgba(85,85,85,0.6)",
                      }}
                    >+ Weiteren hinzufügen</button>
                  </div>

                  {/* Description section */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <span style={{ fontFamily: FONT_SERIF, fontSize: "19px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>Beschreibung oder Regel</span>
                    <textarea
                      className="identity-textarea"
                      placeholder="Beispiel: Dieses Tool hilft anonym in öffentlichen Plätzen zu schreiben"
                      value={toolDescription}
                      onChange={(e) => setToolDescription(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      rows={4}
                      style={{
                        width: "100%", boxSizing: "border-box",
                        border: `1px dashed ${innerBorder}`, borderRadius: "8px",
                        padding: "10px 14px", background: settingsCardBg,
                        fontFamily: FONT_SANS, fontSize: "15px",
                        color: dark ? DARK_TEXT : LIGHT_TEXT,
                        outline: "none", resize: "none", lineHeight: "1.5",
                        transition: "color 0.3s, background 0.3s",
                      }}
                    />
                  </div>
                </div>
                <div style={{ padding: "16px 24px", flexShrink: 0 }}>
                  <button style={{
                    width: "100%", padding: "12px",
                    background: "transparent", border: `1px dashed ${innerBorder}`,
                    borderRadius: "8px", cursor: "pointer", outline: "none",
                    fontFamily: FONT_SANS, fontSize: "16px",
                    color: dark ? DARK_TEXT : LIGHT_TEXT,
                  }}>Save</button>
                </div>
              </>
            ) : (
              /* ── Category detail panel ──────────────────────────────────── */
              <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px", overflowY: "auto", flex: 1 }}>
                <span style={{ fontFamily: FONT_SERIF, fontSize: "22px", color: dark ? DARK_TEXT : LIGHT_TEXT, lineHeight: "normal" }}>
                  {SIDEBAR_CATS.find(c => c.en === activeCategory)?.de}
                </span>

                {CAT_DESC[activeCategory] && (
                  <span style={{ fontFamily: FONT_SANS, fontSize: "15px", color: descColor, lineHeight: "1.5" }}>
                    {CAT_DESC[activeCategory]}
                  </span>
                )}

                {/* ── Zeit ───────────────────────────────────────────────── */}
                {activeCategory === "Time" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {/* Timer toggle card */}
                    <div style={{ background: settingsCardBg, border: `1px dashed ${innerBorder}`, borderRadius: "8px", padding: "12px 24px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "36px" }}>
                        <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>Timer</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontFamily: FONT_SANS, fontSize: "11px", fontWeight: 500, color: descColor }}>
                            {timerEnabled ? "An" : "Aus"}
                          </span>
                          <ToggleBtn on={timerEnabled} onToggle={() => setTimerEnabled(t => !t)} dark={dark} />
                        </div>
                      </div>
                    </div>

                    {/* Expanded timer options */}
                    <AnimatePresence>
                      {timerEnabled && (
                        <motion.div
                          key="timer-opts"
                          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.18 }}
                          style={{ display: "flex", flexDirection: "column", gap: "8px" }}
                        >
                          {/* Fixed / Free mode */}
                          <div style={{ display: "flex", gap: "8px" }}>
                            {(["fixed", "free"] as const).map((m) => (
                              <button
                                key={m}
                                onClick={() => setTimerMode(m)}
                                style={{
                                  flex: 1, height: "36px",
                                  background: timerMode === m
                                    ? (dark ? "rgba(240,232,220,0.15)" : "rgba(85,85,85,0.08)")
                                    : settingsCardBg,
                                  border: `1px dashed ${timerMode === m ? (dark ? DARK_TEXT : LIGHT_TEXT) : innerBorder}`,
                                  borderRadius: "8px", cursor: "pointer", outline: "none",
                                  fontFamily: FONT_SANS, fontSize: "14px",
                                  color: dark ? DARK_TEXT : LIGHT_TEXT,
                                }}
                              >{m === "fixed" ? "Feste Zeit" : "Freie Wahl"}</button>
                            ))}
                          </div>

                          {/* Minutes input */}
                          <div style={{ background: settingsCardBg, border: `1px dashed ${innerBorder}`, borderRadius: "8px", padding: "12px 24px" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "36px" }}>
                              <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>Minuten</span>
                              <input
                                type="text"
                                value={timerMinutes === 0 ? "" : timerMinutes}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  if (v === "") { setTimerMinutes(0); return; }
                                  if (/^\d+$/.test(v)) setTimerMinutes(Number(v));
                                }}
                                onClick={(e) => e.stopPropagation()}
                                style={{
                                  width: "48px", height: "28px",
                                  background: "transparent",
                                  border: `1px dashed ${innerBorder}`,
                                  borderRadius: "4px", textAlign: "center",
                                  fontFamily: FONT_SANS, fontSize: "14px",
                                  color: dark ? DARK_TEXT : LIGHT_TEXT,
                                  outline: "none",
                                }}
                              />
                            </div>
                          </div>

                          {/* Visual timer toggle */}
                          <div style={{ background: settingsCardBg, border: `1px dashed ${innerBorder}`, borderRadius: "8px", padding: "12px 24px" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "36px" }}>
                              <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>Visueller Timer</span>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <span style={{ fontFamily: FONT_SANS, fontSize: "11px", fontWeight: 500, color: descColor }}>
                                  {visualTimer ? "An" : "Aus"}
                                </span>
                                <ToggleBtn on={visualTimer} onToggle={() => setVisualTimer(v => !v)} dark={dark} />
                              </div>
                            </div>
                          </div>

                          {/* User resets timer */}
                          <div
                            style={{
                              background: settingsCardBg, border: `1px dashed ${innerBorder}`,
                              borderRadius: "8px", padding: "12px 24px",
                              display: "flex", alignItems: "center", justifyContent: "space-between",
                              cursor: "pointer",
                            }}
                            onClick={e => { e.stopPropagation(); setTimerUserReset(v => !v); }}
                          >
                            <span style={{ fontFamily: FONT_SANS, fontSize: "14px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>
                              User setzt Timer jedes mal neu
                            </span>
                            <RadioCircle selected={timerUserReset} dark={dark} />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Cursor läuft weiter card */}
                    <div style={{
                      background: settingsCardBg, border: `1px dashed ${innerBorder}`,
                      borderRadius: "8px", padding: "12px 24px",
                      display: "flex", flexDirection: "column", gap: "10px",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "36px" }}>
                        <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>Cursor läuft weiter</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontFamily: FONT_SANS, fontSize: "11px", fontWeight: 500, color: descColor }}>
                            {cursorRunning ? "An" : "Aus"}
                          </span>
                          <ToggleBtn on={cursorRunning} onToggle={() => setCursorRunning(v => !v)} dark={dark} />
                        </div>
                      </div>
                      <p style={{ fontFamily: FONT_SANS, fontSize: "13px", color: descColor, lineHeight: "1.45", margin: 0 }}>
                        Der Cursor läuft automatisch weiter, egal ob man schreibt oder nicht. Damit werden Pausen sichtbar.
                      </p>
                    </div>
                  </div>
                )}

                {/* ── Sichtbarkeit ────────────────────────────────────────── */}
                {activeCategory === "Visibility" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ display: "flex", background: settingsCardBg, border: `1px dashed ${innerBorder}`, borderRadius: "8px", overflow: "hidden" }}>
                      {(["visible", "invisible"] as const).map((val, i) => (
                        <button
                          key={val}
                          onClick={() => setVisibility(val)}
                          style={{
                            flex: 1, height: "44px", background: "transparent",
                            border: "none", borderLeft: i === 1 ? `1px dashed ${innerBorder}` : "none",
                            cursor: "pointer", outline: "none",
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "0 16px", boxSizing: "border-box",
                            fontFamily: FONT_SANS, fontSize: "15px", color: dark ? DARK_TEXT : LIGHT_TEXT,
                          }}
                        >
                          {val === "visible" ? "Sichtbar" : "Unsichtbar"}
                          <RadioCircle selected={visibility === val} dark={dark} />
                        </button>
                      ))}
                    </div>
                    {([
                      { val: "sentence" as const, label: "Nur aktueller Satz sichtbar" },
                      { val: "word"     as const, label: "Nur aktuelles Wort sichtbar" },
                      { val: "char"     as const, label: "Nur aktl. Buchstabe sichtbar" },
                    ]).map(({ val, label }) => (
                      <button
                        key={val}
                        onClick={() => setVisibility(val)}
                        style={{
                          background: settingsCardBg, border: `1px dashed ${innerBorder}`,
                          borderRadius: "8px", height: "44px", padding: "0 16px",
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          cursor: "pointer", outline: "none",
                          fontFamily: FONT_SANS, fontSize: "15px", color: dark ? DARK_TEXT : LIGHT_TEXT,
                          boxSizing: "border-box",
                        }}
                      >
                        {label}
                        <RadioCircle selected={visibility === val} dark={dark} />
                      </button>
                    ))}
                  </div>
                )}

                {/* ── Korrigieren ─────────────────────────────────────────── */}
                {activeCategory === "Correction" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {/* Löschen card */}
                    <div style={{
                      background: settingsCardBg, border: `1px dashed ${innerBorder}`,
                      borderRadius: "8px", padding: "16px 24px",
                      display: "flex", flexDirection: "column", gap: "10px",
                    }}>
                      <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>Löschen</span>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {DELETE_OPTS.map(opt => (
                          <div
                            key={opt.value}
                            onClick={() => setDeleteMode(opt.value)}
                            style={{
                              display: "flex", alignItems: "center", justifyContent: "space-between",
                              border: `1px dashed ${innerBorder}`, borderRadius: "4px",
                              padding: "9px 12px", cursor: "pointer",
                              background: deleteMode === opt.value
                                ? (dark ? "rgba(240,232,220,0.08)" : "rgba(85,85,85,0.06)")
                                : "transparent",
                              transition: "background 0.12s",
                            }}
                          >
                            <span style={{ fontFamily: FONT_SANS, fontSize: "15px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>
                              {opt.label}
                            </span>
                            <RadioCircle selected={deleteMode === opt.value} dark={dark} />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Korrigieren sichtbar card */}
                    <div style={{
                      background: settingsCardBg, border: `1px dashed ${innerBorder}`,
                      borderRadius: "8px", padding: "16px 24px",
                      display: "flex", flexDirection: "column", gap: "10px",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>Korrigieren sichtbar</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontFamily: FONT_SANS, fontSize: "11px", fontWeight: 500, color: descColor }}>
                            {correctionVisible ? "An" : "Aus"}
                          </span>
                          <ToggleBtn on={correctionVisible} onToggle={() => setCorrectionVisible(v => !v)} dark={dark} />
                        </div>
                      </div>
                      <span style={{ fontFamily: FONT_SANS, fontSize: "14px", lineHeight: "1.5", color: descColor }}>
                        <span style={{ color: dark ? "#8faee0" : "#6b82b0" }}>Mit Tipp-Ex-Schicht</span>{" "}über alten Text. Das Korrigieren hinterlässt Spuren.
                      </span>
                    </div>
                  </div>
                )}

                {/* ── Stabilität ──────────────────────────────────────────── */}
                {activeCategory === "Stability" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {/* Text fliegt davon */}
                    <div style={{
                      background: settingsCardBg, border: `1px dashed ${innerBorder}`,
                      borderRadius: "8px", padding: "16px 24px",
                      display: "flex", flexDirection: "column", gap: "14px",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>Text fliegt davon</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontFamily: FONT_SANS, fontSize: "11px", fontWeight: 500, color: descColor }}>
                            {textFliegtEnabled ? "An" : "Aus"}
                          </span>
                          <ToggleBtn on={textFliegtEnabled} onToggle={() => setTextFliegtEnabled(e => !e)} dark={dark} />
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <div style={{ display: "flex", gap: "6px" }}>
                          {(["Sätze", "Wörter"] as const).map(u => (
                            <button key={u} onClick={() => setFliegtUnit(u)} style={{
                              flex: 1, height: "36px",
                              background: fliegtUnit === u ? (dark ? "rgba(240,232,220,0.12)" : "rgba(85,85,85,0.08)") : "transparent",
                              border: `1px dashed ${fliegtUnit === u ? (dark ? DARK_TEXT : LIGHT_TEXT) : innerBorder}`,
                              borderRadius: "4px", cursor: "pointer", outline: "none",
                              fontFamily: FONT_SANS, fontSize: "15px", color: dark ? DARK_TEXT : LIGHT_TEXT,
                            }}>{u}</button>
                          ))}
                        </div>
                        <button onClick={() => setFliegtUnit("Buchstabe")} style={{
                          width: "100%", height: "36px",
                          background: fliegtUnit === "Buchstabe" ? (dark ? "rgba(240,232,220,0.12)" : "rgba(85,85,85,0.08)") : "transparent",
                          border: `1px dashed ${fliegtUnit === "Buchstabe" ? (dark ? DARK_TEXT : LIGHT_TEXT) : innerBorder}`,
                          borderRadius: "4px", cursor: "pointer", outline: "none",
                          fontFamily: FONT_SANS, fontSize: "15px", color: dark ? DARK_TEXT : LIGHT_TEXT,
                          textAlign: "left", padding: "0 12px", boxSizing: "border-box",
                        }}>Buchstabe</button>
                      </div>
                      <div style={{ borderTop: `1px dashed ${innerBorder}` }} />
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <span style={{ fontFamily: FONT_SANS, fontSize: "15px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>Zeitpunkt des Fliegens</span>
                        <DoubleSlider value={fliegtZeitpunkt} min={1} max={15} onChange={setFliegtZeitpunkt} dark={dark} />
                        <div style={{ border: `1px dashed ${innerBorder}`, borderRadius: "4px", padding: "8px", textAlign: "center", fontFamily: FONT_SANS, fontSize: "15px", color: descColor }}>
                          Nach {fliegtZeitpunkt} min
                        </div>
                      </div>
                      <div style={{ borderTop: `1px dashed ${innerBorder}` }} />
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <span style={{ fontFamily: FONT_SANS, fontSize: "15px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>Schnelligkeit des Fliegens</span>
                        <DoubleSlider value={fliegtSchnelligkeit} min={1} max={10} onChange={setFliegtSchnelligkeit} dark={dark} />
                      </div>
                    </div>

                    {/* Text verblasst */}
                    <div style={{
                      background: settingsCardBg, border: `1px dashed ${innerBorder}`,
                      borderRadius: "8px", padding: "16px 24px",
                      display: "flex", flexDirection: "column", gap: "14px",
                    }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>Text verblasst</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontFamily: FONT_SANS, fontSize: "11px", fontWeight: 500, color: descColor }}>
                            {textVerblassEnabled ? "An" : "Aus"}
                          </span>
                          <ToggleBtn on={textVerblassEnabled} onToggle={() => setTextVerblassEnabled(e => !e)} dark={dark} />
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <span style={{ fontFamily: FONT_SANS, fontSize: "15px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>Zeitpunkt des Verblassens</span>
                        <DoubleSlider value={verblassZeitpunkt} min={1} max={15} onChange={setVerblassZeitpunkt} dark={dark} />
                        <div style={{ border: `1px dashed ${innerBorder}`, borderRadius: "4px", padding: "8px", textAlign: "center", fontFamily: FONT_SANS, fontSize: "15px", color: descColor }}>
                          Nach {verblassZeitpunkt} min
                        </div>
                      </div>
                      <div style={{ borderTop: `1px dashed ${innerBorder}` }} />
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <span style={{ fontFamily: FONT_SANS, fontSize: "15px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>Schnelligkeit des Verblassens</span>
                        <DoubleSlider value={verblassSchnelligkeit} min={1} max={10} onChange={setVerblassSchnelligkeit} dark={dark} />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Position ────────────────────────────────────────────── */}
                {activeCategory === "Position" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {([
                      { value: "spiral",  label: "Spiraling Text" },
                      { value: "random",  label: "Text appears random" },
                      { value: "custom",  label: "Zeichne deine eigene Linie" },
                    ] as const).map(opt => (
                      <div
                        key={opt.value}
                        onClick={() => setPositionMode(opt.value)}
                        style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          border: `1px dashed ${innerBorder}`, borderRadius: "4px",
                          padding: "12px 16px", cursor: "pointer",
                          background: positionMode === opt.value
                            ? (dark ? "rgba(240,232,220,0.08)" : "rgba(85,85,85,0.06)")
                            : settingsCardBg,
                          transition: "background 0.12s",
                        }}
                      >
                        <span style={{ fontFamily: FONT_SANS, fontSize: "15px", color: dark ? DARK_TEXT : LIGHT_TEXT, lineHeight: "1.4" }}>
                          {opt.label}
                        </span>
                        <RadioCircle selected={positionMode === opt.value} dark={dark} />
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Look & Feel ─────────────────────────────────────────── */}
                {activeCategory === "Look & Feel" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <style>{`
                      .lf-slider {
                        -webkit-appearance: none; appearance: none;
                        width: 100%; height: 2px;
                        border-radius: 2px; cursor: pointer; outline: none;
                        background: ${dark ? "rgba(240,232,220,0.22)" : "#c8bfb5"};
                      }
                      .lf-slider::-webkit-slider-thumb {
                        -webkit-appearance: none; appearance: none;
                        width: 18px; height: 18px; border-radius: 50%;
                        background: ${dark ? "rgba(240,232,220,0.85)" : "#888"};
                        cursor: grab; border: none;
                      }
                      .lf-slider::-moz-range-thumb {
                        width: 18px; height: 18px; border-radius: 50%;
                        background: ${dark ? "rgba(240,232,220,0.85)" : "#888"};
                        cursor: grab; border: none;
                      }
                      .hue-slider {
                        -webkit-appearance: none; appearance: none;
                        width: 100%; height: 100%;
                        border-radius: 4px; cursor: crosshair; outline: none;
                        background: transparent;
                      }
                      .hue-slider::-webkit-slider-thumb {
                        -webkit-appearance: none; appearance: none;
                        width: 2px; height: 44px; border-radius: 1px;
                        background: rgba(80,70,60,0.55);
                        cursor: crosshair; border: none;
                      }
                      .hue-slider::-moz-range-thumb {
                        width: 2px; height: 44px; border-radius: 1px;
                        background: rgba(80,70,60,0.55);
                        cursor: crosshair; border: none;
                      }
                    `}</style>

                    {/* Körnung & Textur */}
                    <div style={{
                      background: settingsCardBg, border: `1px dashed ${innerBorder}`,
                      borderRadius: "8px", padding: "16px 24px",
                      display: "flex", flexDirection: "column", gap: "16px",
                    }}>
                      <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>Körnung & Textur</span>
                      <input
                        type="range" min={0} max={100} value={grainLevel}
                        onChange={e => setGrainLevel(Number(e.target.value))}
                        className="lf-slider"
                      />
                    </div>

                    {/* Textgröße */}
                    <div style={{
                      background: settingsCardBg, border: `1px dashed ${innerBorder}`,
                      borderRadius: "8px", padding: "16px 24px",
                      display: "flex", flexDirection: "column", gap: "16px",
                    }}>
                      <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>Textgröße</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontFamily: FONT_SERIF, fontSize: "12px", color: dark ? DARK_TEXT : LIGHT_TEXT, flexShrink: 0 }}>A</span>
                        <input
                          type="range" min={0} max={100} value={textSizeLevel}
                          onChange={e => setTextSizeLevel(Number(e.target.value))}
                          className="lf-slider"
                          style={{ flex: 1 }}
                        />
                        <span style={{ fontFamily: FONT_SERIF, fontSize: "28px", color: dark ? DARK_TEXT : LIGHT_TEXT, flexShrink: 0, lineHeight: 1 }}>A</span>
                      </div>
                    </div>

                    {/* Hintergrundfarbe */}
                    <div style={{
                      background: settingsCardBg, border: `1px dashed ${innerBorder}`,
                      borderRadius: "8px", padding: "16px 24px",
                      display: "flex", flexDirection: "column", gap: "16px",
                    }}>
                      <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>Hintergrundfarbe anpassen</span>
                      <div style={{
                        borderRadius: "4px", border: `1px dashed ${innerBorder}`,
                        height: "44px", position: "relative", overflow: "hidden",
                        background: "linear-gradient(to right, oklch(90% 0.06 300), oklch(92% 0.05 0), oklch(93% 0.05 60), oklch(92% 0.05 120), oklch(91% 0.06 180), oklch(91% 0.06 240), oklch(90% 0.06 300))",
                      }}>
                        <input
                          type="range" min={0} max={360} value={bgHue ?? 0}
                          onChange={e => setBgHue(Number(e.target.value))}
                          onDoubleClick={() => setBgHue(null)}
                          className="hue-slider"
                          style={{ position: "absolute", inset: 0 }}
                          title="Doppelklick zum Zurücksetzen"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Right panel: Menu + Eye ─────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {visible ? (
          <motion.div
            key="right-full"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ position: "fixed", top: "24px", right: "24px", display: "flex", flexDirection: "row", alignItems: "flex-start", gap: "10px", zIndex: 20 }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: "flex-end" }}>
              <div
                style={{ position: "relative" }}
                onMouseEnter={() => { if (!menuOpen) setMenuHovered(true); }}
                onMouseLeave={() => setMenuHovered(false)}
              >
                <motion.div
                  aria-hidden
                  animate={
                    menuOpen
                      ? { y: 8, opacity: 0, transition: { y: { duration: 0.22, ease: "easeOut" }, opacity: { duration: 0.1 } } }
                      : menuHovered ? { y: 0, opacity: 1 } : { y: -6, opacity: 0 }
                  }
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  style={{
                    position: "absolute", left: "2px", top: "9px",
                    width: "calc(100% - 4px)", height: "28px",
                    background: dark ? "rgba(240,232,220,0.1)" : LIGHT_BG,
                    border: `1px dashed ${BORDER_COL}`,
                    borderRadius: "4px", rotate: -2.42, zIndex: 0, pointerEvents: "none",
                  }}
                />
                <button
                  style={{ ...btnStyle(dark, { background: dark ? "rgba(240,232,220,0.06)" : LIGHT_BG }), position: "relative", zIndex: 1 }}
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(o => !o); setMenuHovered(false); }}
                >
                  {menuOpen ? "Close" : "Menu"}
                </button>
              </div>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    key="nav"
                    variants={NAV_CONTAINER}
                    initial="hidden" animate="visible" exit="exit"
                    style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" }}
                  >
                    {(["Create", "Playground", "About"] as const).map((label, i) => (
                      <motion.button
                        key={label}
                        variants={NAV_ITEM}
                        style={navItemStyle(dark, i === 0)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpen(false);
                          if (label !== "Create") navigate(NAV_ROUTES[label]);
                        }}
                      >{label}</motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <button
              style={btnStyle(dark)}
              onClick={(e) => { e.stopPropagation(); setVisible(false); setMenuOpen(false); }}
            >
              <IconEyeClosed color={iconColor} />
            </button>
          </motion.div>
        ) : (
          <motion.button
            key="right-mini"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "fixed", top: "12px", right: "12px", zIndex: 20,
              background: dark ? "rgba(240,232,220,0.06)" : LIGHT_BTN_BG,
              border: "none", borderRadius: "4px", cursor: "pointer", outline: "none",
              padding: "4px 6px", display: "flex", alignItems: "center", justifyContent: "center",
            }}
            onClick={(e) => { e.stopPropagation(); setVisible(true); }}
          >
            <IconEyeOpen color={iconColor} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Top gradient fade ───────────────────────────────────────────────── */}
      <div
        aria-hidden
        style={{
          position: "fixed", top: 0, left: 0, right: 0, height: "120px",
          background: `linear-gradient(to bottom, ${bg} 0%, ${bg} 35%, transparent 100%)`,
          pointerEvents: "none", zIndex: 10,
          opacity: Math.min(scrollY / 50, 1),
          transition: "background 0.3s",
        }}
      />

      {/* ── Center writing zone ─────────────────────────────────────────────── */}
      <motion.div
        animate={{ x: rulesOpen ? 233.5 : 0 }}
        transition={SPRING}
        style={{ position: "absolute", top: 0, left: 0, right: 0, minHeight: "100vh", pointerEvents: "none" }}
      >
        <div
          style={{
            position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
            width: "848px", maxWidth: "100vw",
            padding: "36px 40px", minHeight: "100vh",
            display: "flex", flexDirection: "column", boxSizing: "border-box",
            pointerEvents: "auto",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <style>{`
            .new-textarea::placeholder {
              color: ${PROMPT_COL};
              font-family: ${FONT_SERIF};
              font-weight: 400;
              font-style: normal;
              white-space: nowrap;
              overflow: hidden;
            }
            ::-webkit-scrollbar { width: 4px; }
            ::-webkit-scrollbar-track { background: transparent; }
            ::-webkit-scrollbar-thumb {
              background: ${dark ? "rgba(240,232,220,0.18)" : "rgba(85,85,85,0.15)"};
              border-radius: 2px;
            }
            ::-webkit-scrollbar-thumb:hover {
              background: ${dark ? "rgba(240,232,220,0.32)" : "rgba(85,85,85,0.28)"};
            }
          `}</style>
          <textarea
            ref={textareaRef}
            className="new-textarea"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            placeholder="Explore new ways of thinking by breaking the rules of standard writing tools..."
            spellCheck={false}
            style={{
              background: "transparent", border: "none", outline: "none",
              resize: "none", overflow: "hidden",
              fontFamily: FONT_SERIF, fontSize: `${computedFontSize}px`, lineHeight: "1.5",
              color: textColor, width: "100%", minHeight: "calc(100vh - 80px)",
              padding: 0, caretColor: textColor, transition: "color 0.3s",
            }}
          />
        </div>
      </motion.div>
    </div>
  );
}
