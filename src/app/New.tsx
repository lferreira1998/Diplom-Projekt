import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";

// ── Design tokens ─────────────────────────────────────────────────────────────
const LIGHT_BG     = "#fcf6ef";
const PANEL_BG     = "#f8efe5";
const DARK_BG      = "#484848";
const BORDER_COL   = "#a4a4a4";
const LIGHT_BTN_BG = "rgba(241,235,228,0.2)";
const LIGHT_TEXT   = "#555555";
const DARK_TEXT    = "#fcf6ef";
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
  "Time":        "In Schreibtools spielt Zeit keine Rolle, doch Denken und Sprechen sind zeitlich.",
  "Visibility":  "",
  "Correction":  "",
  "Stability":   "",
  "Position":    "",
  "Look & Feel": "",
};

// Closed-state positions for the floating buttons
const BTN_CLOSED = { dark: 24, rules: 65 };        // left px
// Open-state positions (inside detail panel header right corner)
// Panel: left 153, width 314, padding 24 → content right edge = 153+314-24 = 443
// × at left 412 (443-31), ◑ at left 371 (412-10-31)
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

// ── Style helpers ─────────────────────────────────────────────────────────────
function btnStyle(dark: boolean, extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: dark ? "transparent" : LIGHT_BTN_BG,
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
      ? (dark ? "rgba(252,246,239,0.12)" : "rgba(85,85,85,0.1)")
      : (dark ? "transparent" : LIGHT_BTN_BG),
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
    width: "100%",
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
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Time");
  const [text, setText]   = useState("");
  const [scrollY, setScrollY] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { textareaRef.current?.focus(); }, []);
  useEffect(() => {
    const fn = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const bg             = dark ? DARK_BG : LIGHT_BG;
  const textColor      = dark ? DARK_TEXT : LIGHT_TEXT;
  const iconColor      = dark ? DARK_TEXT : LIGHT_TEXT;
  const sidebarBg      = dark ? "rgba(30,29,28,0.97)"  : SIDEBAR_BG;
  const catActiveBg    = dark ? "#484848"               : LIGHT_BG;
  const catInactiveBg  = dark ? "#2a2928"               : "#f9f1e8";
  const settingsCardBg = dark ? "#2a2928"               : LIGHT_BG;

  // Background for the floating buttons depending on state
  const darkBtnBg  = rulesOpen ? (dark ? "rgba(248,239,229,0.15)" : PANEL_BG) : (dark ? "transparent" : LIGHT_BTN_BG);
  const rulesBtnBg = rulesOpen ? (dark ? "rgba(248,239,229,0.15)" : PANEL_BG) : (dark ? "transparent" : LIGHT_BTN_BG);

  return (
    <div
      style={{ minHeight: "100vh", background: bg, position: "relative", transition: "background 0.3s" }}
      onClick={() => textareaRef.current?.focus()}
    >
      {/* ── Floating ◑ button — flies between trigger pos and panel header ──── */}
      <AnimatePresence>
        {visible && (
          <motion.button
            key="float-dark"
            initial={false}
            animate={{ x: rulesOpen ? BTN_OPEN.dark - BTN_CLOSED.dark : 0 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            transition={SPRING}
            style={{
              position: "fixed",
              top: "24px",
              left: BTN_CLOSED.dark,
              width: "31px", height: "31px",
              background: darkBtnBg,
              border: `1px dashed ${BORDER_COL}`,
              borderRadius: "4px",
              cursor: "pointer", outline: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 25,
              transition: "background 0.2s",
            }}
            onClick={(e) => { e.stopPropagation(); setDark(d => !d); }}
          >
            <IconHalfCircle color={iconColor} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Floating Rules/× button — flies and morphs ───────────────────────── */}
      <AnimatePresence>
        {visible && (
          <motion.button
            key="float-rules"
            initial={false}
            animate={{ x: rulesOpen ? BTN_OPEN.rules - BTN_CLOSED.rules : 0, width: rulesOpen ? "31px" : "60px" }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            transition={SPRING}
            style={{
              position: "fixed",
              top: "24px",
              left: BTN_CLOSED.rules,
              height: "31px",
              background: rulesBtnBg,
              border: `1px dashed ${BORDER_COL}`,
              borderRadius: "4px",
              cursor: "pointer", outline: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: FONT_SANS,
              color: dark ? DARK_TEXT : LIGHT_TEXT,
              lineHeight: "normal",
              zIndex: 25,
              overflow: "hidden",
              transition: "background 0.2s",
            }}
            onClick={(e) => { e.stopPropagation(); setRulesOpen(o => !o); }}
          >
            <AnimatePresence mode="wait">
              {rulesOpen ? (
                <motion.span
                  key="x"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  style={{ fontSize: "18px", lineHeight: "1" }}
                >×</motion.span>
              ) : (
                <motion.span
                  key="r"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.1 }}
                  style={{ fontSize: "14px" }}
                >Rules</motion.span>
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
            initial={{ x: -153 }}
            animate={{ x: 0 }}
            exit={{ x: -153 }}
            transition={SPRING}
            style={{
              position: "fixed", top: 0, left: 0,
              width: "153px", height: "100vh",
              background: sidebarBg,
              borderRight: `1px dashed ${BORDER_COL}`,
              borderRadius: "4px",
              padding: "24px",
              display: "flex", flexDirection: "column", justifyContent: "space-between",
              boxSizing: "border-box",
              zIndex: 20,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontFamily: FONT_SERIF, fontSize: "22px", color: dark ? DARK_TEXT : LIGHT_TEXT, lineHeight: "normal" }}>
                  Rules
                </span>
                <span style={{ fontFamily: FONT_SANS, fontSize: "14px", color: "#7c7c7c", lineHeight: "normal" }}>
                  Change them.
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {SIDEBAR_CATS.map(cat => (
                  <button
                    key={cat.en}
                    onClick={() => setActiveCategory(cat.en)}
                    style={{
                      width: "105px", height: cat.h,
                      borderRadius: cat.br,
                      background: cat.en === activeCategory ? catActiveBg : catInactiveBg,
                      border: `1px dashed ${BORDER_COL}`,
                      cursor: "pointer", outline: "none",
                      display: "flex",
                      alignItems: cat.bottom ? "flex-end" : "center",
                      justifyContent: cat.bottom ? "flex-start" : "center",
                      padding: cat.bottom ? "12px" : "6px 12px",
                      boxSizing: "border-box",
                      fontFamily: FONT_SANS, fontSize: "16px", fontWeight: 400,
                      color: dark ? DARK_TEXT : LIGHT_TEXT,
                      whiteSpace: "nowrap", lineHeight: "normal",
                      flexShrink: 0,
                    }}
                  >{cat.en}</button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <button style={{
                width: "105px", height: "105px",
                borderRadius: "4px", background: "transparent",
                border: `1px dashed ${BORDER_COL}`,
                cursor: "pointer", outline: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: FONT_SANS, fontSize: "16px", fontWeight: 400, color: dark ? DARK_TEXT : LIGHT_TEXT,
                letterSpacing: "-0.16px", lineHeight: "22px",
                textAlign: "center", whiteSpace: "pre-line",
              }}>{"Name,\nDescription\n& more"}</button>
              <button style={{
                width: "105px", borderRadius: "4px", background: "transparent",
                border: `1px dashed ${BORDER_COL}`,
                cursor: "pointer", outline: "none",
                padding: "6px 12px",
                fontFamily: FONT_SANS, fontSize: "16px", fontWeight: 400, color: dark ? DARK_TEXT : LIGHT_TEXT,
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
            initial={{ x: -314 }}
            animate={{ x: 0 }}
            exit={{ x: -314 }}
            transition={SPRING}
            style={{
              position: "fixed", top: 0, left: "153px",
              width: "314px", height: "100vh",
              background: sidebarBg,
              borderRight: `1px dashed ${BORDER_COL}`,
              borderRadius: "0 4px 4px 0",
              padding: "24px",
              display: "flex", flexDirection: "column", gap: "30px",
              boxSizing: "border-box",
              overflow: "hidden",
              zIndex: 20,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Title row — buttons are floating elements positioned above */}
              <div style={{ display: "flex", alignItems: "flex-start" }}>
                <span style={{ fontFamily: FONT_SERIF, fontSize: "22px", color: dark ? DARK_TEXT : LIGHT_TEXT, lineHeight: "normal" }}>
                  {SIDEBAR_CATS.find(c => c.en === activeCategory)?.de}
                </span>
              </div>

              {/* Description */}
              <span style={{ fontFamily: FONT_SANS, fontSize: "15px", color: "#7c7c7c", lineHeight: "normal" }}>
                {CAT_DESC[activeCategory]}
              </span>

              {/* Settings card */}
              <div style={{
                background: settingsCardBg,
                border: `1px dashed ${BORDER_COL}`,
                borderRadius: "8px",
                padding: "12px 24px",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "36px" }}>
                  <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>Timer</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontFamily: FONT_SANS, fontSize: "11px", fontWeight: 500, color: dark ? DARK_TEXT : LIGHT_TEXT }}>
                      {timerEnabled ? "An" : "Aus"}
                    </span>
                    <button
                      onClick={() => setTimerEnabled(t => !t)}
                      style={{
                        width: "36px", height: "20px",
                        background: timerEnabled ? "#555555" : "transparent",
                        border: timerEnabled ? "none" : `1px dashed ${BORDER_COL}`,
                        borderRadius: "100px",
                        cursor: "pointer", outline: "none",
                        padding: "3px",
                        display: "flex", alignItems: "center", justifyContent: "flex-start",
                        boxSizing: "border-box",
                      }}
                    >
                      <motion.div
                        animate={{ x: timerEnabled ? 16 : 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 28 }}
                        style={{
                          width: "14px", height: "14px",
                          background: timerEnabled ? "transparent" : BORDER_COL,
                          border: timerEnabled ? "1.5px dashed white" : "none",
                          borderRadius: "7px", flexShrink: 0, boxSizing: "border-box",
                        }}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
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
            style={{ position: "fixed", top: "24px", right: "24px", display: "flex", flexDirection: "column", gap: "16px", alignItems: "flex-end", zIndex: 20 }}
          >
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
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
                    background: dark ? "rgba(252,246,239,0.15)" : LIGHT_BG,
                    border: `1px dashed ${BORDER_COL}`,
                    borderRadius: "4px", rotate: -2.42, zIndex: 0, pointerEvents: "none",
                  }}
                />
                <button
                  style={{ ...btnStyle(dark, { background: dark ? "transparent" : LIGHT_BG }), position: "relative", zIndex: 1 }}
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(o => !o); setMenuHovered(false); }}
                >
                  {menuOpen ? "Close" : "Menu"}
                </button>
              </div>
              <button
                style={btnStyle(dark)}
                onClick={(e) => { e.stopPropagation(); setVisible(false); setMenuOpen(false); }}
              >
                <IconEyeClosed color={iconColor} />
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
          </motion.div>
        ) : (
          <motion.button
            key="right-mini"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "fixed", top: "12px", right: "12px", zIndex: 20,
              background: dark ? "transparent" : LIGHT_BTN_BG,
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
        style={{
          position: "absolute", top: 0, left: 0, right: 0, minHeight: "100vh",
          pointerEvents: "none",
        }}
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
            background: ${dark ? "rgba(252,246,239,0.18)" : "rgba(85,85,85,0.15)"};
            border-radius: 2px;
          }
          ::-webkit-scrollbar-thumb:hover {
            background: ${dark ? "rgba(252,246,239,0.32)" : "rgba(85,85,85,0.28)"};
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
            fontFamily: FONT_SERIF, fontSize: "24px", lineHeight: "1.5",
            color: textColor, width: "100%", minHeight: "calc(100vh - 80px)",
            padding: 0, caretColor: textColor, transition: "color 0.3s",
          }}
        />
      </div>
      </motion.div>
    </div>
  );
}
