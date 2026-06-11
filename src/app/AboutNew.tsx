import { useMemo, useState } from "react";
import TopNav from "./components/TopNav";

const SANS = "'az-sans', sans-serif";
const COND = "'az-cond', serif";

type AboutTheme = {
  bg: string; ink: string; body: string; dash: string;
  asideBg: string; asideBody: string; line: string;
};

function getAboutTheme(dark: boolean): AboutTheme {
  if (dark) {
    return {
      bg: "#1a1918", ink: "#f0e8dc", body: "#cdc6ba", dash: "rgba(240,232,220,0.28)",
      asideBg: "#252321", asideBody: "#a9a298", line: "rgba(240,232,220,0.34)",
    };
  }
  return {
    bg: "#fcf6ef", ink: "#302e2c", body: "#555555", dash: "#a4a4a4",
    asideBg: "#f9f1e8", asideBody: "#7c7c7c", line: "#a4a4a4",
  };
}

// ── Canvas + node layout (coordinates lifted from the Figma research map) ──────
const CANVAS_W = 959;
const CANVAS_H = 1880;

type MapNode = {
  id: string;
  img: string;
  cx: number;     // horizontal centre of the illustration on the canvas
  top: number;    // y of the illustration's top edge
  w: number;      // illustration width
  h: number;      // illustration height
  main: boolean;  // main spine node (24px) vs. side node (18px)
  label: { de: string; en: string };
  body: { de: string; en: string };
};

const PLACEHOLDER_DE =
  "Text über dieses Thema. Text über dieses Thema. Text über dieses Thema. Text über dieses Thema. Text über dieses Thema. Text über dieses Thema. Text über dieses Thema. Text über dieses Thema.";
const PLACEHOLDER_EN =
  "Text about this topic. Text about this topic. Text about this topic. Text about this topic. Text about this topic. Text about this topic. Text about this topic. Text about this topic.";

function ph(): { de: string; en: string } {
  return { de: PLACEHOLDER_DE, en: PLACEHOLDER_EN };
}

const NODES: MapNode[] = [
  { id: "denken-schreiben",  img: "/denkenschreiben.png",     cx: 517, top: 0,    w: 228, h: 93,  main: true,  label: { de: "Denken vs. Schreiben", en: "Thinking vs. Writing" }, body: ph() },
  { id: "denken-sichtbar",   img: "/denkenvisualisieren.png", cx: 517, top: 316,  w: 277, h: 178, main: true,  label: { de: "Denken sichtbar machen", en: "Making thinking visible" }, body: ph() },
  { id: "einfluss-werkzeug", img: "/typewriter.png",          cx: 517, top: 688,  w: 178, h: 140, main: true,  label: { de: "Der Einfluss des Werkzeugs\nauf Denken & Schreiben", en: "The tool's influence\non thinking & writing" }, body: ph() },
  { id: "regeln-digital",    img: "/digitaltools.png",        cx: 466, top: 1098, w: 142, h: 124, main: true,  label: { de: "Die Regeln digitaler Schreibtools", en: "The rules of digital writing tools" }, body: ph() },
  { id: "regeln-brechen",    img: "/breakingrules.png",       cx: 675, top: 1297, w: 214, h: 157, main: true,  label: { de: "Regeln brechen", en: "Breaking rules" }, body: ph() },
  { id: "create-own",        img: "/Tool.png",                cx: 355, top: 1594, w: 168, h: 146, main: true,  label: { de: "Create your own", en: "Create your own" }, body: ph() },

  { id: "automatic-writing", img: "/automatic_Writing.png",   cx: 838, top: 307,  w: 87,  h: 100, main: false, label: { de: "Automatic Writing", en: "Automatic Writing" }, body: ph() },
  { id: "concrete-poetry",   img: "/concrete_Poetry.png",     cx: 134, top: 325,  w: 149, h: 104, main: false, label: { de: "Concrete Poetry", en: "Concrete Poetry" }, body: ph() },
  { id: "stream",            img: "/automaticwriting.png",    cx: 90,  top: 626,  w: 133, h: 85,  main: false, label: { de: "Stream of Consciousness", en: "Stream of Consciousness" }, body: ph() },
  { id: "xerox",             img: "/UI.png",                  cx: 121, top: 987,  w: 102, h: 95,  main: false, label: { de: "Xerox Parc", en: "Xerox Parc" }, body: ph() },
  { id: "sprache-schrift",   img: "/firstwriting.png",        cx: 872, top: 639,  w: 171, h: 128, main: false, label: { de: "Einfluss von Sprache und\nSchrift auf das Denken", en: "Influence of language and\nscript on thinking" }, body: ph() },
];

const EDGES: [string, string][] = [
  ["denken-schreiben", "denken-sichtbar"],
  ["denken-sichtbar", "concrete-poetry"],
  ["denken-sichtbar", "automatic-writing"],
  ["denken-sichtbar", "einfluss-werkzeug"],
  ["einfluss-werkzeug", "stream"],
  ["einfluss-werkzeug", "sprache-schrift"],
  ["einfluss-werkzeug", "regeln-digital"],
  ["regeln-digital", "xerox"],
  ["regeln-digital", "regeln-brechen"],
  ["regeln-brechen", "create-own"],
];

function centre(node: MapNode) {
  return { x: node.cx, y: node.top + node.h / 2 };
}

// Gentle hand-drawn bow on each connector
function curvedPath(x1: number, y1: number, x2: number, y2: number, bow: number) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const off = len * bow;
  const cx = mx + (-dy / len) * off;
  const cy = my + (dx / len) * off;
  return `M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`;
}

export default function AboutNew() {
  const [dark, setDark] = useState<boolean>(() => localStorage.getItem("appTheme") === "dark");
  const [lang, setLang] = useState<"de" | "en">(() => (localStorage.getItem("appLang") as "de" | "en") ?? "de");
  const [activeId, setActiveId] = useState<string>(NODES[0].id);
  const T = getAboutTheme(dark);
  const DE = lang === "de";

  const handleSetDark = (fn: (d: boolean) => boolean) => {
    setDark((d) => { const next = fn(d); localStorage.setItem("appTheme", next ? "dark" : "light"); return next; });
  };

  const active = NODES.find((n) => n.id === activeId) ?? NODES[0];

  const paths = useMemo(() => {
    return EDGES.map(([fromId, toId], i) => {
      const from = NODES.find((n) => n.id === fromId)!;
      const to = NODES.find((n) => n.id === toId)!;
      const a = centre(from);
      const b = centre(to);
      const bow = (i % 2 === 0 ? 1 : -1) * 0.08;
      return curvedPath(a.x, a.y, b.x, b.y, bow);
    });
  }, []);

  const imgStyle = (n: MapNode): React.CSSProperties => ({
    width: n.w,
    height: n.h,
    objectFit: "contain",
    pointerEvents: "none",
    mixBlendMode: dark ? "screen" : "multiply",
    filter: dark ? "invert(1) brightness(1.7) contrast(0.9)" : "none",
  });

  return (
    <main
      style={{
        width: "100vw", height: "100vh", overflow: "hidden",
        position: "relative", backgroundColor: T.bg, color: T.body, fontFamily: SANS,
      }}
    >
      <style>{`
        html, body, #root { height: 100%; overflow: hidden; background: ${T.bg}; }
        .aboutmap-scroll::-webkit-scrollbar { width: 10px; }
        .aboutmap-scroll::-webkit-scrollbar-track { background: transparent; }
        .aboutmap-scroll::-webkit-scrollbar-thumb { background: ${T.dash}; border-radius: 999px; }
        .aboutmap-node { background: none; border: none; padding: 0; cursor: pointer; }
        .aboutmap-node:hover .aboutmap-label { text-decoration: underline; text-decoration-style: dashed; text-underline-offset: 5px; }
      `}</style>

      <TopNav current="About" dark={dark} setDark={handleSetDark} lang={lang} setLang={setLang} />

      {/* ── Left detail panel — shows the selected node ─────────────────────── */}
      <aside
        style={{
          position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 20,
          width: 321, boxSizing: "border-box",
          background: T.asideBg, borderRight: `1px dashed ${T.dash}`,
          padding: 24, display: "flex", flexDirection: "column", gap: 16,
          overflowY: "auto",
        }}
      >
        <div style={{ width: "100%", height: 167, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <img
            src={active.img}
            alt=""
            style={{
              maxWidth: "100%", maxHeight: 167, objectFit: "contain",
              mixBlendMode: dark ? "screen" : "multiply",
              filter: dark ? "invert(1) brightness(1.7) contrast(0.9)" : "none",
            }}
          />
        </div>
        <p style={{ margin: 0, fontFamily: COND, fontSize: 28, lineHeight: 1.1, color: T.ink, whiteSpace: "pre-line" }}>
          {DE ? active.label.de : active.label.en}
        </p>
        <p style={{ margin: 0, fontFamily: SANS, fontWeight: 300, fontSize: 15, lineHeight: 1.5, letterSpacing: "-0.15px", color: T.asideBody, whiteSpace: "pre-wrap" }}>
          {DE ? active.body.de : active.body.en}
        </p>
      </aside>

      {/* ── Scrollable mind-map canvas ──────────────────────────────────────── */}
      <div
        className="aboutmap-scroll"
        style={{ position: "absolute", inset: 0, overflowX: "hidden", overflowY: "auto" }}
      >
        <div style={{ display: "flex", justifyContent: "center", paddingLeft: 321, paddingTop: 72, paddingBottom: 160 }}>
          <div style={{ position: "relative", width: CANVAS_W, height: CANVAS_H }}>
            <svg
              width={CANVAS_W}
              height={CANVAS_H}
              style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible" }}
            >
              {paths.map((d, i) => (
                <path key={i} d={d} fill="none" stroke={T.line} strokeWidth={1} strokeDasharray="5 7" strokeLinecap="round" />
              ))}
            </svg>

            {NODES.map((n) => {
              const isActive = n.id === activeId;
              return (
                <button
                  key={n.id}
                  className="aboutmap-node"
                  onClick={() => setActiveId(n.id)}
                  style={{
                    position: "absolute",
                    left: n.cx,
                    top: n.top,
                    transform: "translateX(-50%)",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
                  }}
                >
                  <img src={n.img} alt="" style={imgStyle(n)} />
                  <span
                    className="aboutmap-label"
                    style={{
                      fontFamily: COND,
                      fontSize: n.main ? 24 : 18,
                      lineHeight: 1.15,
                      color: T.ink,
                      textAlign: "center",
                      whiteSpace: "pre-line",
                      textDecoration: isActive ? "underline" : "none",
                      textDecorationStyle: "dashed",
                      textUnderlineOffset: 5,
                    }}
                  >
                    {DE ? n.label.de : n.label.en}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
