import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
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
      asideBg: "#252321", asideBody: "#a9a298", line: "rgba(240,232,220,0.4)",
    };
  }
  return {
    bg: "#fcf6ef", ink: "#302e2c", body: "#555555", dash: "#a4a4a4",
    asideBg: "#f9f1e8", asideBody: "#7c7c7c", line: "#a4a4a4",
  };
}

// ── Canvas + node layout (coordinates from the Figma research map) ────────────
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
  reveals?: string[];   // nodes that appear when this one is opened
};

const NODES: MapNode[] = [
  {
    id: "denken-schreiben", img: "/denkenschreiben.png", cx: 517, top: 0, w: 228, h: 93, main: true,
    label: { de: "Denken vs. Schreiben", en: "Thinking vs. Writing" },
    body: {
      de: "Denken ist flüchtig und sprunghaft, Schreiben ist langsam und linear. In der Übersetzung vom Gedanken zum Wort geht etwas verloren — und etwas Neues entsteht. Hier beginnt meine Frage: Wie verändert das Schreiben unser Denken?",
      en: "Thinking is fleeting and associative; writing is slow and linear. In the translation from thought to word something is lost — and something new appears. This is where my question begins: how does writing change the way we think?",
    },
    reveals: ["denken-sichtbar"],
  },
  {
    id: "denken-sichtbar", img: "/denkenvisualisieren.png", cx: 517, top: 316, w: 277, h: 178, main: true,
    label: { de: "Denken sichtbar machen", en: "Making thinking visible" },
    body: {
      de: "Wenn Schreiben das Denken formt, lässt sich der Denkprozess dann sichtbar machen? Schriftsteller und Künstler haben genau das versucht und Methoden entwickelt, um den ungefilterten Strom der Gedanken festzuhalten.",
      en: "If writing shapes thought, can the process of thinking be made visible? Writers and artists tried exactly that, developing methods to capture the unfiltered stream of thought.",
    },
    reveals: ["concrete-poetry", "automatic-writing", "stream", "einfluss-werkzeug"],
  },
  {
    id: "einfluss-werkzeug", img: "/typewriter.png", cx: 517, top: 688, w: 178, h: 140, main: true,
    label: { de: "Der Einfluss des Werkzeugs\nauf Denken & Schreiben", en: "The tool's influence\non thinking & writing" },
    body: {
      de: "Nicht nur Methoden formen das Schreiben, sondern das Werkzeug selbst. Vom Bleistift über die Schreibmaschine bis zum Texteditor — jedes Werkzeug schreibt mit und prägt, was und wie wir denken.",
      en: "It is not only methods that shape writing, but the tool itself. From pencil to typewriter to text editor — every tool writes along, shaping what and how we think.",
    },
    reveals: ["sprache-schrift", "regeln-digital"],
  },
  {
    id: "regeln-digital", img: "/digitaltools.png", cx: 466, top: 1098, w: 142, h: 124, main: true,
    label: { de: "Die Regeln digitaler Schreibtools", en: "The rules of digital writing tools" },
    body: {
      de: "Digitale Schreibtools haben unsichtbare Regeln: der blinkende Cursor, die Rückgängig-Funktion, die Autokorrektur, die leere Seite. Wir halten sie für selbstverständlich — dabei lenken sie unser Schreiben in feste Bahnen.",
      en: "Digital writing tools have invisible rules: the blinking cursor, undo, autocorrect, the blank page. We take them for granted — yet they steer our writing into fixed paths.",
    },
    reveals: ["xerox", "regeln-brechen"],
  },
  {
    id: "regeln-brechen", img: "/breakingrules.png", cx: 675, top: 1297, w: 214, h: 157, main: true,
    label: { de: "Regeln brechen", en: "Breaking rules" },
    body: {
      de: "Was passiert, wenn man diese Regeln bewusst bricht? Wenn man nicht löschen, nicht anhalten oder nicht sehen kann, was man schreibt? Genau hier setzen meine Experimente an — jedes verändert eine Regel und beobachtet, was mit dem Denken geschieht.",
      en: "What happens when we break these rules on purpose? When you cannot delete, cannot stop, or cannot see what you write? This is where my experiments begin — each changes one rule and watches what happens to thinking.",
    },
    reveals: ["create-own"],
  },
  {
    id: "create-own", img: "/Tool.png", cx: 355, top: 1594, w: 168, h: 146, main: true,
    label: { de: "Create your own", en: "Create your own" },
    body: {
      de: "Am Ende steht eine Einladung: Bau dein eigenes Schreibwerkzeug. Verändere die Regeln und beobachte, wie sich dein Denken und Schreiben mit ihnen verändern.",
      en: "At the end stands an invitation: build your own writing tool. Change the rules and watch how your thinking and writing change with them.",
    },
  },

  // ── Side / context nodes ──
  {
    id: "concrete-poetry", img: "/concrete_Poetry.png", cx: 134, top: 325, w: 149, h: 104, main: false,
    label: { de: "Concrete Poetry", en: "Concrete Poetry" },
    body: {
      de: "In der konkreten Poesie wird die Anordnung der Worte im Raum selbst zur Bedeutung. Nicht nur was dasteht zählt, sondern wie es aussieht — das Schriftbild macht das Denken sichtbar.",
      en: "In concrete poetry the arrangement of words in space becomes meaning itself. Not only what is written matters but how it looks — the visual form makes thinking visible.",
    },
  },
  {
    id: "automatic-writing", img: "/automatic_Writing.png", cx: 838, top: 307, w: 87, h: 100, main: false,
    label: { de: "Automatic Writing", en: "Automatic Writing" },
    body: {
      de: "Beim automatischen Schreiben schreibt die Hand ohne bewusste Kontrolle. Die Surrealisten nutzten es, um das Unterbewusste direkt und ungefiltert aufs Papier zu bringen.",
      en: "In automatic writing the hand writes without conscious control. The Surrealists used it to let the unconscious flow straight onto the page.",
    },
  },
  {
    id: "stream", img: "/automaticwriting.png", cx: 90, top: 626, w: 133, h: 85, main: false,
    label: { de: "Stream of Consciousness", en: "Stream of Consciousness" },
    body: {
      de: "Der Bewusstseinsstrom bei Woolf und Joyce bildet das Denken in seiner ungeordneten, assoziativen Form ab — ohne es nachträglich zu glätten.",
      en: "The stream of consciousness in Woolf and Joyce renders thinking in its disordered, associative form — without smoothing it out afterwards.",
    },
  },
  {
    id: "sprache-schrift", img: "/firstwriting.png", cx: 872, top: 639, w: 171, h: 128, main: false,
    label: { de: "Einfluss von Sprache und\nSchrift auf das Denken", en: "Influence of language\nand script on thinking" },
    body: {
      de: "Schon die Erfindung der Schrift veränderte das Denken grundlegend. Sprache und Schriftsystem bestimmen mit, welche Gedanken überhaupt denkbar werden.",
      en: "The very invention of writing changed thinking fundamentally. Language and writing system help determine which thoughts become thinkable at all.",
    },
  },
  {
    id: "xerox", img: "/UI.png", cx: 121, top: 987, w: 102, h: 95, main: false,
    label: { de: "Xerox Parc", en: "Xerox Parc" },
    body: {
      de: "Bei Xerox PARC entstand in den 1970ern die grafische Benutzeroberfläche. Viele Konventionen heutiger Schreibprogramme gehen auf diese frühen Entscheidungen zurück.",
      en: "At Xerox PARC in the 1970s the graphical user interface was born. Many conventions of today's writing software go back to those early decisions.",
    },
  },
];

const NODE_MAP = new Map(NODES.map((n) => [n.id, n]));

// parent → child connectors, derived from `reveals`
const EDGES: [string, string][] = NODES.flatMap((n) =>
  (n.reveals ?? []).map((to) => [n.id, to] as [string, string])
);

function centre(n: MapNode) {
  return { x: n.cx, y: n.top + n.h / 2 };
}

// Point on a node's (padded) bounding box, along the line toward (tx, ty).
// Keeps the connector off the illustration itself.
function edgePoint(n: MapNode, tx: number, ty: number, pad: number) {
  const c = centre(n);
  const hw = n.w / 2 + pad;
  const hh = n.h / 2 + pad;
  const dx = tx - c.x;
  const dy = ty - c.y;
  if (dx === 0 && dy === 0) return c;
  const sx = dx !== 0 ? hw / Math.abs(dx) : Infinity;
  const sy = dy !== 0 ? hh / Math.abs(dy) : Infinity;
  const s = Math.min(sx, sy);
  return { x: c.x + dx * s, y: c.y + dy * s };
}

// Straight dashed connector between two node image edges (no curve, like Figma).
function connectorPath(a: MapNode, b: MapNode) {
  const ca = centre(a);
  const cb = centre(b);
  const p1 = edgePoint(a, cb.x, cb.y, 10);
  const p2 = edgePoint(b, ca.x, ca.y, 10);
  return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`;
}

export default function AboutNew() {
  const [dark, setDark] = useState<boolean>(() => localStorage.getItem("appTheme") === "dark");
  const [lang, setLang] = useState<"de" | "en">(() => (localStorage.getItem("appLang") as "de" | "en") ?? "de");
  const [opened, setOpened] = useState<Set<string>>(() => new Set());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const T = getAboutTheme(dark);
  const DE = lang === "de";

  const handleSetDark = (fn: (d: boolean) => boolean) => {
    setDark((d) => { const next = fn(d); localStorage.setItem("appTheme", next ? "dark" : "light"); return next; });
  };

  // Visible = the first node + everything revealed by an opened node.
  const visibleIds = useMemo(() => {
    const ids = new Set<string>([NODES[0].id]);
    opened.forEach((id) => {
      ids.add(id);
      NODE_MAP.get(id)?.reveals?.forEach((r) => ids.add(r));
    });
    return ids;
  }, [opened]);

  const visibleEdges = useMemo(
    () => EDGES.filter(([a, b]) => visibleIds.has(a) && visibleIds.has(b)),
    [visibleIds]
  );

  const active = activeId ? NODE_MAP.get(activeId) ?? null : null;
  const activeReveals = (active?.reveals ?? []).map((id) => NODE_MAP.get(id)!).filter(Boolean);

  const openNode = (id: string) => {
    setActiveId(id);
    setOpened((prev) => new Set([...prev, id]));
    setPanelOpen(true);
  };

  const imgMix: React.CSSProperties["mixBlendMode"] = dark ? "screen" : "multiply";
  const imgFilt = dark ? "invert(1) brightness(1.5) contrast(0.85)" : "none";

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
        .aboutmap-next:hover { text-decoration: underline; text-decoration-style: dashed; text-underline-offset: 4px; }
      `}</style>

      <TopNav current="About" dark={dark} setDark={handleSetDark} lang={lang} setLang={setLang} />

      {/* ── Left detail panel — closeable, progresses the story ─────────────── */}
      <AnimatePresence>
        {panelOpen && active && (
          <motion.aside
            key="about-panel"
            initial={{ x: -340, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -340, opacity: 0 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            style={{
              position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 30,
              width: 321, boxSizing: "border-box",
              background: T.asideBg, borderRight: `1px dashed ${T.dash}`,
              padding: "24px 24px 32px", display: "flex", flexDirection: "column", gap: 16,
              overflowY: "auto",
            }}
          >
            <button
              onClick={() => setPanelOpen(false)}
              aria-label="Close"
              style={{
                position: "absolute", top: 14, right: 14,
                width: 28, height: 28, borderRadius: 4,
                border: `1px dashed ${T.dash}`, background: "transparent",
                cursor: "pointer", outline: "none", color: T.body,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontFamily: SANS, fontSize: 17, lineHeight: 1,
              }}
            >
              ×
            </button>

            <div style={{ width: "100%", height: 167, display: "flex", alignItems: "center", justifyContent: "center", isolation: "isolate", backgroundColor: T.asideBg }}>
              <img
                src={active.img}
                alt=""
                style={{ maxWidth: "100%", maxHeight: 167, objectFit: "contain", mixBlendMode: imgMix, filter: imgFilt }}
              />
            </div>

            <p style={{ margin: 0, fontFamily: COND, fontSize: 28, lineHeight: 1.1, color: T.ink, whiteSpace: "pre-line" }}>
              {DE ? active.label.de : active.label.en}
            </p>

            <div style={{ height: 0, borderTop: `1px dashed ${T.dash}` }} />

            <p style={{ margin: 0, fontFamily: SANS, fontWeight: 300, fontSize: 15, lineHeight: 1.55, letterSpacing: "-0.1px", color: T.asideBody, whiteSpace: "pre-wrap" }}>
              {DE ? active.body.de : active.body.en}
            </p>

            {activeReveals.length > 0 && (
              <>
                <div style={{ height: 0, borderTop: `1px dashed ${T.dash}` }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <span style={{ fontFamily: SANS, fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: T.body, opacity: 0.7 }}>
                    {DE ? "Weiter zu" : "Continue to"}
                  </span>
                  {activeReveals.map((r) => (
                    <button
                      key={r.id}
                      className="aboutmap-next"
                      onClick={() => openNode(r.id)}
                      style={{
                        textAlign: "left", background: "none", border: "none", padding: 0, cursor: "pointer",
                        fontFamily: COND, fontSize: r.main ? 20 : 16, lineHeight: 1.15, color: T.ink, whiteSpace: "pre-line",
                      }}
                    >
                      {DE ? r.label.de : r.label.en}
                    </button>
                  ))}
                </div>
              </>
            )}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* ── Scrollable mind-map canvas ──────────────────────────────────────── */}
      <div className="aboutmap-scroll" style={{ position: "absolute", inset: 0, overflowX: "hidden", overflowY: "auto" }}>
        <div style={{ display: "flex", justifyContent: "center", paddingLeft: 321, paddingTop: 80, paddingBottom: 160 }}>
          <div style={{ position: "relative", width: CANVAS_W, height: CANVAS_H }}>
            <svg width={CANVAS_W} height={CANVAS_H} style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "visible" }}>
              <AnimatePresence>
                {visibleEdges.map(([aId, bId]) => {
                  const a = NODE_MAP.get(aId)!;
                  const b = NODE_MAP.get(bId)!;
                  return (
                    <motion.path
                      key={`${aId}->${bId}`}
                      d={connectorPath(a, b)}
                      fill="none"
                      stroke={T.line}
                      strokeWidth={1.2}
                      strokeDasharray="4 7"
                      strokeLinecap="round"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.5, ease: "easeInOut", delay: 0.12 }}
                    />
                  );
                })}
              </AnimatePresence>
            </svg>

            <AnimatePresence>
              {NODES.filter((n) => visibleIds.has(n.id)).map((n) => {
                const isActive = n.id === activeId;
                return (
                  <motion.button
                    key={n.id}
                    className="aboutmap-node"
                    initial={{ opacity: 0, scale: 0.92, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    onClick={() => openNode(n.id)}
                    style={{
                      position: "absolute", left: n.cx, top: n.top,
                      transform: "translateX(-50%)",
                      display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
                    }}
                  >
                    <div style={{ isolation: "isolate", backgroundColor: T.bg, width: n.w, height: n.h, flexShrink: 0 }}>
                      <img
                        src={n.img}
                        alt=""
                        style={{ width: "100%", height: "100%", objectFit: "contain", display: "block", pointerEvents: "none", mixBlendMode: imgMix, filter: imgFilt }}
                      />
                    </div>
                    <span
                      className="aboutmap-label"
                      style={{
                        fontFamily: COND, fontSize: n.main ? 24 : 18, lineHeight: 1.15, color: T.ink,
                        textAlign: "center", whiteSpace: "pre",
                        textDecoration: isActive ? "underline" : "none",
                        textDecorationStyle: "dashed", textUnderlineOffset: 5,
                      }}
                    >
                      {DE ? n.label.de : n.label.en}
                    </span>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </main>
  );
}
