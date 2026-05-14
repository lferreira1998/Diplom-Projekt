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
    promptHeading: "Schreibanstoß oder Aufgabe",
    promptHint: "Das hilft Menschen beim Schreiben. Du kannst mehrere anlegen.",
    promptPlaceholder: "Beispiel: Schreibe etwas über dich…",
    promptAdd: "+ Weiteren hinzufügen",
    descHeading: "Beschreibung oder Regel",
    descPlaceholder: "Beispiel: Dieses Tool hilft anonym zu schreiben",
    // Time
    timerLabel: "Timer",
    on: "An", off: "Aus",
    timerFixed: "Feste Zeit", timerFree: "Freie Wahl",
    minutes: "Minuten",
    visualTimer: "Visueller Timer",
    visualTimerDesc: "Der Hintergrund rennt langsam die Schriftfläche ab. Wenn nichts mehr bleibt ist die Zeit um.",
    userReset: "User setzt Timer jedes mal neu",
    cursorRunning: "Cursor läuft weiter",
    cursorRunningDesc: "Der Cursor läuft automatisch weiter, egal ob man schreibt oder nicht. Damit werden Pausen sichtbar.",
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
    driftDesc: "Text verliert seine stabile Form und fliegt davon.",
    driftSentences: "Sätze", driftWords: "Wörter", driftLetters: "Buchstabe",
    driftTiming: "Zeitpunkt des Fliegens",
    driftAfter: (n: number) => `Nach ${n} min`,
    driftSpeed: "Schnelligkeit des Fliegens",
    fadeLabel: "Text verblasst",
    fadeDesc: "Der Text verblasst und verschwindet langsam.",
    fadeTiming: "Zeitpunkt des Verblassens",
    fadeAfter: (n: number) => `Nach ${n} min`,
    fadeSpeed: "Schnelligkeit des Verblassens",
    // Position
    posStandard: "Standard",
    posSpiral: "Spiralförmiger Text",
    posRandom: "Text erscheint zufällig",
    posRunning: "Fortlaufende Linie",
    posCustom: "Zeichne deine eigene Linie",
    posRandomSentences: "Ganze Sätze",
    posRandomWords: "Einzelne Wörter",
    // Look & Feel
    lfGrain: "Körnung & Textur",
    lfTextSize: "Textgröße",
    lfBgMotion: "Bewegung des Hintergrunds",
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
    promptHeading: "Writing Prompt or Task",
    promptHint: "This helps people start writing. You can add multiple.",
    promptPlaceholder: "Example: Write something about yourself…",
    promptAdd: "+ Add another",
    descHeading: "Description or Rule",
    descPlaceholder: "Example: This tool helps writing anonymously",
    // Time
    timerLabel: "Timer",
    on: "On", off: "Off",
    timerFixed: "Fixed Time", timerFree: "Free Choice",
    minutes: "Minutes",
    visualTimer: "Visual Timer",
    visualTimerDesc: "The background slowly runs down the writing area. When nothing is left, time is up.",
    userReset: "User resets timer each time",
    cursorRunning: "Cursor keeps running",
    cursorRunningDesc: "The cursor moves automatically whether you type or not. This makes pauses visible.",
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
    driftDesc: "Text loses its stable form and drifts away.",
    driftSentences: "Sentences", driftWords: "Words", driftLetters: "Letters",
    driftTiming: "Drift timing",
    driftAfter: (n: number) => `After ${n} min`,
    driftSpeed: "Drift speed",
    fadeLabel: "Text fades",
    fadeDesc: "Text slowly fades and disappears.",
    fadeTiming: "Fade timing",
    fadeAfter: (n: number) => `After ${n} min`,
    fadeSpeed: "Fade speed",
    // Position
    posStandard: "Standard",
    posSpiral: "Spiraling Text",
    posRandom: "Text appears random",
    posRunning: "Running Line",
    posCustom: "Draw your own path",
    posRandomSentences: "Full sentences",
    posRandomWords: "Individual words",
    // Look & Feel
    lfGrain: "Grain & Texture",
    lfTextSize: "Text Size",
    lfBgMotion: "Background Motion",
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

const BTN_CLOSED = { dark: 24, rules: 67 };
const BTN_OPEN   = { dark: 371, rules: 414 };
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

function IconEyeClosed({ color }: { color: string }) {
  return (
    <svg width="19" height="13" viewBox="0 0 126.33 89.05" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M81.1,74.39v5.69l-.09.11c-4.81,5.63-11.31,8.86-17.83,8.86s-13.05-3.23-17.86-8.86l-.09-.11v-5.69l.66.77c4.59,5.37,10.73,8.33,17.29,8.33s12.67-2.96,17.26-8.33l.66-.77Z" fill={color}/>
      <path d="M80.98,8.9v5.31l-.44-.52c-4.62-5.4-10.79-8.37-17.39-8.37s-12.74,2.97-17.36,8.37l-.44.52v-5.31l.06-.07C50.2,3.22,56.67,0,63.15,0s12.98,3.22,17.77,8.83l.06.07Z" fill={color}/>
      <path d="M107.53,21.49l17.88,18.17v7.65l-29.6,30.08v-8.34l25.34-25.57-18.74-18.9-.96-.97-23.11,13.99c.63,1.82.96,3.84.96,6.01,0,9.22-6.66,16.14-16.13,16.14-5.07,0-9.44-2.09-12.34-5.5l-21.11,12.77-5.13,3.11-19.68,11.91-4.91-3.52,20.56-12.48-.96-.97L2.13,47.31v-7.65L31.73,9.58v8.34L6.39,43.48l18.32,18.49.96.97,22.34-13.56c-.64-1.78-.98-3.72-.98-5.77,0-9.73,6.92-16.39,16.14-16.39,5.2,0,9.55,2.01,12.41,5.43l21.75-13.2,5.13-3.12,18.79-11.4,5.08,3.63-19.76,11.96.96.97Z" fill={color}/>
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

// ── Radio circle ──────────────────────────────────────────────────────────────
function RadioCircle({ selected, dark }: { selected: boolean; dark: boolean }) {
  return (
    <div style={{
      width: "14px", height: "14px",
      borderRadius: "50%",
      flexShrink: 0,
      background: selected ? (dark ? "rgba(240,232,220,0.85)" : LIGHT_TEXT) : "transparent",
      border: `1px dashed ${selected
        ? (dark ? "rgba(240,232,220,0.85)" : LIGHT_TEXT)
        : (dark ? "rgba(240,232,220,0.35)" : BORDER_COL)}`,
    }} />
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
function DoubleSlider({ value, min, max, step = 1, onChange, dark }: {
  value: number; min: number; max: number; step?: number;
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
        type="range" min={min} max={max} step={step} value={value}
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
    fontFamily: FONT_SANS, fontSize: "15px", fontWeight: 400, lineHeight: "normal",
    height: "33px", padding: "0 12px",
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
    fontFamily: FONT_SANS, fontSize: "15px", fontWeight: active ? 500 : 400, lineHeight: "normal",
    height: "33px", padding: "0 12px", whiteSpace: "nowrap",
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

// ── Organic grain canvas ──────────────────────────────────────────────────────
const OG_W = 256, OG_H = 256;

function makeValueNoise(seed: number, cellPx: number): Float32Array {
  const gW = Math.ceil(OG_W / cellPx) + 2;
  const gH = Math.ceil(OG_H / cellPx) + 2;
  let s = (seed | 0) >>> 0;
  const lcg = () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
  const grid = new Float32Array(gW * gH);
  for (let i = 0; i < grid.length; i++) grid[i] = lcg();
  const sm = (f: number) => f * f * (3 - 2 * f);
  const lr = (a: number, b: number, t: number) => a + (b - a) * t;
  const buf = new Float32Array(OG_W * OG_H);
  for (let y = 0; y < OG_H; y++) {
    for (let x = 0; x < OG_W; x++) {
      const cx = x / cellPx, cy = y / cellPx;
      const ix = Math.floor(cx), iy = Math.floor(cy);
      const fx = sm(cx - ix), fy = sm(cy - iy);
      const a = grid[iy * gW + ix], b = grid[iy * gW + ix + 1];
      const c = grid[(iy + 1) * gW + ix], d = grid[(iy + 1) * gW + ix + 1];
      buf[y * OG_W + x] = lr(lr(a, b, fx), lr(c, d, fx), fy);
    }
  }
  return buf;
}

function makeOrganicBuf(seed: number): Float32Array {
  const a = makeValueNoise(seed,          18); // coarse shapes
  const b = makeValueNoise(seed * 7 + 3,   6); // medium
  const c = makeValueNoise(seed * 13 + 7,  2); // fine grain
  const buf = new Float32Array(OG_W * OG_H);
  for (let i = 0; i < buf.length; i++) buf[i] = a[i] * 0.5 + b[i] * 0.35 + c[i] * 0.15;
  return buf;
}

function OrganicGrainCanvas({ grainLevel }: { grainLevel: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef(0);
  const stateRef  = useRef({
    bufA: makeOrganicBuf(42), bufB: makeOrganicBuf(137),
    phase: 0, lastTs: 0, seed: 300,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = OG_W; canvas.height = OG_H;
    const ctx = canvas.getContext("2d")!;
    const st = stateRef.current;

    const render = (ts: number) => {
      const dt = st.lastTs ? Math.min((ts - st.lastTs) / 1000, 0.05) : 0;
      st.lastTs = ts;
      st.phase += dt / 7; // 7-second morph cycle — calm and organic
      if (st.phase >= 1) {
        st.phase -= 1;
        st.bufA = st.bufB;
        st.bufB = makeOrganicBuf(st.seed++);
      }
      const t = st.phase * st.phase * (3 - 2 * st.phase); // smooth-step
      const img = ctx.createImageData(OG_W, OG_H);
      const d = img.data;
      for (let i = 0; i < OG_W * OG_H; i++) {
        const v = ((st.bufA[i] + t * (st.bufB[i] - st.bufA[i])) * 255 + 0.5) | 0;
        const j = i * 4;
        d[j] = d[j + 1] = d[j + 2] = v; d[j + 3] = 255;
      }
      ctx.putImageData(img, 0, 0);
      rafRef.current = requestAnimationFrame(render);
    };
    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: "fixed", inset: 0, zIndex: 3, pointerEvents: "none",
        width: "100%", height: "100%",
        opacity: (grainLevel / 100) * 0.65,
        mixBlendMode: "multiply",
      }}
    />
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
function useWindowWidth() {
  const [width, setWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    const handler = () => setWidth(window.innerWidth);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);
  return width;
}

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

  const windowWidth = useWindowWidth();

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
  const [fliegtSchnelligkeit, setFliegtSchnelligkeit]     = useState(2.0);
  const [textEditingEnabled, setTextEditingEnabled]        = useState(true);
  const [textVerblassEnabled, setTextVerblassEnabled]     = useState(false);
  const [verblassZeitpunkt, setVerblassZeitpunkt]         = useState(2);
  const [verblassSchnelligkeit, setVerblassSchnelligkeit] = useState(3);

  // Position params
  const [positionMode, setPositionMode] = useState<"standard" | "spiral" | "random" | "running" | "custom">("standard");
  const [drawnPath, setDrawnPath]       = useState<{ x: number; y: number }[][]>([]);

  // Look & Feel params
  const [grainLevel, setGrainLevel]       = useState(0);
  const [textSizeLevel, setTextSizeLevel] = useState(46);
  const [bgHue, setBgHue]                 = useState<number | null>(null);
  const [bgMotion, setBgMotion]           = useState(false);

  // Position sub-options
  const [randomMode, setRandomMode] = useState<"sentences" | "words">("words");

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
  const DE = lang === "de";
  const DE_new = DE;

  // ── Mobile blocker (< 1000px) ─────────────────────────────────────────────
  if (windowWidth < 1000) {
    return (
      <div style={{
        minHeight: "100svh", background: LIGHT_BG,
        display: "flex", flexDirection: "column",
        fontFamily: FONT_SANS, boxSizing: "border-box",
      }}>
        {/* Top bar — same as full UI */}
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, height: "56px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 20px",
          background: LIGHT_BG,
          borderBottom: `1px dashed ${BORDER_COL}`,
          boxSizing: "border-box", zIndex: 10,
        }}>
          <span style={{ fontFamily: FONT_SERIF, fontSize: "18px", color: LIGHT_TEXT }}>
            {DE_new ? "Schreibwerkzeug" : "Writing Tool"}
          </span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => setLang(l => { const next = l === "de" ? "en" : "de"; localStorage.setItem("appLang", next); return next; })}
              style={{ background: "transparent", border: `1px dashed ${BORDER_COL}`, borderRadius: "4px", cursor: "pointer", outline: "none", fontFamily: FONT_SANS, fontSize: "13px", color: LIGHT_TEXT, height: "29px", padding: "0 10px" }}
            >{lang === "de" ? "DE" : "ENG"}</button>
            <button
              onClick={() => navigate("/about-the-project")}
              style={{ background: "transparent", border: `1px dashed ${BORDER_COL}`, borderRadius: "4px", cursor: "pointer", outline: "none", fontFamily: FONT_SANS, fontSize: "13px", color: LIGHT_TEXT, height: "29px", padding: "0 10px" }}
            >{DE_new ? "Über das Projekt" : "About"}</button>
          </div>
        </div>

        {/* Blocker message */}
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          alignItems: "center", justifyContent: "center",
          padding: "80px 32px 40px", textAlign: "center", gap: "24px",
        }}>
          <span style={{ fontFamily: FONT_SERIF, fontSize: "28px", color: LIGHT_TEXT, lineHeight: "1.3" }}>
            {DE_new ? "Bitte auf einem Desktop benutzen." : "Please use on a desktop."}
          </span>
          <span style={{ fontFamily: FONT_SANS, fontSize: "14px", color: "#9a9daa", lineHeight: "1.55", maxWidth: "280px" }}>
            {DE_new
              ? "Dieses Tool ist für größere Bildschirme ausgelegt und benötigt mindestens 1000px Breite."
              : "This tool is designed for larger screens and requires at least 1000px width."}
          </span>
          <button
            onClick={() => navigate("/playground")}
            style={{ marginTop: "8px", background: "transparent", border: `1px dashed ${BORDER_COL}`, borderRadius: "4px", cursor: "pointer", outline: "none", fontFamily: FONT_SANS, fontSize: "14px", color: LIGHT_TEXT, height: "36px", padding: "0 18px" }}
          >{DE_new ? "Tools entdecken" : "Explore tools"}</button>
        </div>
      </div>
    );
  }

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
    // If this ID was deleted locally, don't reload it
    try {
      const deleted = JSON.parse(localStorage.getItem("deletedToolIds") ?? "[]") as string[];
      if (deleted.includes(toolId)) return;
    } catch { /* ignore */ }
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
      setRandomMode((p.randomMode as "sentences" | "words") ?? "words");
      if (p.positionMode === "custom" && Array.isArray(p.drawnPath) && p.drawnPath.length > 0) {
        const raw = p.drawnPath as unknown as Array<{ x: number; y: number }> | Array<Array<{ x: number; y: number }>>;
        const first = raw[0];
        if (Array.isArray(first)) {
          setDrawnPath(raw as { x: number; y: number }[][]);
        } else if (first && typeof (first as { x: number }).x === "number") {
          setDrawnPath([raw as { x: number; y: number }[]]);
        }
      }
      setTextEditingEnabled(p.textEditingEnabled !== false); // default true
      setGrainLevel(typeof p.grainLevel === "number" ? p.grainLevel : 0);
      setTextSizeLevel(typeof p.textSizeLevel === "number" ? p.textSizeLevel : 20);
      setBgHue(typeof p.bgHue === "number" ? p.bgHue : null);
      setBgMotion(p.bgMotion === true);
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
        textEditingEnabled,
        textVerblassEnabled, verblassZeitpunkt, verblassSchnelligkeit,
        positionMode, randomMode,
        drawnPath: positionMode === "custom" ? drawnPath : [],
        grainLevel, textSizeLevel, bgHue, bgMotion,
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
    textEditingEnabled,
    textVerblassEnabled, verblassZeitpunkt, verblassSchnelligkeit,
    positionMode, randomMode, drawnPath, grainLevel, textSizeLevel, bgHue, bgMotion,
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
  const wzDriftSpeed = fliegtSchnelligkeit;
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
      className="dark-transition"
      style={{
        minHeight: "100vh", background: bg, position: "relative",
        ...(bgMotion ? {
          backgroundImage: dark
            ? `linear-gradient(135deg, ${bg} 0%, oklch(28% 0.032 ${(bgHue ?? 60) + 30}) 50%, ${bg} 100%)`
            : `linear-gradient(135deg, ${bg} 0%, oklch(96% 0.025 ${(bgHue ?? 60) + 30}) 50%, ${bg} 100%)`,
          backgroundSize: "400% 400%",
          animation: "bgDrift 12s ease infinite",
        } : {}),
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />
      <style>{`
        @keyframes cursorBlink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes bgDrift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        .dark-transition, .dark-transition * {
          transition: color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease, opacity 0.2s ease !important;
        }
        .vis-btn:hover { border-color: ${dark ? "rgba(240,232,220,0.55)" : "#989898"} !important; }
      `}</style>

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
      {grainLevel > 0 && !bgMotion && (
        <div
          aria-hidden
          style={{
            position: "fixed", inset: 0, zIndex: 3, pointerEvents: "none",
            opacity: (grainLevel / 100) * 0.55,
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat", backgroundSize: "200px 200px",
          }}
        />
      )}
      {grainLevel > 0 && bgMotion && <OrganicGrainCanvas grainLevel={grainLevel} />}

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
            textEditingEnabled={textEditingEnabled}
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
            runningLineModus={positionMode === "running"}
            textAppearsRandom={positionMode === "random"}
            customPathModus={positionMode === "custom"}
            customPath={drawnPath}
            onCustomPathChange={setDrawnPath}
            customPathDark={dark}
            customPathDe={DE}
            randomMode={randomMode === "sentences" ? "sentences" : "words"}
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
              width: "33px", height: "33px",
              background: darkBtnBg,
              border: `1px dashed ${BORDER_COL}`,
              borderRadius: "4px",
              cursor: "pointer", outline: "none",
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 25, transition: "background 0.2s",
            }}
            onClick={(e) => { e.stopPropagation(); setDark(d => !d); }}
          >
            <IconHalfCircle color={iconColor} dark={dark} />
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
              height: "33px", width: rulesOpen ? "33px" : "62px",
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
                <motion.span key="r" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }} style={{ fontSize: "15px", fontWeight: 400 }}>{t.rulesBtn}</motion.span>
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

                    {/* Timer card */}
                    <div style={{ background: settingsCardBg, border: `1px dashed ${innerBorder}`, borderRadius: "8px", padding: "12px 24px", display: "flex", flexDirection: "column", gap: "0" }}>
                      <div
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "36px", cursor: "pointer" }}
                        onClick={() => setTimerEnabled(v => !v)}
                      >
                        <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>{t.timerLabel}</span>
                        <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: descColor }}>{timerEnabled ? t.on : t.off}</span>
                      </div>
                      <AnimatePresence>
                        {timerEnabled && (
                          <motion.div
                            key="timer-opts"
                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.15 }}
                            style={{ overflow: "hidden" }}
                          >
                            {/* Divider */}
                            <div style={{ height: "1px", background: innerBorder, margin: "4px 0" }} />
                            {/* Large number input row */}
                            <div style={{ display: "flex", alignItems: "center", border: `1px dashed ${innerBorder}`, borderRadius: "4px", margin: "8px 0", height: "48px", overflow: "hidden" }}>
                              <input
                                type="number"
                                min={1}
                                max={999}
                                value={timerMinutes}
                                onChange={e => setTimerMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                                onClick={e => e.stopPropagation()}
                                style={{
                                  flex: 1, height: "100%", border: "none", outline: "none",
                                  background: "transparent", textAlign: "center",
                                  fontFamily: FONT_SANS, fontSize: "28px", fontWeight: 400,
                                  color: dark ? "rgba(240,232,220,0.55)" : "rgba(85,85,85,0.45)",
                                  WebkitAppearance: "none", MozAppearance: "textfield",
                                }}
                              />
                              <span style={{ fontFamily: FONT_SANS, fontSize: "13px", color: descColor, paddingRight: "12px", flexShrink: 0 }}>min</span>
                            </div>
                            {/* Divider */}
                            <div style={{ height: "1px", background: innerBorder, margin: "4px 0" }} />
                            {/* User reset row */}
                            <div
                              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "36px", cursor: "pointer" }}
                              onClick={e => { e.stopPropagation(); setTimerUserReset(v => !v); }}
                            >
                              <span style={{ fontFamily: FONT_SANS, fontSize: "14px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>{t.userReset}</span>
                              <RadioCircle selected={timerUserReset} dark={dark} />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Visueller Timer */}
                    <div
                      style={{ background: settingsCardBg, border: `1px dashed ${innerBorder}`, borderRadius: "8px", padding: "12px 24px", display: "flex", flexDirection: "column", gap: "10px", cursor: "pointer" }}
                      onClick={() => setVisualTimer(v => !v)}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "36px" }}>
                        <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>{t.visualTimer}</span>
                        <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: descColor }}>{visualTimer ? t.on : t.off}</span>
                      </div>
                      <p style={{ fontFamily: FONT_SANS, fontSize: "13px", color: descColor, lineHeight: "1.45", margin: 0 }}>{t.visualTimerDesc}</p>
                    </div>

                    {/* Cursor läuft weiter */}
                    <div style={{ opacity: (positionMode === "spiral" || positionMode === "running") ? 0.4 : 1, transition: "opacity 0.2s", pointerEvents: (positionMode === "spiral" || positionMode === "running") ? "none" : "auto" }}>
                    <div
                      style={{ background: settingsCardBg, border: `1px dashed ${innerBorder}`, borderRadius: "8px", padding: "12px 24px", display: "flex", flexDirection: "column", gap: "10px", cursor: "pointer" }}
                      onClick={() => setCursorRunning(v => !v)}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "36px" }}>
                        <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>{t.cursorRunning}</span>
                        <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: descColor }}>{cursorRunning ? t.on : t.off}</span>
                      </div>
                      <p style={{ fontFamily: FONT_SANS, fontSize: "13px", color: descColor, lineHeight: "1.45", margin: 0 }}>
                        {(positionMode === "spiral" || positionMode === "running") ? (DE ? "Nicht verfügbar in diesem Modus" : "Not available in this mode") : t.cursorRunningDesc}
                      </p>
                    </div>
                    </div>

                    {/* Freies Editieren card */}
                    <div
                      style={{ background: settingsCardBg, border: `1px dashed ${innerBorder}`, borderRadius: "8px", padding: "12px 24px", display: "flex", flexDirection: "column", gap: "10px", cursor: "pointer" }}
                      onClick={() => setTextEditingEnabled(v => !v)}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "36px" }}>
                        <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>{DE ? "Freies Editieren" : "Free editing"}</span>
                        <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: descColor }}>{textEditingEnabled ? t.on : t.off}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Sichtbarkeit / Visibility ─────────────────────────── */}
                {activeCategory === "Visibility" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {/* Sichtbar / Unsichtbar side-by-side */}
                    <div style={{ display: "flex", gap: "8px" }}>
                      {(["visible", "invisible"] as const).map(val => (
                        <button key={val} className="vis-btn" onClick={() => setVisibility(val)} style={{
                          flex: 1, height: "36px",
                          background: settingsCardBg,
                          border: visibility === val
                            ? `1px dashed ${dark ? "rgba(240,232,220,0.85)" : LIGHT_TEXT}`
                            : `1px dashed ${innerBorder}`,
                          borderRadius: "4px", padding: "0 12px",
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          cursor: "pointer", outline: "none",
                          fontFamily: FONT_SANS, fontSize: "15px",
                          color: dark ? DARK_TEXT : LIGHT_TEXT,
                          boxSizing: "border-box",
                        }}>
                          {val === "visible" ? t.visVisible : t.visInvisible}
                          <RadioCircle selected={visibility === val} dark={dark} />
                        </button>
                      ))}
                    </div>
                    {/* Sentence / Word / Char */}
                    {(["sentence", "word", "char"] as const).map(val => (
                      <button key={val} className="vis-btn" onClick={() => setVisibility(val)} style={{
                        width: "100%", height: "36px",
                        background: settingsCardBg,
                        border: visibility === val
                          ? `1px dashed ${dark ? "rgba(240,232,220,0.85)" : LIGHT_TEXT}`
                          : `1px dashed ${innerBorder}`,
                        borderRadius: "4px", padding: "0 16px",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        cursor: "pointer", outline: "none",
                        fontFamily: FONT_SANS, fontSize: "15px",
                        color: dark ? DARK_TEXT : LIGHT_TEXT,
                        boxSizing: "border-box",
                      }}>
                        {val === "sentence" ? t.visSentence : val === "word" ? t.visWord : t.visChar}
                        <RadioCircle selected={visibility === val} dark={dark} />
                      </button>
                    ))}
                  </div>
                )}

                {/* ── Korrigieren / Correction ──────────────────────────── */}
                {activeCategory === "Correction" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                    {/* Löschen card */}
                    <div style={{ background: settingsCardBg, border: `1px dashed ${innerBorder}`, borderRadius: "8px", padding: "12px 24px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                      {/* Heading row */}
                      <div style={{ height: "36px", display: "flex", alignItems: "center" }}>
                        <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>{t.deleteHeading}</span>
                      </div>
                      {/* Option rows with separator between 2nd and 3rd */}
                      {DELETE_OPTS_KEYS.map((key, i) => (
                        <div key={key}>
                          {i === 2 && (
                            <div style={{ borderTop: `1px dashed ${innerBorder}`, marginBottom: "16px" }} />
                          )}
                          <button className="vis-btn" onClick={() => setDeleteMode(key)} style={{
                            width: "100%", height: "36px",
                            background: dark ? "rgba(240,232,220,0.04)" : "#fcf6ef",
                            border: deleteMode === key
                              ? `1px dashed ${dark ? "rgba(240,232,220,0.85)" : LIGHT_TEXT}`
                              : `1px dashed ${innerBorder}`,
                            borderRadius: "4px", padding: "0 12px",
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            cursor: "pointer", outline: "none",
                            fontFamily: FONT_SANS, fontSize: "15px",
                            color: dark ? DARK_TEXT : LIGHT_TEXT,
                            boxSizing: "border-box",
                          }}>
                            {deleteOptLabels[key]}
                            <RadioCircle selected={deleteMode === key} dark={dark} />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Korrigieren sichtbar card */}
                    <div style={{ background: settingsCardBg, border: `1px dashed ${innerBorder}`, borderRadius: "8px", padding: "12px 24px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                      <div style={{ height: "36px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>{t.correctionVisible}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontFamily: FONT_SANS, fontSize: "11px", fontWeight: 500, color: descColor }}>{correctionVisible ? t.on : t.off}</span>
                          <ToggleBtn on={correctionVisible} onToggle={() => setCorrectionVisible(v => !v)} dark={dark} />
                        </div>
                      </div>
                      <AnimatePresence>
                        {correctionVisible && (
                          <motion.div key="corr-desc" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: "hidden" }}>
                            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                              <p style={{ fontFamily: FONT_SANS, fontSize: "13px", lineHeight: "1.45", color: descColor, margin: 0 }}>
                                <span style={{ color: dark ? "#8faee0" : "#6b82b0" }}>{t.correctionDescHighlight}</span>
                                {t.correctionDescRest}
                              </p>
                              {/* Tipp-Ex visual */}
                              <div style={{ position: "relative", userSelect: "none", lineHeight: 1 }}>
                                <span style={{ fontFamily: FONT_SERIF, fontSize: "13px", color: dark ? DARK_TEXT : LIGHT_TEXT, opacity: 0.55, whiteSpace: "nowrap" }}>
                                  {DE ? "Schreiben ist Denken und Sprechen" : "Writing is thinking and speaking"}
                                </span>
                                <div style={{
                                  position: "absolute",
                                  left: "62px", right: "48px",
                                  top: "-3px", bottom: "-3px",
                                  background: dark ? "rgba(252,246,239,0.82)" : "#fdfaf4",
                                  borderRadius: "2px",
                                }} />
                              </div>
                            </div>
                          </motion.div>
                        )}
                        {!correctionVisible && (
                          <motion.p key="corr-off-desc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} style={{ fontFamily: FONT_SANS, fontSize: "13px", lineHeight: "1.45", color: descColor, margin: 0 }}>
                            {DE ? "Mit Tipp-Ex-Schicht über alten Text. Das Korrigieren hinterlässt Spuren." : "With a Tipp-Ex layer over old text. Corrections leave traces."}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>

                  </div>
                )}

                {/* ── Stabilität / Stability ────────────────────────────── */}
                {activeCategory === "Stability" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                    {/* Text fliegt davon card */}
                    <div style={{ position: "relative" }}>
                      <div style={{ background: settingsCardBg, border: `1px dashed ${innerBorder}`, borderRadius: "8px", padding: "12px 24px 24px", display: "flex", flexDirection: "column", gap: "16px", opacity: positionMode !== "standard" ? 0.4 : 1, transition: "opacity 0.2s", pointerEvents: positionMode !== "standard" ? "none" : "auto" }}>
                        {/* Header row */}
                        <div style={{ height: "36px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>{t.driftLabel}</span>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ fontFamily: FONT_SANS, fontSize: "11px", fontWeight: 500, color: descColor }}>{textFliegtEnabled ? t.on : t.off}</span>
                            <ToggleBtn on={textFliegtEnabled} onToggle={() => setTextFliegtEnabled(e => !e)} dark={dark} />
                          </div>
                        </div>
                        <AnimatePresence initial={false} mode="wait">
                          {!textFliegtEnabled ? (
                            /* OFF: show description only */
                            <motion.p key="drift-off" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} style={{ fontFamily: FONT_SANS, fontSize: "13px", color: descColor, lineHeight: "1.45", margin: 0 }}>
                              {t.driftDesc}
                            </motion.p>
                          ) : (
                            /* ON: show unit options + timing + speed */
                            <motion.div key="drift-on" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                              {/* Unit options */}
                              <div style={{ display: "flex", gap: "10px" }}>
                                {(["Sätze", "Wörter"] as const).map(u => (
                                  <button key={u} onClick={() => setFliegtUnit(u)} style={{
                                    flex: 1, height: "36px",
                                    background: dark ? "rgba(240,232,220,0.04)" : "#fcf6ef",
                                    border: `1px dashed ${fliegtUnit === u ? (dark ? DARK_TEXT : LIGHT_TEXT) : innerBorder}`,
                                    borderRadius: "4px", cursor: "pointer", outline: "none",
                                    fontFamily: FONT_SANS, fontSize: "15px", color: dark ? DARK_TEXT : LIGHT_TEXT,
                                    display: "flex", alignItems: "center", justifyContent: "space-between",
                                    padding: "0 12px", boxSizing: "border-box",
                                  }}>
                                    {u === "Sätze" ? t.driftSentences : t.driftWords}
                                    <RadioCircle selected={fliegtUnit === u} dark={dark} />
                                  </button>
                                ))}
                              </div>
                              <button onClick={() => setFliegtUnit("Buchstabe")} style={{
                                width: "100%", height: "36px",
                                background: dark ? "rgba(240,232,220,0.04)" : "#fcf6ef",
                                border: `1px dashed ${fliegtUnit === "Buchstabe" ? (dark ? DARK_TEXT : LIGHT_TEXT) : innerBorder}`,
                                borderRadius: "4px", cursor: "pointer", outline: "none",
                                fontFamily: FONT_SANS, fontSize: "15px", color: dark ? DARK_TEXT : LIGHT_TEXT,
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                padding: "0 12px", boxSizing: "border-box",
                              }}>
                                {t.driftLetters}
                                <RadioCircle selected={fliegtUnit === "Buchstabe"} dark={dark} />
                              </button>
                              {/* Separator */}
                              <div style={{ borderTop: `1px dashed ${innerBorder}`, margin: "6px 0" }} />
                              {/* Timing */}
                              <span style={{ fontFamily: FONT_SANS, fontSize: "15px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>{t.driftTiming}</span>
                              <DoubleSlider value={fliegtZeitpunkt} min={1} max={15} onChange={setFliegtZeitpunkt} dark={dark} />
                              <div style={{ border: `1px dashed ${innerBorder}`, borderRadius: "4px", padding: "10px 12px", textAlign: "center", fontFamily: FONT_SANS, fontSize: "15px", color: descColor, background: dark ? "rgba(240,232,220,0.04)" : "#fcf6ef" }}>
                                {t.driftAfter(fliegtZeitpunkt)}
                              </div>
                              {/* Separator */}
                              <div style={{ borderTop: `1px dashed ${innerBorder}`, margin: "6px 0" }} />
                              {/* Speed */}
                              <span style={{ fontFamily: FONT_SANS, fontSize: "15px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>{t.driftSpeed}</span>
                              <DoubleSlider value={fliegtSchnelligkeit} min={0.1} max={10} step={0.1} onChange={setFliegtSchnelligkeit} dark={dark} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      {positionMode !== "standard" && (
                        <div style={{ position: "absolute", bottom: "10px", left: 0, right: 0, textAlign: "center", pointerEvents: "none" }}>
                          <span style={{ fontFamily: FONT_SANS, fontSize: "11px", color: descColor }}>
                            {DE ? "Nicht verfügbar in diesem Modus" : "Not available in this mode"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Text verblasst card */}
                    <div style={{ background: settingsCardBg, border: `1px dashed ${innerBorder}`, borderRadius: "8px", padding: "12px 24px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                      <div style={{ height: "36px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>{t.fadeLabel}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontFamily: FONT_SANS, fontSize: "11px", fontWeight: 500, color: descColor }}>{textVerblassEnabled ? t.on : t.off}</span>
                          <ToggleBtn on={textVerblassEnabled} onToggle={() => setTextVerblassEnabled(e => !e)} dark={dark} />
                        </div>
                      </div>
                      <AnimatePresence initial={false} mode="wait">
                        {!textVerblassEnabled ? (
                          <motion.p key="fade-off" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} style={{ fontFamily: FONT_SANS, fontSize: "13px", color: descColor, lineHeight: "1.45", margin: 0 }}>
                            {t.fadeDesc}
                          </motion.p>
                        ) : (
                          <motion.div key="fade-on" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            <span style={{ fontFamily: FONT_SANS, fontSize: "15px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>{t.fadeTiming}</span>
                            <DoubleSlider value={verblassZeitpunkt} min={1} max={15} onChange={setVerblassZeitpunkt} dark={dark} />
                            <div style={{ border: `1px dashed ${innerBorder}`, borderRadius: "4px", padding: "10px 12px", textAlign: "center", fontFamily: FONT_SANS, fontSize: "15px", color: descColor, background: dark ? "rgba(240,232,220,0.04)" : "#fcf6ef" }}>
                              {t.fadeAfter(verblassZeitpunkt)}
                            </div>
                            <div style={{ borderTop: `1px dashed ${innerBorder}`, margin: "6px 0" }} />
                            <span style={{ fontFamily: FONT_SANS, fontSize: "15px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>{t.fadeSpeed}</span>
                            <DoubleSlider value={verblassSchnelligkeit} min={1} max={10} onChange={setVerblassSchnelligkeit} dark={dark} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                  </div>
                )}

                {/* ── Position ──────────────────────────────────────────── */}
                {activeCategory === "Position" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {([
                      { value: "standard" as const, label: t.posStandard, disabled: false },
                      { value: "spiral" as const, label: t.posSpiral, disabled: false },
                      { value: "random" as const, label: t.posRandom, disabled: false },
                      { value: "running" as const, label: t.posRunning, disabled: false },
                      { value: "custom" as const, label: t.posCustom, disabled: false },
                    ]).map((opt) => (
                      <div key={opt.value}>
                        <div onClick={() => {
                          setPositionMode(opt.value);
                          if (opt.value === "custom") setDrawnPath([]);
                        }} style={{
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                          border: positionMode === opt.value
                            ? `2px solid ${dark ? "rgba(240,232,220,0.85)" : LIGHT_TEXT}`
                            : `1px dashed ${innerBorder}`,
                          borderRadius: (positionMode === "random" && opt.value === "random") || (positionMode === "custom" && opt.value === "custom" && drawnPath.length > 0) ? "4px 4px 0 0" : "4px",
                          height: "36px", padding: "0 16px", cursor: "pointer",
                          background: positionMode === opt.value ? (dark ? "rgba(240,232,220,0.22)" : "rgba(85,85,85,0.13)") : settingsCardBg,
                          transition: "background 0.12s, border 0.12s",
                        }}>
                          <span style={{ fontFamily: FONT_SANS, fontSize: "15px", fontWeight: positionMode === opt.value ? 600 : 400, color: dark ? DARK_TEXT : LIGHT_TEXT, lineHeight: "1.4" }}>{opt.label}</span>
                          <RadioCircle selected={positionMode === opt.value} dark={dark} />
                        </div>
                        {opt.value === "random" && positionMode === "random" && (
                          <div style={{
                            border: `2px solid ${dark ? "rgba(240,232,220,0.85)" : LIGHT_TEXT}`,
                            borderTop: "none", borderRadius: "0 0 4px 4px",
                            background: dark ? "rgba(240,232,220,0.08)" : "rgba(85,85,85,0.06)",
                            padding: "10px 16px", display: "flex", gap: "8px",
                          }}>
                            {(["sentences", "words"] as const).map(mode => (
                              <button key={mode} onClick={() => setRandomMode(mode)} style={{
                                flex: 1, height: "32px",
                                background: randomMode === mode ? (dark ? "rgba(240,232,220,0.2)" : "rgba(85,85,85,0.12)") : "transparent",
                                border: `1px dashed ${randomMode === mode ? (dark ? "rgba(240,232,220,0.7)" : LIGHT_TEXT) : innerBorder}`,
                                borderRadius: "4px", cursor: "pointer", outline: "none",
                                fontFamily: FONT_SANS, fontSize: "13px",
                                color: dark ? DARK_TEXT : LIGHT_TEXT,
                                fontWeight: randomMode === mode ? 600 : 400,
                              }}>
                                {mode === "sentences" ? t.posRandomSentences : t.posRandomWords}
                              </button>
                            ))}
                          </div>
                        )}
                        {opt.value === "custom" && positionMode === "custom" && drawnPath.length > 0 && (
                          <div style={{
                            border: `2px solid ${dark ? "rgba(240,232,220,0.85)" : LIGHT_TEXT}`,
                            borderTop: "none", borderRadius: "0 0 4px 4px",
                            background: dark ? "rgba(240,232,220,0.08)" : "rgba(85,85,85,0.06)",
                            padding: "10px 16px",
                          }}>
                            <button onClick={() => setDrawnPath([])} style={{
                              width: "100%", height: "32px",
                              background: "transparent",
                              border: `1px dashed ${innerBorder}`,
                              borderRadius: "4px", cursor: "pointer", outline: "none",
                              fontFamily: FONT_SANS, fontSize: "13px",
                              color: dark ? DARK_TEXT : LIGHT_TEXT,
                            }}>
                              {DE ? "Pfad neu zeichnen" : "Redraw path"}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* ── Look & Feel ───────────────────────────────────────── */}
                {activeCategory === "Look & Feel" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <style>{`
                      input[type=number]::-webkit-inner-spin-button,
                      input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
                      input[type=number] { -moz-appearance: textfield; }
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

                    <div style={{ background: settingsCardBg, border: `1px dashed ${innerBorder}`, borderRadius: "8px", padding: "12px 24px", opacity: grainLevel === 0 ? 0.4 : 1, transition: "opacity 0.2s" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "36px" }}>
                        <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>{t.lfBgMotion}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <span style={{ fontFamily: FONT_SANS, fontSize: "11px", fontWeight: 500, color: descColor }}>{bgMotion && grainLevel > 0 ? t.on : t.off}</span>
                          <ToggleBtn on={bgMotion && grainLevel > 0} onToggle={() => { if (grainLevel > 0) setBgMotion(v => !v); }} dark={dark} />
                        </div>
                      </div>
                      {grainLevel === 0 && (
                        <p style={{ fontFamily: FONT_SANS, fontSize: "12px", color: descColor, margin: "0 0 4px", lineHeight: "1.4" }}>
                          {DE ? "Körnung aktivieren um Bewegung hinzuzufügen" : "Enable grain to add motion"}
                        </p>
                      )}
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
            <IconShowHidden color={iconColor} />
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
