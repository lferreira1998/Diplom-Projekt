import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { nodes as allNodes } from "./projects/abouttheproject/components/mindmap-data";
import TopNav from "./components/TopNav";

const SERIF = "'az-serif', serif";
const SANS = "'az-sans', sans-serif";
const MONO = "'az-sans', sans-serif";

type AboutTheme = {
  bg: string; panelBg: string; ink: string; text: string; muted: string;
  dash: string; dotGrid: string; nodeBg: string; nodeHoverBg: string;
  asideBg: string; bodyText: string; scrollThumb: string; headerGradient: string;
  titleBoxBg: string;
};

function getAboutTheme(dark: boolean): AboutTheme {
  if (dark) {
    return {
      bg: "#484848", panelBg: "#3a3836", ink: "#f0e8dc", text: "#cdc6ba",
      muted: "rgba(240,232,220,0.5)", dash: "rgba(240,232,220,0.28)",
      dotGrid: "radial-gradient(circle, rgba(240,232,220,0.18) 1px, transparent 1.2px)",
      nodeBg: "rgba(240,232,220,0.07)", nodeHoverBg: "rgba(240,232,220,0.12)",
      asideBg: "rgba(58,56,54,0.97)", bodyText: "#d8d1c5",
      scrollThumb: "rgba(240,232,220,0.22)",
      headerGradient: "linear-gradient(180deg, rgba(72,72,72,0.97), rgba(72,72,72,0.74))",
      titleBoxBg: "rgba(240,232,220,0.06)",
    };
  }
  return {
    bg: "#fcf6ef", panelBg: "#f3ebe0", ink: "#302e2c", text: "#555555",
    muted: "#8f8f89", dash: "#a4a4a4",
    dotGrid: "radial-gradient(circle, rgba(164,164,164,0.64) 1px, transparent 1.2px)",
    nodeBg: "rgba(249,241,232,0.72)", nodeHoverBg: "rgba(243,235,224,0.82)",
    asideBg: "rgba(249,241,232,0.94)", bodyText: "#3d3a36",
    scrollThumb: "rgba(164,164,164,0.34)",
    headerGradient: "linear-gradient(180deg, rgba(252,246,239,0.96), rgba(252,246,239,0.74))",
    titleBoxBg: "rgba(249,241,232,0.52)",
  };
}

const CANVAS_W = 1120;
const CANVAS_H = 2260;

const NODE_POINTS: Record<string, { x: number; y: number }> = {
  start: { x: 560, y: 180 },
  erste_frage: { x: 560, y: 470 },
  erkenntnis: { x: 560, y: 790 },
  these: { x: 560, y: 1130 },
  experimente: { x: 560, y: 1500 },
  projekt: { x: 560, y: 1910 },

  konkrete: { x: 230, y: 330 },
  surrealismus: { x: 890, y: 380 },
  stream: { x: 230, y: 630 },

  kognition: { x: 220, y: 720 },
  medientheorie: { x: 235, y: 920 },
  danger: { x: 890, y: 880 },

  geschichte: { x: 230, y: 1080 },
  regeln: { x: 890, y: 1135 },
  methode: { x: 230, y: 1260 },

  tippex: { x: 235, y: 1390 },
  version: { x: 225, y: 1545 },
  raum3d: { x: 235, y: 1700 },
  uninvited: { x: 890, y: 1365 },
  unsichtbar: { x: 900, y: 1520 },
  cursor: { x: 890, y: 1675 },
  spirale: { x: 560, y: 1780 },

  tool: { x: 330, y: 2090 },
  behauptung: { x: 790, y: 2090 },
};

type ArchivePhoto = {
  src: string;
  alt: string;
  credit: string;
  source: string;
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
    x: CANVAS_W / 2 + (y - 500) * 0.74,
    y: 150 + x * 1.16,
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
        width: large ? 112 : 96,
        height: large ? 58 : 42,
        margin: "0 auto 9px",
        border: `1px dashed ${border}`,
        borderRadius: large ? 8 : 6,
        overflow: "hidden",
        background: panelBg,
        filter: "grayscale(1) contrast(0.92) sepia(0.12)",
        opacity: 0.86,
      }}
    >
      <img src={photo.src} alt="" loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
    </span>
  );
}

export default function AboutNew() {
  const [opened, setOpened] = useState<Set<string>>(
    () => new Set(allNodes.filter((node) => node.initiallyVisible).map((node) => node.id))
  );
  const [active, setActive] = useState<string | null>(null);
  const [dark, setDark] = useState<boolean>(() => localStorage.getItem("appTheme") === "dark");
  const [lang, setLang] = useState<"de" | "en">(() => (localStorage.getItem("appLang") as "de" | "en") ?? "de");
  const T = getAboutTheme(dark);

  const handleSetDark = (fn: (d: boolean) => boolean) => {
    setDark((d) => { const next = fn(d); localStorage.setItem("appTheme", next ? "dark" : "light"); return next; });
  };

  const visibleIds = useMemo(() => {
    const ids = new Set<string>();
    allNodes.forEach((node) => node.initiallyVisible && ids.add(node.id));
    opened.forEach((id) => {
      ids.add(id);
      allNodes.find((node) => node.id === id)?.reveals?.forEach((revealedId) => ids.add(revealedId));
    });
    return ids;
  }, [opened]);

  const visibleNodes = allNodes.filter((node) => visibleIds.has(node.id));
  const activeNode = active ? allNodes.find((node) => node.id === active) ?? null : null;
  const activePhoto = activeNode ? NODE_PHOTOS[activeNode.id] : undefined;

  const lines = useMemo(() => {
    const result: { fx: number; fy: number; tx: number; ty: number }[] = [];
    visibleNodes.forEach((node) => {
      node.connections?.forEach((connection) => {
        const target = allNodes.find((candidate) => candidate.id === connection.to);
        if (!target || !visibleIds.has(target.id)) return;
        const from = getPoint(node);
        const to = getPoint(target);
        result.push({ fx: from.x, fy: from.y, tx: to.x, ty: to.y });
      });
    });
    return result;
  }, [visibleNodes, visibleIds]);

  const handleOpen = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setActive(id);
    setOpened((previous) => new Set([...previous, id]));
  };

  return (
    <main
      onClick={() => setActive(null)}
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        position: "relative",
        backgroundColor: T.bg,
        backgroundImage: T.dotGrid,
        backgroundSize: "42px 42px",
        color: T.text,
        fontFamily: SANS,
      }}
    >
      <style>{`
        html, body, #root { height: 100%; overflow: hidden; background: ${T.bg}; }
        .aboutnew-node:hover p { color: ${T.ink} !important; text-decoration: underline; text-decoration-style: dashed; text-underline-offset: 5px; }
        .aboutnew-node:hover { border-color: ${T.ink} !important; background: ${T.nodeHoverBg} !important; }
        .aboutnew-scroll::-webkit-scrollbar { width: 10px; }
        .aboutnew-scroll::-webkit-scrollbar-track { background: transparent; }
        .aboutnew-scroll::-webkit-scrollbar-thumb { background: ${T.scrollThumb}; border-radius: 999px; }
      `}</style>

      <TopNav current="About" dark={dark} setDark={handleSetDark} lang={lang} setLang={setLang} />

      <header
        onClick={(event) => event.stopPropagation()}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px 44px 16px",
          background: T.headerGradient,
          backdropFilter: "blur(6px)",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            height: 38,
            padding: "0 28px",
            border: `1px dashed ${T.dash}`,
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: T.titleBoxBg,
          }}
        >
          <span style={{ fontFamily: SERIF, color: T.ink, fontSize: 21, lineHeight: 1 }}>Shaping Thoughts: Research Map</span>
        </div>
      </header>

      <div
        className="aboutnew-scroll"
        style={{
          position: "absolute",
          top: 78,
          left: 0,
          right: 0,
          bottom: 0,
          overflowX: "hidden",
          overflowY: "auto",
          paddingBottom: 140,
        }}
      >
        <div
          style={{
            position: "relative",
            width: CANVAS_W,
            height: CANVAS_H,
            minHeight: "calc(100vh - 78px)",
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
            <defs>
              <marker id="aboutnewArrow" markerWidth="10" markerHeight="10" refX="7" refY="4" orient="auto">
                <polyline points="1,1 7,4 1,7" fill="none" stroke={T.dash} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
              </marker>
            </defs>
            <AnimatePresence>
              {lines.map((line) => (
                <motion.line
                  key={`${line.fx}-${line.fy}-${line.tx}-${line.ty}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.32 }}
                  x1={line.fx}
                  y1={line.fy}
                  x2={line.tx}
                  y2={line.ty}
                  stroke={T.dash}
                  strokeWidth={1}
                  strokeDasharray="5 8"
                  markerEnd="url(#aboutnewArrow)"
                />
              ))}
            </AnimatePresence>
          </svg>

          <AnimatePresence>
            {visibleNodes.map((node) => {
              const isMain = node.nodeType === "main";
              const isActive = active === node.id;
              const point = getPoint(node);
              const photo = NODE_PHOTOS[node.id];
              return (
                <motion.button
                  key={node.id}
                  className="aboutnew-node"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  onClick={(event) => handleOpen(node.id, event)}
                  style={{
                    position: "absolute",
                    left: point.x,
                    top: point.y,
                    transform: "translate(-50%, -50%)",
                    padding: isMain ? "14px 18px" : "11px 14px",
                    minWidth: isMain ? 190 : 156,
                    maxWidth: isMain ? 246 : 208,
                    background: isActive ? T.panelBg : T.nodeBg,
                    border: `1px dashed ${isActive ? T.ink : T.dash}`,
                    borderRadius: isMain ? 20 : 8,
                    cursor: "pointer",
                    boxShadow: isActive ? "0 12px 38px rgba(48,46,44,0.07)" : "none",
                    transition: "background 140ms ease, border-color 140ms ease, box-shadow 140ms ease",
                  }}
                >
                  <NodeImage photo={photo} large={isMain} border={T.dash} panelBg={T.panelBg} />
                  <p
                    style={{
                      margin: 0,
                      fontFamily: isMain ? SERIF : MONO,
                      fontSize: isMain ? 22 : 12,
                      lineHeight: isMain ? "24px" : "15px",
                      color: isMain ? T.ink : T.text,
                      textAlign: "center",
                      whiteSpace: "pre-wrap",
                      textDecoration: isActive ? "underline" : "none",
                      textDecorationStyle: "dashed",
                      textUnderlineOffset: 5,
                    }}
                  >
                    {node.label}
                  </p>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {activeNode && (
          <motion.aside
            key={activeNode.id}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
            style={{
              position: "fixed",
              zIndex: 30,
              top: 94,
              right: 44,
              bottom: 28,
              width: 340,
              boxSizing: "border-box",
              background: T.asideBg,
              border: `1px dashed ${T.dash}`,
              borderRadius: 10,
              padding: "20px 22px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
              overflowY: "auto",
              boxShadow: "0 18px 70px rgba(48,46,44,0.09)",
              backdropFilter: "blur(8px)",
            }}
          >
            {activePhoto && (
              <a href={activePhoto.source} target="_blank" rel="noreferrer" style={{ color: "inherit", textDecoration: "none" }}>
                <div
                  style={{
                    height: 150,
                    border: `1px dashed ${T.dash}`,
                    borderRadius: 8,
                    overflow: "hidden",
                    background: T.panelBg,
                    filter: "grayscale(1) contrast(0.94) sepia(0.1)",
                  }}
                >
                  <img src={activePhoto.src} alt={activePhoto.alt} loading="lazy" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </div>
                <p style={{ margin: "7px 0 0", fontFamily: MONO, color: T.muted, fontSize: 9, lineHeight: "13px" }}>{activePhoto.credit}</p>
              </a>
            )}

            <p style={{ margin: 0, fontFamily: SERIF, fontSize: 30, lineHeight: "33px", color: T.ink }}>
              {activeNode.title}
            </p>

            <div style={{ height: 0, borderTop: `1px dashed ${T.dash}` }} />

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {activeNode.body.map((paragraph, index) => {
                if (!paragraph) return <div key={index} style={{ height: 4 }} />;
                const isHeading = paragraph === paragraph.toUpperCase() && paragraph.length < 60;
                const isDash = paragraph.startsWith("—") || paragraph.startsWith("–");
                return (
                  <p
                    key={index}
                    style={{
                      margin: 0,
                      fontFamily: isHeading ? MONO : isDash ? SANS : MONO,
                      fontSize: isHeading ? 10 : 12,
                      lineHeight: isHeading ? "14px" : "20px",
                      color: isHeading ? T.muted : isDash ? T.text : T.bodyText,
                      letterSpacing: isHeading ? "0.12em" : 0,
                      paddingLeft: isDash ? 4 : 0,
                    }}
                  >
                    {paragraph}
                  </p>
                );
              })}
            </div>

            {activeNode.reveals && activeNode.reveals.length > 0 && (
              <>
                <div style={{ height: 0, borderTop: `1px dashed ${T.dash}` }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <p style={{ margin: 0, fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", color: T.muted }}>
                    FÜHRT WEITER ZU
                  </p>
                  {activeNode.reveals.map((revealedId) => {
                    const target = allNodes.find((node) => node.id === revealedId);
                    if (!target) return null;
                    return (
                      <button
                        key={revealedId}
                        onClick={(event) => handleOpen(revealedId, event)}
                        style={{
                          fontFamily: target.nodeType === "main" ? SERIF : MONO,
                          fontSize: target.nodeType === "main" ? 17 : 12,
                          lineHeight: target.nodeType === "main" ? "20px" : "16px",
                          color: target.nodeType === "main" ? T.ink : T.text,
                          background: "none",
                          border: "none",
                          padding: 0,
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        {target.label}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </main>
  );
}
