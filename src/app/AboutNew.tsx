import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { nodes as allNodes } from "./projects/abouttheproject/components/mindmap-data";
import TopNav from "./components/TopNav";

const SERIF = "'az-serif', serif";
const SANS = "'az-sans', sans-serif";
const MONO = "'az-sans', sans-serif";

const SIDEBAR_W = "max(390px, min(34vw, 520px))";
const CANVAS_W = 1520;
const CANVAS_H = 1460;

type AboutTheme = {
  bg: string;
  panelBg: string;
  ink: string;
  text: string;
  muted: string;
  dash: string;
  nodeBg: string;
  nodeHoverBg: string;
  asideBg: string;
  bodyText: string;
  scrollThumb: string;
  titleBoxBg: string;
};

type ArchivePhoto = {
  src: string;
  alt: string;
  credit: string;
  source: string;
};

function getAboutTheme(dark: boolean): AboutTheme {
  if (dark) {
    return {
      bg: "#484848",
      panelBg: "#3a3836",
      ink: "#f0e8dc",
      text: "#cdc6ba",
      muted: "rgba(240,232,220,0.54)",
      dash: "rgba(240,232,220,0.32)",
      nodeBg: "rgba(240,232,220,0.07)",
      nodeHoverBg: "rgba(240,232,220,0.12)",
      asideBg: "rgba(58,56,54,0.98)",
      bodyText: "#d8d1c5",
      scrollThumb: "rgba(240,232,220,0.22)",
      titleBoxBg: "rgba(240,232,220,0.05)",
    };
  }

  return {
    bg: "#fcf6ef",
    panelBg: "#f3ebe0",
    ink: "#302e2c",
    text: "#555555",
    muted: "#8f8f89",
    dash: "#a4a4a4",
    nodeBg: "rgba(255,253,250,0.54)",
    nodeHoverBg: "rgba(255,253,250,0.88)",
    asideBg: "rgba(252,246,239,0.98)",
    bodyText: "#3d3a36",
    scrollThumb: "rgba(164,164,164,0.34)",
    titleBoxBg: "rgba(255,253,250,0.42)",
  };
}

const NODE_POINTS: Record<string, { x: number; y: number }> = {
  start: { x: 780, y: 195 },
  erste_frage: { x: 780, y: 485 },
  erkenntnis: { x: 780, y: 780 },
  these: { x: 780, y: 1055 },
  experimente: { x: 1065, y: 1085 },
  projekt: { x: 1120, y: 1320 },

  konkrete: { x: 450, y: 360 },
  surrealismus: { x: 1240, y: 360 },
  stream: { x: 440, y: 610 },

  kognition: { x: 420, y: 765 },
  medientheorie: { x: 430, y: 930 },
  danger: { x: 1220, y: 815 },

  geschichte: { x: 420, y: 1110 },
  regeln: { x: 1205, y: 1035 },
  methode: { x: 410, y: 1270 },

  tippex: { x: 915, y: 1210 },
  version: { x: 995, y: 940 },
  raum3d: { x: 1300, y: 1210 },
  uninvited: { x: 1165, y: 930 },
  unsichtbar: { x: 1320, y: 1040 },
  cursor: { x: 1130, y: 1235 },
  spirale: { x: 810, y: 1320 },

  tool: { x: 950, y: 1420 },
  behauptung: { x: 1280, y: 1420 },
};

const FALLBACK_PANEL = {
  title: "Denken & Schreiben",
  body: [
    "Gedanken bewegen sich, bevor sie Text werden: fragmentarisch, zeitlich, manchmal noch nicht sprachlich.",
    "Schreiben macht daraus etwas Festes: eine Linie, eine Ordnung, ein Dokument, das korrigiert und gespeichert werden kann.",
    "Shaping Thoughts untersucht genau diese Spannung und fragt, wie digitale Schreibtools unser Denken mitformen.",
  ],
};

function commonsFile(file: string, width = 560) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${width}`;
}

const PHOTOS = {
  automaticWriting: {
    src: commonsFile("Automatic Writing.jpg"),
    alt: "Automatic writing manuscript",
    credit: "Wikimedia Commons / Automatic Writing.jpg",
    source: "https://commons.wikimedia.org/wiki/File:Automatic_Writing.jpg",
  },
  automaticDrawing: {
    src: commonsFile("Dibujo automático.jpg"),
    alt: "Automatic drawing",
    credit: "Wikimedia Commons / Dibujo automático.jpg",
    source: "https://commons.wikimedia.org/wiki/File:Dibujo_autom%C3%A1tico.jpg",
  },
  woolf: {
    src: commonsFile("VirginiaWoolf.jpg"),
    alt: "Portrait of Virginia Woolf",
    credit: "Wikimedia Commons / George Charles Beresford",
    source: "https://commons.wikimedia.org/wiki/File:VirginiaWoolf.jpg",
  },
  xerox: {
    src: commonsFile("Xerox Alto computer.jpg"),
    alt: "Xerox Alto computer",
    credit: "Wikimedia Commons / Xerox Alto computer.jpg",
    source: "https://commons.wikimedia.org/wiki/File:Xerox_Alto_computer.jpg",
  },
  typewriter: {
    src: commonsFile("Old typewriter analog keyboard closeup.jpg"),
    alt: "Old typewriter keyboard closeup",
    credit: "Wikimedia Commons / Nenad Stojković",
    source: "https://commons.wikimedia.org/wiki/File:Old_typewriter_analog_keyboard_closeup.jpg",
  },
  keyboard: {
    src: commonsFile("Woodstock typewriter, 1940s, daylight - keyboard.jpg"),
    alt: "Woodstock typewriter keyboard",
    credit: "Wikimedia Commons / Cbaile19, CC0",
    source: "https://commons.wikimedia.org/wiki/File:Woodstock_typewriter,_1940s,_daylight_-_keyboard.jpg",
  },
} satisfies Record<string, ArchivePhoto>;

const NODE_PHOTOS: Record<string, ArchivePhoto> = {
  start: PHOTOS.automaticWriting,
  erste_frage: PHOTOS.automaticDrawing,
  konkrete: PHOTOS.keyboard,
  surrealismus: PHOTOS.automaticWriting,
  stream: PHOTOS.woolf,
  erkenntnis: PHOTOS.xerox,
  kognition: PHOTOS.typewriter,
  medientheorie: PHOTOS.xerox,
  danger: PHOTOS.automaticWriting,
  these: PHOTOS.typewriter,
  geschichte: PHOTOS.xerox,
  regeln: PHOTOS.keyboard,
  methode: PHOTOS.automaticDrawing,
  experimente: PHOTOS.typewriter,
  uninvited: PHOTOS.automaticDrawing,
  unsichtbar: PHOTOS.automaticWriting,
  cursor: PHOTOS.keyboard,
  tippex: PHOTOS.typewriter,
  version: PHOTOS.automaticWriting,
  raum3d: PHOTOS.automaticDrawing,
  spirale: PHOTOS.automaticDrawing,
  projekt: PHOTOS.xerox,
  tool: PHOTOS.xerox,
  behauptung: PHOTOS.typewriter,
};

function fallbackPoint(x: number, y: number) {
  return {
    x: 300 + x * 0.8,
    y: 190 + y * 1.08,
  };
}

function getPoint(node: { id: string; x: number; y: number }) {
  return NODE_POINTS[node.id] ?? fallbackPoint(node.x, node.y);
}

function NodeImage({ photo, large, border, panelBg }: { photo?: ArchivePhoto; large: boolean; border: string; panelBg: string }) {
  if (!photo) return null;

  return (
    <span
      style={{
        display: "block",
        width: large ? 116 : 96,
        height: large ? 58 : 42,
        margin: "0 auto 10px",
        border: `1px dashed ${border}`,
        borderRadius: large ? 7 : 5,
        overflow: "hidden",
        background: panelBg,
        filter: "grayscale(1) contrast(0.92) sepia(0.12)",
        opacity: 0.84,
      }}
    >
      <img src={photo.src} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
    </span>
  );
}

export default function AboutNew() {
  const [active, setActive] = useState<string>("start");
  const [dark, setDark] = useState<boolean>(() => localStorage.getItem("appTheme") === "dark");
  const [lang, setLang] = useState<"de" | "en">(() => (localStorage.getItem("appLang") as "de" | "en") ?? "en");
  const T = getAboutTheme(dark);

  const handleSetDark = (fn: (d: boolean) => boolean) => {
    setDark((d) => {
      const next = fn(d);
      localStorage.setItem("appTheme", next ? "dark" : "light");
      return next;
    });
  };

  const activeNode = allNodes.find((node) => node.id === active) ?? allNodes[0];
  const activePhoto = activeNode ? NODE_PHOTOS[activeNode.id] : undefined;

  const lines = useMemo(() => {
    const result: { fx: number; fy: number; tx: number; ty: number }[] = [];
    allNodes.forEach((node) => {
      node.connections?.forEach((connection) => {
        const target = allNodes.find((candidate) => candidate.id === connection.to);
        if (!target) return;
        const from = getPoint(node);
        const to = getPoint(target);
        result.push({ fx: from.x, fy: from.y, tx: to.x, ty: to.y });
      });
    });
    return result;
  }, []);

  return (
    <main
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        position: "relative",
        backgroundColor: T.bg,
        color: T.text,
        fontFamily: SANS,
      }}
    >
      <style>{`
        html, body, #root { height: 100%; overflow: hidden; background: ${T.bg}; }
        .aboutnew-node:hover p { color: ${T.ink} !important; text-decoration: underline; text-decoration-style: dashed; text-underline-offset: 5px; }
        .aboutnew-node:hover { border-color: ${T.ink} !important; background: ${T.nodeHoverBg} !important; }
        .aboutnew-scroll::-webkit-scrollbar { width: 10px; height: 10px; }
        .aboutnew-scroll::-webkit-scrollbar-track { background: transparent; }
        .aboutnew-scroll::-webkit-scrollbar-thumb { background: ${T.scrollThumb}; border-radius: 999px; }
        .aboutnew-left::-webkit-scrollbar { width: 8px; }
        .aboutnew-left::-webkit-scrollbar-track { background: transparent; }
        .aboutnew-left::-webkit-scrollbar-thumb { background: ${T.scrollThumb}; border-radius: 999px; }
      `}</style>

      <TopNav current="About" dark={dark} setDark={handleSetDark} lang={lang} setLang={setLang} />

      <aside
        className="aboutnew-left"
        style={{
          position: "absolute",
          zIndex: 8,
          top: 0,
          left: 0,
          bottom: 0,
          width: SIDEBAR_W,
          boxSizing: "border-box",
          padding: "36px 30px 44px",
          overflowY: "auto",
          background: T.asideBg,
          borderRight: `1px dashed ${T.dash}`,
        }}
      >
        <p style={{ margin: "0 0 92px", fontFamily: MONO, fontSize: 12, letterSpacing: "0.12em", color: T.muted, textTransform: "uppercase" }}>
          Shaping Thoughts
        </p>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeNode?.id ?? "fallback"}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            style={{ display: "flex", flexDirection: "column", gap: 24 }}
          >
            {activePhoto && (
              <a href={activePhoto.source} target="_blank" rel="noreferrer" style={{ color: "inherit", textDecoration: "none" }}>
                <div
                  style={{
                    width: 148,
                    height: 76,
                    border: `1px dashed ${T.dash}`,
                    borderRadius: 7,
                    overflow: "hidden",
                    background: T.panelBg,
                    filter: "grayscale(1) contrast(0.94) sepia(0.1)",
                    opacity: 0.86,
                  }}
                >
                  <img src={activePhoto.src} alt={activePhoto.alt} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </div>
                <p style={{ margin: "7px 0 0", fontFamily: MONO, color: T.muted, fontSize: 9, lineHeight: "13px" }}>{activePhoto.credit}</p>
              </a>
            )}

            <h1 style={{ margin: 0, fontFamily: SERIF, color: T.ink, fontSize: 35, lineHeight: "39px", fontWeight: 400 }}>
              {activeNode?.title ?? FALLBACK_PANEL.title}
            </h1>

            <div style={{ height: 0, borderTop: `1px dashed ${T.dash}` }} />

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {(activeNode?.body ?? FALLBACK_PANEL.body).map((paragraph, index) => {
                if (!paragraph) return <div key={index} style={{ height: 6 }} />;
                const isHeading = paragraph === paragraph.toUpperCase() && paragraph.length < 60;
                const isDash = paragraph.startsWith("-") || paragraph.startsWith("—") || paragraph.startsWith("–");
                return (
                  <p
                    key={index}
                    style={{
                      margin: 0,
                      fontFamily: isHeading ? MONO : SANS,
                      fontSize: isHeading ? 11 : 18,
                      lineHeight: isHeading ? "16px" : "27px",
                      color: isHeading ? T.muted : isDash ? T.text : T.bodyText,
                      letterSpacing: isHeading ? "0.11em" : 0,
                    }}
                  >
                    {paragraph}
                  </p>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </aside>

      <section
        style={{
          position: "absolute",
          top: 0,
          left: SIDEBAR_W,
          right: 0,
          bottom: 0,
          overflow: "hidden",
        }}
      >
        <header
          style={{
            position: "fixed",
            top: 31,
            left: `calc(${SIDEBAR_W} + 40px)`,
            right: 260,
            zIndex: 7,
            pointerEvents: "none",
          }}
        >
          <h2 style={{ margin: 0, textAlign: "center", fontFamily: SERIF, color: T.ink, fontSize: 29, lineHeight: "36px", fontWeight: 400 }}>
            About the Project
          </h2>
        </header>

        <div
          className="aboutnew-scroll"
          style={{
            position: "absolute",
            inset: 0,
            overflow: "auto",
            padding: "100px 80px 90px",
            boxSizing: "border-box",
          }}
        >
          <div
            style={{
              position: "relative",
              width: CANVAS_W,
              height: CANVAS_H,
              margin: "0 auto",
            }}
          >
            <svg
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                pointerEvents: "none",
                overflow: "visible",
              }}
            >
              <line x1={780} y1={80} x2={780} y2={CANVAS_H - 30} stroke={T.dash} strokeWidth={1} strokeDasharray="5 8" opacity={0.68} />
              {lines.map((line) => (
                <motion.line
                  key={`${line.fx}-${line.fy}-${line.tx}-${line.ty}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.7 }}
                  transition={{ duration: 0.28 }}
                  x1={line.fx}
                  y1={line.fy}
                  x2={line.tx}
                  y2={line.ty}
                  stroke={T.dash}
                  strokeWidth={1}
                  strokeDasharray="5 8"
                />
              ))}
            </svg>

            {allNodes.map((node) => {
              const isMain = node.nodeType === "main";
              const isActive = active === node.id;
              const point = getPoint(node);
              const photo = NODE_PHOTOS[node.id];
              return (
                <motion.button
                  key={node.id}
                  className="aboutnew-node"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  onClick={() => setActive(node.id)}
                  style={{
                    position: "absolute",
                    left: point.x,
                    top: point.y,
                    transform: "translate(-50%, -50%)",
                    width: isMain ? 228 : 168,
                    minHeight: isMain ? 128 : 86,
                    padding: isMain ? "16px 18px" : "12px 13px",
                    background: isActive ? T.panelBg : T.nodeBg,
                    border: `1px dashed ${isActive ? T.ink : T.dash}`,
                    borderRadius: isMain ? 14 : 7,
                    cursor: "pointer",
                    boxShadow: isActive ? "0 16px 42px rgba(48,46,44,0.10)" : "0 10px 30px rgba(48,46,44,0.035)",
                    transition: "background 140ms ease, border-color 140ms ease, box-shadow 140ms ease",
                  }}
                >
                  <NodeImage photo={photo} large={isMain} border={T.dash} panelBg={T.panelBg} />
                  <p
                    style={{
                      margin: 0,
                      fontFamily: isMain ? SERIF : MONO,
                      fontSize: isMain ? 21 : 12,
                      lineHeight: isMain ? "24px" : "15px",
                      color: isMain ? T.ink : T.text,
                      textAlign: "center",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {node.label}
                  </p>
                </motion.button>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
