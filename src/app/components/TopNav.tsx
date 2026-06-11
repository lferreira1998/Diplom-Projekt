import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";

const BORDER_COL = "#a4a4a4";
const LIGHT_TEXT = "#555555";
const DARK_TEXT  = "#f0e8dc";
const FONT_SANS  = "'az-sans', sans-serif";

const ROUTES: Record<string, string> = {
  Introduction: "/introduction",
  Create:       "/create-tool",
  Playground:   "/tool-collection",
  About:        "/about-the-project",
};

const LABELS = {
  de: { Introduction: "Einführung", Create: "Tool erstellen", Playground: "Tool-Sammlung", About: "Über das Projekt", menuClosed: "Go to", menuOpen: "Go to", langSwitch: "English" },
  en: { Introduction: "Introduction", Create: "Create Tool", Playground: "Tool Collection", About: "About", menuClosed: "Go to", menuOpen: "Go to", langSwitch: "Deutsch" },
};

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

// Designer icons (ABCArizona glyphs + paths). Inlined so the loaded webfont
// renders the <text> marks and currentColor follows the active theme.
const AZ_GLYPH: React.CSSProperties = {
  fontFamily: "'ABCArizona'",
  fontVariationSettings: "'SRFF' 0, 'wdth' 100, 'wght' 350",
};

// "auge_aus" — crossed-out eye → action: hide the UI
function IconEyeClosed({ color }: { color: string }) {
  return (
    <svg width="20" height="14.1" viewBox="0 0 21.67 15.26" fill={color} style={{ overflow: "visible" }} xmlns="http://www.w3.org/2000/svg">
      <path d="M4.71,11.23l-1.09-.64-3.62-2.12v-1.07l5.03-2.94v1.16l-3.97,2.28v.03l3.66,2.13.31.18v.84l-.32.15Z"/>
      <path d="M16.64,10.28l3.97-2.28v-.03l-3.97-2.31v-1.19l5.03,2.96v1.06l-5.03,2.94v-1.16Z"/>
      <path d="M8.34.62c.73-.42,1.52-.62,2.38-.62s1.66.21,2.38.63c.73.42,1.44,1.03,2.15,1.84v1.06c-.74-.75-1.46-1.31-2.16-1.69-.7-.38-1.49-.57-2.37-.57s-1.67.19-2.37.57c-.71.38-1.42.94-2.16,1.69v-1.06c.71-.82,1.42-1.44,2.15-1.85Z"/>
      <path d="M13.1,14.63c-.73.42-1.52.62-2.38.62s-1.66-.21-2.38-.63c-.73-.42-1.44-1.03-2.15-1.84v-1.06c.74.75,1.46,1.31,2.16,1.69.7.38,1.49.57,2.37.57s1.67-.19,2.37-.57c.71-.38,1.42-.94,2.16-1.69v1.06c-.71.82-1.42,1.44-2.15,1.85Z"/>
      <path d="M13.3,7.79c0,1.29-1.04,2.33-2.33,2.33-.79,0-1.49-.39-1.91-.98-.21-.29-.34-.62-.4-.98-.02-.12-.03-.24-.03-.37,0-1.29,1.04-2.34,2.34-2.34.69,0,1.3.3,1.72.77.24.26.42.57.52.92.06.21.09.42.09.65Z"/>
      <path d="M20.93,2.27c-1.06.5-1.85.88-2.37,1.12-.52.25-1.04.51-1.57.76-.53.25-1.32.64-2.38,1.14l-1.92.93c.24.26.42.57.52.92l1.86-.89c.62-.3,1.14-.55,1.57-.76.32-.15.59-.28.81-.39.05-.02.09-.04.14-.07.48-.22.96-.45,1.43-.68.52-.25,1.31-.63,2.36-1.14l-.45-.94ZM6.83,9.04c-.9.44-1.6.78-2.11,1.02-.09.04-.17.08-.25.12-.28.14-.56.28-.85.41-.24.12-.48.24-.72.35-.53.25-1.32.63-2.37,1.15l.45.94c1.06-.51,1.85-.89,2.38-1.14.46-.22.9-.44,1.35-.66.07-.03.15-.06.22-.1.03-.01.06-.03.1-.05.51-.25,1.26-.61,2.26-1.09l1.77-.85c-.21-.29-.34-.62-.4-.98l-1.83.88Z"/>
    </svg>
  );
}

// "auge_an" — open eye → action: show the UI again
function IconShowHidden({ color }: { color: string }) {
  return (
    <svg width="20" height="16.16" viewBox="0 0 22.83 18.45" fill={color} style={{ overflow: "visible" }} xmlns="http://www.w3.org/2000/svg">
      <text fill={color} transform="translate(0 12.71) scale(.75 1)" fontSize="15" style={AZ_GLYPH}>{"<"}</text>
      <text fill={color} transform="translate(22.83 5.74) rotate(-180) scale(.75 1)" fontSize="15" style={AZ_GLYPH}>{"<"}</text>
      <text fill={color} transform="translate(8.19 .55) rotate(90) scale(1.53 1)" fontSize="9.8" style={AZ_GLYPH}>(</text>
      <text fill={color} transform="translate(14.39 17.27) rotate(-90) scale(1.53 1)" fontSize="9.8" style={AZ_GLYPH}>(</text>
      <circle fill={color} cx="11.54" cy="9.06" r="2.34"/>
    </svg>
  );
}

function IconHalfCircle({ color, dark }: { color: string; dark: boolean }) {
  if (!dark) {
    // "light mode an" — sun
    return (
      <svg width="17" height="16.49" viewBox="0 0 18.69 18.13" fill={color} style={{ overflow: "visible" }} xmlns="http://www.w3.org/2000/svg">
        <path d="M12.59,10.85c-.32.54-.76.97-1.33,1.28s-1.2.47-1.91.47-1.36-.16-1.93-.47-1.01-.74-1.33-1.28c-.32-.53-.48-1.13-.48-1.78s.16-1.27.48-1.81c.32-.54.76-.96,1.33-1.27s1.21-.47,1.93-.47,1.35.16,1.91.47,1.01.73,1.33,1.27.48,1.15.48,1.81-.16,1.23-.48,1.77ZM11.71,7.87c-.22-.35-.53-.62-.94-.81-.4-.19-.88-.29-1.42-.29s-1.01.1-1.42.29-.73.46-.94.81c-.22.35-.33.75-.33,1.21s.11.84.33,1.19c.22.36.53.63.94.81.41.19.88.28,1.42.28s1-.09,1.41-.28c.41-.18.73-.45.94-.81.22-.35.33-.75.33-1.19s-.11-.86-.33-1.21Z"/>
        <path d="M18.69,9.61h-3.95v-1.09h3.95v1.09Z"/>
        <path d="M8.8,18.13v-3.95h1.09v3.95h-1.09Z"/>
        <path d="M8.8,3.95V0h1.09v3.95h-1.09Z"/>
        <path d="M3.95,9.61H0v-1.09h3.95v1.09Z"/>
        <path d="M5.31,6.25l-2.79-2.79.77-.77,2.79,2.79-.77.77Z"/>
        <path d="M15.16,15.44l-2.79-2.79.77-.77,2.79,2.79-.77.77Z"/>
        <path d="M6.28,12.65l-2.79,2.79-.77-.77,2.79-2.79.77.77Z"/>
        <path d="M16.36,3.46l-2.79,2.79-.77-.77,2.79-2.79.77.77Z"/>
      </svg>
    );
  }
  // "dark mode an" — crescent moon
  return (
    <svg width="13.35" height="17" viewBox="0 0 13.71 17.46" fill={color} style={{ overflow: "visible" }} xmlns="http://www.w3.org/2000/svg">
      <path d="M13.7,15.13c-.68.37-1.35.65-2.01.85-2.31.66-4.66.41-6.49-.52-1.17-.59-2.1-1.48-2.76-2.64-.66-1.15-1-2.52-1-4.08s.35-2.9,1.03-4.05c.68-1.14,1.62-2.04,2.79-2.65,1.16-.62,2.45-.93,3.81-.93.9,0,1.75.12,2.53.35.59.17,1.2.42,1.83.73v-.99c-.65-.38-1.34-.67-2.04-.87-.76-.22-1.65-.33-2.62-.33-1.53,0-2.98.36-4.33,1.05-1.33.69-2.42,1.72-3.22,3.04-.81,1.32-1.22,2.88-1.22,4.63s.4,3.36,1.19,4.68c.79,1.32,1.87,2.33,3.2,3.02,1.35.69,2.84,1.04,4.45,1.04.96,0,1.87-.13,2.7-.38.77-.23,1.49-.56,2.17-.97v-.98Z"/>
      <path d="M12.61,13.53c-1.49.4-3.04.24-4.22-.42-.76-.42-1.36-1.03-1.78-1.79s-.64-1.65-.64-2.63.21-1.85.61-2.6c.41-.75,1-1.34,1.75-1.76.75-.41,1.61-.62,2.58-.62.55,0,1.09.06,1.58.19.32.08.64.19.97.32v-.79c-.36-.18-.76-.33-1.19-.43-.51-.13-1.08-.2-1.67-.2-1.16,0-2.21.26-3.1.77-.89.5-1.59,1.21-2.09,2.1-.5.89-.75,1.91-.75,3.02s.26,2.16.76,3.06c.51.9,1.22,1.62,2.12,2.13.9.52,1.96.78,3.14.78.57,0,1.15-.08,1.7-.22.48-.12.93-.3,1.33-.53v-.77c-.37.17-.74.3-1.1.39Z"/>
    </svg>
  );
}

function btnStyle(dark: boolean): React.CSSProperties {
  return {
    background: dark ? "#484848" : "#fcf6ef",
    border: `1px dashed ${BORDER_COL}`,
    borderRadius: "4px",
    cursor: "pointer", outline: "none",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
    color: dark ? DARK_TEXT : LIGHT_TEXT,
    fontFamily: FONT_SANS, fontSize: "15px", fontWeight: 400, lineHeight: "normal",
    height: "33px", padding: "0 12px",
  };
}

function navItemStyle(dark: boolean, active: boolean): React.CSSProperties {
  const activeDarkBg = "#302e2c";
  const activeLightText = "#f5f0ea";
  return {
    background: active
      ? (dark ? "rgba(240,232,220,0.85)" : activeDarkBg)
      : (dark ? "#484848" : "#fcf6ef"),
    border: active
      ? (dark ? "1px solid rgba(240,232,220,0.85)" : `1px solid ${activeDarkBg}`)
      : `1px dashed ${BORDER_COL}`,
    borderRadius: "4px", cursor: "pointer", outline: "none",
    display: "flex", alignItems: "center", justifyContent: "flex-start",
    color: active ? (dark ? "#302e2c" : activeLightText) : (dark ? DARK_TEXT : LIGHT_TEXT),
    fontFamily: FONT_SANS, fontSize: "15px", fontWeight: active ? 500 : 400, lineHeight: "normal",
    height: "33px", padding: "0 12px", whiteSpace: "nowrap",
  };
}

export default function TopNav({
  current, dark, setDark, lang, setLang,
}: {
  current: "Introduction" | "Create" | "Playground" | "About";
  dark: boolean;
  setDark: (fn: (d: boolean) => boolean) => void;
  lang: "de" | "en";
  setLang: (fn: (l: "de" | "en") => "de" | "en") => void;
}) {
  const navigate = useNavigate();
  const navRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  // true when hidden by New.tsx's focus mode (vs. our own eye button)
  const [hiddenByNew, setHiddenByNew] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuHovered, setMenuHovered] = useState(false);

  // Mirror New.tsx focus mode: when body[data-new-ui-hidden]="1" is set, hide.
  // When removed, restore — but only if we were hidden by New.tsx (not our own eye).
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const hidden = document.body.dataset.newUiHidden === "1";
      if (hidden) { setVisible(false); setHiddenByNew(true); }
      else { setHiddenByNew(false); setVisible(true); }
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["data-new-ui-hidden"] });
    return () => observer.disconnect();
  }, []);

  const L = LABELS[lang];
  const iconColor = dark ? DARK_TEXT : LIGHT_TEXT;

  useEffect(() => {
    if (!menuOpen) return;
    const closeOnOutsidePointerDown = (event: PointerEvent) => {
      if (!navRef.current?.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePointerDown);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointerDown);
  }, [menuOpen]);

  return (
    <>
      {/* ── Right cluster: eye + dark + menu ── */}
      <AnimatePresence mode="wait">
        {visible ? (
          <motion.div
            ref={navRef}
            key="topnav-right-full"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ position: "fixed", top: "24px", right: "24px", display: "flex", flexDirection: "row", alignItems: "center", gap: "10px", zIndex: 60 }}
          >
            {/* Eye button only on non-Create routes — Create Tool has its own eye in New.tsx */}
            {current !== "Create" && (
              <button
                style={{ ...btnStyle(dark), width: "33px", padding: 0 }}
                onClick={(e) => { e.stopPropagation(); setVisible(false); setMenuOpen(false); }}
              >
                <IconEyeClosed color={iconColor} />
              </button>
            )}
            {/* Dark-mode toggle hidden for now — re-enable when dark mode is ready
            <button
              style={{ ...btnStyle(dark), width: "33px", padding: 0 }}
              onClick={(e) => { e.stopPropagation(); setDark(d => { const next = !d; localStorage.setItem("appTheme", next ? "dark" : "light"); return next; }); }}
            >
              <IconHalfCircle color={iconColor} dark={dark} />
            </button>
            */}
            <div
              style={{ position: "relative" }}
              onMouseEnter={() => { if (!menuOpen) setMenuHovered(true); }}
              onMouseLeave={() => setMenuHovered(false)}
            >
              <motion.div
                aria-hidden
                animate={
                  menuOpen
                    ? { y: 8, opacity: 0, scale: 1, transition: { y: { duration: 0.22, ease: "easeOut" }, opacity: { duration: 0.1 } } }
                    : menuHovered ? { y: 4, opacity: 1, scale: 1 } : { y: -6, opacity: 0, scale: 1 }
                }
                transition={{ duration: 0.22, ease: "easeOut" }}
                style={{
                  position: "absolute", left: "2px", top: "9px",
                  width: "calc(100% - 4px)", height: "28px",
                  background: dark ? "rgba(240,232,220,0.1)" : "rgba(252,246,239,0.6)",
                  border: `1px dashed ${BORDER_COL}`,
                  borderRadius: "4px", rotate: -2.42, zIndex: 0, pointerEvents: "none",
                }}
              />
              <button
                style={{ ...btnStyle(dark), position: "relative", zIndex: 1 }}
                onClick={(e) => { e.stopPropagation(); setMenuOpen(o => !o); setMenuHovered(false); }}
              >
                {L.menuClosed}
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    key="topnav-menu"
                    variants={NAV_CONTAINER}
                    initial="hidden" animate="visible" exit="exit"
                    style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" }}
                  >
                    {(["Introduction", "Create", "Playground"] as const).map((key) => (
                      <motion.button
                        key={key}
                        variants={NAV_ITEM}
                        style={navItemStyle(dark, key === current)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpen(false);
                          if (key !== current) navigate(ROUTES[key]);
                        }}
                      >{L[key]}</motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : (
          // Don't render the restore button when New.tsx triggered the hide —
          // New.tsx renders its own restore button at the same position.
          !hiddenByNew ? (
            <motion.button
              key="topnav-right-mini"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{
                position: "fixed", top: "12px", right: "12px", zIndex: 60,
                background: dark ? "rgba(240,232,220,0.06)" : "rgba(252,246,239,0.6)",
                border: "none", borderRadius: "4px", cursor: "pointer", outline: "none",
                padding: "4px 6px", display: "flex", alignItems: "center", justifyContent: "center",
              }}
              onClick={(e) => { e.stopPropagation(); setVisible(true); }}
            >
              <IconShowHidden color={iconColor} />
            </motion.button>
          ) : null
        )}
      </AnimatePresence>
    </>
  );
}
