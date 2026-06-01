import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { useNavigate, useSearchParams, useLocation } from "react-router";
import {
  WritingZone,
  type Position,
  extractText,
} from "./projects/parametrischestool/components/writing-zone";
import { saveNewTool, updateNewTool, getNewToolById } from "./utils/storage";
import { RecordPreviewOverlay } from "./components/RecordPreviewOverlay";
import html2canvas from "html2canvas-pro";

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

const FONT_SERIF   = "'az-serif', serif";
const FONT_SANS    = "'general-sans', sans-serif";
const FONT_ARIZONA = "'ABCArizona', serif";

const DICE_PROMPTS_DE = [
  "Schreib einen Satz, den du niemandem zeigen würdest.",
  "Was würdest du sagen, wenn niemand zuhört?",
  "Beschreib eine Farbe, ohne ihren Namen zu nennen.",
  "Wenn deine Angst einen Namen hätte, was würde sie sagen?",
  "Schreib den ersten Satz eines Briefes, den du nie abschicken wirst.",
  "Erkläre in drei Sätzen, wer du bist, ohne Beruf, Herkunft oder Namen.",
  "Was macht dich wütend, das dir gleichzeitig peinlich ist?",
  "Schreib über das, was du nicht bist.",
  "Stell dir vor, deine Gedanken haben Gewicht. Was ist gerade am schwersten?",
  "Was fängst du an zu denken, wenn du aufhörst zu denken?",
  "Schreib eine Lüge, die du dir selbst immer wieder erzählst.",
  "Was würde sich ändern, wenn niemand zuschaute?",
  "Schreib über etwas, das du weißt, aber nie sagst.",
  "Was wäre, wenn das Gegenteil von dem, was du glaubst, wahr wäre?",
  "Schreib über einen Moment, den du vergessen hast, aber dein Körper noch kennt.",
  "Was fragst du dich mitten in der Nacht?",
  "Schreib einen Satz, den du erst in zehn Jahren verstehen wirst.",
  "Beschreib das letzte Mal, als du dich geirrt hast.",
  "Was kannst du nicht aufhören zu wollen, obwohl du weißt, dass du es solltest?",
  "Schreib so, als ob niemand jemals lesen wird, was du schreibst.",
];
const DICE_PROMPTS_EN = [
  "Write a sentence you'd never show anyone.",
  "What would you say if nobody was listening?",
  "Describe a color without naming it.",
  "If your fear had a name, what would it say?",
  "Write the first line of a letter you'll never send.",
  "Describe who you are in three sentences: no job, no hometown, no name.",
  "What makes you angry that also embarrasses you?",
  "Write about what you are not.",
  "Imagine your thoughts have weight. What's the heaviest one right now?",
  "What do you start thinking when you stop thinking?",
  "Write a lie you keep telling yourself.",
  "What would change if nobody was watching?",
  "Write about something you know but never say.",
  "What if the opposite of what you believe were true?",
  "Write about a moment you've forgotten, but your body still remembers.",
  "What do you wonder about in the middle of the night?",
  "Write a sentence you'll only understand in ten years.",
  "Describe the last time you were wrong.",
  "What can't you stop wanting, even though you know you should?",
  "Write as if nobody will ever read what you're writing.",
];

// Isometric cube outline shared by every dice face
const DICE_FRAME = [
  "M1 3.99988L1 16.9999L5.5011e-07 16.7924L0 4.20733L1 3.99988Z",
  "M21 3.99988L21 16.9999L20 16.7924V4.20733L21 3.99988Z",
  "M13.7348 0.460938L19.3489 2.57786L18.9065 3.47978L13.4715 1.43041L13.7348 0.460938Z",
  "M3.35196 5L8.9661 7.11693L8.52369 8.01884L3.08872 5.96947L3.35196 5Z",
  "M3.35196 17L8.9661 19.1169L8.52369 20.0188L3.08872 17.9695L3.35196 17Z",
  "M8.61484 0L3.00069 2.11693L3.4431 3.01884L8.87807 0.969472L8.61484 0Z",
  "M17.6148 5L12.0007 7.11693L12.4431 8.01884L17.8781 5.96947L17.6148 5Z",
  "M10 9.73426V18.7343L11 18.5906L11 9.87788L10 9.73426Z",
  "M17.6148 17L12.0007 19.1169L12.4431 20.0188L17.8781 17.9695L17.6148 17Z",
];
// Pip dots per face (würfel1 / würfel2 / würfel3) — drawn on top of the frame
const DICE_FACES: string[][] = [
  [
    "M17 12.9999C17 13.5522 16.5523 13.9999 16 13.9999C15.4477 13.9999 15 13.5522 15 12.9999C15 12.4476 15.4477 11.9999 16 11.9999C16.5523 11.9999 17 12.4476 17 12.9999Z",
    "M8 3.99988C8 4.55217 7.55229 4.99988 7 4.99988C6.44772 4.99988 6 4.55217 6 3.99988C6 3.4476 6.44772 2.99988 7 2.99988C7.55229 2.99988 8 3.4476 8 3.99988Z",
    "M13 3.99988C13 4.55217 12.5523 4.99988 12 4.99988C11.4477 4.99988 11 4.55217 11 3.99988C11 3.4476 11.4477 2.99988 12 2.99988C12.5523 2.99988 13 3.4476 13 3.99988Z",
    "M4 7.99988C4 8.55217 3.55229 8.99988 3 8.99988C2.44772 8.99988 2 8.55217 2 7.99988C2 7.4476 2.44772 6.99988 3 6.99988C3.55229 6.99988 4 7.4476 4 7.99988Z",
    "M6 11.9999C6 12.5522 5.55229 12.9999 5 12.9999C4.44772 12.9999 4 12.5522 4 11.9999C4 11.4476 4.44772 10.9999 5 10.9999C5.55229 10.9999 6 11.4476 6 11.9999Z",
    "M9 15.9999C9 16.5522 8.55229 16.9999 8 16.9999C7.44772 16.9999 7 16.5522 7 15.9999C7 15.4476 7.44772 14.9999 8 14.9999C8.55229 14.9999 9 15.4476 9 15.9999Z",
  ],
  [
    "M6 12C6 12.5523 5.55228 13 5 13C4.44771 13 4 12.5523 4 12C4 11.4477 4.44771 11 5 11C5.55228 11 6 11.4477 6 12Z",
    "M15 11C15 11.5523 14.5523 12 14 12C13.4477 12 13 11.5523 13 11C13 10.4477 13.4477 10 14 10C14.5523 10 15 10.4477 15 11Z",
    "M9 10C9 10.5523 8.55228 11 8 11C7.44771 11 7 10.5523 7 10C7 9.44772 7.44771 9 8 9C8.55228 9 9 9.44772 9 10Z",
    "M4 15C4 15.5523 3.55228 16 3 16C2.44771 16 2 15.5523 2 15C2 14.4477 2.44771 14 3 14C3.55228 14 4 14.4477 4 15Z",
    "M4 9C4 9.55228 3.55228 10 3 10C2.44771 10 2 9.55228 2 9C2 8.44772 2.44771 8 3 8C3.55228 8 4 8.44772 4 9Z",
    "M18 14C18 14.5523 17.5523 15 17 15C16.4477 15 16 14.5523 16 14C16 13.4477 16.4477 13 17 13C17.5523 13 18 13.4477 18 14Z",
    "M8 16C8 16.5523 7.55228 17 7 17C6.44771 17 6 16.5523 6 16C6 15.4477 6.44771 15 7 15C7.55228 15 8 15.4477 8 16Z",
    "M12 4C12 4.55228 11.5523 5 11 5C10.4477 5 10 4.55228 10 4C10 3.44772 10.4477 3 11 3C11.5523 3 12 3.44772 12 4Z",
  ],
  [
    "M6 12C6 12.5523 5.55228 13 5 13C4.44771 13 4 12.5523 4 12C4 11.4477 4.44771 11 5 11C5.55228 11 6 11.4477 6 12Z",
    "M15 11C15 11.5523 14.5523 12 14 12C13.4477 12 13 11.5523 13 11C13 10.4477 13.4477 10 14 10C14.5523 10 15 10.4477 15 11Z",
    "M18 14C18 14.5523 17.5523 15 17 15C16.4477 15 16 14.5523 16 14C16 13.4477 16.4477 13 17 13C17.5523 13 18 13.4477 18 14Z",
    "M7 4C7 4.55228 6.55228 5 6 5C5.44771 5 5 4.55228 5 4C5 3.44772 5.44771 3 6 3C6.55228 3 7 3.44772 7 4Z",
    "M11 4C11 4.55228 10.5523 5 10 5C9.44771 5 9 4.55228 9 4C9 3.44772 9.44771 3 10 3C10.5523 3 11 3.44772 11 4Z",
    "M15 4C15 4.55228 14.5523 5 14 5C13.4477 5 13 4.55228 13 4C13 3.44772 13.4477 3 14 3C14.5523 3 15 3.44772 15 4Z",
  ],
];

const NAV_ROUTES: Record<string, string> = {
  CreateTool:      "/create-tool",
  ToolCollection:  "/tool-collection",
  About:           "/about-the-project",
};

const SIDEBAR_CATS = [
  { en: "Look & Feel", de: "Look & Feel",  h: "60px",  br: "100px" },
  { en: "Time",        de: "Zeit",         h: "104px", br: "100px" },
  { en: "Visibility",  de: "Sichtbarkeit", h: "63px",  br: "4px" },
  { en: "Correction",  de: "Korrigieren",  h: "60px",  br: "40px 4px 40px 4px" },
  { en: "Stability",   de: "Stabilität",   h: "46px",  br: "4px" },
  { en: "Position",    de: "Position",     h: "68px",  br: "4px", bottom: true as const },
];

// ── Translations ──────────────────────────────────────────────────────────────
const TRANSLATIONS = {
  de: {
    langBtn: "DE",
    backBtn: "Zurück",
    rulesBtn: "Regeln brechen",
    rulesHeading: "Regeln",
    rulesSubtitle: "Ändere sie.",
    identityBtn: "Name,\nBeschreibung\n& mehr",
    saveBtn: "Mein Tool speichern",
    menuClosed: "Menü",
    menuOpen: "Schließen",
    word: "Wort",
    words: "Wörter",
    navLabels: { CreateTool: "Tool erstellen", ToolCollection: "Tool-Sammlung", About: "Über das Projekt" },
    // Identity panel
    identityHeading: "Identität.",
    identitySubtitle: "Speichere dein Regelset als Tool. Nur Name und Vorschau sind nötig – Beschreibung und Schreibanstoß sind optional.",
    nameHeading: "Name",
    nameHint: 'Gib deinem Tool einen Namen.',
    namePlaceholder: "Name eingeben",
    promptHeading: "Schreibanstoß oder Aufgabe (optional)",
    promptHint: "Das hilft Menschen beim Schreiben. Wenn leer, werden die Standard-Würfel-Prompts verwendet.",
    promptPlaceholder: "Beispiel: Schreibe etwas über dich…",
    promptAdd: "+ Weiteren hinzufügen",
    descHeading: "Beschreibung oder Regel (optional)",
    descPlaceholder: "Beispiel: Dieses Tool hilft anonym zu schreiben",
    // Time
    timerLabel: "Timer",
    on: "An", off: "Aus",
    timerFixed: "Feste Zeit", timerFree: "Freie Wahl",
    minutes: "Minuten",
    visualTimer: "Visueller Timer",
    visualTimerDesc: "Der Text verblasst langsam, bis er unsichtbar wird. Wenn nichts mehr zu sehen ist, ist die Zeit um.",
    userReset: "Nutzer können Dauer ändern",
    userResetDesc: "Wenn deaktiviert, bleibt die Dauer fest.",
    cursorRunning: "Cursor läuft weiter",
    cursorRunningDesc: "Der Cursor läuft automatisch weiter, egal ob man schreibt oder nicht. Damit werden Pausen sichtbar.",
    cursorSpeed: "Geschwindigkeit",
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
    driftAfter: (n: number) => {
      const totalSec = Math.round(n * 60);
      const mins = Math.floor(totalSec / 60);
      const secs = totalSec % 60;
      if (mins === 0) return `Nach ${secs} Sek`;
      if (secs === 0) return `Nach ${mins} min`;
      return `Nach ${mins} min ${secs} Sek`;
    },
    driftSpeed: "Schnelligkeit des Fliegens",
    fadeLabel: "Text verblasst",
    fadeDesc: "Der Text verblasst und verschwindet langsam.",
    fadeTiming: "Zeitpunkt des Verblassens",
    fadeAfter: (n: number) => {
      const totalSec = Math.round(n * 60);
      const mins = Math.floor(totalSec / 60);
      const secs = totalSec % 60;
      if (mins === 0) return `Nach ${secs} Sek`;
      if (secs === 0) return `Nach ${mins} min`;
      return `Nach ${mins} min ${secs} Sek`;
    },
    fadeSpeed: "Schnelligkeit des Verblassens",
    heavyLabel: "Text wird schwer",
    heavyDesc: "Die Buchstaben werden zu schwer und fallen nach und nach auf den Boden der Seite.",
    heavyTiming: "Zeitpunkt des Fallens",
    heavySpeed: "Schwere",
    heavyAfter: (n: number) => {
      const totalSec = Math.round(n * 60);
      const mins = Math.floor(totalSec / 60);
      const secs = totalSec % 60;
      if (mins === 0) return `Nach ${secs} Sek`;
      if (secs === 0) return `Nach ${mins} min`;
      return `Nach ${mins} min ${secs} Sek`;
    },
    // Position
    posStandard: "Standard",
    posSpiral: "Spiralförmiger Text",
    posRandom: "Text erscheint zufällig",
    posRunning: "Fortlaufende Linie",
    posCustom: "Zeichne deine eigene Linie",
    posZigzag: "Zig Zag",
    posFollowDot: "Dem Punkt folgen",
    posRandomSentences: "Ganze Sätze",
    posRandomWords: "Einzelne Wörter",
    // Look & Feel
    lfGrain: "Körnung & Textur",
    lfTextSize: "Textgröße",
    lfSerif: "Serifen",
    lfBgMotion: "Bewegung des Hintergrunds",
    lfBgColor: "Hintergrundfarbe anpassen",
    lfBgColorReset: "Farbe zurücksetzen",
    lfNoColor: "Originalfarbe",
    // Timer overlay
    timesUp: "Zeit abgelaufen.",
    timesUpSub: "Dein Text ist noch da, unsichtbar.",
    deleteText: "Text löschen",
    revealText: "Text sehen",
    copyText: "Text kopieren",
    copied: "Kopiert ✓",
    exportText: "Export Text",
    exportJPG: "Als JPG exportieren",
    exportTxt: "Als TXT exportieren",
    exportCopy: "Text kopieren",
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
    langBtn: "EN",
    backBtn: "Back",
    rulesBtn: "Break Rules",
    rulesHeading: "Rules",
    rulesSubtitle: "Change them.",
    identityBtn: "Name,\nDescription\n& more",
    saveBtn: "Save my Tool",
    menuClosed: "Menu",
    menuOpen: "Close",
    word: "word",
    words: "words",
    navLabels: { CreateTool: "Create Tool", ToolCollection: "Tool Collection", About: "About" },
    // Identity panel
    identityHeading: "Identity.",
    identitySubtitle: "Save your rule set as a tool. Only name and preview are required — description and writing prompt are optional.",
    nameHeading: "Name",
    nameHint: 'Give your tool a name.',
    namePlaceholder: "Enter name",
    promptHeading: "Writing Prompt or Task (optional)",
    promptHint: "This helps people start writing. If left empty, default dice prompts are used.",
    promptPlaceholder: "Example: Write something about yourself…",
    promptAdd: "+ Add another",
    descHeading: "Description or Rule (optional)",
    descPlaceholder: "Example: This tool helps writing anonymously",
    // Time
    timerLabel: "Timer",
    on: "On", off: "Off",
    timerFixed: "Fixed Time", timerFree: "Free Choice",
    minutes: "Minutes",
    visualTimer: "Visual Timer",
    visualTimerDesc: "The text slowly fades until it disappears. When nothing is visible, time is up.",
    userReset: "Allow users to change duration",
    userResetDesc: "If disabled, duration stays fixed.",
    cursorRunning: "Cursor keeps running",
    cursorRunningDesc: "The cursor moves automatically whether you type or not. This makes pauses visible.",
    cursorSpeed: "Speed",
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
    driftAfter: (n: number) => {
      const totalSec = Math.round(n * 60);
      const mins = Math.floor(totalSec / 60);
      const secs = totalSec % 60;
      if (mins === 0) return `After ${secs} sec`;
      if (secs === 0) return `After ${mins} min`;
      return `After ${mins} min ${secs} sec`;
    },
    driftSpeed: "Drift speed",
    fadeLabel: "Text fades",
    fadeDesc: "Text slowly fades and disappears.",
    fadeTiming: "Fade timing",
    fadeAfter: (n: number) => {
      const totalSec = Math.round(n * 60);
      const mins = Math.floor(totalSec / 60);
      const secs = totalSec % 60;
      if (mins === 0) return `After ${secs} sec`;
      if (secs === 0) return `After ${mins} min`;
      return `After ${mins} min ${secs} sec`;
    },
    fadeSpeed: "Fade speed",
    heavyLabel: "Text gets heavy",
    heavyDesc: "The letters grow too heavy and fall, one by one, to the floor of the page.",
    heavyTiming: "Falling timing",
    heavySpeed: "Weight",
    heavyAfter: (n: number) => {
      const totalSec = Math.round(n * 60);
      const mins = Math.floor(totalSec / 60);
      const secs = totalSec % 60;
      if (mins === 0) return `After ${secs} sec`;
      if (secs === 0) return `After ${mins} min`;
      return `After ${mins} min ${secs} sec`;
    },
    // Position
    posStandard: "Standard",
    posSpiral: "Spiraling Text",
    posRandom: "Text appears random",
    posRunning: "Running Line",
    posCustom: "Draw your own path",
    posZigzag: "Zig Zag",
    posFollowDot: "Follow the dot",
    posRandomSentences: "Full sentences",
    posRandomWords: "Individual words",
    // Look & Feel
    lfGrain: "Grain & Texture",
    lfTextSize: "Text Size",
    lfSerif: "Serifs",
    lfBgMotion: "Background Motion",
    lfBgColor: "Adjust background color",
    lfBgColorReset: "Reset color",
    lfNoColor: "Original Color",
    // Timer overlay
    timesUp: "Time's up.",
    timesUpSub: "Your text is still there, invisible.",
    deleteText: "Delete text",
    revealText: "Reveal text",
    copyText: "Copy text",
    copied: "Copied ✓",
    exportText: "Export Text",
    exportJPG: "Export as JPG",
    exportTxt: "Export as TXT",
    exportCopy: "Copy text",
    // Category labels
    catLabel: (cat: { en: string; de: string }) => cat.en,
    catHeading: (cat: { en: string; de: string }) => cat.en,
    // Category descriptions
    catDesc: {
      "Time":        "In typical writing tools, time plays no role, yet our thinking and speaking are inherently temporal.",
      "Visibility":  "In typical writing tools, text is always visible. But what happens when we play with that?",
      "Correction":  "In typical writing tools you can always edit and delete. Here, deletion becomes impossible… or visible.",
      "Stability":   "In typical writing tools, text is stable and permanent. But thoughts are fleeting and fade away.",
      "Position":    "In typical writing tools, text is linear, written left to right. Here, that changes.",
      "Look & Feel": "Modern writing tools are smooth, clean, and static. Qualities impossible in our actual thinking.",
    } as Record<string, string>,
    writingPrompt: "Explore new ways of thinking by breaking the rules of standard writing tools…",
  },
};

type Tr = typeof TRANSLATIONS["de"];

const DELETE_OPTS_KEYS = ["all", "none", "sentence", "word"] as const;
type DeleteMode = typeof DELETE_OPTS_KEYS[number];

const BTN_CLOSED = { dark: 24, rules: 67, clear: 188 };
const BTN_OPEN   = { dark: 371, rules: 414, clear: 535 };
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

// ── Double slider ─────────────────────────────────────────────────────────────
function DoubleSlider({ value, min, max, step = 1, onChange, dark }: {
  value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void; dark: boolean;
}) {
  const pct      = ((value - min) / (max - min)) * 100;
  const filled   = dark ? DARK_TEXT : LIGHT_TEXT;
  const unfilled = dark ? "rgba(240,232,220,0.25)" : "rgba(164,164,164,0.45)";
  return (
    <div style={{ position: "relative", height: "20px", display: "flex", alignItems: "center" }}>
      <div style={{ position: "absolute", left: 0, right: 0 }}>
        <div style={{ position: "absolute", left: 0, width: `${pct}%`, height: "2px", background: filled, top: "5px", borderRadius: "1px" }} />
        <div style={{ position: "absolute", left: 0, width: `${pct}%`, height: "2px", background: filled, top: "10px", borderRadius: "1px" }} />
        <div style={{ position: "absolute", left: `${pct}%`, right: 0, height: "1px", background: unfilled, top: "8px" }} />
        {/* Handle */}
        <div style={{
          position: "absolute",
          left: `calc(${pct}% - 7px)`,
          top: "0px",
          width: "14px",
          height: "14px",
          borderRadius: "50%",
          background: filled,
          boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
          pointerEvents: "none",
        }} />
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
  dark, isVisual, onDelete, onReveal, onCopy, copied, t, surfaceLight, cardBg,
}: {
  dark: boolean; isVisual: boolean;
  onDelete: () => void; onReveal: () => void; onCopy: () => void; copied: boolean;
  t: Tr; surfaceLight: string; cardBg: string;
}) {
  return createPortal(
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        display: "flex", alignItems: "center", justifyContent: "center",
        backgroundColor: `color-mix(in srgb, ${dark ? cardBg : surfaceLight} 88%, transparent)`,
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
          background: cardBg,
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
function SavedModal({ dark, savedId, lang, onClose, onPlayground, surfaceLight, cardBg }: {
  dark: boolean; savedId: string; lang: "de" | "en";
  onClose: () => void; onPlayground: () => void; surfaceLight: string; cardBg: string;
}) {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}/create-tool?tool=${savedId}`;

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
        backgroundColor: `color-mix(in srgb, ${dark ? cardBg : surfaceLight} 90%, transparent)`,
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
          background: cardBg,
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
            onClick={() => navigate(`/create-tool?tool=${savedId}`)}
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

// ── Organic grain overlay (SVG turbulence layers) ─────────────────────────────
// One uniform tile looks artificial, so we stack several noise layers with
// different scales, octaves and seeds — a fine speckle, larger soft grains, and
// an anisotropic layer that reads as fibres/streaks. Seeds derive from the
// tool's seed so each tool gets its own organic texture.
function grainNoiseUrl(freq: string, octaves: number, seed: number, slope: number, type: "fractalNoise" | "turbulence" = "fractalNoise", size = 256): string {
  const intercept = (1 - slope) / 2; // keep mid-grey centred
  const svg =
    `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'>` +
    `<filter id='n'>` +
    `<feTurbulence type='${type}' baseFrequency='${freq}' numOctaves='${octaves}' stitchTiles='stitch' seed='${seed}'/>` +
    `<feColorMatrix type='saturate' values='0'/>` +
    `<feComponentTransfer>` +
    `<feFuncR type='linear' slope='${slope}' intercept='${intercept}'/>` +
    `<feFuncG type='linear' slope='${slope}' intercept='${intercept}'/>` +
    `<feFuncB type='linear' slope='${slope}' intercept='${intercept}'/>` +
    `</feComponentTransfer></filter>` +
    `<rect width='${size}' height='${size}' filter='url(#n)'/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

interface GrainLayer { url: string; size: number; alpha: number; }
function buildGrainLayers(seed: number): GrainLayer[] {
  const s1 = Math.abs(seed) % 1000;
  const s2 = Math.abs(seed * 7 + 13) % 1000;
  const s3 = Math.abs(seed * 13 + 29) % 1000;
  const s4 = Math.abs(seed * 31 + 7) % 1000;
  return [
    // fine speckle (the main grain)
    { url: grainNoiseUrl("0.9", 3, s1, 2.0),          size: 190, alpha: 0.5  },
    // larger soft grains / blotches
    { url: grainNoiseUrl("0.16", 4, s2, 1.5),         size: 430, alpha: 0.4  },
    // vertical-ish fibres / streaks
    { url: grainNoiseUrl("0.012 0.42", 2, s3, 1.45),  size: 512, alpha: 0.2  },
    // faint horizontal-ish streaks for cross-grain
    { url: grainNoiseUrl("0.4 0.014", 2, s4, 1.35),   size: 512, alpha: 0.14 },
  ];
}

// ── Paper grain canvas ────────────────────────────────────────────────────────
const OG_W = 512, OG_H = 512;

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

// Paper grain: fine speckle + micro fibers + subtle surface, no large blobs
function makePaperBuf(seed: number): Float32Array {
  const speckle = makeValueNoise(seed,          1);  // pixel-level speckle
  const micro   = makeValueNoise(seed * 7  + 3, 2);  // micro fibers
  const fiber   = makeValueNoise(seed * 17 + 5, 5);  // fiber bundles
  const surface = makeValueNoise(seed * 29 + 9, 11); // subtle paper topography
  const buf = new Float32Array(OG_W * OG_H);
  const C = 2.2;
  for (let i = 0; i < buf.length; i++) {
    const raw = speckle[i] * 0.40 + micro[i] * 0.30 + fiber[i] * 0.22 + surface[i] * 0.08;
    const v = (raw - 0.5) * C + 0.5;
    buf[i] = v < 0 ? 0 : v > 1 ? 1 : v;
  }
  return buf;
}

function OrganicGrainCanvas({ grainLevel, dark }: { grainLevel: number; dark: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef    = useRef(0);
  const startRef  = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = OG_W; canvas.height = OG_H;
    const ctx = canvas.getContext("2d")!;

    // Draw paper grain texture once — no per-frame pixel work
    const buf = makePaperBuf(42);
    const img = ctx.createImageData(OG_W, OG_H);
    const d = img.data;
    for (let i = 0; i < OG_W * OG_H; i++) {
      const v = (buf[i] * 255 + 0.5) | 0;
      const j = i * 4;
      d[j] = d[j + 1] = d[j + 2] = v; d[j + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);

    // Motion: very slow Lissajous drift via CSS transform — GPU-accelerated, zero pixel work
    const PERIOD = 46; // seconds per main cycle
    const tick = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const t = (ts - startRef.current) / 1000;
      const dx = 6 * Math.sin((t / PERIOD) * Math.PI * 2);
      const dy = 5 * Math.cos((t / PERIOD) * Math.PI * 2 * 0.618); // golden ratio desync
      canvas.style.transform = `translate(${dx}px, ${dy}px)`;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      style={{
        position: "fixed",
        top: "-4%", left: "-4%",
        width: "108%", height: "108%",
        zIndex: 3, pointerEvents: "none",
        opacity: (grainLevel / 100) * 0.88,
        mixBlendMode: dark ? "screen" : "multiply",
        willChange: "transform",
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
  const location = useLocation();
  const [searchParams] = useSearchParams();

  // Go back to wherever the user came from (preserving their scroll position).
  // If they landed here directly (e.g. via a shared tool link) there's no
  // in-app history, so fall back to the tool collection.
  const goBack = () => {
    if (location.key && location.key !== "default") navigate(-1);
    else navigate("/tool-collection");
  };
  const sessionId = useMemo(() => getOrCreateSessionId(), []);
  // Save state
  const [saving, setSaving]               = useState(false);
  const [savedId, setSavedId]             = useState<string | null>(null);
  const [previewSeed]                     = useState(() => Math.floor(Math.random() * 999983));
  const grainLayers = useMemo(() => buildGrainLayers(previewSeed), [previewSeed]);
  const [saveError, setSaveError]         = useState<string | null>(null);
  const [currentToolId, setCurrentToolId] = useState<string | null>(null);
  const [previewVideoUrl, setPreviewVideoUrl]   = useState<string | null>(null);
  const [previewVideoPath, setPreviewVideoPath] = useState<string | null>(null);
  const [showRecordOverlay, setShowRecordOverlay] = useState(false);
  const [recordState, setRecordState]             = useState<"idle" | "done" | "error">("idle");
  const [videoPreviewError, setVideoPreviewError] = useState(false);
  // Loaded-tool ownership & edit mode
  const [loadedToolIsOwn, setLoadedToolIsOwn]         = useState(false);
  const [editModeEnabledState, setEditModeEnabledState] = useState(false);
  const [infoModalOpen, setInfoModalOpen]               = useState(false);

  const windowWidth = useWindowWidth();

  // UI
  const [lang, setLang]               = useState<"de" | "en">(() => (localStorage.getItem("appLang") as "de" | "en") ?? "de");
  const [dark, setDark]               = useState<boolean>(() => localStorage.getItem("appTheme") === "dark");
  const [visible, setVisible]         = useState(true);
  const [menuOpen, setMenuOpen]       = useState(false);
  const [menuHovered, setMenuHovered] = useState(false);
  const [rulesHovered, setRulesHovered] = useState(false);
  const [rulesOpen, setRulesOpen]     = useState(() => !searchParams.get("tool"));
  const [activeCategory, setActiveCategory] = useState("Look & Feel");
  const [identityOpen, setIdentityOpen]     = useState(false);
  const writingFocusRef = useRef<(() => void) | null>(null);

  // Time params
  const [timerEnabled, setTimerEnabled]     = useState(false);
  const [timerMode, setTimerMode]           = useState<"fixed" | "free">("fixed");
  const [timerMinutes, setTimerMinutes]     = useState(10);
  const [visualTimer, setVisualTimer]       = useState(false);
  const [timerUserReset, setTimerUserReset] = useState(false);
  const [cursorRunning, setCursorRunning]   = useState(false);
  const [cursorSchnelligkeit, setCursorSchnelligkeit] = useState(50);

  // Visibility params
  const [visibility, setVisibility] = useState<"visible" | "invisible" | "sentence" | "word" | "char">("visible");

  // Correction params
  const [deleteMode, setDeleteMode]               = useState<DeleteMode>("all");
  const [correctionVisible, setCorrectionVisible] = useState(false);

  // Stability params
  const [textFliegtEnabled, setTextFliegtEnabled]         = useState(false);
  const [fliegtUnit, setFliegtUnit]                       = useState<"Sätze" | "Wörter" | "Buchstabe">("Sätze");
  const [fliegtZeitpunkt, setFliegtZeitpunkt]             = useState(0.5);
  const [fliegtSchnelligkeit, setFliegtSchnelligkeit]     = useState(2.0);
  const [textEditingEnabled, setTextEditingEnabled]        = useState(true);
  const [textVerblassEnabled, setTextVerblassEnabled]     = useState(false);
  const [verblassZeitpunkt, setVerblassZeitpunkt]         = useState(0.5);
  const [verblassSchnelligkeit, setVerblassSchnelligkeit] = useState(2.0);
  const [textSchwerEnabled, setTextSchwerEnabled]         = useState(false);
  const [schwerZeitpunkt, setSchwerZeitpunkt]             = useState(0.5);
  const [schwerSchnelligkeit, setSchwerSchnelligkeit]     = useState(50);

  // Position params
  const [positionMode, setPositionMode] = useState<"standard" | "spiral" | "random" | "running" | "custom" | "zigzag" | "followdot">("standard");
  const [drawnPath, setDrawnPath]       = useState<{ x: number; y: number }[][]>([]);

  // Compatibility toast
  const [compatMsg, setCompatMsg] = useState<string | null>(null);
  const compatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showCompatMsg = useCallback((msg: string) => {
    setCompatMsg(msg);
    if (compatTimerRef.current) clearTimeout(compatTimerRef.current);
    compatTimerRef.current = setTimeout(() => setCompatMsg(null), 3000);
  }, []);

  // Non-standard positions block: drift, cursor-running, correction-visible
  const NON_STANDARD_POSITIONS = ["spiral", "random", "running", "custom", "zigzag", "followdot"] as const;
  type NonStdPos = typeof NON_STANDARD_POSITIONS[number];
  const isNonStandard = NON_STANDARD_POSITIONS.includes(positionMode as NonStdPos);

  // Smart position setter — auto-clears incompatible rules and shows toast
  const applyPositionMode = useCallback((
    mode: "standard" | "spiral" | "random" | "running" | "custom" | "zigzag" | "followdot",
    opts: { setTextFliegtEnabled: (v: boolean) => void; setCursorRunning: (v: boolean) => void; setCorrectionVisible: (v: boolean) => void; setTextSchwerEnabled: (v: boolean) => void; textFliegtEnabled: boolean; cursorRunning: boolean; correctionVisible: boolean; textSchwerEnabled: boolean; de: boolean; posNames: Record<string, string> }
  ) => {
    setPositionMode(mode);
    if (mode === "standard") return;
    const turned: string[] = [];
    if (opts.textFliegtEnabled) { opts.setTextFliegtEnabled(false); turned.push(opts.de ? "Text fliegt davon" : "Text drift"); }
    if (opts.cursorRunning && mode !== "running") { opts.setCursorRunning(false); turned.push(opts.de ? "Cursor läuft weiter" : "Cursor keeps running"); }
    if (opts.correctionVisible) { opts.setCorrectionVisible(false); turned.push(opts.de ? "Korrigieren sichtbar" : "Correction visible"); }
    if (opts.textSchwerEnabled) { opts.setTextSchwerEnabled(false); turned.push(opts.de ? "Text wird schwer" : "Text gets heavy"); }
    if (turned.length > 0) {
      const posLabel = opts.posNames[mode] ?? mode;
      showCompatMsg(opts.de
        ? `${posLabel} aktiv. Ausgeschaltet: ${turned.join(", ")}.`
        : `${posLabel} enabled. Turned off: ${turned.join(", ")}.`
      );
    }
  }, [showCompatMsg]);

  // Smart drift setter — resets position to standard if incompatible
  const applyDrift = useCallback((enabled: boolean, de: boolean, posLabel: string) => {
    setTextFliegtEnabled(enabled);
    if (enabled && isNonStandard) {
      setPositionMode("standard");
      showCompatMsg(de
        ? `Text fliegt davon aktiv. Position zurück auf Standard.`
        : `Text drift enabled. Position reset to Standard.`
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNonStandard, showCompatMsg]);

  // Smart heavy setter — resets position to standard if incompatible
  const applyHeavy = useCallback((enabled: boolean, de: boolean) => {
    setTextSchwerEnabled(enabled);
    if (enabled && isNonStandard) {
      setPositionMode("standard");
      showCompatMsg(de
        ? `Text wird schwer aktiv. Position zurück auf Standard.`
        : `Text gets heavy enabled. Position reset to Standard.`
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNonStandard, showCompatMsg]);

  // Smart cursorRunning setter
  const applyCursorRunning = useCallback((enabled: boolean, de: boolean) => {
    setCursorRunning(enabled);
    if (enabled && isNonStandard && positionMode !== "running") {
      setPositionMode("standard");
      showCompatMsg(de
        ? `Cursor läuft weiter aktiv. Position zurück auf Standard.`
        : `Cursor keeps running enabled. Position reset to Standard.`
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNonStandard, positionMode, showCompatMsg]);

  // Smart correctionVisible setter
  const applyCorrectionVisible = useCallback((enabled: boolean, de: boolean) => {
    setCorrectionVisible(enabled);
    if (enabled && isNonStandard) {
      setPositionMode("standard");
      showCompatMsg(de
        ? `Korrigieren sichtbar aktiv. Position zurück auf Standard.`
        : `Correction visible enabled. Position reset to Standard.`
      );
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isNonStandard, showCompatMsg]);

  // Look & Feel params
  const [grainLevel, setGrainLevel]       = useState(0);
  const [textSizeLevel, setTextSizeLevel] = useState(46);
  const [bgHue, setBgHue]                 = useState<number | null>(null);
  const [serifLevel, setSerifLevel]       = useState<number | null>(null); // null = az-serif; 0-100 = ABCArizona SRFF axis

  // Position sub-options
  const [randomMode, setRandomMode] = useState<"sentences" | "words">("words");

  // Identity panel state
  const [toolName, setToolName]               = useState("");
  const [prompts, setPrompts]                 = useState<string[]>([""]);
  const [diceIdx, setDiceIdx]                 = useState(-1);
  const [diceFace, setDiceFace]               = useState(0);
  const [diceSpinning, setDiceSpinning]       = useState(false);
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
  const [exportOpen, setExportOpen]     = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  const topRightGroupRef = useRef<HTMLDivElement>(null);
  const [topRightWidth, setTopRightWidth] = useState(200);
  const writingZoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const measure = () => {
      if (topRightGroupRef.current) {
        setTopRightWidth(topRightGroupRef.current.getBoundingClientRect().width);
      }
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [currentToolId, lang]);

  useEffect(() => {
    if (!exportOpen) return;
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [exportOpen]);

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
            >{lang === "de" ? "DE" : "EN"}</button>
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
            onClick={() => navigate("/tool-collection")}
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
      const timerOverride = searchParams.get("timer");
      if (timerOverride !== null) {
        const mins = Number(timerOverride);
        setTimerEnabled(mins > 0);
        setTimerMinutes(mins > 0 ? mins : 10);
      } else {
        setTimerEnabled(p.timerEnabled === true);
        setTimerMinutes(typeof p.timerMinutes === "number" ? p.timerMinutes : 10);
      }
      setTimerMode((p.timerMode as "fixed" | "free") ?? "fixed");
      setVisualTimer(p.visualTimer === true);
      setTimerUserReset(p.timerUserReset === true);
      setCursorRunning(p.cursorRunning === true);
      setCursorSchnelligkeit(typeof p.cursorSchnelligkeit === "number" ? p.cursorSchnelligkeit : 50);
      setVisibility((p.visibility as typeof visibility) ?? "visible");
      setDeleteMode((p.deleteMode as typeof deleteMode) ?? "all");
      setCorrectionVisible(p.correctionVisible === true);
      setTextFliegtEnabled(p.textFliegtEnabled === true);
      setFliegtUnit((p.fliegtUnit as typeof fliegtUnit) ?? "Sätze");
      setFliegtZeitpunkt(typeof p.fliegtZeitpunkt === "number" ? p.fliegtZeitpunkt : 0.5);
      setFliegtSchnelligkeit(typeof p.fliegtSchnelligkeit === "number" ? p.fliegtSchnelligkeit : 2.0);
      setTextVerblassEnabled(p.textVerblassEnabled === true);
      setVerblassZeitpunkt(typeof p.verblassZeitpunkt === "number" ? p.verblassZeitpunkt : 0.5);
      setVerblassSchnelligkeit(typeof p.verblassSchnelligkeit === "number" ? p.verblassSchnelligkeit : 2.0);
      setTextSchwerEnabled(p.textSchwerEnabled === true);
      setSchwerZeitpunkt(typeof p.schwerZeitpunkt === "number" ? p.schwerZeitpunkt : 0.5);
      setSchwerSchnelligkeit(typeof p.schwerSchnelligkeit === "number" ? p.schwerSchnelligkeit : 50);
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
      setSerifLevel(typeof p.serifLevel === "number" ? p.serifLevel : null);
      if (p.previewVideo) { setPreviewVideoUrl(p.previewVideo); setPreviewVideoPath(p.previewVideoPath ?? null); setRecordState("done"); }
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

  const handleDiceRoll = useCallback(() => {
    if (diceSpinning) return;
    setDiceSpinning(true);
    setTimeout(() => {
      setDiceIdx(i => {
        let next = i;
        const len = DICE_PROMPTS_DE.length;
        while (next === i) next = Math.floor(Math.random() * len);
        return next;
      });
      setDiceFace(f => {
        let next = f;
        while (next === f) next = Math.floor(Math.random() * DICE_FACES.length);
        return next;
      });
      setDiceSpinning(false);
    }, 550);
  }, [diceSpinning]);

  const handleReveal = useCallback(() => setTextRevealed(true), []);

  const handleDownloadTxt = useCallback(() => {
    const text = extractText(positions);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${toolName.trim() || "text"}.txt`; a.click();
    URL.revokeObjectURL(url);
    setExportOpen(false);
  }, [positions, toolName]);

  const handleCopyExport = useCallback(() => {
    const text = extractText(positions);
    navigator.clipboard.writeText(text).catch(() => {});
    setExportOpen(false);
  }, [positions]);

  const handleSave = useCallback(async (isPublic: boolean) => {
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
      const params = {
        source: "new" as const,
        sessionId,
        prompts,
        isPublic,
        timerEnabled, timerMode, timerMinutes, visualTimer, timerUserReset, cursorRunning, cursorSchnelligkeit,
        visibility, deleteMode, correctionVisible,
        textFliegtEnabled, fliegtUnit, fliegtZeitpunkt, fliegtSchnelligkeit,
        textEditingEnabled,
        textVerblassEnabled, verblassZeitpunkt, verblassSchnelligkeit,
        textSchwerEnabled, schwerZeitpunkt, schwerSchnelligkeit,
        positionMode, randomMode,
        drawnPath: positionMode === "custom" ? drawnPath : [],
        grainLevel, textSizeLevel, bgHue, serifLevel,
        ...(previewVideoUrl ? { previewVideo: previewVideoUrl, previewVideoPath: previewVideoPath ?? undefined } : {}),
        preview: {
          text: prompts[0]?.trim().slice(0, 40) || (lang === "de" ? "Ich schreibe anders." : "I write differently."),
          seed: previewSeed,
          version: 1,
        },
      };
      // Fix 3: update existing tool if loaded via URL, otherwise create new
      const id = currentToolId
        ? await updateNewTool(currentToolId, toolName, toolDescription, params)
        : await saveNewTool(toolName, toolDescription, params);
      if (!currentToolId) setCurrentToolId(id);
      localStorage.setItem("hasCreatedTool", "1");
      setSavedId(id);
    } catch {
      setSaveError(lang === "de" ? "Fehler beim Speichern. Bitte erneut versuchen." : "Error saving. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [
    toolName, toolDescription, prompts, sessionId, lang, currentToolId,
    timerEnabled, timerMode, timerMinutes, visualTimer, timerUserReset, cursorRunning, cursorSchnelligkeit,
    visibility, deleteMode, correctionVisible,
    textFliegtEnabled, fliegtUnit, fliegtZeitpunkt, fliegtSchnelligkeit,
    textEditingEnabled,
    textVerblassEnabled, verblassZeitpunkt, verblassSchnelligkeit,
    textSchwerEnabled, schwerZeitpunkt, schwerSchnelligkeit,
    positionMode, randomMode, drawnPath, grainLevel, textSizeLevel, bgHue, serifLevel,
  ]);

  // ── Computed values ──────────────────────────────────────────────────────
  const canEdit = currentToolId === null || editModeEnabledState;
  const computedFontSize       = 14 + Math.round(textSizeLevel / 100 * 22);
  const writingFont            = FONT_ARIZONA;
  const writingFontVariations  = `'SRFF' ${serifLevel ?? 70}, 'wdth' 92, 'wght' 327`;
  const timerTotalSecs   = (timerMinutes || 1) * 60;
  const timerProgress    = timerEnabled && timerTotalSecs > 0
    ? Math.max(0, 1 - timeLeft / timerTotalSecs) : 0;

  const { surfaceLight, surfaceDark } = getLookFeelColors(bgHue);
  const darkColors = getLookFeelDarkColors(bgHue);

  const bg = dark ? darkColors.darkBg : surfaceLight;

  const textColor = dark ? DARK_TEXT : LIGHT_TEXT;

  const timerTextOpacity = timerEnabled && visualTimer && (timerRunning || (timerDone && !textRevealed))
    ? Math.max(0, 1 - timerProgress)
    : 1;

  const iconColor      = textColor;
  // Nav buttons always contrast with their own button background (not the writing area bg)
  const navIconColor   = dark ? DARK_TEXT : LIGHT_TEXT;
  const sidebarBg      = dark ? darkColors.darkSidebarBg : surfaceDark;
  const catActiveBg    = dark ? darkColors.darkActiveCatBg : surfaceLight;
  const catInactiveBg  = dark ? darkColors.darkInactiveCatBg : surfaceDark;
  const settingsCardBg = dark ? darkColors.darkCardBg : surfaceLight;
  const descColor      = dark ? DARK_MUTED : "#7c7c7c";
  const innerBorder    = dark ? DARK_BORDER : BORDER_COL;

  const handleExportJPG = async () => {
    setExportOpen(false);
    const node = writingZoneRef.current;
    if (!node) return;
    const scale = 2;
    const w = node.offsetWidth;
    const h = node.offsetHeight;
    const textCanvas = await html2canvas(node, { backgroundColor: null, scale, logging: false });
    const out = document.createElement("canvas");
    out.width = w * scale;
    out.height = h * scale;
    const ctx = out.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(textCanvas, 0, 0, out.width, out.height);
    if (grainLevel > 0) {
      const blend = dark ? "screen" : "multiply";
      for (const layer of grainLayers) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise<void>((res) => { img.onload = () => res(); img.onerror = () => res(); img.src = layer.url; });
        if (img.width > 0) {
          const pattern = ctx.createPattern(img, "repeat");
          if (pattern) {
            pattern.setTransform(new DOMMatrix().scaleSelf(scale * (layer.size / 256)));
            ctx.save();
            ctx.globalCompositeOperation = blend as GlobalCompositeOperation;
            ctx.globalAlpha = (grainLevel / 100) * 0.92 * layer.alpha;
            ctx.fillStyle = pattern;
            ctx.fillRect(0, 0, out.width, out.height);
            ctx.restore();
          }
        }
      }
    }
    const a = document.createElement("a");
    a.href = out.toDataURL("image/jpeg", 0.95);
    a.download = `${toolName.trim() || "text"}.jpg`;
    a.click();
  };

  const darkBtnBg  = rulesOpen ? (dark ? "rgba(240,232,220,0.1)" : surfaceDark) : (dark ? "rgba(240,232,220,0.06)" : surfaceLight);

  const rulesBtnBg = rulesOpen ? (dark ? "rgba(240,232,220,0.1)" : surfaceDark) : (dark ? "rgba(240,232,220,0.06)" : surfaceLight);

  // Re-focus writing area after panel close or category switch
  useEffect(() => {
    if (!rulesOpen) setTimeout(() => writingFocusRef.current?.(), 50);
  }, [rulesOpen]);
  useEffect(() => {
    setTimeout(() => writingFocusRef.current?.(), 50);
  }, [activeCategory, positionMode]);

  // Re-focus writing area after any rule-panel interaction (button, toggle,
  // slider release), but NOT when the user is editing a text field.
  const handlePanelInteraction = useCallback((e: React.PointerEvent) => {
    const tgt = e.target as HTMLElement | null;
    if (tgt) {
      const tag = tgt.tagName;
      if (tag === "TEXTAREA" || tgt.isContentEditable) return;
      if (tag === "INPUT") {
        const it = (tgt as HTMLInputElement).type;
        if (it !== "range" && it !== "checkbox" && it !== "radio" && it !== "button" && it !== "submit") return;
      }
    }
    setTimeout(() => writingFocusRef.current?.(), 0);
  }, []);

  const wzVisibility = visibility === "invisible" ? "hidden" : visibility as "visible"|"hidden"|"sentence"|"word"|"char";
  const wzDeleteMode = deleteMode === "all" ? "deletable" : deleteMode === "none" ? "no-delete" : deleteMode as "sentence"|"word";
  const wzCorrection = correctionVisible ? "tippex" as const : "hidden" as const;
  const wzDriftSpeed = fliegtSchnelligkeit * 50;
  const wzVerblSpeed = verblassSchnelligkeit * 50;
  const wzDriftDelay = fliegtZeitpunkt * 60;
  const wzVerblDelay = verblassZeitpunkt * 60;
  const wzSchwerDelay = schwerZeitpunkt * 60;
  const wzSchwerSpeed = schwerSchnelligkeit;

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
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />
      <style>{`
        @keyframes cursorBlink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes bgDrift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        @keyframes _diceRoll{0%{transform:rotate(0)scale(1)}20%{transform:rotate(-20deg)scale(.85)}55%{transform:rotate(170deg)scale(.9)}80%{transform:rotate(340deg)scale(1.05)}100%{transform:rotate(360deg)scale(1)}}
        .dark-transition, .dark-transition * {
          transition: color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease, opacity 0.2s ease !important;
        }
        .vis-btn:hover { border-color: ${dark ? "rgba(240,232,220,0.55)" : "#989898"} !important; }
        .writing-scroll { scrollbar-width: thin; scrollbar-color: ${dark ? "rgba(240,232,220,0.18)" : "rgba(85,85,85,0.18)"} transparent; }
        .writing-scroll::-webkit-scrollbar { width: 8px; }
        .writing-scroll::-webkit-scrollbar-track { background: transparent; }
        .writing-scroll::-webkit-scrollbar-thumb { background: ${dark ? "rgba(240,232,220,0.18)" : "rgba(85,85,85,0.18)"}; border-radius: 4px; border: 2px solid transparent; background-clip: padding-box; }
        .writing-scroll::-webkit-scrollbar-thumb:hover { background: ${dark ? "rgba(240,232,220,0.32)" : "rgba(85,85,85,0.32)"}; background-clip: padding-box; }
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
              fontFamily: FONT_SERIF, fontSize: "13px", fontStyle: "italic",
              color: dark ? DARK_MUTED : "#9a9daa",
              flexShrink: 0, lineHeight: 1,
            }}
          >i</button>
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
              backgroundColor: `color-mix(in srgb, ${dark ? darkColors.darkCardBg : surfaceLight} 88%, transparent)`,
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

      {/* ── Noise overlay (layered, organic) ──────────────────────────────── */}
      {grainLevel > 0 && grainLayers.map((layer, i) => (
        <div
          key={i}
          aria-hidden
          style={{
            position: "fixed", inset: 0, zIndex: 3, pointerEvents: "none",
            opacity: (grainLevel / 100) * 0.92 * layer.alpha,
            mixBlendMode: dark ? "screen" : "multiply",
            backgroundImage: `url("${layer.url}")`,
            backgroundRepeat: "repeat", backgroundSize: `${layer.size}px ${layer.size}px`,
          }}
        />
      ))}

      {/* ── Writing zone ─────────────────────────────────────────────────── */}
      <motion.div
        ref={writingZoneRef}
        className="writing-scroll"
        animate={{
          paddingLeft: rulesOpen ? "507px" : "165px",
          opacity: timerTextOpacity,
        }}
        transition={{
          paddingLeft: SPRING,
          opacity: { duration: 1, ease: "linear" },
        }}
        style={{
          position: "fixed", inset: 0,
          display: "flex", flexDirection: "column",
          paddingTop: "24px",
          paddingRight: "240px",
          paddingBottom: "96px",
          overflowY: "auto",
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
            cursorSchnelligkeit={cursorSchnelligkeit}
            driftet={textFliegtEnabled}
            driftSaetze={fliegtUnit === "Sätze"}
            driftWoerter={fliegtUnit === "Wörter"}
            driftBuchstaben={fliegtUnit === "Buchstabe"}
            driftDelay={wzDriftDelay}
            driftSpeed={wzDriftSpeed}
            verblasst={textVerblassEnabled}
            verblassenDelay={wzVerblDelay}
            verblassenSpeed={wzVerblSpeed}
            schwer={textSchwerEnabled}
            schwerDelay={wzSchwerDelay}
            schwerSchnelligkeit={wzSchwerSpeed}
            spiralModus={positionMode === "spiral"}
            runningLineModus={positionMode === "running"}
            textAppearsRandom={positionMode === "random"}
            boustrophedonModus={positionMode === "zigzag"}
            customPathModus={positionMode === "custom"}
            followDotModus={positionMode === "followdot"}
            customPath={drawnPath}
            onCustomPathChange={setDrawnPath}
            customPathDark={dark}
            customPathDe={DE}
            randomMode={randomMode === "sentences" ? "sentences" : "words"}
            writingPrompt={prompts[0] || (diceIdx < 0 ? t.writingPrompt : (lang === "de" ? DICE_PROMPTS_DE[diceIdx] : DICE_PROMPTS_EN[diceIdx]))}
            onDiceRoll={prompts[0] ? undefined : handleDiceRoll}
            diceSpinning={diceSpinning}
            dicePaths={[...DICE_FRAME, ...DICE_FACES[diceFace]]}
            fontSize={computedFontSize}
            fontFamily={writingFont}
            fontVariationSettings={writingFontVariations}
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
            onClick={(e) => { e.stopPropagation(); setDark(d => { const next = !d; localStorage.setItem("appTheme", next ? "dark" : "light"); return next; }); }}
          >
            <IconHalfCircle color={iconColor} dark={dark} />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Zurück + Erase/Redraw buttons (viewer mode only) ──────────────── */}
      <AnimatePresence>
        {visible && currentToolId && (
          <motion.div
            key="float-back-group"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            transition={{ duration: 0.15 }}
            style={{
              position: "fixed", top: "24px", left: BTN_CLOSED.dark + 33 + 8,
              display: "flex", alignItems: "center", gap: "8px",
              zIndex: 25,
            }}
          >
            <button
              style={{
                height: "33px",
                background: dark ? darkColors.darkBg : surfaceLight,
                border: `1px dashed ${BORDER_COL}`,
                borderRadius: "4px",
                cursor: "pointer", outline: "none",
                display: "flex", alignItems: "center",
                padding: "0 13px",
                fontFamily: FONT_SANS, fontSize: "13px",
                color: dark ? DARK_TEXT : LIGHT_TEXT,
                flexShrink: 0,
              }}
              onClick={(e) => { e.stopPropagation(); goBack(); }}
            >
              {t.backBtn}
            </button>

            {/* Erase text — appears once there is text */}
            {!canEdit && positions.length > 0 && (
              <button
                style={{
                  height: "33px", padding: "0 13px",
                  background: rulesBtnBg,
                  border: `1px dashed ${BORDER_COL}`,
                  borderRadius: "4px",
                  cursor: "pointer", outline: "none",
                  display: "flex", alignItems: "center",
                  fontFamily: FONT_SANS, fontSize: "15px", fontWeight: 400,
                  color: dark ? DARK_TEXT : LIGHT_TEXT,
                  lineHeight: "normal", whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
                onClick={(e) => { e.stopPropagation(); handleDelete(); }}
              >{lang === "de" ? "Text leeren" : "Erase text"}</button>
            )}

            {/* Redraw path — appears for custom-path tools */}
            {!canEdit && positionMode === "custom" && drawnPath.length > 0 && (
              <button
                style={{
                  height: "33px", padding: "0 13px",
                  background: rulesBtnBg,
                  border: `1px dashed ${BORDER_COL}`,
                  borderRadius: "4px",
                  cursor: "pointer", outline: "none",
                  display: "flex", alignItems: "center",
                  fontFamily: FONT_SANS, fontSize: "15px", fontWeight: 400,
                  color: dark ? DARK_TEXT : LIGHT_TEXT,
                  lineHeight: "normal", whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
                onClick={(e) => { e.stopPropagation(); setDrawnPath([]); }}
              >{lang === "de" ? "Pfad neu zeichnen" : "Redraw path"}</button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Floating Rules/× button ──────────────────────────────────────── */}
      <AnimatePresence>
        {visible && canEdit && (
          <motion.div
            key="float-rules-group"
            initial={false}
            animate={{ x: rulesOpen ? BTN_OPEN.rules - BTN_CLOSED.rules : 0 }}
            exit={{ opacity: 0, transition: { duration: 0.12 } }}
            transition={SPRING}
            style={{
              position: "fixed", top: "24px", left: BTN_CLOSED.rules,
              display: "flex", alignItems: "center", gap: "8px",
              zIndex: 25,
            }}
          >
            {/* Rules / × button */}
            <button
              style={{
                height: "33px", width: rulesOpen ? "33px" : "auto",
                background: rulesBtnBg,
                border: `1px dashed ${BORDER_COL}`,
                borderRadius: "4px",
                cursor: "pointer", outline: "none",
                display: "flex", alignItems: "center",
                justifyContent: rulesOpen ? "center" : "flex-start",
                padding: rulesOpen ? 0 : "0 13px",
                fontFamily: FONT_SANS, color: dark ? DARK_TEXT : LIGHT_TEXT,
                lineHeight: "normal", overflow: rulesOpen ? "hidden" : "visible",
                transition: "background 0.2s",
                flexShrink: 0,
              }}
              onMouseEnter={() => setRulesHovered(true)}
              onMouseLeave={() => setRulesHovered(false)}
              onClick={(e) => { e.stopPropagation(); setRulesOpen(o => { if (o) setIdentityOpen(false); return !o; }); }}
            >
              <AnimatePresence mode="wait">
                {rulesOpen ? (
                  <motion.span key="x" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }} style={{ display: "flex" }}>
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M2 2L11 11M11 2L2 11" stroke={dark ? DARK_TEXT : LIGHT_TEXT} strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                  </motion.span>
                ) : (
                  <motion.span key="r" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.1 }} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                    <span style={{ fontSize: "15px", fontWeight: 400, whiteSpace: "nowrap" }}>{t.rulesBtn}</span>
                    <span style={{
                      display: "flex",
                      flexShrink: 0,
                      overflow: "hidden",
                      maxWidth: rulesHovered ? "30px" : "0px",
                      opacity: rulesHovered ? 1 : 0,
                      marginLeft: rulesHovered ? "8px" : "0px",
                      transition: "max-width 0.35s cubic-bezier(0.4,0,0.2,1), opacity 0.35s ease, margin-left 0.35s cubic-bezier(0.4,0,0.2,1)",
                    }}>
                      <svg width="17" height="7" viewBox="0 0 17 7" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0 3.5H11" stroke={dark ? DARK_TEXT : LIGHT_TEXT} strokeWidth="1.3" strokeLinecap="round" strokeDasharray="2.6 2.6" />
                        <path d="M11 1L14.5 3.5L11 6" stroke={dark ? DARK_TEXT : LIGHT_TEXT} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            {/* Clear button — 10px right of Rules button to match the gap between
                the dark-mode button and the Rules button (flex gap 8px + 2px).
                When the panel is open it nudges right to clear the panel edge. */}
            <AnimatePresence>
              {positions.length > 0 && (
                <motion.button
                  key="float-clear"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, x: rulesOpen ? 20 : 0 }}
                  exit={{ opacity: 0, transition: { duration: 0.12 } }}
                  transition={SPRING}
                  style={{
                    height: "33px", padding: "0 13px", marginLeft: "2px",
                    background: rulesBtnBg,
                    border: `1px dashed ${BORDER_COL}`,
                    borderRadius: "4px",
                    cursor: "pointer", outline: "none",
                    display: "flex", alignItems: "center",
                    fontFamily: FONT_SANS, fontSize: "15px", fontWeight: 400,
                    color: dark ? DARK_TEXT : LIGHT_TEXT,
                    lineHeight: "normal", whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                  onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                >{lang === "de" ? "Text leeren" : "Clear Text"}</motion.button>
              )}
            </AnimatePresence>

            {/* Redraw Path button — visible when custom path mode is active */}
            <AnimatePresence>
              {positionMode === "custom" && drawnPath.length > 0 && (
                <motion.button
                  key="float-redraw"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, x: rulesOpen ? 20 : 0 }}
                  exit={{ opacity: 0, transition: { duration: 0.12 } }}
                  transition={SPRING}
                  style={{
                    height: "33px", padding: "0 13px", marginLeft: "2px",
                    background: rulesBtnBg,
                    border: `1px dashed ${BORDER_COL}`,
                    borderRadius: "4px",
                    cursor: "pointer", outline: "none",
                    display: "flex", alignItems: "center",
                    fontFamily: FONT_SANS, fontSize: "15px", fontWeight: 400,
                    color: dark ? DARK_TEXT : LIGHT_TEXT,
                    lineHeight: "normal", whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                  onClick={(e) => { e.stopPropagation(); setDrawnPath([]); }}
                >{lang === "de" ? "Pfad neu zeichnen" : "Redraw Path"}</motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Sidebar ──────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {visible && rulesOpen && (
          <motion.div
            key="sidebar"
            onPointerUp={handlePanelInteraction}
            initial={{ x: -153, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -153, opacity: 0, transition: { duration: 0.22, ease: "easeIn" } }}
            transition={SPRING}
            style={{
              position: "fixed", top: 0, left: 0,
              width: "153px", height: "100vh",
              background: sidebarBg,
              borderRight: `1px dashed ${innerBorder}`,
              borderRadius: "4px",
              padding: "24px",
              display: "flex", flexDirection: "column", justifyContent: "space-between",
              boxSizing: "border-box", zIndex: 20,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <span style={{ fontFamily: "'az-heading', sans-serif", fontSize: "22px", color: dark ? DARK_TEXT : LIGHT_TEXT, lineHeight: "normal" }}>{t.rulesHeading}</span>
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
                <button
                  onClick={() => setIdentityOpen(o => !o)}
                  style={{
                    width: "105px",
                    borderRadius: "4px",
                    background: identityOpen ? catActiveBg : "transparent",
                    border: `1px dashed ${innerBorder}`,
                    cursor: "pointer", outline: "none",
                    padding: "14px 12px",
                    fontFamily: FONT_SANS, fontSize: "15px", fontWeight: 400,
                    color: dark ? DARK_TEXT : LIGHT_TEXT,
                    letterSpacing: "-0.16px", lineHeight: "20px",
                    textAlign: "center",
                  }}>{t.saveBtn}</button>
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
            onPointerUp={handlePanelInteraction}
            initial={{ x: -314, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -314, opacity: 0, transition: { duration: 0.22, ease: "easeIn" } }}
            transition={SPRING}
            style={{
              position: "fixed", top: 0, left: "153px",
              width: "314px", height: "100vh",
              background: sidebarBg,
              borderRight: `1px dashed ${innerBorder}`,
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
                background: `color-mix(in srgb, ${sidebarBg} 92%, transparent)`,
                borderTop: `1px dashed ${dark ? DARK_BORDER : BORDER_COL}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                backdropFilter: "blur(4px)",
              }}>
                <span style={{ fontFamily: FONT_SANS, fontSize: "12px", color: dark ? DARK_MUTED : "#9a9daa" }}>
                  {lang === "de" ? "Nur ansehen, Regeln nicht änderbar" : "View only, rules cannot be changed"}
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
                  .identity-scroll::-webkit-scrollbar { width: 6px; }
                  .identity-scroll::-webkit-scrollbar-track { background: ${sidebarBg}; }
                  .identity-scroll::-webkit-scrollbar-thumb { background: ${dark ? "rgba(240,232,220,0.2)" : "rgba(85,85,85,0.2)"}; border-radius: 3px; }
                  .identity-scroll { scrollbar-color: ${dark ? "rgba(240,232,220,0.2)" : "rgba(85,85,85,0.2)"} ${sidebarBg}; }
                `}</style>
                <div className="identity-scroll" style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
                  <span style={{ fontFamily: "'az-heading', sans-serif", fontSize: "22px", color: dark ? DARK_TEXT : LIGHT_TEXT, lineHeight: "normal" }}>{t.identityHeading}</span>
                  <span style={{ fontFamily: FONT_SANS, fontSize: "14px", color: descColor, lineHeight: "1.45" }}>
                    {t.identitySubtitle}
                  </span>

                  {/* Preview recording — image-upload zone style */}
                  <div
                    onClick={() => { setVideoPreviewError(false); setShowRecordOverlay(true); }}
                    style={{
                      position: "relative", cursor: "pointer",
                      border: `1px dashed ${recordState === "error" ? "#e05252" : innerBorder}`,
                      borderRadius: "8px", overflow: "hidden",
                      width: "100%", aspectRatio: "3 / 2", flexShrink: 0,
                      background: settingsCardBg,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    {previewVideoUrl && !videoPreviewError ? (
                      <>
                        <video
                          src={previewVideoUrl}
                          autoPlay loop muted playsInline
                          onError={() => setVideoPreviewError(true)}
                          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                        />
                        <div style={{
                          position: "absolute", inset: 0,
                          background: "rgba(0,0,0,0.38)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <span style={{ fontFamily: FONT_SANS, fontSize: "13px", color: "#fff", letterSpacing: "0.02em" }}>
                            {DE ? "Neu aufnehmen" : "Re-record"}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", padding: "16px", textAlign: "center" }}>
                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                          {(["M1 13L1 19L2.53898e-07 18.9043L0 13.0957L1 13Z","M18 13V19L17 18.9043V13.0957L18 13Z","M26.0544 11.9657L20.2588 13.5187L20.0925 12.528L25.7031 11.0246L26.0544 11.9657Z","M28 12V18L27 17.9043V12.0957L28 12Z","M25.3758 20.1922L20.1797 17.1922L20.7626 16.374L25.7929 19.2783L25.3758 20.1922Z","M14.4534 27.4824L11.0005 22.5755L11.8735 22.0783L15.2161 26.8286L14.4534 27.4824Z","M3.81813 27.4824L7.27095 22.5755L6.39803 22.0783L3.0554 26.8286L3.81813 27.4824Z","M1.70658e-07 10L17 10L16.7287 11L0.271279 11L1.70658e-07 10Z","M1.70658e-07 20L17 20L16.7287 21L0.271279 21L1.70658e-07 20Z","M2 4.11605V3.86847C2 2.7234 2.27182 1.79239 2.81547 1.07544C3.36354 0.358478 4.09061 0 4.99669 0C5.9116 0 6.64088 0.358478 7.18453 1.07544C7.72818 1.79239 8 2.7234 8 3.86847V4.11605C8 5.27144 7.72818 6.20761 7.18453 6.92456C6.64088 7.64152 5.9116 8 4.99669 8C4.08619 8 3.35912 7.64152 2.81547 6.92456C2.27182 6.20761 2 5.27144 2 4.11605ZM2.99448 3.87621V4.11605C2.99448 4.95164 3.16243 5.64797 3.49834 6.20503C3.83867 6.75693 4.33812 7.03288 4.99669 7.03288C5.65525 7.03288 6.1547 6.75693 6.49503 6.20503C6.83536 5.64797 7.00553 4.95164 7.00553 4.11605V3.87621C7.00553 3.04062 6.83536 2.34945 6.49503 1.80271C6.1547 1.25081 5.65525 0.974855 4.99669 0.974855C4.33812 0.974855 3.83867 1.25081 3.49834 1.80271C3.16243 2.34945 2.99448 3.04062 2.99448 3.87621Z","M9 4.11605V3.86847C9 2.7234 9.27182 1.79239 9.81547 1.07544C10.3635 0.358478 11.0906 0 11.9967 0C12.9116 0 13.6409 0.358478 14.1845 1.07544C14.7282 1.79239 15 2.7234 15 3.86847V4.11605C15 5.27144 14.7282 6.20761 14.1845 6.92456C13.6409 7.64152 12.9116 8 11.9967 8C11.0862 8 10.3591 7.64152 9.81547 6.92456C9.27182 6.20761 9 5.27144 9 4.11605ZM9.99448 3.87621V4.11605C9.99448 4.95164 10.1624 5.64797 10.4983 6.20503C10.8387 6.75693 11.3381 7.03288 11.9967 7.03288C12.6552 7.03288 13.1547 6.75693 13.495 6.20503C13.8354 5.64797 14.0055 4.95164 14.0055 4.11605V3.87621C14.0055 3.04062 13.8354 2.34945 13.495 1.80271C13.1547 1.25081 12.6552 0.974855 11.9967 0.974855C11.3381 0.974855 10.8387 1.25081 10.4983 1.80271C10.1624 2.34945 9.99448 3.04062 9.99448 3.87621Z"] as string[]).map((d, i) => (
                            <path key={i} d={d} fill={recordState === "error" ? "#e05252" : (dark ? DARK_MUTED : "#a0a0a0")} />
                          ))}
                        </svg>
                        <span style={{ fontFamily: FONT_SANS, fontSize: "13px", color: recordState === "error" ? "#e05252" : (dark ? DARK_MUTED : "#9a9daa") }}>
                          {recordState === "error"
                            ? (DE ? "Fehlgeschlagen, erneut versuchen" : "Failed, try again")
                            : (DE ? "Vorschau-Video aufnehmen" : "Add Preview-Video")}
                        </span>
                        <span style={{ fontFamily: FONT_SANS, fontSize: "11px", color: dark ? "rgba(240,232,220,0.3)" : "rgba(150,150,150,0.7)", lineHeight: 1.4 }}>
                          {DE ? "10-Sek.-Clip" : "10-sec clip"}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Name */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>{t.nameHeading}</span>
                    <span style={{ fontFamily: FONT_SANS, fontSize: "13px", color: descColor, lineHeight: "1.45" }}>
                      {t.nameHint}
                    </span>
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

                  {/* Description */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>{t.descHeading}</span>
                    <textarea
                      className="identity-textarea"
                      placeholder={t.descPlaceholder}
                      value={toolDescription}
                      onChange={(e) => setToolDescription(e.target.value)}
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
                  </div>

                  {/* Prompts */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>{t.promptHeading}</span>
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
                </div>
                <div style={{ padding: "16px 24px", flexShrink: 0, display: "flex", flexDirection: "column", gap: "8px", borderTop: `1px dashed ${innerBorder}` }}>
                  {saveError && (
                    <span style={{ fontFamily: FONT_SANS, fontSize: "12px", color: "#e05252", textAlign: "center" }}>{saveError}</span>
                  )}
                  <button
                    onClick={() => handleSave(true)}
                    disabled={saving}
                    style={{
                      width: "100%", padding: "12px",
                      background: "transparent",
                      border: `1px dashed ${innerBorder}`,
                      borderRadius: "8px", cursor: saving ? "wait" : "pointer", outline: "none",
                      fontFamily: FONT_SANS, fontSize: "16px",
                      color: dark ? DARK_TEXT : LIGHT_TEXT,
                      opacity: saving ? 0.6 : 1,
                    }}
                  >{saving ? (lang === "de" ? "Speichert…" : "Saving…") : (lang === "de" ? "Mein Tool speichern" : "Save my Tool")}</button>
                  <button
                    onClick={() => handleSave(false)}
                    disabled={saving}
                    style={{
                      width: "100%", padding: "12px",
                      background: "transparent",
                      border: "none",
                      borderRadius: "8px", cursor: saving ? "wait" : "pointer", outline: "none",
                      fontFamily: FONT_SANS, fontSize: "16px",
                      color: dark ? DARK_TEXT : LIGHT_TEXT,
                      opacity: saving ? 0.6 : 1,
                    }}
                  >Save privately</button>
                </div>
              </>
            ) : (
              /* ── Category detail ────────────────────────────────────────── */
              <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px", overflowY: "auto", flex: 1, pointerEvents: canEdit ? "auto" : "none", opacity: canEdit ? 1 : 0.75 }}>
                <span style={{ fontFamily: "'az-heading', serif", fontSize: "22px", color: dark ? DARK_TEXT : LIGHT_TEXT, lineHeight: "normal" }}>
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
                    <div style={{ background: settingsCardBg, border: `1px dashed ${innerBorder}`, borderRadius: "8px", padding: "20px 24px", display: "flex", flexDirection: "column", gap: "0" }}>
                      <div
                        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "36px", cursor: "pointer" }}
                        onClick={() => setTimerEnabled(v => { const next = !v; if (!next) setVisualTimer(false); return next; })}
                      >
                        <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>{t.timerLabel}</span>
                        <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>{timerEnabled ? t.on : t.off}</span>
                      </div>
                      <AnimatePresence>
                        {timerEnabled && (
                          <motion.div
                            key="timer-opts"
                            initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.15 }}
                            style={{ overflow: "hidden" }}
                          >
                            {/* Large number input row */}
                            <div style={{ position: "relative", border: `1px dashed ${innerBorder}`, borderRadius: "4px", margin: "20px 0", height: "76px", overflow: "hidden" }}>
                              <input
                                type="number"
                                min={1}
                                max={999}
                                value={timerMinutes}
                                onChange={e => setTimerMinutes(Math.max(1, parseInt(e.target.value) || 1))}
                                onClick={e => e.stopPropagation()}
                                style={{
                                  width: "100%", height: "100%", border: "none", outline: "none",
                                  background: "transparent", textAlign: "center",
                                  fontFamily: FONT_SANS, fontSize: "36px", fontWeight: 400,
                                  color: dark ? "rgba(240,232,220,0.55)" : "rgba(85,85,85,0.45)",
                                  WebkitAppearance: "none", MozAppearance: "textfield",
                                  boxSizing: "border-box",
                                }}
                              />
                              <span style={{ position: "absolute", right: "20px", top: "50%", transform: "translateY(-50%)", fontFamily: FONT_SANS, fontSize: "15px", color: descColor, pointerEvents: "none" }}>min</span>
                            </div>
                            {/* User reset row */}
                            <div
                              style={{ display: "flex", flexDirection: "column", gap: "4px", cursor: "pointer" }}
                              onClick={e => { e.stopPropagation(); setTimerUserReset(v => !v); }}
                            >
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>{t.userReset}</span>
                                <RadioCircle selected={timerUserReset} dark={dark} />
                              </div>
                              <span style={{ fontFamily: FONT_SANS, fontSize: "12px", color: descColor, lineHeight: 1.4 }}>{t.userResetDesc}</span>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Visueller Timer — only available once the normal timer is on */}
                    <AnimatePresence initial={false}>
                      {timerEnabled && (
                        <motion.div
                          key="visual-timer-card"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ overflow: "hidden" }}
                        >
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
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Cursor läuft weiter */}
                    <div
                      style={{ background: settingsCardBg, border: `1px dashed ${innerBorder}`, borderRadius: "8px", padding: "12px 24px", display: "flex", flexDirection: "column", gap: "10px", cursor: "pointer", opacity: (isNonStandard && positionMode !== "running") ? 0.55 : 1, transition: "opacity 0.2s" }}
                      onClick={() => applyCursorRunning(!cursorRunning, DE)}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "36px" }}>
                        <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>{t.cursorRunning}</span>
                        <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: descColor }}>{cursorRunning ? t.on : t.off}</span>
                      </div>
                      <p style={{ fontFamily: FONT_SANS, fontSize: "13px", color: descColor, lineHeight: "1.45", margin: 0 }}>
                        {(isNonStandard && positionMode !== "running")
                          ? (DE ? "Aktivieren setzt Position auf Standard zurück" : "Enabling resets position to Standard")
                          : t.cursorRunningDesc}
                      </p>
                      <AnimatePresence initial={false}>
                        {cursorRunning && (
                          <motion.div
                            key="cursor-speed"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.18 }}
                            onClick={(e) => e.stopPropagation()}
                            style={{ display: "flex", flexDirection: "column", gap: "10px", overflow: "visible", paddingBottom: "8px", cursor: "default" }}
                          >
                            <span style={{ fontFamily: FONT_SANS, fontSize: "15px", color: dark ? DARK_TEXT : LIGHT_TEXT, marginTop: "4px" }}>{t.cursorSpeed}</span>
                            <DoubleSlider value={cursorSchnelligkeit} min={1} max={100} step={1} onChange={setCursorSchnelligkeit} dark={dark} />
                          </motion.div>
                        )}
                      </AnimatePresence>
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

                    {/* Freies Editieren card */}
                    <div
                      style={{ background: settingsCardBg, border: `1px dashed ${innerBorder}`, borderRadius: "8px", padding: "12px 24px", display: "flex", flexDirection: "column", gap: "10px", cursor: "pointer" }}
                      onClick={() => setTextEditingEnabled(v => !v)}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: "36px" }}>
                        <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>{DE ? "Freies Editieren" : "Free editing"}</span>
                        <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: descColor }}>{textEditingEnabled ? t.on : t.off}</span>
                      </div>
                      <span style={{ fontFamily: FONT_SANS, fontSize: "12px", color: descColor, lineHeight: "1.5" }}>
                        {DE ? "Cursor frei setzen, Text markieren und löschen." : "Freely reposition cursor, select and delete text."}
                      </span>
                    </div>

                    {/* Löschen card */}
                    <div style={{ background: settingsCardBg, border: `1px dashed ${innerBorder}`, borderRadius: "8px", padding: "12px 24px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                      {/* Heading row */}
                      <div style={{ height: "36px", display: "flex", alignItems: "center" }}>
                        <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>{t.deleteHeading}</span>
                      </div>
                      {/* Option rows with separator between 2nd and 3rd */}
                      {DELETE_OPTS_KEYS.map((key, i) => (
                        <div key={key}>
                          {i === 1 && (
                            <div style={{ borderTop: `1px dashed ${innerBorder}`, marginBottom: "16px" }} />
                          )}
                          <button className="vis-btn" onClick={() => setDeleteMode(key)} style={{
                            width: "100%", height: "36px",
                            background: dark ? "rgba(240,232,220,0.04)" : surfaceLight,
                            border: `1px dashed ${innerBorder}`,
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
                    <div
                      onClick={() => applyCorrectionVisible(!correctionVisible, DE)}
                      style={{ background: settingsCardBg, border: `1px dashed ${innerBorder}`, borderRadius: "8px", padding: "12px 24px 24px", display: "flex", flexDirection: "column", gap: "16px", cursor: "pointer", opacity: isNonStandard ? 0.55 : 1, transition: "opacity 0.2s" }}
                    >
                      <div style={{ height: "36px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>{t.correctionVisible}</span>
                        <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: descColor }}>{correctionVisible ? t.on : t.off}</span>
                      </div>
                      <p style={{ fontFamily: FONT_SANS, fontSize: "13px", lineHeight: "1.6", color: descColor, margin: 0 }}>
                        {isNonStandard
                          ? (DE ? "Aktivieren setzt Position auf Standard zurück" : "Enabling resets position to Standard")
                          : <><span style={{ background: dark ? "rgba(240,232,220,0.16)" : "#ffffff", padding: "1px 4px", borderRadius: "2px", boxShadow: dark ? "0 1px 3px rgba(0,0,0,0.35)" : "0 1px 4px rgba(180,170,155,0.45), 0 0.5px 1px rgba(180,170,155,0.3)" }}>{t.correctionDescHighlight}</span>{t.correctionDescRest}</>
                        }
                      </p>
                    </div>

                  </div>
                )}

                {/* ── Stabilität / Stability ────────────────────────────── */}
                {activeCategory === "Stability" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

                    {/* Text fliegt davon card */}
                    <div style={{ position: "relative" }}>
                      <div style={{ background: settingsCardBg, border: `1px dashed ${innerBorder}`, borderRadius: "8px", padding: "12px 24px 24px", display: "flex", flexDirection: "column", gap: "16px", opacity: isNonStandard ? 0.55 : 1, transition: "opacity 0.2s" }}>
                        {/* Header row */}
                        <div style={{ height: "36px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>{t.driftLabel}</span>
                          <span onClick={() => applyDrift(!textFliegtEnabled, DE, t.driftLabel)} style={{ fontFamily: FONT_SANS, fontSize: "16px", color: descColor, cursor: "pointer" }}>{textFliegtEnabled ? t.on : t.off}</span>
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
                              {/* Unit options — Sentences alone, then Words + Letters side by side */}
                              <button onClick={() => setFliegtUnit("Sätze")} style={{
                                width: "100%", height: "36px",
                                background: dark ? "rgba(240,232,220,0.04)" : surfaceLight,
                                border: `1px dashed ${fliegtUnit === "Sätze" ? (dark ? DARK_TEXT : LIGHT_TEXT) : innerBorder}`,
                                borderRadius: "4px", cursor: "pointer", outline: "none",
                                fontFamily: FONT_SANS, fontSize: "15px", color: dark ? DARK_TEXT : LIGHT_TEXT,
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                padding: "0 12px", boxSizing: "border-box",
                              }}>
                                {t.driftSentences}
                                <RadioCircle selected={fliegtUnit === "Sätze"} dark={dark} />
                              </button>
                              <div style={{ display: "flex", gap: "10px" }}>
                                {(["Wörter", "Buchstabe"] as const).map(u => (
                                  <button key={u} onClick={() => setFliegtUnit(u)} style={{
                                    flex: 1, height: "36px",
                                    background: dark ? "rgba(240,232,220,0.04)" : surfaceLight,
                                    border: `1px dashed ${fliegtUnit === u ? (dark ? DARK_TEXT : LIGHT_TEXT) : innerBorder}`,
                                    borderRadius: "4px", cursor: "pointer", outline: "none",
                                    fontFamily: FONT_SANS, fontSize: "15px", color: dark ? DARK_TEXT : LIGHT_TEXT,
                                    display: "flex", alignItems: "center", justifyContent: "space-between",
                                    padding: "0 12px", boxSizing: "border-box",
                                  }}>
                                    {u === "Wörter" ? t.driftWords : t.driftLetters}
                                    <RadioCircle selected={fliegtUnit === u} dark={dark} />
                                  </button>
                                ))}
                              </div>
                              {/* Separator */}
                              <div style={{ borderTop: `1px dashed ${innerBorder}`, margin: "6px 0" }} />
                              {/* Timing */}
                              <span style={{ fontFamily: FONT_SANS, fontSize: "15px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>{t.driftTiming}</span>
                              <DoubleSlider value={fliegtZeitpunkt} min={0.5} max={15} step={0.5} onChange={setFliegtZeitpunkt} dark={dark} />
                              <div style={{ border: `1px dashed ${innerBorder}`, borderRadius: "4px", padding: "10px 12px", textAlign: "center", fontFamily: FONT_SANS, fontSize: "15px", color: descColor, background: dark ? "rgba(240,232,220,0.04)" : surfaceLight }}>
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
                      {isNonStandard && (
                        <div style={{ position: "absolute", bottom: "10px", left: 0, right: 0, textAlign: "center", pointerEvents: "none" }}>
                          <span style={{ fontFamily: FONT_SANS, fontSize: "11px", color: descColor }}>
                            {DE ? "Aktivieren setzt Position auf Standard zurück" : "Enabling resets position to Standard"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Text verblasst card */}
                    <div style={{ background: settingsCardBg, border: `1px dashed ${innerBorder}`, borderRadius: "8px", padding: "12px 24px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                      <div style={{ height: "36px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>{t.fadeLabel}</span>
                        <span onClick={() => setTextVerblassEnabled(e => !e)} style={{ fontFamily: FONT_SANS, fontSize: "16px", color: descColor, cursor: "pointer" }}>{textVerblassEnabled ? t.on : t.off}</span>
                      </div>
                      <AnimatePresence initial={false} mode="wait">
                        {!textVerblassEnabled ? (
                          <motion.p key="fade-off" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} style={{ fontFamily: FONT_SANS, fontSize: "13px", color: descColor, lineHeight: "1.45", margin: 0 }}>
                            {t.fadeDesc}
                          </motion.p>
                        ) : (
                          <motion.div key="fade-on" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                            <span style={{ fontFamily: FONT_SANS, fontSize: "15px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>{t.fadeTiming}</span>
                            <DoubleSlider value={verblassZeitpunkt} min={0.5} max={15} step={0.5} onChange={setVerblassZeitpunkt} dark={dark} />
                            <div style={{ border: `1px dashed ${innerBorder}`, borderRadius: "4px", padding: "10px 12px", textAlign: "center", fontFamily: FONT_SANS, fontSize: "15px", color: descColor, background: dark ? "rgba(240,232,220,0.04)" : surfaceLight }}>
                              {t.fadeAfter(verblassZeitpunkt)}
                            </div>
                            <div style={{ borderTop: `1px dashed ${innerBorder}`, margin: "6px 0" }} />
                            <span style={{ fontFamily: FONT_SANS, fontSize: "15px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>{t.fadeSpeed}</span>
                            <DoubleSlider value={verblassSchnelligkeit} min={0.1} max={10} step={0.1} onChange={setVerblassSchnelligkeit} dark={dark} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Text wird schwer card */}
                    <div style={{ position: "relative" }}>
                      <div style={{ background: settingsCardBg, border: `1px dashed ${innerBorder}`, borderRadius: "8px", padding: "12px 24px 24px", display: "flex", flexDirection: "column", gap: "16px", opacity: isNonStandard ? 0.55 : 1, transition: "opacity 0.2s" }}>
                        <div style={{ height: "36px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                          <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>{t.heavyLabel}</span>
                          <span onClick={() => applyHeavy(!textSchwerEnabled, DE)} style={{ fontFamily: FONT_SANS, fontSize: "16px", color: descColor, cursor: "pointer" }}>{textSchwerEnabled ? t.on : t.off}</span>
                        </div>
                        <AnimatePresence initial={false} mode="wait">
                          {!textSchwerEnabled ? (
                            <motion.p key="heavy-off" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} style={{ fontFamily: FONT_SANS, fontSize: "13px", color: descColor, lineHeight: "1.45", margin: 0 }}>
                              {t.heavyDesc}
                            </motion.p>
                          ) : (
                            <motion.div key="heavy-on" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                              <span style={{ fontFamily: FONT_SANS, fontSize: "15px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>{t.heavyTiming}</span>
                              <DoubleSlider value={schwerZeitpunkt} min={0.5} max={15} step={0.5} onChange={setSchwerZeitpunkt} dark={dark} />
                              <div style={{ border: `1px dashed ${innerBorder}`, borderRadius: "4px", padding: "10px 12px", textAlign: "center", fontFamily: FONT_SANS, fontSize: "15px", color: descColor, background: dark ? "rgba(240,232,220,0.04)" : surfaceLight }}>
                                {t.heavyAfter(schwerZeitpunkt)}
                              </div>
                              <span style={{ fontFamily: FONT_SANS, fontSize: "15px", color: dark ? DARK_TEXT : LIGHT_TEXT, marginTop: "6px" }}>{t.heavySpeed}</span>
                              <DoubleSlider value={schwerSchnelligkeit} min={1} max={100} step={1} onChange={setSchwerSchnelligkeit} dark={dark} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      {isNonStandard && (
                        <div style={{ position: "absolute", bottom: "10px", left: 0, right: 0, textAlign: "center", pointerEvents: "none" }}>
                          <span style={{ fontFamily: FONT_SANS, fontSize: "11px", color: descColor }}>
                            {DE ? "Aktivieren setzt Position auf Standard zurück" : "Enabling resets position to Standard"}
                          </span>
                        </div>
                      )}
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
                      { value: "zigzag" as const, label: t.posZigzag, disabled: false },
                      { value: "followdot" as const, label: t.posFollowDot, disabled: false },
                      { value: "custom" as const, label: t.posCustom, disabled: false },
                    ]).map((opt) => (
                      <div key={opt.value}>
                        <div onClick={() => {
                          if (opt.value === "custom") setDrawnPath([]);
                          const posNames = { spiral: t.posSpiral, random: t.posRandom, running: t.posRunning, custom: t.posCustom, standard: t.posStandard, zigzag: t.posZigzag, followdot: t.posFollowDot };
                          applyPositionMode(opt.value, { setTextFliegtEnabled, setCursorRunning, setCorrectionVisible, setTextSchwerEnabled, textFliegtEnabled, cursorRunning, correctionVisible, textSchwerEnabled, de: DE, posNames });
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
                      .txt-slider {
                        -webkit-appearance: none; appearance: none;
                        width: 100%; height: 2px; border-radius: 2px; cursor: pointer; outline: none;
                        background: ${dark ? "rgba(240,232,220,0.22)" : "#c8bfb5"};
                      }
                      .txt-slider::-webkit-slider-thumb {
                        -webkit-appearance: none; appearance: none;
                        width: 30px; height: 30px; background: transparent; cursor: grab; border: none;
                      }
                      .txt-slider::-moz-range-thumb {
                        width: 30px; height: 30px; background: transparent; cursor: grab; border: none;
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
                      <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>{t.lfTextSize}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <span style={{ fontFamily: FONT_SERIF, fontSize: "13px", color: dark ? DARK_TEXT : LIGHT_TEXT, flexShrink: 0, lineHeight: 1 }}>A</span>
                        <div style={{ position: "relative", flex: 1, display: "flex", alignItems: "center" }}>
                          <input type="range" min={0} max={100} value={textSizeLevel} onChange={e => setTextSizeLevel(Number(e.target.value))} className="txt-slider" style={{ flex: 1 }} />
                          <span style={{
                            position: "absolute",
                            left: `calc(${textSizeLevel}% + ${(50 - textSizeLevel) * 0.3}px)`,
                            transform: "translateX(-50%)",
                            pointerEvents: "none",
                            fontFamily: FONT_SERIF,
                            fontSize: `${17 + textSizeLevel / 100 * 13}px`,
                            color: dark ? DARK_TEXT : LIGHT_TEXT,
                            lineHeight: 1,
                            background: settingsCardBg,
                            padding: "0 7px",
                          }}>A</span>
                        </div>
                        <span style={{ fontFamily: FONT_SERIF, fontSize: "40px", color: dark ? DARK_TEXT : LIGHT_TEXT, flexShrink: 0, lineHeight: 1 }}>A</span>
                      </div>
                    </div>

                    {/* ── Serif slider ───────────────────────────────────── */}
                    <div style={{ background: settingsCardBg, border: `1px dashed ${innerBorder}`, borderRadius: "8px", padding: "16px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>{t.lfSerif}</span>
                        {serifLevel !== null && (
                          <button
                            onClick={() => setSerifLevel(null)}
                            style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", fontFamily: FONT_SANS, fontSize: "12px", color: dark ? DARK_MUTED : "#9a9daa", outline: "none" }}
                          >↩ zurücksetzen</button>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <span style={{ fontFamily: FONT_ARIZONA, fontVariationSettings: "'SRFF' 0, 'wdth' 92, 'wght' 327", fontSize: "22px", color: dark ? DARK_TEXT : LIGHT_TEXT, flexShrink: 0, lineHeight: 1 }}>A</span>
                        <input
                          type="range" min={0} max={100}
                          value={serifLevel ?? 70}
                          onChange={e => setSerifLevel(Number(e.target.value))}
                          className="lf-slider" style={{ flex: 1 }}
                        />
                        <span style={{ fontFamily: FONT_ARIZONA, fontVariationSettings: "'SRFF' 100, 'wdth' 92, 'wght' 327", fontSize: "22px", color: dark ? DARK_TEXT : LIGHT_TEXT, flexShrink: 0, lineHeight: 1 }}>A</span>
                      </div>
                      <span style={{ fontFamily: FONT_SANS, fontSize: "11px", color: dark ? DARK_MUTED : "#9a9daa", marginTop: "-6px" }}>ABC Arizona by Dinamo Typefaces &lt;3</span>
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

                    <div style={{ background: settingsCardBg, border: `1px dashed ${innerBorder}`, borderRadius: "8px", padding: "16px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                      <span style={{ fontFamily: FONT_SANS, fontSize: "16px", color: dark ? DARK_TEXT : LIGHT_TEXT }}>{t.lfGrain}</span>
                      <input type="range" min={0} max={100} value={grainLevel} onChange={e => setGrainLevel(Number(e.target.value))} className="lf-slider" />
                    </div>

                    <AnimatePresence>
                      {grainLevel > 0 && (
                        <motion.div
                          key="bgmotion-card"
                          initial={{ opacity: 0, height: 0, marginTop: 0 }}
                          animate={{ opacity: 1, height: "auto", marginTop: 0 }}
                          exit={{ opacity: 0, height: 0, marginTop: 0 }}
                          transition={{ duration: 0.22, ease: "easeInOut" }}
                          style={{ overflow: "hidden" }}
                        >
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Timer circle (bottom-left, aligned to the top buttons' left edge) ── */}
      <AnimatePresence>
        {visible && timerEnabled && timerRunning && (
          <motion.div
            key="timer-circle"
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1, x: rulesOpen ? 459 : 0 }}
            exit={{ opacity: 0, scale: 0.88, transition: { duration: 0.15 } }}
            transition={SPRING}
            style={{
              position: "fixed", bottom: "16px", left: BTN_CLOSED.dark,
              width: "84px", height: "84px",
              borderRadius: "100px",
              border: `1px dashed ${dark ? DARK_BORDER : BORDER_COL}`,
              background: dark ? darkColors.darkCardBg : surfaceLight,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: FONT_SANS, fontSize: "17px",
              color: timeLeft <= 10 ? "#e05252" : (dark ? DARK_TEXT : LIGHT_TEXT),
              letterSpacing: "0.04em",
              transition: "color 0.3s",
              zIndex: 20,
              pointerEvents: "none",
            }}
          >
            {formatTime(timeLeft)}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Export Text button (bottom-right, rectangle) ─────────────────── */}
      <AnimatePresence>
        {visible && positions.length > 0 && (
          <motion.div
            key="export-circle"
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.88, transition: { duration: 0.15 } }}
            transition={SPRING}
            ref={exportRef}
            style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 20, width: `${topRightWidth}px` }}
          >
            <button
              onClick={() => setExportOpen(o => !o)}
              style={{
                width: "100%",
                height: "44px", padding: "0 24px",
                borderRadius: "8px",
                border: `1px dashed ${dark ? DARK_BORDER : BORDER_COL}`,
                background: dark ? darkColors.darkCardBg : surfaceLight,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: FONT_SANS, fontSize: "15px",
                color: dark ? DARK_TEXT : LIGHT_TEXT,
                cursor: "pointer", outline: "none",
                whiteSpace: "nowrap",
              }}
            >
              {t.exportText}
            </button>
            <AnimatePresence>
              {exportOpen && (
                <motion.div
                  key="export-panel"
                  initial={{ opacity: 0, y: 8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 8, scale: 0.97 }}
                  transition={{ duration: 0.18 }}
                  style={{
                    position: "absolute", bottom: "calc(100% + 8px)", right: 0,
                    width: "100%", boxSizing: "border-box",
                    display: "flex", flexDirection: "column", gap: "4px",
                    background: `color-mix(in srgb, ${settingsCardBg} 95%, transparent)`,
                    border: `1px dashed ${dark ? DARK_BORDER : BORDER_COL}`,
                    borderRadius: "12px",
                    backdropFilter: "blur(12px)",
                    padding: "8px",
                    zIndex: 100,
                  }}
                >
                  {([
                    { label: t.exportJPG,  onClick: handleExportJPG },
                    { label: t.exportTxt,  onClick: handleDownloadTxt },
                    { label: t.exportCopy, onClick: handleCopyExport },
                  ] as { label: string; onClick: () => void }[]).map(({ label, onClick }) => (
                    <button
                      key={label}
                      onClick={onClick}
                      style={{
                        fontFamily: FONT_SANS, fontSize: "13px", letterSpacing: "0.04em",
                        padding: "7px 16px", textAlign: "left",
                        background: "transparent",
                        border: "none", borderRadius: "8px",
                        color: dark ? "rgba(240,232,220,0.8)" : "#555555",
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}
                    >
                      {label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Right panel: eye + lang + menu ───────────────────────────────── */}
      <AnimatePresence mode="wait">
        {visible ? (
          <motion.div
            key="right-full"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ position: "fixed", top: "24px", right: "24px", display: "flex", flexDirection: "row", alignItems: "center", gap: "10px", zIndex: 20 }}
            ref={topRightGroupRef}
          >
            {/* Eye toggle */}
            <button
              style={btnStyle(dark, { background: dark ? darkColors.darkBg : surfaceLight, color: navIconColor }, surfaceLight)}
              onClick={(e) => { e.stopPropagation(); setVisible(false); setMenuOpen(false); setExportOpen(false); }}
            >
              <IconEyeClosed color={navIconColor} />
            </button>
            {/* Language toggle — hidden in viewer mode */}
            {!currentToolId && (
              <button
                style={btnStyle(dark, { background: dark ? darkColors.darkBg : surfaceLight, color: navIconColor }, surfaceLight)}
                onClick={(e) => { e.stopPropagation(); setLang(l => { const next = l === "de" ? "en" : "de"; localStorage.setItem("appLang", next); return next; }); }}
              >
                {t.langBtn}
              </button>
            )}
            {/* Menu button + dropdown — hidden in viewer mode */}
            {!currentToolId && <div
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
                style={{ ...btnStyle(dark, { background: dark ? darkColors.darkBg : surfaceLight, color: navIconColor }), position: "relative", zIndex: 1 }}
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
                    {(["CreateTool", "ToolCollection", "About"] as const).map((key, i) => (
                      <motion.button
                        key={key}
                        variants={NAV_ITEM}
                        style={navItemStyle(dark, i === 0, surfaceLight, bgHue)}
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuOpen(false);
                          if (key !== "CreateTool") navigate(NAV_ROUTES[key]);
                        }}
                      >{t.navLabels[key]}</motion.button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>}
          </motion.div>
        ) : (
          <motion.button
            key="right-mini"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "fixed", top: "12px", right: "12px", zIndex: 20,
              background: "transparent",
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
            onPlayground={() => navigate("/tool-collection")}
            surfaceLight={surfaceLight}
            cardBg={settingsCardBg}
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
            cardBg={settingsCardBg}
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

      {/* ── Compatibility toast ──────────────────────────────────────────── */}
      <AnimatePresence>
        {compatMsg && (
          <motion.div
            key="compat-toast"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
            style={{
              position: "fixed", bottom: "28px", left: "50%",
              transform: "translateX(-50%)",
              zIndex: 200,
              background: `color-mix(in srgb, ${settingsCardBg} 96%, transparent)`,
              border: `1px dashed ${dark ? "rgba(240,232,220,0.25)" : "#a4a4a4"}`,
              borderRadius: "8px",
              padding: "10px 18px",
              fontFamily: FONT_SANS, fontSize: "13px",
              color: dark ? DARK_TEXT : LIGHT_TEXT,
              boxShadow: "0 2px 12px rgba(0,0,0,0.12)",
              pointerEvents: "none",
              whiteSpace: "nowrap",
              maxWidth: "90vw",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {compatMsg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Record preview overlay ─────────────────────────────────────── */}
      {showRecordOverlay && (
        <RecordPreviewOverlay
          zoneRef={writingZoneRef}
          bg={bg}
          sessionId={sessionId}
          toolName={toolName}
          lang={lang}
          onDone={(url, path) => {
            setPreviewVideoUrl(url);
            setPreviewVideoPath(path);
            setRecordState("done");
            setShowRecordOverlay(false);
          }}
          onClose={() => {
            setShowRecordOverlay(false);
            if (recordState !== "done") setRecordState("error");
          }}
        />
      )}

    </div>
  );
}
