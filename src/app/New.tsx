import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";

const LIGHT_BG = "#fcf6ef";
const DARK_BG = "#555555";
const BORDER = "#a4a4a4";

const FONT_SERIF = "'Lora', 'Georgia', 'Times New Roman', serif";
const FONT_SANS = "'General Sans', 'Space Grotesk', sans-serif";

function btn(dark: boolean, extra?: React.CSSProperties): React.CSSProperties {
  return {
    border: `1px dashed ${BORDER}`,
    borderRadius: "4px",
    background: dark ? "transparent" : "rgba(241,235,228,0.2)",
    cursor: "pointer",
    color: dark ? "#fcf6ef" : "#555555",
    fontFamily: FONT_SANS,
    fontSize: "14px",
    padding: "6px 12px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    outline: "none",
    whiteSpace: "nowrap" as const,
    lineHeight: "normal",
    flexShrink: 0,
    ...extra,
  };
}

function EyeOpen({ dark }: { dark: boolean }) {
  const c = dark ? "#fcf6ef" : "#666";
  return (
    <svg width="18" height="13" viewBox="0 0 18 13" fill="none">
      <path d="M1 6.5C1 6.5 4 1 9 1C14 1 17 6.5 17 6.5C17 6.5 14 12 9 12C4 12 1 6.5 1 6.5Z" stroke={c} strokeWidth="1.2" />
      <circle cx="9" cy="6.5" r="2.2" fill={c} />
    </svg>
  );
}

function EyeClosed({ dark }: { dark: boolean }) {
  const c = dark ? "#fcf6ef" : "#666";
  return (
    <svg width="18" height="13" viewBox="0 0 18 13" fill="none">
      <path d="M1 6.5C1 6.5 4 1 9 1C14 1 17 6.5 17 6.5C17 6.5 14 12 9 12C4 12 1 6.5 1 6.5Z" stroke={c} strokeWidth="1.2" opacity="0.4" />
      <line x1="2" y1="1" x2="16" y2="12" stroke={c} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function HalfCircleIcon({ dark }: { dark: boolean }) {
  const c = dark ? "#fcf6ef" : "#555555";
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke={c} strokeWidth="1.2" />
      <path d="M8 1.5 A6.5 6.5 0 0 0 8 14.5 Z" fill={c} />
    </svg>
  );
}

function CursorLine({ dark }: { dark: boolean }) {
  return (
    <div style={{
      width: "1.5px",
      height: "34px",
      background: dark ? "rgba(155,155,155,0.6)" : "rgba(155,155,155,0.8)",
      flexShrink: 0,
    }} />
  );
}

export default function New() {
  const [dark, setDark] = useState(false);
  const [elementsVisible, setElementsVisible] = useState(true);
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const bg = dark ? DARK_BG : LIGHT_BG;
  const textColor = dark ? "#fcf6ef" : "#333333";
  const promptColor = "rgba(155,155,155,0.8)";

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setElementsVisible(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: bg,
        position: "relative",
        transition: "background 0.35s ease",
        overflow: "hidden",
      }}
      onClick={() => textareaRef.current?.focus()}
    >
      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;1,400&display=swap"
        rel="stylesheet"
      />

      {/* ── Left panel ── */}
      <AnimatePresence mode="wait">
        {elementsVisible ? (
          <motion.div
            key="left-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "fixed",
              top: "44px",
              left: "44px",
              display: "flex",
              gap: "10px",
              alignItems: "center",
              zIndex: 20,
            }}
          >
            <button style={btn(dark)} onClick={(e) => e.stopPropagation()}>
              Menu
            </button>
            <button
              style={btn(dark, { padding: "6px 12px" })}
              onClick={(e) => { e.stopPropagation(); setElementsVisible(false); }}
              title="UI verstecken"
            >
              <EyeOpen dark={dark} />
            </button>
          </motion.div>
        ) : (
          <motion.button
            key="left-mini"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "fixed",
              top: "12px",
              left: "12px",
              zIndex: 20,
              ...btn(dark, { padding: "4px 8px" }),
            }}
            onClick={(e) => { e.stopPropagation(); setElementsVisible(true); }}
            title="UI anzeigen"
          >
            <EyeClosed dark={dark} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Right panel ── */}
      <AnimatePresence>
        {elementsVisible && (
          <motion.div
            key="right"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "fixed",
              top: "44px",
              right: "44px",
              display: "flex",
              gap: "10px",
              alignItems: "center",
              zIndex: 20,
            }}
          >
            <button
              style={btn(dark, { width: "31px", height: "31px", padding: "6px" })}
              onClick={(e) => { e.stopPropagation(); setDark(d => !d); }}
              title={dark ? "Light mode" : "Dark mode"}
            >
              <HalfCircleIcon dark={dark} />
            </button>
            <button
              style={btn(dark)}
              onClick={(e) => e.stopPropagation()}
            >
              Rules
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Center writing zone ── */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "50%",
          transform: "translateX(-50%)",
          width: "min(768px, calc(100vw - 88px))",
          padding: "36px 40px",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Prompt row */}
        <div style={{ display: "flex", gap: "4px", alignItems: "center", flexShrink: 0 }}>
          <CursorLine dark={dark} />
          <p
            style={{
              fontFamily: FONT_SERIF,
              fontStyle: "italic",
              fontSize: "24px",
              lineHeight: "45px",
              color: promptColor,
              margin: 0,
              userSelect: "none",
            }}
          >
            Explore new ways of thinking by breaking the rules of standard writing tools...
          </p>
        </div>

        {/* Writing area */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder=""
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            resize: "none",
            fontFamily: FONT_SERIF,
            fontSize: "24px",
            lineHeight: "45px",
            color: textColor,
            width: "100%",
            minHeight: "calc(100vh - 130px)",
            padding: 0,
            marginTop: "4px",
            transition: "color 0.35s ease",
            caretColor: textColor,
          }}
          autoFocus
          spellCheck={false}
        />
      </div>
    </div>
  );
}
