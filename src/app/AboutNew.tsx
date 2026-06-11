import { useEffect, useMemo, useRef, useState } from "react";
import TopNav from "./components/TopNav";

const FONT_SERIF = "'az-serif', serif";
const FONT_SANS = "'az-sans', sans-serif";

type Lang = "de" | "en";

type MapNode = {
  id: string;
  img: string;
  cx: number;
  top: number;
  w: number;
  h: number;
  main: boolean;
  label: { de: string; en: string };
  body?: { de: string; en: string };
  reveals?: string[];
};

const NODES: MapNode[] = [
  {
    id: "denken-schreiben",
    img: "/denkenschreiben.png",
    cx: 560,
    top: 160,
    w: 290,
    h: 190,
    main: true,
    label: { de: "Die Spannung\nzwischen Denken & Schreiben", en: "The tension\nbetween thinking & writing" },
    body: {
      de: "Denken ist flüchtig und sprunghaft, Schreiben ist langsam und linear. In der Übersetzung vom Gedanken zum Wort geht etwas verloren, und etwas Neues entsteht. Hier beginnt meine Frage: Wie verändert das Schreiben unser Denken?",
      en: "Thinking is fleeting and associative; writing is slow and linear. In the translation from thought to word something is lost, and something new appears. This is where my question begins: how does writing change the way we think?",
    },
    reveals: ["denken-sichtbar"],
  },
  {
    id: "denken-sichtbar",
    img: "/denkenvisualisieren.png",
    cx: 517,
    top: 316,
    w: 277,
    h: 178,
    main: true,
    label: { de: "Wie Denken\nsichtbar machen?", en: "How can thinking\nbe made visible?" },
    body: {
      de: "Mich interessiert nicht nur der Inhalt von Gedanken, sondern ihre Bewegung: Wie sie auftauchen, kreisen, verschwinden, sich überlagern. Das Projekt versucht, diese Bewegungen in Schreibsituationen erfahrbar zu machen.",
      en: "I am not only interested in the content of thoughts, but in their movement: how they appear, circle, disappear, and overlap. The project tries to make these movements tangible through writing situations.",
    },
    reveals: ["medium-formt", "poesie", "automatic-writing", "stream", "tippen-hand"],
  },
  {
    id: "medium-formt",
    img: "/typewriter.png",
    cx: 560,
    top: 556,
    w: 330,
    h: 185,
    main: true,
    label: { de: "Das Medium formt\nDenken & Schreiben", en: "The medium shapes\nthinking & writing" },
    body: {
      de: "Nicht nur Methoden formen das Schreiben, sondern das Werkzeug selbst. Vom Bleistift über die Schreibmaschine bis zum Texteditor schreibt jedes Werkzeug mit und prägt, was und wie wir denken.",
      en: "It is not only methods that shape writing, but the tool itself. From pencil to typewriter to text editor, every tool writes along, shaping what and how we think.",
    },
    reveals: ["sprache-schrift", "regeln-digital"],
  },
  {
    id: "regeln-digital",
    img: "/digitaltools.png",
    cx: 466,
    top: 1098,
    w: 142,
    h: 124,
    main: true,
    label: { de: "Die Regeln digitaler\nSchreibwerkzeuge", en: "The rules of digital\nwriting tools" },
    body: {
      de: "Digitale Schreibtools haben unsichtbare Regeln: der blinkende Cursor, die Rückgängig-Funktion, die Autokorrektur, die leere Seite. Wir halten sie für selbstverständlich, dabei lenken sie unser Schreiben in feste Bahnen.",
      en: "Digital writing tools have invisible rules: the blinking cursor, undo, autocorrect, the blank page. We take them for granted, yet they steer our writing into fixed paths.",
    },
    reveals: ["xerox", "regeln-brechen"],
  },
  {
    id: "regeln-brechen",
    img: "/breakingrules.png",
    cx: 675,
    top: 1297,
    w: 214,
    h: 157,
    main: true,
    label: { de: "Regeln brechen", en: "Breaking rules" },
    body: {
      de: "Was passiert, wenn man diese Regeln bewusst bricht? Wenn man nicht löschen, nicht anhalten oder nicht sehen kann, was man schreibt? Genau hier setzen meine Experimente an. Jedes verändert eine Regel und beobachtet, was mit dem Denken geschieht.",
      en: "What happens when we break these rules on purpose? When you cannot delete, cannot stop, or cannot see what you write? This is where my experiments begin. Each changes one rule and watches what happens to thinking.",
    },
    reveals: ["create-own"],
  },
  {
    id: "create-own",
    img: "/Tool.png",
    cx: 355,
    top: 1594,
    w: 168,
    h: 146,
    main: true,
    label: { de: "Create your own", en: "Create your own" },
    body: {
      de: "Am Ende wird das Projekt selbst zu einem Werkzeug. Man kann Regeln verändern, kombinieren und eigene Schreibtools erstellen, um neue Formen des Schreibens und Denkens auszuprobieren.",
      en: "In the end, the project becomes a tool itself. You can change and combine rules, then create your own writing tools to explore new forms of writing and thinking.",
    },
  },

  { id: "poesie", img: "/concrete_Poetry.png", cx: 280, top: 352, w: 165, h: 111, main: false, label: { de: "Konkrete Poesie", en: "Concrete Poetry" }, body: { de: "In der konkreten Poesie wird die Anordnung der Worte im Raum selbst zur Bedeutung. Nicht nur was dasteht zählt, sondern wie es aussieht. Das Schriftbild macht das Denken sichtbar.", en: "In concrete poetry the arrangement of words in space becomes meaning itself. Not only what is written matters but how it looks. The visual form makes thinking visible." } },
  { id: "automatic-writing", img: "/automatic_Writing.png", cx: 838, top: 307, w: 87, h: 100, main: false, label: { de: "Automatisches Schreiben", en: "Automatic Writing" }, body: { de: "Beim automatischen Schreiben wird Kontrolle gelockert. Sprache soll schneller erscheinen, als sie bewusst geordnet werden kann.", en: "In automatic writing, control is loosened. Language is allowed to appear faster than it can be consciously ordered." } },
  { id: "stream", img: "/firstwriting.png", cx: 310, top: 660, w: 180, h: 115, main: false, label: { de: "Stream of Consciousness", en: "Stream of Consciousness" }, body: { de: "Der Bewusstseinsstrom bei Woolf und Joyce bildet das Denken in seiner ungeordneten, assoziativen Form ab, ohne es nachträglich zu glätten.", en: "The stream of consciousness in Woolf and Joyce renders thinking in its disordered, associative form, without smoothing it out afterwards." } },
  { id: "tippen-hand", img: "/firstwriting.png", cx: 265, top: 786, w: 170, h: 122, main: false, label: { de: "Tippen & Handschrift", en: "Typing & handwriting" }, body: { de: "Handschrift, Tippen und digitale Interfaces erzeugen unterschiedliche Geschwindigkeiten, Widerstände und Formen von Aufmerksamkeit.", en: "Handwriting, typing, and digital interfaces create different speeds, frictions, and forms of attention." } },
  { id: "sprache-schrift", img: "/firstwriting.png", cx: 872, top: 639, w: 171, h: 128, main: false, label: { de: "Einfluss von Sprache und\nSchrift auf das Denken", en: "Influence of language\nand script on thought" }, body: { de: "Sprache ist nicht nur Ausdruck von Denken. Sie gibt Gedanken eine Form, die zurückwirkt.", en: "Language is not only an expression of thought. It gives thought a form that acts back on it." } },
  { id: "xerox", img: "/UI.png", cx: 848, top: 1055, w: 166, h: 120, main: false, label: { de: "Xerox, Word, Google Docs", en: "Xerox, Word, Google Docs" }, body: { de: "Viele heutige Schreibinterfaces basieren auf alten Paradigmen: Seite, Cursor, Menüleiste, Rückgängig. Gerade deshalb wirken ihre Regeln so unsichtbar.", en: "Many writing interfaces still rely on old paradigms: page, cursor, menu bar, undo. That is why their rules often feel invisible." } },
];

function getInitialLang(): Lang {
  if (typeof window === "undefined") return "en";
  return (localStorage.getItem("appLang") as Lang) || "en";
}

function getInitialDark() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("appTheme") === "dark";
}

function NodeCard({ node, selected, visible, onClick, lang, dark }: { node: MapNode; selected: boolean; visible: boolean; onClick: () => void; lang: Lang; dark: boolean }) {
  const text = node.label[lang];
  const border = dark ? "rgba(240,232,220,0.24)" : "#a4a4a4";
  const bg = dark ? "rgba(37,35,33,0.86)" : "rgba(255,253,250,0.62)";
  return (
    <button
      onClick={onClick}
      style={{
        position: "absolute",
        left: node.cx - node.w / 2,
        top: node.top,
        width: node.w,
        minHeight: node.h,
        background: bg,
        border: `1px dashed ${selected ? (dark ? "rgba(240,232,220,0.75)" : "#555") : border}`,
        borderRadius: node.main ? 22 : 8,
        boxSizing: "border-box",
        opacity: visible ? 1 : 0,
        transform: `translateY(${visible ? 0 : 18}px) scale(${visible ? 1 : 0.98})`,
        transition: "opacity 360ms ease, transform 360ms ease, border-color 160ms ease, box-shadow 160ms ease",
        cursor: "pointer",
        outline: "none",
        color: dark ? "#f0e8dc" : "#555",
        fontFamily: FONT_SANS,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: node.main ? 13 : 8,
        padding: node.main ? "22px 24px" : "12px 14px",
        boxShadow: selected ? (dark ? "0 16px 46px rgba(0,0,0,0.28)" : "0 18px 55px rgba(70,50,35,0.08)") : "none",
      }}
    >
      <img src={node.img} alt="" style={{ width: node.main ? Math.min(145, node.w * 0.48) : Math.min(112, node.w * 0.58), height: node.main ? 58 : 36, objectFit: "cover", borderRadius: 5, opacity: dark ? 0.85 : 0.75, filter: dark ? "grayscale(0.2) contrast(0.9)" : "grayscale(0.35) contrast(0.86)" }} />
      <span style={{ fontSize: node.main ? 22 : 13, lineHeight: 1.12, whiteSpace: "pre-line", textAlign: "center", letterSpacing: "-0.01em" }}>{text}</span>
    </button>
  );
}

function ConnectorLines({ revealed, dark }: { revealed: Set<string>; dark: boolean }) {
  const points = useMemo(() => Object.fromEntries(NODES.map((n) => [n.id, { x: n.cx, y: n.top + n.h / 2 }])) as Record<string, { x: number; y: number }>, []);
  const links: [string, string][] = [
    ["denken-schreiben", "denken-sichtbar"],
    ["denken-sichtbar", "medium-formt"],
    ["medium-formt", "regeln-digital"],
    ["regeln-digital", "regeln-brechen"],
    ["regeln-brechen", "create-own"],
    ["denken-sichtbar", "poesie"],
    ["denken-sichtbar", "automatic-writing"],
    ["denken-sichtbar", "stream"],
    ["denken-sichtbar", "tippen-hand"],
    ["medium-formt", "sprache-schrift"],
    ["regeln-digital", "xerox"],
  ];
  const stroke = dark ? "rgba(240,232,220,0.18)" : "rgba(164,164,164,0.58)";
  return (
    <svg style={{ position: "absolute", inset: 0, width: 1120, height: 1850, pointerEvents: "none" }}>
      {links.map(([a, b]) => {
        const show = revealed.has(a) && revealed.has(b);
        const pa = points[a];
        const pb = points[b];
        return (
          <line key={`${a}-${b}`} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} stroke={stroke} strokeWidth="1" strokeDasharray="5 10" style={{ opacity: show ? 1 : 0, transition: "opacity 300ms ease" }} />
        );
      })}
    </svg>
  );
}

function DetailPanel({ node, lang, dark }: { node: MapNode | null; lang: Lang; dark: boolean }) {
  if (!node) return null;
  return (
    <div style={{ width: 380, padding: "37px 30px", boxSizing: "border-box", color: dark ? "#f0e8dc" : "#302e2c" }}>
      <h2 style={{ margin: 0, fontFamily: FONT_SERIF, fontSize: 36, lineHeight: 1.08, fontWeight: 500 }}>{node.label[lang].replace(/\n/g, " ")}</h2>
      <p style={{ margin: "34px 0 0", fontFamily: FONT_SERIF, fontSize: 24, lineHeight: 1.28, color: dark ? "rgba(240,232,220,0.64)" : "#878787" }}>{node.body?.[lang] ?? ""}</p>
    </div>
  );
}

export default function AboutNew() {
  const [lang, setLang] = useState<Lang>(getInitialLang);
  const [dark, setDark] = useState(getInitialDark);
  const [selected, setSelected] = useState("denken-schreiben");
  const [revealed, setRevealed] = useState<Set<string>>(() => new Set(["denken-schreiben"]));
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => { localStorage.setItem("appLang", lang); }, [lang]);
  useEffect(() => { localStorage.setItem("appTheme", dark ? "dark" : "light"); }, [dark]);

  const selectedNode = NODES.find((n) => n.id === selected) ?? NODES[0];

  function selectNode(node: MapNode) {
    setSelected(node.id);
    setRevealed((current) => {
      const next = new Set(current);
      next.add(node.id);
      node.reveals?.forEach((id) => next.add(id));
      return next;
    });
  }

  const bg = dark ? "#1a1918" : "#fcf6ef";
  const divider = dark ? "rgba(240,232,220,0.16)" : "rgba(164,164,164,0.8)";

  return (
    <>
      <TopNav current="About" dark={dark} setDark={setDark} lang={lang} setLang={setLang} />
      <main ref={mainRef} style={{ width: "100vw", height: "100vh", overflow: "auto", background: bg, color: dark ? "#f0e8dc" : "#302e2c", position: "relative" }}>
        <style>{`html, body, #root { height: 100%; overflow: hidden; }`}</style>
        <div style={{ minWidth: 1500, minHeight: 1900, display: "flex" }}>
          {/* -- Left detail panel - closeable, progresses the story -------------- */}
          <aside style={{ position: "sticky", left: 0, top: 0, width: 400, height: "100vh", flexShrink: 0, background: bg, borderRight: `1px dashed ${divider}`, zIndex: 3 }}>
            <DetailPanel node={selectedNode} lang={lang} dark={dark} />
          </aside>

          <section style={{ flex: 1, position: "relative", minHeight: 1850, paddingTop: 32 }}>
            <h1 style={{ position: "sticky", top: 34, zIndex: 2, margin: "0 0 0 452px", fontFamily: FONT_SERIF, fontSize: 36, fontWeight: 500, lineHeight: 1.1, color: dark ? "#f0e8dc" : "#302e2c" }}>{lang === "de" ? "Über das Projekt" : "About the Project"}</h1>
            <div style={{ position: "relative", width: 1120, height: 1850, margin: "54px auto 0" }}>
              <ConnectorLines revealed={revealed} dark={dark} />
              {NODES.map((node) => (
                <NodeCard
                  key={node.id}
                  node={node}
                  selected={selected === node.id}
                  visible={revealed.has(node.id)}
                  onClick={() => selectNode(node)}
                  lang={lang}
                  dark={dark}
                />
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
