import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router";

const BG = "#fcf6ef";
const PAPER = "#f9f1e8";
const PAPER_DARK = "#f3ebe0";
const INK = "#302e2c";
const TEXT = "#555555";
const MUTED = "#8f8f89";
const DASH = "#a4a4a4";
const SOFT = "rgba(164,164,164,0.42)";
const DOT_GRID = "radial-gradient(circle, rgba(164,164,164,0.64) 1px, transparent 1.2px)";
const SERIF = "'freight-text-pro', 'EB Garamond', Georgia, serif";
const SANS = "'general-sans', 'Space Grotesk', sans-serif";
const MONO = "'Courier Prime', 'Courier New', monospace";

const chapters = [
  {
    id: "spark",
    number: "01",
    title: "Der Anfang: Gedanken benehmen sich nicht linear",
    label: "Meditation",
    date: "Tagebuchnotiz: irgendwo zwischen Stille und Browser-Tab 47",
    short: "Ich wollte nicht noch ein Schreibtool bauen. Ich wollte wissen, warum Schreiben sich manchmal so ordentlich anfühlt, obwohl Denken es nie ist.",
    detail: [
      "Beim Meditieren tauchen Gedanken nicht als fertige Sätze auf. Sie kommen als Fetzen, Bilder, Störungen, Wiederholungen.",
      "Dann öffnet man ein Schreibprogramm und plötzlich soll alles links anfangen, rechts weitergehen und brav untereinander stehen.",
      "Die erste Frage war deshalb nicht: Wie schreibe ich besser? Sondern: Welche Regeln zwingt mir das Interface eigentlich auf?",
    ],
  },
  {
    id: "research",
    number: "02",
    title: "Die Suche: alte Schreibmaschinen, Poesie, Interfaces",
    label: "Recherche",
    date: "Fundstück-Sammlung: Xerox, konkrete Poesie, automatisches Schreiben",
    short: "Die Regeln waren nicht natürlich. Sie wurden irgendwann erfunden. Und sobald man das merkt, wird jedes Textfeld verdächtig spannend.",
    detail: [
      "Lineare Zeilen, sofortiges Feedback, perfekte Löschbarkeit, volle Kontrolle: Das sind Designentscheidungen.",
      "In der Recherche wurden Schreibmaschinen, GUI-Geschichte, konkrete Poesie und Stream of Consciousness zu einer merkwürdigen Familienfeier.",
      "Alle zeigten auf dieselbe Sache: Das Medium ist nicht nur ein Behälter für Gedanken. Es mischt mit.",
    ],
  },
  {
    id: "experiments",
    number: "03",
    title: "Die Experimente: Schreibregeln kaputtspielen",
    label: "Prototypen",
    date: "Laborbuch: viel kaputt, einiges schön kaputt",
    short: "Jedes Experiment nimmt eine Standardregel und dreht daran: Zeit, Sichtbarkeit, Korrektur, Stabilität, Position, Look & Feel.",
    detail: [
      "Was passiert, wenn Pausen sichtbar werden? Wenn Löschen Spuren hinterlässt? Wenn Wörter nicht auf Linien bleiben?",
      "Die Tools sind keine Featuresammlung, sondern kleine Versuchsräume. Man schreibt darin und merkt am eigenen Denken, dass etwas anders ist.",
      "Aus dieser Serie wurde klar: Die spannendste Form ist nicht ein einzelnes Tool, sondern ein System, in dem man Regeln kombinieren kann.",
    ],
  },
  {
    id: "tool",
    number: "04",
    title: "Das Tool: eigene Schreibmaschinen für Gedanken bauen",
    label: "Parameter",
    date: "Bauplan: aus Experiments wird Playground",
    short: "Das Projekt wird zur Einladung: Bau dir dein eigenes Schreibinterface, gib ihm einen Namen, speichere es, teile es.",
    detail: [
      "Der wichtigste Sprung: Nicht ich entscheide, welche Regel spannend ist. Nutzerinnen und Nutzer können selbst Regeln mischen.",
      "Das Tool macht sichtbar, dass Interfaces aus veränderbaren Entscheidungen bestehen: Zeit, Sichtbarkeit, Korrektur, Stabilität, Position und Stimmung.",
      "Damit wird Forschung zu etwas Spielbarem. Man liest nicht nur über das Medium, man verändert es und schreibt darin.",
    ],
  },
  {
    id: "now",
    number: "05",
    title: "Heute: eine Landkarte für das, was Schreiben auslöst",
    label: "Shaping Thought",
    date: "Aktueller Stand: noch lebendig, noch wackelig, genau deshalb gut",
    short: "Shaping Thought ist kein Produktivitäts-Tool. Es ist eine Sammlung von seltsamen Schreibsituationen, die Denken anders hörbar machen.",
    detail: [
      "Manche Tools erzeugen Druck. Manche machen Spuren sichtbar. Manche geben Kontrolle ab. Manche fühlen sich wie eine kleine mentale Wetterlage an.",
      "Die About-Seite soll deshalb keine trockene Erklärung sein, sondern eine Reise durch diese Entscheidungen.",
      "Kurz gesagt: Schreibtools formen nicht nur Texte. Sie formen die Art, wie Gedanken auftauchen, bleiben, verschwinden und sich trauen.",
    ],
  },
] as const;

type Chapter = (typeof chapters)[number];

const nodePositions: Record<Chapter["id"], { x: number; y: number }> = {
  spark: { x: 132, y: 335 },
  research: { x: 330, y: 225 },
  experiments: { x: 570, y: 345 },
  tool: { x: 820, y: 250 },
  now: { x: 1058, y: 365 },
};

const rules = [
  { title: "Zeit", text: "Pausen werden sichtbar. Schreiben bekommt Tempo." },
  { title: "Sichtbarkeit", text: "Text kann verschwinden, warten oder erst später auftauchen." },
  { title: "Korrektur", text: "Löschen ist nicht neutral. Jede Entscheidung kann Spuren hinterlassen." },
  { title: "Stabilität", text: "Wörter dürfen driften, verblassen oder sich neu sortieren." },
  { title: "Position", text: "Gedanken müssen nicht in einer Zeile wohnen." },
  { title: "Look & Feel", text: "Stimmung verändert, wie mutig, ruhig oder vorsichtig man schreibt." },
];

const quickCards = [
  ["Was?", "Ein Set experimenteller Schreibinterfaces und ein Tool, mit dem man eigene Schreibregeln kombinieren kann."],
  ["Warum?", "Weil normale Textfelder so selbstverständlich wirken, dass man ihre Regeln kaum noch bemerkt."],
  ["Wie?", "Durch kleine Störungen: Text verschwindet, Pausen werden sichtbar, Korrekturen bleiben, Linien brechen aus."],
] as const;

function DottedButton({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        minHeight: 34,
        padding: "0 14px",
        border: `1px dashed ${DASH}`,
        borderRadius: 4,
        background: "rgba(249,241,232,0.68)",
        color: TEXT,
        fontFamily: SANS,
        fontSize: 14,
        cursor: "pointer",
        outline: "none",
      }}
    >
      {children}
    </button>
  );
}

function ChapterNode({ chapter, active, onClick }: { chapter: Chapter; active: boolean; onClick: () => void }) {
  const pos = nodePositions[chapter.id];

  return (
    <button
      onClick={onClick}
      className="about-node"
      style={{
        position: "absolute",
        left: pos.x,
        top: pos.y,
        width: chapter.id === "experiments" ? 188 : 164,
        minHeight: 82,
        transform: "translate(-50%, -50%)",
        border: `1px dashed ${active ? INK : DASH}`,
        borderRadius: chapter.id === "spark" || chapter.id === "now" ? 999 : 8,
        background: active ? PAPER_DARK : "rgba(249,241,232,0.74)",
        color: active ? INK : TEXT,
        padding: "13px 15px",
        textAlign: "center",
        cursor: "pointer",
        boxShadow: active ? "0 18px 55px rgba(48,46,44,0.08)" : "none",
        transition: "border-color 160ms ease, background 160ms ease, transform 160ms ease, box-shadow 160ms ease",
      }}
    >
      <span style={{ display: "block", fontFamily: MONO, fontSize: 10, color: MUTED }}>{chapter.number}</span>
      <span style={{ display: "block", marginTop: 6, fontFamily: SERIF, fontSize: 20, lineHeight: "22px" }}>{chapter.label}</span>
    </button>
  );
}

function RuleNode({ title, text }: { title: string; text: string }) {
  return (
    <div
      className="about-rule-node"
      style={{
        border: `1px dashed ${DASH}`,
        borderRadius: 8,
        background: "rgba(249,241,232,0.68)",
        padding: "12px 14px",
        minHeight: 86,
      }}
    >
      <p style={{ margin: 0, fontFamily: SERIF, fontSize: 22, lineHeight: "24px", color: INK }}>{title}</p>
      <p style={{ margin: "8px 0 0", fontFamily: SANS, fontSize: 12, lineHeight: "17px", color: TEXT }}>{text}</p>
    </div>
  );
}

export default function AboutNew() {
  const navigate = useNavigate();
  const [activeId, setActiveId] = useState<Chapter["id"]>(chapters[0].id);
  const active = useMemo(() => chapters.find((chapter) => chapter.id === activeId) ?? chapters[0], [activeId]);

  return (
    <main
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: BG,
        backgroundImage: DOT_GRID,
        backgroundSize: "42px 42px",
        color: TEXT,
        fontFamily: SANS,
      }}
    >
      <style>{`
        html, body, #root { height: 100%; overflow: hidden; background: ${BG}; }
        .about-node:hover { transform: translate(-50%, -54%) !important; border-color: ${INK} !important; }
        .about-rule-node { transition: transform 160ms ease, background 160ms ease; }
        .about-rule-node:hover { transform: translateY(-3px); background: rgba(243,235,224,0.76) !important; }
        .about-line { animation: aboutDash 18s linear infinite; }
        .about-small-dot { animation: aboutPulse 3.8s ease-in-out infinite; }
        @keyframes aboutDash { to { stroke-dashoffset: -180; } }
        @keyframes aboutPulse { 0%, 100% { opacity: 0.28; transform: scale(0.92); } 50% { opacity: 0.9; transform: scale(1.08); } }
        @media (max-width: 1000px) {
          main { overflow: auto !important; height: auto !important; min-height: 100vh !important; }
          .about-shell { height: auto !important; min-height: 100vh !important; padding: 88px 22px 28px !important; grid-template-columns: 1fr !important; }
          .about-map { height: 660px !important; order: 2; }
          .about-map-canvas { transform: scale(0.76); transform-origin: top left; width: 1160px !important; }
          .about-side, .about-detail { min-height: auto !important; }
          .about-nav { padding: 20px !important; }
        }
      `}</style>

      <nav
        className="about-nav"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "26px 44px",
          pointerEvents: "none",
        }}
      >
        <div style={{ display: "flex", gap: 10, pointerEvents: "auto" }}>
          <DottedButton onClick={() => navigate("/")}>Zurück</DottedButton>
          <DottedButton onClick={() => navigate("/playgroundnew1")}>Playground</DottedButton>
        </div>
        <div style={{ display: "flex", gap: 10, pointerEvents: "auto" }}>
          <DottedButton onClick={() => navigate("/new")}>Tool bauen</DottedButton>
        </div>
      </nav>

      <section
        className="about-shell"
        style={{
          height: "100%",
          boxSizing: "border-box",
          padding: "94px 44px 34px",
          display: "grid",
          gridTemplateColumns: "300px minmax(520px, 1fr) 340px",
          gap: 22,
        }}
      >
        <aside
          className="about-side"
          style={{
            minHeight: 0,
            border: `1px dashed ${DASH}`,
            borderRadius: 10,
            background: "rgba(249,241,232,0.72)",
            padding: 22,
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <div>
            <p style={{ margin: 0, fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: "0.08em" }}>ABOUT THE PROJECT</p>
            <h1 style={{ margin: "14px 0 0", fontFamily: SERIF, color: INK, fontSize: 42, lineHeight: "44px", fontWeight: 400 }}>
              Eine Reise durch Schreibregeln, Gedankenwetter und kleine Interface-Unfälle.
            </h1>
            <p style={{ margin: "18px 0 0", fontFamily: SANS, color: TEXT, fontSize: 14, lineHeight: "22px" }}>
              Shaping Thought untersucht, wie digitale Schreibtools unser Denken mitformen. Nicht als trockene Theorie, sondern als begehbares Labor: anfassen, schreiben, scheitern, neu mischen.
            </p>
          </div>

          <div style={{ borderTop: `1px dashed ${DASH}`, paddingTop: 16 }}>
            <p style={{ margin: 0, fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: "0.08em" }}>IN EINEM SATZ</p>
            <p style={{ margin: "10px 0 0", fontFamily: SERIF, color: INK, fontSize: 25, lineHeight: "29px" }}>
              Es geht nicht darum, schneller zu schreiben. Es geht darum, zu spüren, welche Form das Schreiben dem Denken gibt.
            </p>
          </div>

          <div style={{ display: "grid", gap: 10, marginTop: "auto" }}>
            {quickCards.map(([title, text]) => (
              <div key={title} style={{ border: `1px dashed ${DASH}`, borderRadius: 8, padding: "12px 13px", background: "rgba(252,246,239,0.56)" }}>
                <p style={{ margin: 0, fontFamily: SERIF, color: INK, fontSize: 22 }}>{title}</p>
                <p style={{ margin: "6px 0 0", fontFamily: SANS, color: TEXT, fontSize: 12, lineHeight: "17px" }}>{text}</p>
              </div>
            ))}
          </div>
        </aside>

        <div
          className="about-map"
          style={{
            position: "relative",
            minHeight: 0,
            border: `1px dashed ${DASH}`,
            borderRadius: 10,
            background: "rgba(252,246,239,0.34)",
            overflow: "hidden",
          }}
        >
          <div className="about-map-canvas" style={{ position: "relative", width: 1160, height: "100%", minHeight: 670, margin: "0 auto" }}>
            <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
              <path className="about-line" d="M132 335 C205 245 255 222 330 225 S476 349 570 345 S730 252 820 250 S985 350 1058 365" stroke={DASH} strokeWidth="1" strokeDasharray="6 8" fill="none" />
              <path className="about-line" d="M330 225 C330 420 448 530 620 545 C780 558 908 468 1058 365" stroke={SOFT} strokeWidth="1" strokeDasharray="4 10" fill="none" />
              <path d="M570 345 C555 438 506 500 430 570" stroke={SOFT} strokeWidth="1" strokeDasharray="4 8" fill="none" />
              <path d="M570 345 C665 470 748 515 865 575" stroke={SOFT} strokeWidth="1" strokeDasharray="4 8" fill="none" />
            </svg>

            <div style={{ position: "absolute", left: 42, top: 38 }}>
              <p style={{ margin: 0, fontFamily: MONO, color: MUTED, fontSize: 11, letterSpacing: "0.08em" }}>DIE REISE</p>
              <h2 style={{ margin: "8px 0 0", fontFamily: SERIF, color: INK, fontSize: 42, lineHeight: "44px", fontWeight: 400 }}>Tagebuch als Mindmap</h2>
              <p style={{ margin: "10px 0 0", maxWidth: 310, fontFamily: SANS, color: TEXT, fontSize: 13, lineHeight: "20px" }}>
                Klick dich durch die Stationen. Links steht der schnelle Weg, rechts die Notiz aus dem Maschinenraum.
              </p>
            </div>

            {chapters.map((chapter) => (
              <ChapterNode key={chapter.id} chapter={chapter} active={active.id === chapter.id} onClick={() => setActiveId(chapter.id)} />
            ))}

            <div className="about-small-dot" style={{ position: "absolute", left: 256, top: 468, width: 8, height: 8, borderRadius: 999, background: DASH }} />
            <div className="about-small-dot" style={{ position: "absolute", left: 690, top: 178, width: 6, height: 6, borderRadius: 999, background: DASH, animationDelay: "0.8s" }} />
            <div className="about-small-dot" style={{ position: "absolute", left: 960, top: 505, width: 7, height: 7, borderRadius: 999, background: DASH, animationDelay: "1.5s" }} />

            <div style={{ position: "absolute", left: 62, right: 62, bottom: 36 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 20, marginBottom: 14 }}>
                <div>
                  <p style={{ margin: 0, fontFamily: MONO, color: MUTED, fontSize: 11, letterSpacing: "0.08em" }}>DIE REGELN</p>
                  <h3 style={{ margin: "6px 0 0", fontFamily: SERIF, color: INK, fontSize: 32, lineHeight: "34px", fontWeight: 400 }}>Sechs Regler, viele Denkstimmungen</h3>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, minmax(0, 1fr))", gap: 10 }}>
                {rules.map((rule) => <RuleNode key={rule.title} {...rule} />)}
              </div>
            </div>
          </div>
        </div>

        <aside
          className="about-detail"
          style={{
            minHeight: 0,
            border: `1px dashed ${DASH}`,
            borderRadius: 10,
            background: "rgba(249,241,232,0.76)",
            padding: 22,
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
          }}
        >
          <p style={{ margin: 0, fontFamily: MONO, color: MUTED, fontSize: 11 }}>{active.number} / {active.label}</p>
          <h2 style={{ margin: "14px 0 0", fontFamily: SERIF, color: INK, fontWeight: 400, fontSize: 38, lineHeight: "40px" }}>{active.title}</h2>
          <p style={{ margin: "12px 0 0", fontFamily: MONO, color: MUTED, fontSize: 11, lineHeight: "17px" }}>{active.date}</p>
          <p style={{ margin: "22px 0 0", fontFamily: SANS, color: TEXT, fontSize: 15, lineHeight: "24px" }}>{active.short}</p>

          <div style={{ marginTop: 22, borderTop: `1px dashed ${DASH}`, paddingTop: 18, display: "grid", gap: 13 }}>
            {active.detail.map((paragraph) => (
              <p key={paragraph} style={{ margin: 0, fontFamily: MONO, color: TEXT, fontSize: 12, lineHeight: "20px" }}>{paragraph}</p>
            ))}
          </div>

          <div style={{ marginTop: "auto", paddingTop: 22, display: "flex", flexWrap: "wrap", gap: 10 }}>
            <DottedButton onClick={() => navigate("/playgroundnew1")}>Tools ansehen</DottedButton>
            <DottedButton onClick={() => navigate("/new")}>Eigenes Tool bauen</DottedButton>
          </div>
        </aside>
      </section>
    </main>
  );
}
