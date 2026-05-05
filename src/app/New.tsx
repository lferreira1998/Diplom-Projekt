import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

// ── Design tokens (exact from Figma) ─────────────────────────────────────────
const LIGHT_BG   = "#fcf6ef";
const DARK_BG    = "#484848";
const BORDER_COL = "#a4a4a4";
const LIGHT_BTN_BG = "rgba(241,235,228,0.2)";
const LIGHT_TEXT = "#555555";
const DARK_TEXT  = "#fcf6ef";
const PROMPT_COL = "rgba(155,155,155,0.8)";

const FONT_SERIF = "'freight-text-pro', 'EB Garamond', Georgia, serif";
const FONT_SANS  = "'general-sans', 'Space Grotesk', sans-serif";

// ── Icons (SVG recreations from Figma screenshots) ────────────────────────────

// Eye open icon — 17.705 × 12.665 px in Figma
function IconEyeOpen({ color }: { color: string }) {
  return (
    <svg width="18" height="13" viewBox="0 0 18 13" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M1 6.33C1 6.33 3.8 1 9 1C14.2 1 17 6.33 17 6.33C17 6.33 14.2 11.66 9 11.66C3.8 11.66 1 6.33 1 6.33Z"
        stroke={color} strokeWidth="1.1" fill="none"
      />
      <circle cx="9" cy="6.33" r="2.3" fill={color} />
    </svg>
  );
}

// Closed eye (hidden state) — same dimensions, crossed
function IconEyeClosed({ color }: { color: string }) {
  return (
    <svg width="18" height="13" viewBox="0 0 18 13" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M1 6.33C1 6.33 3.8 1 9 1C14.2 1 17 6.33 17 6.33C17 6.33 14.2 11.66 9 11.66C3.8 11.66 1 6.33 1 6.33Z"
        stroke={color} strokeWidth="1.1" fill="none"
      />
      <circle cx="9" cy="6.33" r="2.3" fill={color} />
      <line x1="2" y1="0.5" x2="16" y2="12.5" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
    </svg>
  );
}

// Half-circle dark mode toggle — 15.482 × 15.978 px in Figma (◑ shape)
function IconHalfCircle({ color }: { color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="8" cy="8" r="6.5" stroke={color} strokeWidth="1.1" />
      {/* Left half filled */}
      <path d="M8 1.5 A6.5 6.5 0 0 0 8 14.5 Z" fill={color} />
    </svg>
  );
}

// Cursor line — thin vertical bar before the prompt (recreates Figma's Line 2)
function CursorLine() {
  return (
    <div style={{ width: "1.5px", height: "34px", background: PROMPT_COL, flexShrink: 0 }} />
  );
}

// ── Button style helper ───────────────────────────────────────────────────────
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
  const [dark, setDark]         = useState(false);
  const [visible, setVisible]   = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuHovered, setMenuHovered] = useState(false);
  const [text, setText]         = useState("");
  const [scrollY, setScrollY] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

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
          /* Full left panel: padding 44px from edges, col layout when menu open */
          <motion.div
            key="left-full"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ position: "fixed", top: "44px", left: "44px", display: "flex", flexDirection: "column", gap: "16px", alignItems: "flex-start", zIndex: 20 }}
          >
            {/* Top row: Menu/Close + Eye */}
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              {/* Menu button with peek-card hover effect */}
              <div
                style={{ position: "relative" }}
                onMouseEnter={() => { if (!menuOpen) setMenuHovered(true); }}
                onMouseLeave={() => setMenuHovered(false)}
              >
                {/* Ghost card — peeks only from bottom, not sides */}
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
                    position: "absolute",
                    left: "2px",
                    top: "9px",
                    width: "calc(100% - 4px)",
                    height: "28px",
                    background: dark ? "rgba(252,246,239,0.15)" : LIGHT_BG,
                    border: `1px dashed ${BORDER_COL}`,
                    borderRadius: "4px",
                    rotate: -2.42,
                    zIndex: 0,
                    pointerEvents: "none",
                  }}
                />
                <button
                  style={{ ...btnStyle(dark, { background: dark ? "transparent" : LIGHT_BG }), position: "relative", zIndex: 1 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(o => !o);
                    setMenuHovered(false);
                  }}
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

            {/* Nav items — staggered entrance on menu open */}
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  key="nav"
                  variants={NAV_CONTAINER}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-start" }}
                >
                  {(["Create", "Playground", "About"] as const).map((label, i) => (
                    <motion.button
                      key={label}
                      variants={NAV_ITEM}
                      style={navItemStyle(dark, i === 0)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {label}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          /* Mini eye: padding 12px from edges, px:6 py:4, icon at opacity 40% */
          <motion.button
            key="left-mini"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "fixed", top: "12px", left: "12px", zIndex: 20,
              background: dark ? "transparent" : LIGHT_BTN_BG,
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              outline: "none",
              padding: "4px 6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            onClick={(e) => { e.stopPropagation(); setVisible(true); }}
          >
            <IconEyeOpen color={iconColor} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Right panel — padding 44px from edges, buttons gap 10px ───────── */}
      <AnimatePresence>
        {visible && (
          <motion.div
            key="right"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ position: "fixed", top: "44px", right: "44px", display: "flex", gap: "10px", alignItems: "center", zIndex: 20 }}
          >
            {/* Dark mode toggle — 31×31px, p:6, icon 15.482×15.978 */}
            <button
              style={btnStyle(dark, { width: "31px", padding: "0 6px" })}
              onClick={(e) => { e.stopPropagation(); setDark(d => !d); }}
            >
              <IconHalfCircle color={iconColor} />
            </button>

            {/* Rules — w:60px, px:12 py:6 */}
            <button
              style={btnStyle(dark, { width: "60px" })}
              onClick={(e) => e.stopPropagation()}
            >
              Rules
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Top gradient fade — appears only when scrolled ──────────────── */}
      <div
        aria-hidden
        style={{
          position: "fixed", top: 0, left: 0, right: 0,
          height: "120px",
          background: `linear-gradient(to bottom, ${bg} 0%, ${bg} 35%, transparent 100%)`,
          pointerEvents: "none",
          zIndex: 10,
          opacity: Math.min(scrollY / 50, 1),
          transition: "background 0.3s",
        }}
      />

      {/* ── Center writing zone ─────────────────────────────────────────────── */}
      {/* Figma: left:50% translateX(-50%), px:40 py:36, frame width 848px     */}
      <div
        style={{
          position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)",
          width: "848px", maxWidth: "100vw",
          padding: "36px 40px",
          minHeight: "100vh",
          display: "flex", flexDirection: "column",
          boxSizing: "border-box",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Writing area */}
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
              background: "transparent",
              border: "none",
              outline: "none",
              resize: "none",
              overflow: "hidden",
              fontFamily: FONT_SERIF,
              fontSize: "24px",
              lineHeight: "1.5",
              color: textColor,
              width: "100%",
              minHeight: "calc(100vh - 80px)",
              padding: 0,
              caretColor: textColor,
              transition: "color 0.3s",
            }}
          />
      </div>
    </div>
  );
}
