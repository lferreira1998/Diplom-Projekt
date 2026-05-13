import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate, useSearchParams } from "react-router";
import AsciiImagePanel from "./components/AsciiImagePanel";
import {
  WritingZone,
  type Position,
  extractText,
} from "./projects/parametrischestool/components/writing-zone";
import { saveNewTool, updateNewTool, getNewToolById } from "./utils/storage";

// ── Design tokens ─────────────────────────────────────────────────────────────
const LIGHT_BG    = "#fcf6ef";
const DARK_BG     = "#484848";
const BORDER_COL  = "#a4a4a4";
const DARK_BORDER = "rgba(252,246,239,0.16)";
const LIGHT_TEXT  = "#555555";
const DARK_TEXT   = "#f0e8dc";
const DARK_MUTED  = "rgba(240,232,220,0.5)";

// Hue-aware surface colors: only hue changes, lightness/chroma are fixed
function getLookFeelColors(bgHue: number | null): { surfaceLight: string; surfaceDark: string } {
  if (bgHue === null) return { surfaceLight: "#fcf6ef", surfaceDark: "#f9f1e8" };
  return {
    surfaceLight: `oklch(97.5% 0.015 ${bgHue})`,
    surfaceDark:  `oklch(95.5% 0.022 ${bgHue})`,
  };
}

function getLookFeelDarkColors(bgHue: number | null): {
  darkBg: string; darkSidebarBg: string; darkCardBg: string;
  darkActiveCatBg: string; darkInactiveCatBg: string;
} {
  if (bgHue === null) {
    return { darkBg: "#484848", darkSidebarBg: "#1c1b19", darkCardBg: "#2d2b28", darkActiveCatBg: "#3c3a37", darkInactiveCatBg: "#252321" };
  }
  return {
    darkBg:            `oklch(32% 0.028 ${bgHue})`,
    darkSidebarBg:     `oklch(14% 0.020 ${bgHue})`,
    darkCardBg:        `oklch(22% 0.025 ${bgHue})`,
    darkActiveCatBg:   `oklch(27% 0.025 ${bgHue})`,
    darkInactiveCatBg: `oklch(17% 0.020 ${bgHue})`,
  };
}

const FONT_SERIF = "'freight-text-pro', 'EB Garamond', Georgia, serif";
const FONT_SANS  = "'general-sans', 'Space Grotesk', sans-serif";

const NAV_ROUTES: Record<string, string> = {
  Create:     "/new",
  Playground: "/playground",
  About:      "/about-the-project",
};

const SIDEBAR_CATS = [
  { en: "Time",        de: "Zeit",         h: "104px", br: "100px" },
  { en: "Visibility",  de: "Sichtbarkeit", h: "63px",  br: "4px" },
  { en: "Correction",  de: "Korrigieren",  h: "60px",  br: "40px 4px 40px 4px" },
  { en: "Stability",   de: "Stabilität",   h: "46px",  br: "4px" },
  { en: "Position",    de: "Position",     h: "68px",  br: "4px", bottom: true as const },
  { en: "Look & Feel", de: "Look & Feel",  h: "60px",  br: "100px" },
];

// ── Translations ──────────────────────────────────────────────────────────────
const TRANSLATIONS = {
  de: {
    langBtn: "DE",
    rulesBtn: "Regeln",
    rulesHeading: "Regeln",
    rulesSubtitle: "Ändere sie.",
    identityBtn: "Name,\nBeschreibung\n& mehr",
    saveBtn: "Speichern",
    menuClosed: "Menü",
    menuOpen: "Schließen",
    word: "Wort",
    words: "Wörter",
    navLabels: { Create: "Erstellen", Playground: "Playground", About: "Über das Projekt" },
    // Identity panel
    identityHeading: "Identität.",
    identitySubtitle: "Gib deinem Tool ein Bild, einen Namen, Beschreibung und Schreibanstöße.",
    nameHeading: "Name",
    nameHint: 'Beende mit dem Namen den Satz „Write and think…“',
    namePlaceholder: "Name eingeben",
    promptHeading: "Schreibanstoß",
    promptHint: "Das hilft Menschen beim Schreiben. Du kannst mehrere anlegen.",
    promptPlaceholder: "Beispiel: Schreibe etwas über dich…",
    promptAdd: "+ Weiteren hinzufügen",
    descHeading: "Beschreibung",
    descPlaceholder: "Beispiel: Dieses Tool hilft anonym zu schreiben",
    // Time
    timerLabel: "Timer",
    on: "An", off: "Aus",
    timerFixed: "Feste Zeit", timerFree: "Freie Wahl",
    minutes: "Minuten",
    visualTimer: "Visueller Timer",
    userReset: "User setzt Timer neu",
    cursorRunning: "Cursor läuft weiter",
    cursorRunningDesc: "Der Cursor läuft automatisch weiter, egal ob man schreibt oder nicht.",
    // Visibility
    visVisible: "Sichtbar", visInvisible: "Unsichtbar",
    visSentence: "Nur aktueller Satz sichtbar",
    visWord: "Nur aktuelles Wort sichtbar",
    visChar: "Nur aktl. Buchstabe sichtbar",
    // Correction
    deleteHeading: "Löschen",
    deleteAll: "Text ist löschbar",
    deleteNone: "Kein Löschen",
    deleteSentence: "Nur aktl. Satz löschbar",
    deleteWord: "Nur aktl. Wort löschbar",
    correctionVisible: "Korrigieren sichtbar",
    correctionDescHighlight: "Mit Tipp-Ex-Schicht",
    correctionDescRest: " über alten Text. Das Korrigieren hinterlässt Spuren.",
    // Stability
    driftLabel: "Text fliegt davon",
    driftSentences: "Sätze", driftWords: "Wörter", driftLetters: "Buchstabe",
    driftTiming: "Zeitpunkt des Fliegens",
    driftAfter: (n: number) => `Nach ${n} min`,
    driftSpeed: "Schnelligkeit des Fliegens",
    fadeLabel: "Text verblasst",
    fadeTiming: "Zeitpunkt des Verblassens",
    fadeAfter: (n: number) => `Nach ${n} min`,
    fadeSpeed: "Schnelligkeit des Verblassens",
    // Position
    posStandard: "Standard",
    posSpiral: "Spiralförmiger Text",
    posRandom: "Text erscheint zufällig",
    posCustom: "Zeichne deine eigene Linie",
    // Look & Feel
    lfGrain: "Körnung & Textur",
    lfTextSize: "Textgröße",
    lfBgColor: "Hintergrundfarbe anpassen",
    lfBgColorReset: "Farbe zurücksetzen",
    lfNoColor: "Keine Farbe",
    // Timer overlay
    timesUp: "Zeit abgelaufen.",
    timesUpSub: "Dein Text wartet hinter dem Dunkel.",
    deleteText: "Text löschen",
    revealText: "Text sehen",
    copyText: "Text kopieren",
    copied: "Kopiert ✓",
    // Category labels (what shows on sidebar buttons)
    catLabel: (cat: { en: string; de: string }) => cat.de,
    // Category heading in detail panel
    catHeading: (cat: { en: string; de: string }) => cat.de,
    // Category descriptions
    catDesc: {
      "Time":        "In üblichen Schreibtools spielt Zeit keine Rolle, doch unser Denken und Sprechen sind zeitlich.",
      "Visibility":  "In üblichen Schreibtools ist der Text jederzeit sichtbar, doch was passiert, wenn wir damit spielen?",
      "Correction":  "In üblichen Schreibtools kann man den Text jederzeit editieren, löschen etc. Hier wird löschen unmöglich...oder sichtbar.",
      "Stability":   "In üblichen Schreibtools ist der Text stabil und permanent. Doch Gedanken sind flüchtig und vergehen.",
      "Position":    "In üblichen Schreibtools ist der Text linear und wird von links nach rechts geschrieben. Hier ändert sich das.",
      "Look & Feel": "Moderne Schreibtools sind glatt, sauber und statisch. Eigenschaften, die in unserem Denken unmöglich sind.",
    } as Record<string, string>,
    writingPrompt: "Erkunde neue Denkwege, indem du die Regeln üblicher Schreibtools brichst…",
  },
  en: {
    langBtn: "ENG",
    rulesBtn: "Rules",
    rulesHeading: "Rules",
    rulesSubtitle: "Change them.",
    identityBtn: "Name,\nDescription\n& more",
    saveBtn: "Save",
    menuClosed: "Menu",
    menuOpen: "Close",
    word: "word",
    words: "words",
    navLabels: { Create: "Create", Playground: "Playground", About: "About" },
    // Identity panel
    identityHeading: "Identity.",
    identitySubtitle: "Give your tool an image, a name, description, and writing prompts.",
    nameHeading: "Name",
    nameHint: 'Complete the sentence “Write and think…” with the name',
    namePlaceholder: "Enter name",
    promptHeading: "Writing Prompt",
    promptHint: "This helps people start writing. You can add multiple.",
    promptPlaceholder: "Example: Write something about yourself…",
    promptAdd: "+ Add another",
    descHeading: "Description",
    descPlaceholder: "Example: This tool helps writing anonymously",
    // Time
    timerLabel: "Timer",
    on: "On", off: "Off",
    timerFixed: "Fixed Time", timerFree: "Free Choice",
    minutes: "Minutes",
    visualTimer: "Visual Timer",
    userReset: "User resets timer",
    cursorRunning: "Cursor keeps running",
    cursorRunningDesc: "The cursor moves automatically whether you type or not.",
    // Visibility
    visVisible: "Visible", visInvisible: "Invisible",
    visSentence: "Current sentence only",
    visWord: "Current word only",
    visChar: "Current letter only",
    // Correction
    deleteHeading: "Delete",
    deleteAll: "Text is deletable",
    deleteNone: "No deletion",
    deleteSentence: "Current sentence only",
    deleteWord: "Current word only",
    correctionVisible: "Correction visible",
    correctionDescHighlight: "With a Tipp-Ex layer",
    correctionDescRest: " over old text. Corrections leave traces.",
    // Stability
    driftLabel: "Text drifts away",
    driftSentences: "Sentences", driftWords: "Words", driftLetters: "Letters",
    driftTiming: "Drift timing",
    driftAfter: (n: number) => `After ${n} min`,
    driftSpeed: "Drift speed",
    fadeLabel: "Text fades",
    fadeTiming: "Fade timing",
    fadeAfter: (n: number) => `After ${n} min`,
    fadeSpeed: "Fade speed",
    // Position
    posStandard: "Standard",
    posSpiral: "Spiraling Text",
    posRandom: "Text appears random",
    posCustom: "Draw your own path",
    // Look & Feel
    lfGrain: "Grain & Texture",
    lfTextSize: "Text Size",
    lfBgColor: "Adjust background color",
    lfBgColorReset: "Reset color",
    lfNoColor: "No color",
    // Timer overlay
    timesUp: "Time's up.",
    timesUpSub: "Your text waits behind the dark.",
    deleteText: "Delete text",
    revealText: "Reveal text",
    copyText: "Copy text",
    copied: "Copied ✓",
    // Category labels
    catLabel: (cat: { en: string; de: string }) => cat.en,
    catHeading: (cat: { en: string; de: string }) => cat.en,
    // Category descriptions
    catDesc: {
      "Time":        "In typical writing tools, time plays no role — yet our thinking and speaking are inherently temporal.",
      "Visibility":  "In typical writing tools, text is always visible. But what happens when we play with that?",
      "Correction":  "In typical writing tools you can always edit and delete. Here, deletion becomes impossible… or visible.",
      "Stability":   "In typical writing tools, text is stable and permanent. But thoughts are fleeting and fade away.",
      "Position":    "In typical writing tools, text is linear, written left to right. Here, that changes.",
      "Look & Feel": "Modern writing tools are smooth, clean, and static — qualities impossible in our actual thinking.",
    } as Record<string, string>,
    writingPrompt: "Explore new ways of thinking by breaking the rules of standard writing tools…",
  },
};

type Tr = typeof TRANSLATIONS["de"];

const DELETE_OPTS_KEYS = ["all", "none", "sentence", "word"] as const;
type DeleteMode = typeof DELETE_OPTS_KEYS[number];

const BTN_CLOSED = { dark: 24, rules: 65 };
const BTN_OPEN   = { dark: 371, rules: 412 };
const SPRING = { type: "spring" as const, stiffness: 300, damping: 30 };

// ── Helpers ───────────────────────────────────────────────────────────────────

function lerpColor(a: string, b: string, t: number): string {
  const parse = (hex: string) => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
  const ca = parse(a), cb = parse(b);
  return `rgb(${Math.round(ca[0]+(cb[0]-ca[0])*t)},${Math.round(ca[1]+(cb[1]-ca[1])*t)},${Math.round(ca[2]+(cb[2]-ca[2])*t)})`;
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

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
        <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: dark ? DARK_TEXT : LIGHT_TEXT }} />
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
        background: on ? (dark ? "rgba(240,232,220,0.28)" : "#555555") : "transparent",
        border: on ? "none" : `1px dashed ${dark ? "rgba(240,232,220,0.3)" : BORDER_COL}`,
        borderRadius: "100px",
        cursor: "pointer", outline: "none", padding: "3px",
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
  const pct      = ((value - min) / (max - min)) * 100;
  const filled   = dark ? DARK_TEXT : LIGHT_TEXT;
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

// ── Timer done overlay ────────────────────────────────────────────────────────
function TimerDoneOverlay({
  dark, isVisual, onDelete, onReveal, onCopy, copied, t, surfaceLight,
}: {
  dark: boolean; isVisual: boolean;
  onDelete: () => void; onReveal: () => void; onCopy: () => void; copied: boolean;
  t: Tr; surfaceLight: string;
}) {
  return createPortal(
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        display: "flex", alignItems: "center", justifyContent: "center",
        backgroundColor: dark ? "rgba(30,29,26,0.88)" : "rgba(252,246,239,0.88)",
        backdropFilter: "blur(6px)",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 14, scale: 0.97 }}
        transition={{ duration: 0.28, delay: 0.08 }}
        style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: "24px",
          background: dark ? "#2d2b28" : surfaceLight,
          border: `1px dashed ${dark ? DARK_BORDER : BORDER_COL}`,
          borderRadius: "16px",
          padding: "36px 44px",
          maxWidth: "320px",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
          <span style={{ fontFamily: FONT_SERIF, fontSize: "24px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>
            {t.timesUp}
          </span>
          {isVisual && (
            <span style={{ fontFamily: FONT_SANS, fontSize: "13px", color: dark ? DARK_MUTED : "#9a9daa", fontStyle: "italic", textAlign: "center" }}>
              {t.timesUpSub}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
          <button
            onClick={onDelete}
            style={{
              fontFamily: FONT_SANS, fontSize: "13px", padding: "7px 18px",
              borderRadius: "100px", border: `1px dashed ${dark ? DARK_BORDER : BORDER_COL}`,
              background: "transparent", color: dark ? DARK_MUTED : "#9a9daa", cursor: "pointer",
            }}
          >{t.deleteText}</button>
          {isVisual && (
            <button
              onClick={onReveal}
              style={{
                fontFamily: FONT_SANS, fontSize: "13px", padding: "7px 18px",
                borderRadius: "100px", border: `1px solid ${dark ? "rgba(240,232,220,0.5)" : BORDER_COL}`,
                background: dark ? "rgba(240,232,220,0.08)" : "rgba(85,85,85,0.06)",
                color: dark ? DARK_TEXT : LIGHT_TEXT, cursor: "pointer",
              }}
            >{t.revealText}</button>
          )}
          <button
            onClick={onCopy}
            style={{
              fontFamily: FONT_SANS, fontSize: "13px", padding: "7px 18px",
              borderRadius: "100px", border: "none",
              background: dark ? DARK_TEXT : LIGHT_TEXT,
              color: dark ? DARK_BG : LIGHT_BG, cursor: "pointer",
            }}
          >{copied ? t.copied : t.copyText}</button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}

// ── Style helpers ─────────────────────────────────────────────────────────────
function btnStyle(dark: boolean, extra?: React.CSSProperties, surfaceLight = "#fcf6ef"): React.CSSProperties {
  return {
    background: dark ? "rgba(240,232,220,0.06)" : surfaceLight,
    border: `1px dashed ${BORDER_COL}`,
    borderRadius: "4px",
    cursor: "pointer", outline: "none",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0,
    color: dark ? DARK_TEXT : LIGHT_TEXT,
    fontFamily: FONT_SANS, fontSize: "14px", fontWeight: 400, lineHeight: "normal",
    height: "31px", padding: "0 12px",
    ...extra,
  };
}

function navItemStyle(dark: boolean, active: boolean, surfaceLight = "#fcf6ef", bgHue: number | null = null): React.CSSProperties {
  const activeDarkBg = bgHue === null ? "#1e1d1b" : `oklch(18% 0.025 ${bgHue})`;
  const activeLightText = bgHue === null ? "#f5f0ea" : `oklch(93% 0.012 ${bgHue})`;
  return {
    background: active
      ? (dark ? "rgba(240,232,220,0.85)" : activeDarkBg)
      : (dark ? "rgba(240,232,220,0.06)" : surfaceLight),
    border: active
      ? (dark ? "1px solid rgba(240,232,220,0.85)" : `1px solid ${activeDarkBg}`)
      : `1px dashed ${BORDER_COL}`,
    borderRadius: "4px", cursor: "pointer", outline: "none",
    display: "flex", alignItems: "center", justifyContent: "flex-start",
    color: active ? (dark ? "#1e1d1b" : activeLightText) : (dark ? DARK_TEXT : LIGHT_TEXT),
    fontFamily: FONT_SANS, fontSize: "14px", fontWeight: active ? 500 : 400, lineHeight: "normal",
    height: "31px", padding: "0 12px", whiteSpace: "nowrap",
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

// ── Session ID ────────────────────────────────────────────────────────────────
function getOrCreateSessionId(): string {
  const key = "diplom_session_id";
  let id = localStorage.getItem(key);
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(key, id); }
  return id;
}

// ── Saved modal ───────────────────────────────────────────────────────────────
function SavedModal({ dark, savedId, lang, onClose, onPlayground, surfaceLight }: {
  dark: boolean; savedId: string; lang: "de" | "en";
  onClose: () => void; onPlayground: () => void; surfaceLight: string;
}) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}/Diplom-Projekt/new?tool=${savedId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  };

  const DE = lang === "de";

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      style={{
        position: "fixed", inset: 0, zIndex: 400,
        display: "flex", alignItems: "center", justifyContent: "center",
        backgroundColor: dark ? "rgba(30,29,26,0.9)" : "rgba(252,246,239,0.9)",
        backdropFilter: "blur(6px)",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 14, scale: 0.97 }}
        transition={{ duration: 0.25, delay: 0.06 }}
        onClick={e => e.stopPropagation()}
        style={{
          display: "flex", flexDirection: "column", alignItems: "center", gap: "24px",
          background: dark ? "#2d2b28" : surfaceLight,
          border: `1px dashed ${dark ? DARK_BORDER : BORDER_COL}`,
          borderRadius: "16px", padding: "36px 44px",
          maxWidth: "340px", width: "90vw", boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
          <span style={{ fontFamily: FONT_SERIF, fontSize: "24px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>
            {DE ? "Gespeichert." : "Saved."}
          </span>
          <span style={{ fontFamily: FONT_SANS, fontSize: "13px", color: dark ? DARK_MUTED : "#9a9daa", textAlign: "center" }}>
            {DE ? "Dein Tool ist bereit." : "Your tool is ready."}
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", width: "100%" }}>
          <button
            onClick={onPlayground}
            style={{
              fontFamily: FONT_SANS, fontSize: "14px", padding: "10px 18px",
              borderRadius: "8px", border: `1px dashed ${dark ? DARK_BORDER : BORDER_COL}`,
              background: "transparent", color: dark ? DARK_TEXT : LIGHT_TEXT,
              cursor: "pointer", textAlign: "center",
            }}
          >{DE ? "Im Playground ansehen" : "View in Playground"}</button>
          <button
            onClick={handleCopyLink}
            style={{
              fontFamily: FONT_SANS, fontSize: "14px", padding: "10px 18px",
              borderRadius: "8px", border: `1px solid ${dark ? "rgba(240,232,220,0.4)" : BORDER_COL}`,
              background: dark ? "rgba(240,232,220,0.06)" : "rgba(85,85,85,0.04)",
              color: dark ? DARK_TEXT : LIGHT_TEXT,
              cursor: "pointer", textAlign: "center",
            }}
          >{copied ? (DE ? "Kopiert ✓" : "Copied ✓") : (DE ? "Link kopieren" : "Copy link")}</button>
          <button
            onClick={() => navigate(`/new?tool=${savedId}`)}
            style={{
              fontFamily: FONT_SANS, fontSize: "14px", padding: "10px 18px",
              borderRadius: "8px", border: "none",
              background: dark ? DARK_TEXT : LIGHT_TEXT,
              color: dark ? DARK_BG : LIGHT_BG,
              cursor: "pointer", textAlign: "center",
            }}
          >{DE ? "Benutzen" : "Use"}</button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function New() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = useMemo(() => getOrCreateSessionId(), []);
  const asciiSnapshotRef = useRef<() => string | null>(() => null);

  // Save state
  const [saving, setSaving]               = useState(false);
  const [savedId, setSavedId]             = useState<string | null>(null);
  const [saveError, setSaveError]         = useState<string | null>(null);
  const [currentToolId, setCurrentToolId] = useState<string | null>(null);
  const [loadedAsciiImage, setLoadedAsciiImage] = useState<string | null>(null);

  // Loaded-tool ownership & edit mode
  const [loadedToolIsOwn, setLoadedToolIsOwn]         = useState(false);
  const [editModeEnabledState, setEditModeEnabledState] = useState(false);
  const [infoModalOpen, setInfoModalOpen]               = useState(false);

  // UI
  const [lang, setLang]               = useState<"de" | "en">(() => (localStorage.getItem("appLang") as "de" | "en") ?? "de");
  const [dark, setDark]               = useState(false);
  const [visible, setVisible]         = useState(true);
  const [menuOpen, setMenuOpen]       = useState(false);
  const [menuHovered, setMenuHovered] = useState(false);
  const [rulesOpen, setRulesOpen]     = useState(false);
  const [activeCategory, setActiveCategory] = useState("Time");
  const [identityOpen, setIdentityOpen]     = useState(false);
  const writingFocusRef = useRef<(() => void) | null>(null);

  // Time params
  const [timerEnabled, setTimerEnabled]     = useState(false);
  const [timerMode, setTimerMode]           = useState<"fixed" | "free">("fixed");
  const [timerMinutes, setTimerMinutes]     = useState(10);
  const [visualTimer, setVisualTimer]       = useState(false);
  const [timerUserReset, setTimerUserReset] = useState(false);
  const [cursorRunning, setCursorRunning]   = useState(false);

  // Visibility params
  const [visibility, setVisibility] = useState<"visible" | "invisible" | "sentence" | "word" | "char">("visible");

  // Correction params
  const [deleteMode, setDeleteMode]               = useState<DeleteMode>("all");
  const [correctionVisible, setCorrectionVisible] = useState(false);

  // Stability params
  const [textFliegtEnabled, setTextFliegtEnabled]         = useState(false);
  const [fliegtUnit, setFliegtUnit]                       = useState<"Sätze" | "Wörter" | "Buchstabe">("Sätze");
  const [fliegtZeitpunkt, setFliegtZeitpunkt]             = useState(2);
  const [fliegtSchnelligkeit, setFliegtSchnelligkeit]     = useState(3);
  const [textVerblassEnabled, setTextVerblassEnabled]     = useState(false);
  const [verblassZeitpunkt, setVerblassZeitpunkt]         = useState(2);
  const [verblassSchnelligkeit, setVerblassSchnelligkeit] = useState(3);

  // Position params
  const [positionMode, setPositionMode] = useState<"standard" | "spiral" | "random">("standard");

  // Look & Feel params
  const [grainLevel, setGrainLevel]       = useState(0);
  const [textSizeLevel, setTextSizeLevel] = useState(46);
  const [bgHue, setBgHue]                 = useState<number | null>(null);

  // Identity panel state
  const [toolName, setToolName]               = useState("");
  const [prompts, setPrompts]                 = useState<string[]>([""]);
  const [toolDescription, setToolDescription] = useState("");

  // Writing engine state
  const [positions, setPositions] = useState<Position[]>([]);
  const [cursor, setCursor]       = useState(0);
  const lastKeyPressTimestamp     = useRef(0);

  // Timer runtime state
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft]         = useState(0);
  const [timerDone, setTimerDone]       = useState(false);
  const [textRevealed, setTextRevealed] = useState(false);
  const [copied, setCopied]             = useState(false);

  const t: Tr = TRANSLATIONS[lang];

  // Timer initialization
  useEffect(() => {
    if (!timerEnabled) {
      setTimerRunning(false); setTimeLeft(0); setTimerDone(false); setTextRevealed(false);
      return;
    }
    const total = (timerMinutes || 1) * 60;
    setTimeLeft(total); setTimerRunning(true); setTimerDone(false); setTextRevealed(false);
  }, [timerEnabled, timerMode, timerMinutes]);

  // Timer countdown
  useEffect(() => {
    if (!timerRunning || timeLeft <= 0) return;
    const id = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { setTimerRunning(false); setTimerDone(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timerRunning]);

  // Timer reset on first keystroke
  useEffect(() => {
    if (!timerUserReset || !timerEnabled) return;
    if (positions.length === 1 && !timerRunning) {
      const total = (timerMinutes || 1) * 60;
      setTimeLeft(total); setTimerRunning(true); setTimerDone(false); setTextRevealed(false);
    }
  }, [positions.length, timerUserReset, timerEnabled, timerMinutes, timerRunning]);

  // Load tool from URL ?tool=ID
  useEffect(() => {
    const toolId = searchParams.get("tool");
    if (!toolId) return;
    getNewToolById(toolId).then(tool => {
      if (!tool) return;
      setCurrentToolId(toolId);
      setLoadedToolIsOwn(tool.params.sessionId === sessionId);
      setEditModeEnabledState(false);
      const p = tool.params;
      setToolName(p.displayName ?? tool.name);
      setToolDescription(tool.description ?? "");
      setPrompts(p.prompts?.length ? p.prompts : [""]);
      setTimerEnabled(p.timerEnabled === true);
      setTimerMode((p.timerMode as "fixed" | "free") ?? "fixed");
      setTimerMinutes(typeof p.timerMinutes === "number" ? p.timerMinutes : 10);
      setVisualTimer(p.visualTimer === true);
      setTimerUserReset(p.timerUserReset === true);
      setCursorRunning(p.cursorRunning === true);
      setVisibility((p.visibility as typeof visibility) ?? "visible");
      setDeleteMode((p.deleteMode as typeof deleteMode) ?? "all");
      setCorrectionVisible(p.correctionVisible === true);
      setTextFliegtEnabled(p.textFliegtEnabled === true);
      setFliegtUnit((p.fliegtUnit as typeof fliegtUnit) ?? "Sätze");
      setFliegtZeitpunkt(typeof p.fliegtZeitpunkt === "number" ? p.fliegtZeitpunkt : 2);
      setFliegtSchnelligkeit(typeof p.fliegtSchnelligkeit === "number" ? p.fliegtSchnelligkeit : 3);
      setTextVerblassEnabled(p.textVerblassEnabled === true);
      setVerblassZeitpunkt(typeof p.verblassZeitpunkt === "number" ? p.verblassZeitpunkt : 2);
      setVerblassSchnelligkeit(typeof p.verblassSchnelligkeit === "number" ? p.verblassSchnelligkeit : 3);
      setPositionMode((p.positionMode as typeof positionMode) ?? "standard");
      setGrainLevel(typeof p.grainLevel === "number" ? p.grainLevel : 0);
      setTextSizeLevel(typeof p.textSizeLevel === "number" ? p.textSizeLevel : 20);
      setBgHue(typeof p.bgHue === "number" ? p.bgHue : null);
      if (p.asciiImage) setLoadedAsciiImage(p.asciiImage);
    }).catch((err) => {
      console.error("[New] Failed to load tool:", err);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpdate = useCallback((newPos: Position[], newCursor: number) => {
    setPositions(newPos); setCursor(newCursor);
  }, []);

  const handleCopy = useCallback(() => {
    const text = extractText(positions);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [positions]);

  const handleDelete = useCallback(() => {
    setPositions([]); setCursor(0);
    setTimerDone(false); setTextRevealed(false);
    setTimerRunning(false); setTimeLeft(0);
  }, []);

  const handleReveal = useCallback(() => setTextRevealed(true), []);

  const handleSave = useCallback(async () => {
    if (!toolName.trim()) {
      // Fix 1: Auto-open Identity panel so user sees the error + name field
      setRulesOpen(true);
      setIdentityOpen(true);
      setSaveError(lang === "de" ? "Bitte gib deinem Tool einen Namen." : "Please give your tool a name.");
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const asciiImage = asciiSnapshotRef.current?.() ?? null;
      const params = {
        source: "new" as const,
        sessionId,
        prompts,
        asciiImage,
        timerEnabled, timerMode, timerMinutes, visualTimer, timerUserReset, cursorRunning,
        visibility, deleteMode, correctionVisible,
        textFliegtEnabled, fliegtUnit, fliegtZeitpunkt, fliegtSchnelligkeit,
        textVerblassEnabled, verblassZeitpunkt, verblassSchnelligkeit,
        positionMode, grainLevel, textSizeLevel, bgHue,
      };
      // Fix 3: update existing tool if loaded via URL, otherwise create new
      const id = currentToolId
        ? await updateNewTool(currentToolId, toolName, toolDescription, params)
        : await saveNewTool(toolName, toolDescription, params);
      if (!currentToolId) setCurrentToolId(id);
      setSavedId(id);
    } catch {
      setSaveError(lang === "de" ? "Fehler beim Speichern. Bitte erneut versuchen." : "Error saving. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [
    toolName, toolDescription, prompts, sessionId, lang, currentToolId,
    timerEnabled, timerMode, timerMinutes, visualTimer, timerUserReset, cursorRunning,
    visibility, deleteMode, correctionVisible,
    textFliegtEnabled, fliegtUnit, fliegtZeitpunkt, fliegtSchnelligkeit,
    textVerblassEnabled, verblassZeitpunkt, verblassSchnelligkeit,
    positionMode, grainLevel, textSizeLevel, bgHue,
  ]);

  // ── Computed values ──────────────────────────────────────────────────────
  const canEdit = currentToolId === null || editModeEnabledState;
  const computedFontSize = 14 + Math.round(textSizeLevel / 100 * 22);
  const timerTotalSecs   = (timerMinutes || 1) * 60;
  const timerProgress    = timerEnabled && timerTotalSecs > 0
    ? Math.max(0, 1 - timeLeft / timerTotalSecs) : 0;

  const { surfaceLight, surfaceDark } = getLookFeelColors(bgHue);
  const darkColors = getLookFeelDarkColors(bgHue);

  const bg = dark
    ? darkColors.darkBg
    : timerEnabled && visualTimer && timerRunning
      ? lerpColor(LIGHT_BG, DARK_BG, timerProgress)
      : timerEnabled && visualTimer && timerDone && !textRevealed
        ? DARK_BG
        : surfaceLight;

  const textColor = dark
    ? DARK_TEXT
    : timerEnabled && visualTimer && (timerRunning || (timerDone && !textRevealed))
      ? lerpColor(LIGHT_TEXT, DARK_TEXT, Math.min(1, timerProgress * 1.8))
      : timerEnabled && visualTimer && timerDone && textRevealed
        ? DARK_TEXT
        : LIGHT_TEXT;

  const iconColor      = textColor;
  const sidebarBg      = dark ? darkColors.darkSidebarBg : surfaceDark;
  const catActiveBg    = dark ? darkColors.darkActiveCatBg : surfaceLight;
  const catInactiveBg  = dark ? darkColors.darkInactiveCatBg : surfaceDark;
  const settingsCardBg = dark ? darkColors.darkCardBg : surfaceLight;
  const descColor      = dark ? DARK_MUTED : "#7c7c7c";
  const innerBorder    = dark ? DARK_BORDER : BORDER_COL;

  const darkBtnBg  = rulesOpen ? (dark ? "rgba(240,232,220,0.1)" : surfaceDark) : (dark ? "rgba(240,232,220,0.06)" : surfaceLight);
  const rulesBtnBg = rulesOpen ? (dark ? "rgba(240,232,220,0.1)" : surfaceDark) : (dark ? "rgba(240,232,220,0.06)" : surfaceLight);

  // Re-focus writing area after panel close or category switch
  useEffect(() => {
    if (!rulesOpen) setTimeout(() => writingFocusRef.current?.(), 50);
  }, [rulesOpen]);
  useEffect(() => {
    setTimeout(() => writingFocusRef.current?.(), 50);
  }, [activeCategory, positionMode]);

  const wzVisibility = visibility === "invisible" ? "hidden" : visibility as "visible"|"hidden"|"sentence"|"word"|"char";
  const wzDeleteMode = deleteMode === "all" ? "deletable" : deleteMode === "none" ? "no-delete" : deleteMode as "sentence"|"word";
  const wzCorrection = correctionVisible ? "tippex" as const : "hidden" as const;
  const wzDriftSpeed = fliegtSchnelligkeit * 50;
  const wzVerblSpeed = verblassSchnelligkeit * 50;
  const wzDriftDelay = fliegtZeitpunkt * 60;
  const wzVerblDelay = verblassZeitpunkt * 60;

  const showDoneModal = timerDone && !textRevealed;
  const showRevealBar = timerDone && textRevealed && visualTimer;
  const wordCount     = extractText(positions).split(/\s+/).filter(Boolean).length;

  // Delete option labels keyed by value
  const deleteOptLabels: Record<DeleteMode, string> = {
    all:      t.deleteAll,
    none:     t.deleteNone,
    sentence: t.deleteSentence,
    word:     t.deleteWord,
  };

  return (
    <div
      style={{ minHeight: "100vh", background: bg, position: "relative", transition: "background 1s linear" }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />
      <style>{`@keyframes cursorBlink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>

      {/* ── Tool name header (center top, when loaded from URL) ──────────── */}
      {currentToolId && visible && (
        <div style={{
          position: "fixed", top: "24px", left: "50%", transform: "translateX(-50%)",
          display: "flex", alignItems: "center", gap: "8px", zIndex: 21,
        }}>
          <span style={{
            fontFamily: FONT_SERIF, fontSize: "15px",
            color: dark ? DARK_TEXT : LIGHT_TEXT,
            opacity: 0.75, whiteSpace: "nowrap", maxWidth: "280px",
            overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {toolName || "Untitled"}
          </span>
          <button
            onClick={(e) => { e.stopPropagation(); setInfoModalOpen(true); }}
            style={{
              width: "22px", height: "22px", borderRadius: "50%",
              border: `1px dashed ${BORDER_COL}`,
              background: "transparent", cursor: "pointer", outline: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: FONT_SANS, fontSize: "12px",
              color: dark ? DARK_MUTED : "#9a9daa",
              flexShrink: 0,
            }}
          >ⓘ</button>
        </div>
      )}

      {/* ── Info modal ────────────────────────────────────────────────────── */}
      {infoModalOpen && createPortal(
        <AnimatePresence>
          <motion.div
            key="info-backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "fixed", inset: 0, zIndex: 500,
              display: "flex", alignItems: "center", justifyContent: "center",
              backgroundColor: dark ? "rgba(30,29,26,0.85)" : "rgba(252,246,239,0.88)",
              backdropFilter: "blur(6px)",
            }}
            onClick={() => setInfoModalOpen(false)}
          >
            <motion.div
              key="info-card"
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.97 }}
              transition={{ duration: 0.2, delay: 0.05 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: dark ? darkColors.darkCardBg : surfaceLight,
                border: `1px dashed ${dark ? DARK_BORDER : BORDER_COL}`,
                borderRadius: "16px", padding: "36px 40px",
                maxWidth: "420px", width: "90vw", boxSizing: "border-box",
                display: "flex", flexDirection: "column", gap: "20px",
              }}
            >
              {loadedAsciiImage && (
                <img
                  src={loadedAsciiImage}
                  alt={toolName || "Tool"}
                  style={{
                    width: "100%", borderRadius: "8px",
                    aspectRatio: "3/2", objectFit: "cover", display: "block",
                  }}
                />
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontFamily: FONT_SERIF, fontSize: "24px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>
                  {toolName || "Untitled"}
                </span>
                {toolDescription && (
                  <span style={{ fontFamily: FONT_SANS, fontSize: "14px", color: dark ? DARK_MUTED : "#7c7c7c", lineHeight: "1.55" }}>
                    {toolDescription}
                  </span>
                )}
              </div>
              {prompts.filter(p => p.trim()).length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <span style={{ fontFamily: FONT_SANS, fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", color: dark ? DARK_MUTED : "#9a9daa", textTransform: "uppercase" }}>
                    {lang === "de" ? "Schreibanstöße" : "Writing Prompts"}
                  </span>
                  {prompts.filter(p => p.trim()).map((pr, i) => (
                    <span key={i} style={{ fontFamily: FONT_SANS, fontSize: "14px", color: dark ? DARK_TEXT : LIGHT_TEXT, lineHeight: "1.5", paddingLeft: "8px", borderLeft: `2px solid ${dark ? "rgba(240,232,220,0.25)" : "rgba(164,164,164,0.4)"}` }}>
                      {pr}
                    </span>
                  ))}
                </div>
              )}
              <button
                onClick={() => setInfoModalOpen(false)}
                style={{
                  alignSelf: "flex-end",
                  fontFamily: FONT_SANS, fontSize: "13px", padding: "7px 18px",
                  borderRadius: "100px", border: `1px dashed ${dark ? DARK_BORDER : BORDER_COL}`,
                  background: "transparent", color: dark ? DARK_MUTED : "#9a9daa", cursor: "pointer",
                }}
              >{lang === "de" ? "Schließen" : "Close"}</button>
            </motion.div>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}

      {/* ── Noise overlay ─────────────────────────────────────────────────── */}
      {grainLevel > 0 && (
        <div
          aria-hidden
          style={{
            position: "fixed", inset: 0, zIndex: 3, pointerEvents: "none",
            opacity: (grainLevel / 100) * 0.72,
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat", backgroundSize: "200px 200px",
          }}
        />
      )}

      {/* ── Writing zone ─────────────────────────────────────────────────── */}
      <motion.div
        animate={{
          paddingLeft: rulesOpen ? "507px" : "165px",
        }}
        transition={SPRING}
        style={{
          position: "fixed", inset: 0,
          display: "flex", flexDirection: "column",
          paddingTop: "24px",
          paddingRight: "240px",
          zIndex: 1,
        }}
      >
        <WritingZone
            positions={positions}
            cursor={cursor}
            onUpdate={handleUpdate}
            lastKeyPressTimestamp={lastKeyPressTimestamp}
            panelOpen={true}
            focusRef={writingFocusRef}
            textColor={textColor}
            coverBgColor={bg}
            visibility={wzVisibility}
            deleteMode={wzDeleteMode}
            correctionMode={wzCorrection}
            cursorLaeuftWeiter={cursorRunning}
            driftet={textFliegtEnabled}
            driftSaetze={fliegtUnit === "Sätze"}
            driftWoerter={fliegtUnit === "Wörter"}
            driftBuchstaben={fliegtUnit === "Buchstabe"}
            driftDelay={wzDriftDelay}
            driftSpeed={wzDriftSpeed}
            verblasst={textVerblassEnabled}
            verblassenDelay={wzVerblDelay}
            verblassenSpeed={wzVerblSpeed}
            spiralModus={positionMode === "spiral"}
            textAppearsRandom={positionMode === "random"}
            randomMode="words"
            writingPrompt={prompts[0] || t.writingPrompt}
            fontSize={computedFontSize}
            fontFamily={FONT_SERIF}
            centeredPrompt={false}
            containerWidth="764px"
          />
      </motion.div>

      {/* ── Floating ◑ button ─────────────────────────────────────────────── */}
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

      {/* ── Floating Rules/× button ───────────────────────────────────────── */}
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
                <motion.span key="r" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }} style={{ fontSize: "14px" }}>{t.rulesBtn}</motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
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
                <span style={{ fontFamily: FONT_SERIF, fontSize: "22px", color: dark ? DARK_TEXT : LIGHT_TEXT, lineHeight: "normal" }}>{t.rulesHeading}</span>
                <span style={{ fontFamily: FONT_SANS, fontSize: "14px", color: descColor, lineHeight: "normal" }}>{t.rulesSubtitle}</span>
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
                      border: `1px dashed ${innerBorder}`,
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
                  >{t.catLabel(cat)}</button>
                ))}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {canEdit ? (
                <>
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
                    }}>{t.identityBtn}</button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                      width: "105px", borderRadius: "4px", background: "transparent",
                      border: `1px dashed ${innerBorder}`,
                      cursor: saving ? "wait" : "pointer", outline: "none",
                      padding: "6px 12px",
                      fontFamily: FONT_SANS, fontSize: "16px", fontWeight: 400,
                      color: dark ? DARK_TEXT : LIGHT_TEXT,
                      lineHeight: "22px", textAlign: "center",
                      opacity: saving ? 0.6 : 1,
                    }}>{saving ? "…" : t.saveBtn}</button>
                </>
              ) : loadedToolIsOwn ? (
                <button
                  onClick={() => { setEditModeEnabledState(true); setIdentityOpen(false); }}
                  style={{
                    width: "105px", borderRadius: "4px", background: "transparent",
                    border: `1px dashed ${innerBorder}`,
                    cursor: "pointer", outline: "none",
                    padding: "10px 12px",
                    fontFamily: FONT_SANS, fontSize: "15px", fontWeight: 400,
                    color: dark ? DARK_TEXT : LIGHT_TEXT,
                    lineHeight: "22px", textAlign: "center",
                  }}
                >
                  {lang === "de" ? "Bearbeiten" : "Edit"}
                </button>
              ) : (
                <span style={{
                  fontFamily: FONT_SANS, fontSize: "12px",
                  color: dark ? DARK_MUTED : "#9a9daa",
                  lineHeight: "1.4", textAlign: "center",
                  opacity: 0.7,
                }}>
                  {lang === "de" ? "Nur ansehen" : "View only"}
                </span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Detail panel ──────────────────────────────────────────────────── */}
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
              boxSizing: "border-box", overflow: "hidden", zIndex: 20,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Read-only banner for non-editable tools */}
            {!canEdit && !identityOpen && (
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0, zIndex: 10,
                padding: "8px 16px",
                background: dark ? "rgba(30,28,26,0.9)" : "rgba(252,246,239,0.9)",
                borderTop: `1px dashed ${dark ? DARK_BORDER : BORDER_COL}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                backdropFilter: "blur(4px)",
              }}>
                <span style={{ fontFamily: FONT_SANS, fontSize: "12px", color: dark ? DARK_MUTED : "#9a9daa" }}>
                  {lang === "de" ? "Nur ansehen – Regeln nicht änderbar" : "View only – rules cannot be changed"}
                </span>
              </div>
            )}
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
                  <span style={{ fontFamily: FONT_SERIF, fontSize: "22px", color: dark ? DARK_TEXT : LIGHT_TEXT, lineHeight: "normal" }}>{t.identityHeading}</span>
                  <span style={{ fontFamily: FONT_SANS, fontSize: "14px", color: descColor, lineHeight: "1.45" }}>
                    {t.identitySubtitle}
                  </span>

                  <AsciiImagePanel
                    dark={dark}
                    background={settingsCardBg}
                    textColor={dark ? DARK_TEXT : LIGHT_TEXT}
                    fontSans={FONT_SANS}
                    snapshotRef={asciiSnapshotRef}
                    initialImage={loadedAsciiImage}
                  />

                  {/* Name */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <span style={{ fontFamily: FONT_SERIF, fontSize: "19px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>{t.nameHeading}</span>
                    <span style={{ fontFamily: FONT_SANS, fontSize: "13px", color: descColor, lineHeight: "1.45" }}>
                      {t.nameHint}
                    </span>
                    <div style={{ border: `1px dashed ${innerBorder}`, borderRadius: "8px", padding: "10px 14px", background: settingsCardBg }}>
                      <span style={{ fontFamily: FONT_SANS, fontSize: "15px", color: dark ? "rgba(240,232,220,0.38)" : "rgba(85,85,85,0.38)" }}>
                        Write and think&hellip;
                      </span>
                    </div>
                    <input
                      className="identity-input"
                      placeholder={t.namePlaceholder}
                      value={toolName}
                      onChange={(e) => { setToolName(e.target.value); if (e.target.value.trim()) setSaveError(null); }}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        width: "100%", boxSizing: "border-box",
                        border: `1px dashed ${innerBorder}`, borderRadius: "8px",
                        padding: "10px 14px", background: settingsCardBg,
                        fontFamily: FONT_SANS, fontSize: "15px",
                        color: dark ? DARK_TEXT : LIGHT_TEXT, outline: "none",
                      }}
                    />
                  </div>

                  {/* Prompts */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <span style={{ fontFamily: FONT_SERIF, fontSize: "19px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>{t.promptHeading}</span>
                    <span style={{ fontFamily: FONT_SANS, fontSize: "13px", color: descColor, lineHeight: "1.45" }}>
                      {t.promptHint}
                    </span>
                    {prompts.map((p, i) => (
                      <textarea
                        key={i}
                        className="identity-textarea"
                        placeholder={t.promptPlaceholder}
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
                    >{t.promptAdd}</button>
                  </div>

                  {/* Description */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <span style={{ fontFamily: FONT_SERIF, fontSize: "19px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>{t.descHeading}</span>
                    <textarea
                      className="identity-textarea"
                      placeholder={t.descPlaceholder}
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
                      }}
                    />
                  </div>
                </div>
                <div style={{ padding: "16px 24px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                  {saveError && (
                    <span style={{ fontFamily: FONT_SANS, fontSize: "12px", color: "#e05252", textAlign: "center" }}>{saveError}</span>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    style={{
                      width: "100%", padding: "12px",
                      background: saving ? "transparent" : (dark ? "rgba(240,232,220,0.1)" : "rgba(85,85,85,0.07)"),
                      border: `1px dashed ${innerBorder}`,
                      borderRadius: "8px", cursor: saving ? "wait" : "pointer", outline: "none",
                      fontFamily: FONT_SANS, fontSize: "16px",
                      color: dark ? DARK_TEXT : LIGHT_TEXT,
                      opacity: saving ? 0.6 : 1,
                    }}
                  >{saving ? (lang === "de" ? "Speichert…" : "Saving…") : t.saveBtn}</button>
                </div>
              </>
            ) : (
              /* ── Category detail ────────────────────────────────────────── */
              <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px", overflowY: "auto", flex: 1, pointerEvents: canEdit ? "auto" : "none", opacity: canEdit ? 1 : 0.75 }}>
                <span style={{ fontFamily: FONT_SERIF, fontSize: "22px", color: dark ? DARK_TEXT : LIGHT_TEXT, lineHeight: "normal" }}>
                  {t.catHeading(SIDEBAR_CATS.find(c => c.en === activeCategory) ?? { en: activeCategory, de: activeCategory })}
                </span>

                {t.catDesc[activeCategory] && (
                  <span style={{ fontFamily: FONT_SANS, fontSize: "15px", color: descColor, lineHeight: "1.5" }}>
                    {t.catDesc[activeCategory]}
                  </span>
                )}

                {/* ── Zeit / Time ───────────────────────────────────────── */}
                {activeCategory === "Time" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ background: settingsCardBg, border: `1px dashed ${innerBorder}`, borderRadius: "8px", padding: "12px 24px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "36px" }}>
                        <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>{t.timerLabel}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontFamily: FONT_SANS, fontSize: "11px", fontWeight: 500, color: descColor }}>
                            {timerEnabled ? t.on : t.off}
                          </span>
                          <ToggleBtn on={timerEnabled} onToggle={() => setTimerEnabled(v => !v)} dark={dark} />
                        </div>
                      </div>
                    </div>

                    <AnimatePresence>
                      {timerEnabled && (
                        <motion.div
                          key="timer-opts"
                          initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                          transition={{ duration: 0.18 }}
                          style={{ display: "flex", flexDirection: "column", gap: "8px" }}
                        >
                          <div style={{ display: "flex", gap: "8px" }}>
                            {(["fixed", "free"] as const).map(m => (
                              <button key={m} onClick={() => setTimerMode(m)} style={{
                                flex: 1, height: "36px",
                                background: timerMode === m ? (dark ? "rgba(240,232,220,0.15)" : "rgba(85,85,85,0.08)") : settingsCardBg,
                                border: `1px dashed ${timerMode === m ? (dark ? DARK_TEXT : LIGHT_TEXT) : innerBorder}`,
                                borderRadius: "8px", cursor: "pointer", outline: "none",
                                fontFamily: FONT_SANS, fontSize: "14px", color: dark ? DARK_TEXT : LIGHT_TEXT,
                              }}>{m === "fixed" ? t.timerFixed : t.timerFree}</button>
                            ))}
                          </div>
                          <div style={{ background: settingsCardBg, border: `1px dashed ${innerBorder}`, borderRadius: "8px", padding: "12px 24px" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "36px" }}>
                              <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>{t.minutes}</span>
                              <input
                                type="text"
                                value={timerMinutes === 0 ? "" : timerMinutes}
                                onChange={e => { const v = e.target.value; if (v === "") { setTimerMinutes(0); return; } if (/^\d+$/.test(v)) setTimerMinutes(Number(v)); }}
                                onClick={e => e.stopPropagation()}
                                style={{ width: "48px", height: "28px", background: "transparent", border: `1px dashed ${innerBorder}`, borderRadius: "4px", textAlign: "center", fontFamily: FONT_SANS, fontSize: "14px", color: dark ? DARK_TEXT : LIGHT_TEXT, outline: "none" }}
                              />
                            </div>
                          </div>
                          <div style={{ background: settingsCardBg, border: `1px dashed ${innerBorder}`, borderRadius: "8px", padding: "12px 24px" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "36px" }}>
                              <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>{t.visualTimer}</span>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <span style={{ fontFamily: FONT_SANS, fontSize: "11px", fontWeight: 500, color: descColor }}>{visualTimer ? t.on : t.off}</span>
                                <ToggleBtn on={visualTimer} onToggle={() => setVisualTimer(v => !v)} dark={dark} />
                              </div>
                            </div>
                          </div>
                          <div
                            style={{ background: settingsCardBg, border: `1px dashed ${innerBorder}`, borderRadius: "8px", padding: "12px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
                            onClick={e => { e.stopPropagation(); setTimerUserReset(v => !v); }}
                          >
                            <span style={{ fontFamily: FONT_SANS, fontSize: "14px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>{t.userReset}</span>
                            <RadioCircle selected={timerUserReset} dark={dark} />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div style={{ background: settingsCardBg, border: `1px dashed ${innerBorder}`, borderRadius: "8px", padding: "12px 24px", display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "36px" }}>
                        <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>{t.cursorRunning}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontFamily: FONT_SANS, fontSize: "11px", fontWeight: 500, color: descColor }}>{cursorRunning ? t.on : t.off}</span>
                          <ToggleBtn on={cursorRunning} onToggle={() => setCursorRunning(v => !v)} dark={dark} />
                        </div>
                      </div>
                      <p style={{ fontFamily: FONT_SANS, fontSize: "13px", color: descColor, lineHeight: "1.45", margin: 0 }}>
                        {t.cursorRunningDesc}
                      </p>
                    </div>
                  </div>
                )}

                {/* ── Sichtbarkeit / Visibility ─────────────────────────── */}
                {activeCategory === "Visibility" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {(["visible", "invisible", "sentence", "word", "char"] as const).map((val) => (
                      <button key={val} onClick={() => setVisibility(val)} style={{
                        width: "100%", height: "44px",
                        background: visibility === val ? (dark ? "rgba(240,232,220,0.22)" : "rgba(85,85,85,0.13)") : settingsCardBg,
                        border: visibility === val
                          ? `2px solid ${dark ? "rgba(240,232,220,0.85)" : LIGHT_TEXT}`
                          : `1px dashed ${innerBorder}`,
                        borderRadius: "8px", padding: "0 16px",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        cursor: "pointer", outline: "none",
                        fontFamily: FONT_SANS, fontSize: "15px",
                        color: dark ? DARK_TEXT : LIGHT_TEXT,
                        fontWeight: visibility === val ? 600 : 400,
                        boxSizing: "border-box", transition: "background 0.12s, border 0.12s",
                      }}>
                        {val === "visible" ? t.visVisible
                          : val === "invisible" ? t.visInvisible
                          : val === "sentence" ? t.visSentence
                          : val === "word" ? t.visWord
                          : t.visChar}
                        <RadioCircle selected={visibility === val} dark={dark} />
                      </button>
                    ))}
                  </div>
                )}

                {/* ── Korrigieren / Correction ──────────────────────────── */}
                {activeCategory === "Correction" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ background: settingsCardBg, border: `1px dashed ${innerBorder}`, borderRadius: "8px", padding: "16px 24px", display: "flex", flexDirection: "column", gap: "10px" }}>
                      <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>{t.deleteHeading}</span>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {DELETE_OPTS_KEYS.map(key => (
                          <div key={key} onClick={() => setDeleteMode(key)} style={{
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            border: deleteMode === key
                              ? `2px solid ${dark ? "rgba(240,232,220,0.85)" : LIGHT_TEXT}`
                              : `1px dashed ${innerBorder}`,
                            borderRadius: "4px",
                            padding: "9px 12px", cursor: "pointer",
                            background: deleteMode === key ? (dark ? "rgba(240,232,220,0.22)" : "rgba(85,85,85,0.13)") : "transparent",
                            transition: "background 0.12s, border 0.12s",
                          }}>
                            <span style={{ fontFamily: FONT_SANS, fontSize: "15px", fontWeight: deleteMode === key ? 600 : 400, color: dark ? DARK_TEXT : LIGHT_TEXT }}>{deleteOptLabels[key]}</span>
                            <RadioCircle selected={deleteMode === key} dark={dark} />
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ background: settingsCardBg, border: `1px dashed ${innerBorder}`, borderRadius: "8px", padding: "16px 24px", display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>{t.correctionVisible}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontFamily: FONT_SANS, fontSize: "11px", fontWeight: 500, color: descColor }}>{correctionVisible ? t.on : t.off}</span>
                          <ToggleBtn on={correctionVisible} onToggle={() => setCorrectionVisible(v => !v)} dark={dark} />
                        </div>
                      </div>
                      <span style={{ fontFamily: FONT_SANS, fontSize: "14px", lineHeight: "1.5", color: descColor }}>
                        <span style={{ color: dark ? "#8faee0" : "#6b82b0" }}>{t.correctionDescHighlight}</span>
                        {t.correctionDescRest}
                      </span>
                    </div>
                  </div>
                )}

                {/* ── Stabilität / Stability ────────────────────────────── */}
                {activeCategory === "Stability" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ background: settingsCardBg, border: `1px dashed ${innerBorder}`, borderRadius: "8px", padding: "16px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>{t.driftLabel}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontFamily: FONT_SANS, fontSize: "11px", fontWeight: 500, color: descColor }}>{textFliegtEnabled ? t.on : t.off}</span>
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
                            }}>{u === "Sätze" ? t.driftSentences : t.driftWords}</button>
                          ))}
                        </div>
                        <button onClick={() => setFliegtUnit("Buchstabe")} style={{
                          width: "100%", height: "36px",
                          background: fliegtUnit === "Buchstabe" ? (dark ? "rgba(240,232,220,0.12)" : "rgba(85,85,85,0.08)") : "transparent",
                          border: `1px dashed ${fliegtUnit === "Buchstabe" ? (dark ? DARK_TEXT : LIGHT_TEXT) : innerBorder}`,
                          borderRadius: "4px", cursor: "pointer", outline: "none",
                          fontFamily: FONT_SANS, fontSize: "15px", color: dark ? DARK_TEXT : LIGHT_TEXT,
                          textAlign: "left", padding: "0 12px", boxSizing: "border-box",
                        }}>{t.driftLetters}</button>
                      </div>
                      <div style={{ borderTop: `1px dashed ${innerBorder}` }} />
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <span style={{ fontFamily: FONT_SANS, fontSize: "15px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>{t.driftTiming}</span>
                        <DoubleSlider value={fliegtZeitpunkt} min={1} max={15} onChange={setFliegtZeitpunkt} dark={dark} />
                        <div style={{ border: `1px dashed ${innerBorder}`, borderRadius: "4px", padding: "8px", textAlign: "center", fontFamily: FONT_SANS, fontSize: "15px", color: descColor }}>
                          {t.driftAfter(fliegtZeitpunkt)}
                        </div>
                      </div>
                      <div style={{ borderTop: `1px dashed ${innerBorder}` }} />
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <span style={{ fontFamily: FONT_SANS, fontSize: "15px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>{t.driftSpeed}</span>
                        <DoubleSlider value={fliegtSchnelligkeit} min={1} max={10} onChange={setFliegtSchnelligkeit} dark={dark} />
                      </div>
                    </div>

                    <div style={{ background: settingsCardBg, border: `1px dashed ${innerBorder}`, borderRadius: "8px", padding: "16px 24px", display: "flex", flexDirection: "column", gap: "14px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>{t.fadeLabel}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontFamily: FONT_SANS, fontSize: "11px", fontWeight: 500, color: descColor }}>{textVerblassEnabled ? t.on : t.off}</span>
                          <ToggleBtn on={textVerblassEnabled} onToggle={() => setTextVerblassEnabled(e => !e)} dark={dark} />
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <span style={{ fontFamily: FONT_SANS, fontSize: "15px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>{t.fadeTiming}</span>
                        <DoubleSlider value={verblassZeitpunkt} min={1} max={15} onChange={setVerblassZeitpunkt} dark={dark} />
                        <div style={{ border: `1px dashed ${innerBorder}`, borderRadius: "4px", padding: "8px", textAlign: "center", fontFamily: FONT_SANS, fontSize: "15px", color: descColor }}>
                          {t.fadeAfter(verblassZeitpunkt)}
                        </div>
                      </div>
                      <div style={{ borderTop: `1px dashed ${innerBorder}` }} />
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <span style={{ fontFamily: FONT_SANS, fontSize: "15px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>{t.fadeSpeed}</span>
                        <DoubleSlider value={verblassSchnelligkeit} min={1} max={10} onChange={setVerblassSchnelligkeit} dark={dark} />
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Position ──────────────────────────────────────────── */}
                {activeCategory === "Position" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {([
                      { value: "standard" as const, label: t.posStandard },
                      { value: "spiral" as const, label: t.posSpiral },
                      { value: "random" as const, label: t.posRandom },
                    ]).map(opt => (
                      <div key={opt.value} onClick={() => setPositionMode(opt.value)} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        border: positionMode === opt.value
                          ? `2px solid ${dark ? "rgba(240,232,220,0.85)" : LIGHT_TEXT}`
                          : `1px dashed ${innerBorder}`,
                        borderRadius: "4px",
                        padding: "12px 16px", cursor: "pointer",
                        background: positionMode === opt.value ? (dark ? "rgba(240,232,220,0.22)" : "rgba(85,85,85,0.13)") : settingsCardBg,
                        transition: "background 0.12s, border 0.12s",
                      }}>
                        <span style={{ fontFamily: FONT_SANS, fontSize: "15px", fontWeight: positionMode === opt.value ? 600 : 400, color: dark ? DARK_TEXT : LIGHT_TEXT, lineHeight: "1.4" }}>{opt.label}</span>
                        <RadioCircle selected={positionMode === opt.value} dark={dark} />
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Look & Feel ───────────────────────────────────────── */}
                {activeCategory === "Look & Feel" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <style>{`
                      .lf-slider {
                        -webkit-appearance: none; appearance: none;
                        width: 100%; height: 2px; border-radius: 2px; cursor: pointer; outline: none;
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
                        width: 100%; height: 100%; border-radius: 4px; cursor: crosshair; outline: none;
                        background: transparent;
                      }
                      .hue-slider::-webkit-slider-thumb {
                        -webkit-appearance: none; appearance: none;
                        width: 2px; height: 44px; border-radius: 1px;
                        background: rgba(80,70,60,0.55); cursor: crosshair; border: none;
                      }
                      .hue-slider::-moz-range-thumb {
                        width: 2px; height: 44px; border-radius: 1px;
                        background: rgba(80,70,60,0.55); cursor: crosshair; border: none;
                      }
                    `}</style>

                    <div style={{ background: settingsCardBg, border: `1px dashed ${innerBorder}`, borderRadius: "8px", padding: "16px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                      <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>{t.lfGrain}</span>
                      <input type="range" min={0} max={100} value={grainLevel} onChange={e => setGrainLevel(Number(e.target.value))} className="lf-slider" />
                    </div>

                    <div style={{ background: settingsCardBg, border: `1px dashed ${innerBorder}`, borderRadius: "8px", padding: "16px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                      <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>{t.lfTextSize}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <span style={{ fontFamily: FONT_SERIF, fontSize: "12px", color: dark ? DARK_TEXT : LIGHT_TEXT, flexShrink: 0 }}>A</span>
                        <input type="range" min={0} max={100} value={textSizeLevel} onChange={e => setTextSizeLevel(Number(e.target.value))} className="lf-slider" style={{ flex: 1 }} />
                        <span style={{ fontFamily: FONT_SERIF, fontSize: "28px", color: dark ? DARK_TEXT : LIGHT_TEXT, flexShrink: 0, lineHeight: 1 }}>A</span>
                      </div>
                    </div>

                    <div style={{ background: settingsCardBg, border: `1px dashed ${innerBorder}`, borderRadius: "8px", padding: "16px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                      <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>{t.lfBgColor}</span>
                      <div style={{ borderRadius: "4px", border: `1px dashed ${innerBorder}`, height: "44px", position: "relative", overflow: "hidden", background: dark ? "linear-gradient(to right, oklch(32% 0.028 0), oklch(32% 0.028 60), oklch(32% 0.028 120), oklch(32% 0.028 180), oklch(32% 0.028 240), oklch(32% 0.028 300), oklch(32% 0.028 360))" : "linear-gradient(to right, oklch(97.5% 0.015 0), oklch(97.5% 0.015 60), oklch(97.5% 0.015 120), oklch(97.5% 0.015 180), oklch(97.5% 0.015 240), oklch(97.5% 0.015 300), oklch(97.5% 0.015 360))" }}>
                        <input type="range" min={0} max={360} value={bgHue ?? 0} onChange={e => setBgHue(Number(e.target.value))} className="hue-slider" style={{ position: "absolute", inset: 0 }} />
                      </div>
                      <button
                        onClick={() => setBgHue(null)}
                        style={{
                          alignSelf: "flex-start",
                          fontFamily: FONT_SANS, fontSize: "13px",
                          padding: "5px 14px", borderRadius: "100px",
                          border: `1px dashed ${innerBorder}`,
                          background: bgHue === null ? (dark ? "rgba(240,232,220,0.12)" : "rgba(0,0,0,0.06)") : "transparent",
                          color: dark ? DARK_MUTED : "#9a9daa",
                          cursor: "pointer", outline: "none",
                        }}
                      >{t.lfNoColor}</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Right panel: word count + eye + lang + menu ───────────────────── */}
      <AnimatePresence mode="wait">
        {visible ? (
          <motion.div
            key="right-full"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ position: "fixed", top: "24px", right: "24px", display: "flex", flexDirection: "row", alignItems: "center", gap: "10px", zIndex: 20 }}
          >
            {/* Timer countdown */}
            {timerEnabled && timerRunning && (
              <div style={{
                height: "31px", padding: "0 12px",
                display: "flex", alignItems: "center",
                fontFamily: FONT_SANS, fontSize: "13px",
                color: timeLeft <= 10 ? "#e05252" : (dark ? DARK_TEXT : LIGHT_TEXT),
                opacity: 0.7, letterSpacing: "0.04em",
                transition: "color 0.3s",
              }}>
                {formatTime(timeLeft)}
              </div>
            )}
            {/* Word count */}
            {positions.length > 0 && !timerRunning && (
              <div style={{ height: "31px", padding: "0 12px", display: "flex", alignItems: "center", fontFamily: FONT_SANS, fontSize: "13px", color: dark ? DARK_MUTED : "#9a9daa" }}>
                {wordCount} {wordCount === 1 ? t.word : t.words}
              </div>
            )}
            {/* Eye toggle */}
            <button
              style={btnStyle(dark, undefined, surfaceLight)}
              onClick={(e) => { e.stopPropagation(); setVisible(false); setMenuOpen(false); }}
            >
              <IconEyeClosed color={iconColor} />
            </button>
            {/* Language toggle */}
            <button
              style={btnStyle(dark, undefined, surfaceLight)}
              onClick={(e) => { e.stopPropagation(); setLang(l => { const next = l === "de" ? "en" : "de"; localStorage.setItem("appLang", next); return next; }); }}
            >
              {t.langBtn}
            </button>
            {/* Menu button + dropdown */}
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
                  background: dark ? "rgba(240,232,220,0.1)" : surfaceLight,
                  border: `1px dashed ${BORDER_COL}`,
                  borderRadius: "4px", rotate: -2.42, zIndex: 0, pointerEvents: "none",
                }}
              />
              <button
                style={{ ...btnStyle(dark, { background: dark ? "rgba(240,232,220,0.06)" : surfaceLight }), position: "relative", zIndex: 1 }}
                onClick={(e) => { e.stopPropagation(); setMenuOpen(o => !o); setMenuHovered(false); }}
              >
                {menuOpen ? t.menuOpen : t.menuClosed}
              </button>
              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    key="nav"
                    variants={NAV_CONTAINER}
                    initial="hidden" animate="visible" exit="exit"
                    style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" }}
                  >
                    {(["Create", "Playground", "About"] as const).map((key, i) => (
                      <motion.button
                        key={key}
                        variants={NAV_ITEM}
                        style={navItemStyle(dark, i === 0, surfaceLight, bgHue)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpen(false);
                          if (key !== "Create") navigate(NAV_ROUTES[key]);
                        }}
                      >{t.navLabels[key]}</motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="right-mini"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "fixed", top: "12px", right: "12px", zIndex: 20,
              background: dark ? "rgba(240,232,220,0.06)" : surfaceLight,
              border: "none", borderRadius: "4px", cursor: "pointer", outline: "none",
              padding: "4px 6px", display: "flex", alignItems: "center", justifyContent: "center",
            }}
            onClick={(e) => { e.stopPropagation(); setVisible(true); }}
          >
            <IconEyeOpen color={iconColor} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Saved modal ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {savedId && (
          <SavedModal
            dark={dark}
            savedId={savedId}
            lang={lang}
            onClose={() => setSavedId(null)}
            onPlayground={() => navigate("/playground")}
            surfaceLight={surfaceLight}
          />
        )}
      </AnimatePresence>

      {/* ── Timer done overlay ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showDoneModal && (
          <TimerDoneOverlay
            dark={dark}
            isVisual={visualTimer}
            onDelete={handleDelete}
            onReveal={handleReveal}
            onCopy={handleCopy}
            copied={copied}
            t={t}
            surfaceLight={surfaceLight}
          />
        )}
      </AnimatePresence>

      {/* ── Revealed bar (after visual timer) ─────────────────────────── */}
      <AnimatePresence>
        {showRevealBar && createPortal(
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.25 }}
            style={{
              position: "fixed", bottom: "32px", left: "50%",
              transform: "translateX(-50%)", zIndex: 200,
            }}
          >
            <div style={{
              display: "flex", alignItems: "center",
              background: "rgba(240,232,220,0.1)",
              border: `1px dashed ${DARK_BORDER}`,
              borderRadius: "100px", backdropFilter: "blur(10px)",
              overflow: "hidden",
            }}>
              <button
                onClick={handleCopy}
                style={{ fontFamily: FONT_SANS, fontSize: "12px", letterSpacing: "0.04em", padding: "8px 20px", background: "transparent", border: "none", color: "rgba(240,232,220,0.8)", cursor: "pointer" }}
              >{copied ? t.copied : t.copyText}</button>
              <div style={{ width: "1px", height: "14px", background: DARK_BORDER }} />
              <button
                onClick={handleDelete}
                style={{ fontFamily: FONT_SANS, fontSize: "12px", letterSpacing: "0.04em", padding: "8px 20px", background: "transparent", border: "none", color: "rgba(240,232,220,0.45)", cursor: "pointer" }}
              >{t.deleteText}</button>
            </div>
          </motion.div>,
          document.body
        )}
      </AnimatePresence>
    </div>
  );
}
