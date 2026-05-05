import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate } from "react-router";

// ── Design tokens ─────────────────────────────────────────────────────────────
const LIGHT_BG   = "#fcf6ef";
const DARK_BG    = "#484848";
const BORDER_COL = "#a4a4a4";
const LIGHT_BTN_BG = "rgba(241,235,228,0.2)";
const LIGHT_TEXT = "#555555";
const DARK_TEXT  = "#fcf6ef";
const PROMPT_COL = "rgba(155,155,155,0.8)";

const FONT_SERIF = "'freight-text-pro', 'EB Garamond', Georgia, serif";
const FONT_SANS  = "'general-sans', 'Space Grotesk', sans-serif";

const CATEGORIES = ["Zeit", "Sichtbarkeit", "Korrigieren", "Stabilität", "Position", "Look & Feel"];

const NAV_ROUTES: Record<string, string> = {
  Create: "/new",
  Playground: "/parametrisches-tool",
  About: "/about-the-project",
};

// ── Icons ─────────────────────────────────────────────────────────────────────
function IconEyeOpen({ color }: { color: string }) {
  return (
    <svg width="18" height="13" viewBox="0 0 18 13" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 6.33C1 6.33 3.8 1 9 1C14.2 1 17 6.33 17 6.33C17 6.33 14.2 11.66 9 11.66C3.8 11.66 1 6.33 1 6.33Z" stroke={color} strokeWidth="1.1" fill="none" />
      <circle cx="9" cy="6.33" r="2.3" fill={color} />
    </svg>
  );
}

function IconEyeClosed({ color }: { color: string }) {
  return (
    <svg width="18" height="13" viewBox="0 0 18 13" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 6.33C1 6.33 3.8 1 9 1C14.2 1 17 6.33 17 6.33C17 6.33 14.2 11.66 9 11.66C3.8 11.66 1 6.33 1 6.33Z" stroke={color} strokeWidth="1.1" fill="none" />
      <circle cx="9" cy="6.33" r="2.3" fill={color} />
      <line x1="2" y1="0.5" x2="16" y2="12.5" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

function IconHalfCircle({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
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
    width: "fit-content",
    whiteSpace: "nowrap",
  };
}

function catStyle(dark: boolean, active: boolean): React.CSSProperties {
  return {
    background: active ? "#f2e9dd" : (dark ? "transparent" : LIGHT_BG),
    border: `1px dashed ${BORDER_COL}`,
    borderRadius: "4px",
    cursor: "pointer",
    outline: "none",
    padding: "6px 12px",
    fontFamily: FONT_SANS,
    fontSize: "14px",
    fontWeight: 400,
    color: dark ? DARK_TEXT : LIGHT_TEXT,
    whiteSpace: "nowrap",
    lineHeight: "normal",
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
  const [dark, setDark]         = useState(false);
  const [visible, setVisible]   = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuHovered, setMenuHovered] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Zeit");
  const [text, setText]         = useState("");
  const [scrollY, setScrollY]   = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { textareaRef.current?.focus(); }, []);

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const bg        = dark ? DARK_BG : LIGHT_BG;
  const textColor = dark ? DARK_TEXT : LIGHT_TEXT;
  const iconColor = dark ? DARK_TEXT : LIGHT_TEXT;

  return (
    <div
      style={{ minHeight: "100vh", background: bg, position: "relative", transition: "background 0.3s" }}
      onClick={() => textareaRef.current?.focus()}
    >
      {/* ── Left panel ─────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {visible ? (
          <motion.div
            key="left-full"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ position: "fixed", top: "44px", left: "44px", display: "flex", flexDirection: "column", gap: "16px", alignItems: "flex-start", zIndex: 20 }}
          >
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              {/* Menu button with peek-card hover effect */}
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
                      : menuHovered
                        ? { y: 0, opacity: 1 }
                        : { y: -6, opacity: 0 }
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

            {/* Nav items */}
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  key="nav"
                  variants={NAV_CONTAINER}
                  initial="hidden" animate="visible" exit="exit"
                  style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-start" }}
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
                    >
                      {label}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.button
            key="left-mini"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "fixed", top: "12px", left: "12px", zIndex: 20,
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

      {/* ── Right panel ────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {visible && (
          <motion.div
            key="right"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ position: "fixed", top: "44px", right: "44px", display: "flex", gap: "10px", alignItems: "center", zIndex: 20 }}
          >
            <button
              style={btnStyle(dark, { width: "31px", padding: "0 6px" })}
              onClick={(e) => { e.stopPropagation(); setDark(d => !d); }}
            >
              <IconHalfCircle color={iconColor} />
            </button>
            <button
              style={btnStyle(dark, { width: "60px" })}
              onClick={(e) => { e.stopPropagation(); setRulesOpen(true); }}
            >
              Rules
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Rules panel — slides in from left ──────────────────────────────── */}
      <AnimatePresence>
        {rulesOpen && (
          <motion.div
            key="rules"
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            style={{
              position: "fixed", top: 0, left: 0, height: "100vh",
              display: "flex", gap: "24px",
              padding: "24px 0 24px 44px",
              zIndex: 30,
              alignItems: "flex-start",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left micro-column: close + dark mode */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ delay: 0.12, duration: 0.2 }}
              style={{ display: "flex", flexDirection: "column", gap: "10px", paddingTop: "20px" }}
            >
              <button
                style={btnStyle(dark, { width: "31px", padding: "0", fontSize: "18px" })}
                onClick={() => setRulesOpen(false)}
              >
                ×
              </button>
              <button
                style={btnStyle(dark, { width: "31px", padding: "0 6px" })}
                onClick={() => setDark(d => !d)}
              >
                <IconHalfCircle color={iconColor} />
              </button>
            </motion.div>

            {/* Main content panel */}
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ delay: 0.06, type: "spring", stiffness: 300, damping: 28 }}
              style={{
                border: `1px dashed ${BORDER_COL}`,
                borderRadius: "4px",
                display: "flex", flexDirection: "column", gap: "24px",
                padding: "24px",
                width: "277px",
                height: "calc(100vh - 48px)",
                background: bg,
                overflow: "hidden",
                boxSizing: "border-box",
              }}
            >
              {/* Categories */}
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.18, duration: 0.22, ease: "easeOut" }}
                style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}
              >
                {CATEGORIES.map(cat => (
                  <button key={cat} style={catStyle(dark, cat === activeCategory)}
                    onClick={() => setActiveCategory(cat)}>
                    {cat}
                  </button>
                ))}
              </motion.div>

              {/* Divider */}
              <motion.div
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 0.5, scaleX: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.24, duration: 0.28, ease: "easeOut" }}
                style={{ height: "1px", background: BORDER_COL, transformOrigin: "left" }}
              />

              {/* Timer row */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.28, duration: 0.22, ease: "easeOut" }}
                style={{ border: `1px dashed ${BORDER_COL}`, borderRadius: "4px", padding: "12px 24px" }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "36px" }}>
                  <span style={{ fontFamily: FONT_SANS, fontSize: "14px", color: textColor }}>Timer</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontFamily: FONT_SANS, fontSize: "11px", color: BORDER_COL }}>
                      {timerEnabled ? "An" : "Aus"}
                    </span>
                    <button
                      onClick={() => setTimerEnabled(t => !t)}
                      style={{
                        width: "36px", height: "20px",
                        border: `1px dashed ${BORDER_COL}`, borderRadius: "100px",
                        background: "transparent", cursor: "pointer",
                        padding: "3px", display: "flex", alignItems: "center",
                        justifyContent: "flex-start", outline: "none",
                      }}
                    >
                      <motion.div
                        animate={{ x: timerEnabled ? 16 : 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 28 }}
                        style={{ width: "14px", height: "14px", background: BORDER_COL, borderRadius: "7px", flexShrink: 0 }}
                      />
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
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
      <div
        style={{
          position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
          width: "848px", maxWidth: "100vw",
          padding: "36px 40px", minHeight: "100vh",
          display: "flex", flexDirection: "column", boxSizing: "border-box",
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
    </div>
  );
}
