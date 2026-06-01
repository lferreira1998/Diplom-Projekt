import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";

const BORDER_COL = "#a4a4a4";
const LIGHT_TEXT = "#555555";
const DARK_TEXT  = "#f0e8dc";
const FONT_SANS  = "'general-sans', sans-serif";

const ROUTES: Record<string, string> = {
  Create:     "/create-tool",
  Playground: "/tool-collection",
  About:      "/about-the-project",
};

const LABELS = {
  de: { Create: "Tool erstellen", Playground: "Tool-Sammlung", About: "Über das Projekt", menuClosed: "Menü", menuOpen: "Schließen", langSwitch: "English" },
  en: { Create: "Create Tool", Playground: "Tool Collection", About: "About", menuClosed: "Menu", menuOpen: "Close", langSwitch: "Deutsch" },
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

function IconEyeClosed({ color }: { color: string }) {
  return (
    <svg width="19" height="13" viewBox="0 0 126.33 89.05" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M81.1,74.39v5.69l-.09.11c-4.81,5.63-11.31,8.86-17.83,8.86s-13.05-3.23-17.86-8.86l-.09-.11v-5.69l.66.77c4.59,5.37,10.73,8.33,17.29,8.33s12.67-2.96,17.26-8.33l.66-.77Z" fill={color}/>
      <path d="M80.98,8.9v5.31l-.44-.52c-4.62-5.4-10.79-8.37-17.39-8.37s-12.74,2.97-17.36,8.37l-.44.52v-5.31l.06-.07C50.2,3.22,56.67,0,63.15,0s12.98,3.22,17.77,8.83l.06.07Z" fill={color}/>
      <path d="M107.53,21.49l17.88,18.17v7.65l-29.6,30.08v-8.34l25.34-25.57-18.74-18.9-.96-.97-23.11,13.99c.63,1.82.96,3.84.96,6.01,0,9.22-6.66,16.14-16.13,16.14-5.07,0-9.44-2.09-12.34-5.5l-21.11,12.77-5.13,3.11-19.68,11.91-4.91-3.52,20.56-12.48-.96-.97L2.13,47.31v-7.65L31.73,9.58v8.34L6.39,43.48l18.32,18.49.96.97,22.34-13.56c-.64-1.78-.98-3.72-.98-5.77,0-9.73,6.92-16.39,16.14-16.39,5.2,0,9.55,2.01,12.41,5.43l21.75-13.2,5.13-3.12,18.79-11.4,5.08,3.63-19.76,11.96.96.97Z" fill={color}/>
    </svg>
  );
}

function IconShowHidden({ color }: { color: string }) {
  return (
    <svg width="19" height="13" viewBox="0 0 36 25" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M23.318 2.9355V4.46104C21.7844 2.56568 19.7599 1.61799 17.7232 1.61799C15.6988 1.61799 13.6744 2.56568 12.1407 4.46104V2.9355C13.6744 1.04014 15.6988 8.84903e-08 17.7232 0C19.7599 -8.90266e-08 21.7844 1.04014 23.318 2.9355Z" fill={color}/>
      <path d="M11.7952 21.6912V20.1656C13.3289 22.061 15.3533 23.0087 17.39 23.0087C19.4144 23.0087 21.4389 22.061 22.9725 20.1656V21.6912C21.4389 23.5865 19.4144 24.6267 17.39 24.6267C15.3533 24.6267 13.3289 23.5865 11.7952 21.6912Z" fill={color}/>
      <path d="M35.113 11.2229L26.682 2.65537V5.03092L33.8989 12.3133L26.682 19.5957V21.9713L35.113 13.4037V11.2229Z" fill={color}/>
      <path d="M0 13.4037L8.43094 21.9713V19.5957L1.21406 12.3133L8.43094 5.03092V2.65537L0 11.2229V13.4037Z" fill={color}/>
      <path d="M21.9794 12.3497C21.9794 14.9757 20.0828 16.9453 17.3839 16.9453C14.7579 16.9453 12.7883 14.9757 12.7883 12.3497C12.7883 9.57782 14.7579 7.68125 17.3839 7.68125C20.0828 7.68125 21.9794 9.57782 21.9794 12.3497Z" fill={color}/>
    </svg>
  );
}

function IconHalfCircle({ color, dark }: { color: string; dark: boolean }) {
  if (!dark) {
    return (
      <svg width="17" height="16" viewBox="0 0 101.94 97.7" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M53.89,80.3v17.4h-5.84v-17.4h5.84Z" fill={color}/>
        <path d="M76.69,48.89c0,13.66-10.83,23.55-25.81,23.55s-25.62-9.89-25.62-23.55,10.74-23.65,25.62-23.65,25.81,9.89,25.81,23.65ZM70.94,48.89c0-9.7-7.73-16.96-20.07-16.96s-19.88,7.25-19.88,16.96,7.73,16.86,19.88,16.86,20.07-7.25,20.07-16.86Z" fill={color}/>
        <path d="M53.89,0v17.4h-5.84V0h5.84Z" fill={color}/>
        <path d="M101.94,51.77h-17.4v-5.84h17.4v5.84Z" fill={color}/>
        <path d="M17.4,51.77H0v-5.84h17.4v5.84Z" fill={color}/>
        <path d="M25.25,28.53l-12.3-12.3,4.13-4.13,12.3,12.3-4.13,4.13Z" fill={color}/>
        <path d="M83.18,86.46l-12.3-12.3,4.13-4.13,12.3,12.3-4.13,4.13Z" fill={color}/>
        <path d="M88.24,16.22l-12.3,12.3-4.13-4.13,12.3-12.3,4.13,4.13Z" fill={color}/>
        <path d="M28.38,74.15l-12.3,12.3-4.13-4.13,12.3-12.3,4.13,4.13Z" fill={color}/>
      </svg>
    );
  }
  return (
    <svg width="17" height="15" viewBox="0 0 107.41 95.89" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M67.06,21.2c3.64,8.43,6.24,19.55-.1,30.56-6.38,10.84-17.47,13.9-26.57,14.75l-6.99-4.12c10.47-1.32,20.24-5.16,26.06-15.05,5.92-10.06,4.81-20.45.62-30.26l6.99,4.12Z" fill={color}/>
      <path d="M24.22,78.13c2.33,3.19,7.3,6.45,15.08,11.35,3.69,2.34,7.5,4.05,11.33,5.09,1.12.32,2.23.57,3.31.76,2.11.37,4.24.56,6.33.56,12.61,0,24.81-7,34.35-19.73,1.15-1.52,2.27-3.16,3.35-4.86l.02-.04.04-.06c7.63-12.11,10.69-24.61,8.87-36.17-1.79-11.44-8.25-20.97-18.67-27.55-8.13-5.12-15.18-6.39-18.2-6.7l-2.06,6.48c3.13.4,9.87,1.7,16.31,5.76,8.81,5.55,14.17,13.43,15.5,22.77,1.38,9.46-1.46,20.12-8.21,30.81-.25.39-.5.77-.75,1.16-7.99,12.12-18.36,19.31-29.21,20.25l-.02.02h-.18c-.74.08-1.51.11-2.35.11-6.11,0-12.18-1.89-18.05-5.6-.65-.42-1.3-.81-1.93-1.2-.31-.18-.61-.37-.91-.55-3.79-2.3-7.08-4.31-9.38-7.21l-4.57,4.55Z" fill={color}/>
      <path d="M10.42,0l5.48,12.57h.18S21.65.09,21.65.09l5.48,3.15-8.44,10.96v.18s13.21-1.71,13.21-1.71v6.11s-13.29-1.7-13.29-1.7v.18s8.53,10.96,8.53,10.96l-5.12,3.24-5.84-12.67h-.18s-5.39,12.58-5.39,12.58l-5.66-3.23,8.62-10.78v-.18s-13.56,1.62-13.56,1.62v-6.11s13.56,1.8,13.56,1.8v-.18S5.03,3.05,5.03,3.05L10.42,0Z" fill={color}/>
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
  current: "Create" | "Playground" | "About";
  dark: boolean;
  setDark: (fn: (d: boolean) => boolean) => void;
  lang: "de" | "en";
  setLang: (fn: (l: "de" | "en") => "de" | "en") => void;
}) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuHovered, setMenuHovered] = useState(false);

  const L = LABELS[lang];
  const iconColor = dark ? DARK_TEXT : LIGHT_TEXT;

  return (
    <>
      {/* ── Right cluster: eye + dark + menu ── */}
      <AnimatePresence mode="wait">
        {visible ? (
          <motion.div
            key="topnav-right-full"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ position: "fixed", top: "24px", right: "24px", display: "flex", flexDirection: "row", alignItems: "center", gap: "10px", zIndex: 60 }}
          >
            <button
              style={{ ...btnStyle(dark), width: "33px", padding: 0 }}
              onClick={(e) => { e.stopPropagation(); setVisible(false); setMenuOpen(false); }}
            >
              <IconEyeClosed color={iconColor} />
            </button>
            <button
              style={{ ...btnStyle(dark), width: "33px", padding: 0 }}
              onClick={(e) => { e.stopPropagation(); setDark(d => { const next = !d; localStorage.setItem("appTheme", next ? "dark" : "light"); return next; }); }}
            >
              <IconHalfCircle color={iconColor} dark={dark} />
            </button>
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
                  background: dark ? "rgba(240,232,220,0.1)" : "rgba(252,246,239,0.6)",
                  border: `1px dashed ${BORDER_COL}`,
                  borderRadius: "4px", rotate: -2.42, zIndex: 0, pointerEvents: "none",
                }}
              />
              <button
                style={{ ...btnStyle(dark), position: "relative", zIndex: 1 }}
                onClick={(e) => { e.stopPropagation(); setMenuOpen(o => !o); setMenuHovered(false); }}
              >
                {menuOpen ? L.menuOpen : L.menuClosed}
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    key="topnav-menu"
                    variants={NAV_CONTAINER}
                    initial="hidden" animate="visible" exit="exit"
                    style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" }}
                  >
                    {(["Create", "Playground", "About"] as const).map((key) => (
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
                    <motion.button
                      key="lang"
                      variants={NAV_ITEM}
                      style={navItemStyle(dark, false)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setMenuOpen(false);
                        setLang(l => { const next = l === "de" ? "en" : "de"; localStorage.setItem("appLang", next); return next; });
                      }}
                    >{L.langSwitch}</motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : (
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
        )}
      </AnimatePresence>
    </>
  );
}
