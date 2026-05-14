import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { useNavigate } from "react-router";

const BG = "#fcf6ef";
const PAPER = "#f9f1e8";
const PAPER_DARK = "#f3ebe0";
const INK = "#302e2c";
const TEXT = "#555555";
const MUTED = "#8f8f89";
const DASH = "#a4a4a4";
const SOFT = "rgba(164,164,164,0.35)";
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
    video: "uninvited-thoughts",
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
    video: "visible-corrections",
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
    video: "without-stopping",
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
    video: "off-the-grid",
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
    video: "in-a-spiral",
    short: "Shaping Thought ist kein Produktivitäts-Tool. Es ist eine Sammlung von seltsamen Schreibsituationen, die Denken anders hörbar machen.",
    detail: [
      "Manche Tools erzeugen Druck. Manche machen Spuren sichtbar. Manche geben Kontrolle ab. Manche fühlen sich wie eine kleine mentale Wetterlage an.",
      "Die About-Seite soll deshalb keine trockene Erklärung sein, sondern eine Reise durch diese Entscheidungen.",
      "Kurz gesagt: Schreibtools formen nicht nur Texte. Sie formen die Art, wie Gedanken auftauchen, bleiben, verschwinden und sich trauen.",
    ],
  },
] as const;

type Chapter = (typeof chapters)[number];

const rules = [
  { title: "Zeit", text: "Pausen werden sichtbar. Schreiben bekommt Tempo.", angle: "-7deg" },
  { title: "Sichtbarkeit", text: "Text kann verschwinden, warten oder erst später auftauchen.", angle: "5deg" },
  { title: "Korrektur", text: "Löschen ist nicht neutral. Jede Entscheidung kann Spuren hinterlassen.", angle: "-2deg" },
  { title: "Stabilität", text: "Wörter dürfen driften, verblassen oder sich neu sortieren.", angle: "6deg" },
  { title: "Position", text: "Gedanken müssen nicht in einer Zeile wohnen.", angle: "-5deg" },
  { title: "Look & Feel", text: "Stimmung verändert, wie mutig, ruhig oder vorsichtig man schreibt.", angle: "3deg" },
];

const previews = [
  { label: "...without stopping", video: "without-stopping", note: "Zeit läuft weiter" },
  { label: "...with visible corrections", video: "visible-corrections", note: "Fehler bleiben als Material" },
  { label: "...off the grid", video: "off-the-grid", note: "Linien werden verhandelbar" },
  { label: "...in a spiral", video: "in-a-spiral", note: "Vergangenheit wickelt sich ein" },
  { label: "...uninvited thoughts", video: "uninvited-thoughts", note: "Ablenkung wird Karte" },
  { label: "...blind & then witness", video: "blind-then-witness", note: "Schreiben wird Playback" },
];

function videoPath(video: string) {
  return `/Diplom-Projekt/videos/${video}.mp4`;
}

function VideoFrame({ video, title, note, style, shape = "rect", auto = false }: {
  video: string;
  title: string;
  note?: string;
  style?: CSSProperties;
  shape?: "rect" | "circle" | "ticket" | "oval" | "tilt";
  auto?: boolean;
}) {
  const clipPath = {
    rect: "inset(0 round 7px)",
    circle: "circle(49% at 50% 50%)",
    ticket: "polygon(0 0, 100% 5%, 96% 100%, 6% 94%)",
    oval: "ellipse(49% 45% at 50% 50%)",
    tilt: "polygon(4% 8%, 94% 0, 100% 88%, 8% 100%)",
  }[shape];

  return (
    <div
      className="about-video-frame"
      style={{
        position: "relative",
        overflow: "hidden",
        border: `1px dashed ${DASH}`,
        background: PAPER,
        clipPath,
        boxShadow: "0 24px 80px rgba(48,46,44,0.07)",
        ...style,
      }}
    >
      <video
        muted
        loop
        playsInline
        autoPlay={auto}
        preload="auto"
        onMouseEnter={(event) => event.currentTarget.play().catch(() => undefined)}
        onMouseLeave={(event) => {
          if (!auto) {
            event.currentTarget.pause();
            try { event.currentTarget.currentTime = 0; } catch { /* metadata may not be ready */ }
          }
        }}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: 0.92 }}
      >
        <source src={videoPath(video)} type="video/mp4" />
      </video>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(180deg, rgba(252,246,239,0.08), rgba(48,46,44,0.2))",
          pointerEvents: "none",
        }}
      />
      <div
        className="about-video-caption"
        style={{
          position: "absolute",
          left: 16,
          right: 16,
          bottom: 14,
          color: "#fffaf4",
          textShadow: "0 1px 14px rgba(0,0,0,0.28)",
        }}
      >
        <div style={{ fontFamily: SANS, fontSize: 14, lineHeight: 1.1 }}>{title}</div>
        {note && <div style={{ fontFamily: MONO, fontSize: 10, opacity: 0.82, marginTop: 5 }}>{note}</div>}
      </div>
    </div>
  );
}

function DottedButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        minHeight: 36,
        padding: "0 16px",
        border: `1px dashed ${DASH}`,
        borderRadius: 4,
        background: "rgba(249,241,232,0.62)",
        color: TEXT,
        fontFamily: SANS,
        fontSize: 14,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

function ChapterButton({ chapter, active, onClick }: { chapter: Chapter; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="about-chapter-button"
      style={{
        position: "relative",
        border: `1px dashed ${active ? INK : DASH}`,
        borderRadius: 8,
        background: active ? PAPER_DARK : "rgba(249,241,232,0.7)",
        padding: 16,
        textAlign: "left",
        color: active ? INK : TEXT,
        cursor: "pointer",
        display: "grid",
        gridTemplateColumns: "42px 1fr",
        gap: 12,
        minHeight: 96,
        transform: active ? "translateY(-2px)" : "none",
        transition: "border-color 140ms ease, transform 140ms ease, background 140ms ease",
      }}
    >
      <span style={{ fontFamily: MONO, fontSize: 11, color: MUTED }}>{chapter.number}</span>
      <span>
        <span style={{ display: "block", fontFamily: SANS, fontSize: 13, marginBottom: 6 }}>{chapter.label}</span>
        <span style={{ display: "block", fontFamily: SERIF, fontSize: 21, lineHeight: "24px" }}>{chapter.title}</span>
      </span>
    </button>
  );
}

function RuleCard({ title, text, angle }: { title: string; text: string; angle: string }) {
  return (
    <div
      className="about-rule-card"
      style={{
        minHeight: 148,
        border: `1px dashed ${DASH}`,
        borderRadius: 8,
        padding: 18,
        background: "rgba(249,241,232,0.72)",
        transform: `rotate(${angle})`,
        boxShadow: "0 18px 50px rgba(48,46,44,0.05)",
      }}
    >
      <p style={{ margin: 0, fontFamily: SERIF, color: INK, fontSize: 27, lineHeight: "30px" }}>{title}</p>
      <p style={{ margin: "12px 0 0", fontFamily: SANS, color: TEXT, fontSize: 14, lineHeight: "21px" }}>{text}</p>
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
        minHeight: "100vh",
        backgroundColor: BG,
        backgroundImage: DOT_GRID,
        backgroundSize: "42px 42px",
        color: TEXT,
        fontFamily: SANS,
        overflowX: "hidden",
      }}
    >
      <style>{`
        html, body, #root { min-height: 100%; background: ${BG}; }
        .about-video-frame { transition: transform 180ms ease, box-shadow 180ms ease; }
        .about-video-frame:hover { transform: translateY(-6px) rotate(-1deg); box-shadow: 0 30px 90px rgba(48,46,44,0.12); }
        .about-chapter-button:hover { transform: translateY(-2px); border-color: ${INK}; }
        .about-rule-card:hover { transform: translateY(-4px) rotate(0deg) !important; }
        .about-float-a { animation: aboutFloatA 7s ease-in-out infinite; }
        .about-float-b { animation: aboutFloatB 8s ease-in-out infinite; }
        .about-float-c { animation: aboutFloatC 9s ease-in-out infinite; }
        @keyframes aboutFloatA { 0%, 100% { translate: 0 0; } 50% { translate: 0 -14px; } }
        @keyframes aboutFloatB { 0%, 100% { translate: 0 0; } 50% { translate: 12px 10px; } }
        @keyframes aboutFloatC { 0%, 100% { translate: 0 0; } 50% { translate: -10px 12px; } }
        @media (max-width: 1000px) {
          .about-nav { padding: 18px 20px !important; }
          .about-hero { padding: 120px 22px 70px !important; }
          .about-map-stage { min-height: 780px !important; }
          .about-map-inner { transform: scale(0.72); transform-origin: top left; width: 1320px !important; }
          .about-grid-two, .about-diary-grid, .about-preview-grid, .about-rules-grid { grid-template-columns: 1fr !important; }
          .about-section { padding-left: 22px !important; padding-right: 22px !important; }
          .about-video-caption { left: 12px !important; right: 12px !important; }
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
        className="about-hero"
        style={{
          position: "relative",
          minHeight: "100vh",
          padding: "128px 56px 88px",
          boxSizing: "border-box",
        }}
      >
        <div className="about-map-stage" style={{ position: "relative", maxWidth: 1320, minHeight: 720, margin: "0 auto" }}>
          <div className="about-map-inner" style={{ position: "relative", width: 1320, height: 720 }}>
            <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
              <path d="M652 320 C460 130 290 165 190 310" stroke={DASH} strokeWidth="1" strokeDasharray="5 7" fill="none" />
              <path d="M682 330 C760 116 976 80 1100 190" stroke={DASH} strokeWidth="1" strokeDasharray="5 7" fill="none" />
              <path d="M686 402 C530 545 438 632 286 610" stroke={DASH} strokeWidth="1" strokeDasharray="5 7" fill="none" />
              <path d="M744 402 C873 552 1010 598 1164 552" stroke={DASH} strokeWidth="1" strokeDasharray="5 7" fill="none" />
              <path d="M756 360 C916 340 1054 330 1212 384" stroke={DASH} strokeWidth="1" strokeDasharray="5 7" fill="none" />
            </svg>

            <VideoFrame auto shape="circle" video="uninvited-thoughts" title="uninvited thoughts" note="Gedanken als kleine Störungen" style={{ position: "absolute", left: 52, top: 212, width: 250, height: 250 }} />
            <VideoFrame auto shape="tilt" video="visible-corrections" title="visible corrections" note="Fehler werden Landschaft" style={{ position: "absolute", left: 390, top: 36, width: 310, height: 190, transform: "rotate(-7deg)" }} />
            <VideoFrame auto shape="ticket" video="off-the-grid" title="off the grid" note="die Linie gehört dir" style={{ position: "absolute", left: 1010, top: 88, width: 270, height: 180, transform: "rotate(5deg)" }} />
            <VideoFrame auto shape="oval" video="in-a-spiral" title="in a spiral" note="Text rollt sich ein" style={{ position: "absolute", left: 1032, top: 400, width: 220, height: 285, transform: "rotate(11deg)" }} />
            <VideoFrame auto shape="oval" video="without-stopping" title="without stopping" note="Pausen bekommen Raum" style={{ position: "absolute", left: 160, top: 520, width: 330, height: 150, transform: "rotate(4deg)" }} />

            <div
              className="about-float-a"
              style={{
                position: "absolute",
                left: 446,
                top: 250,
                width: 470,
                border: `1px dashed ${DASH}`,
                background: "rgba(249,241,232,0.86)",
                borderRadius: 10,
                padding: "34px 42px 38px",
                boxShadow: "0 32px 100px rgba(48,46,44,0.08)",
              }}
            >
              <p style={{ margin: 0, fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: "0.08em" }}>ABOUT THE PROJECT</p>
              <h1 style={{ margin: "18px 0 0", fontFamily: SERIF, color: INK, fontSize: 55, lineHeight: "57px", fontWeight: 400 }}>
                Eine Reise durch Schreibregeln, Gedankenwetter und kleine Interface-Unfälle.
              </h1>
              <p style={{ margin: "24px 0 0", fontFamily: SANS, color: TEXT, fontSize: 17, lineHeight: "27px" }}>
                Shaping Thought untersucht, wie digitale Schreibtools unser Denken mitformen. Nicht als trockene Theorie, sondern als begehbares Labor: anfassen, schreiben, scheitern, neu mischen.
              </p>
            </div>

            <div className="about-float-b" style={{ position: "absolute", left: 780, top: 166, width: 186, padding: 14, border: `1px dashed ${DASH}`, borderRadius: 8, background: PAPER }}>
              <p style={{ margin: 0, fontFamily: MONO, fontSize: 11, color: MUTED }}>Kurzfassung</p>
              <p style={{ margin: "8px 0 0", fontFamily: SANS, fontSize: 14, lineHeight: "20px", color: TEXT }}>Das Medium ist nie neutral. Sobald die Regeln kippen, kippt auch das Schreiben.</p>
            </div>

            <div className="about-float-c" style={{ position: "absolute", left: 520, top: 565, width: 260, padding: "16px 18px", border: `1px dashed ${DASH}`, borderRadius: 999, background: PAPER_DARK, textAlign: "center" }}>
              <p style={{ margin: 0, fontFamily: SERIF, color: INK, fontSize: 24 }}>read it like a diary, use it like a map</p>
            </div>
          </div>
        </div>
      </section>

      <section className="about-section" style={{ padding: "40px 100px 90px" }}>
        <div className="about-grid-two" style={{ display: "grid", gridTemplateColumns: "1.05fr 0.95fr", gap: 24, maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ border: `1px dashed ${DASH}`, borderRadius: 10, padding: 34, background: "rgba(249,241,232,0.72)" }}>
            <p style={{ margin: 0, fontFamily: MONO, fontSize: 11, color: MUTED, letterSpacing: "0.08em" }}>IN EINEM SATZ</p>
            <h2 style={{ margin: "18px 0 0", fontFamily: SERIF, color: INK, fontWeight: 400, fontSize: 46, lineHeight: "50px" }}>
              Es geht nicht darum, schneller zu schreiben. Es geht darum, zu spüren, welche Form das Schreiben dem Denken gibt.
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
            {[
              ["Was?", "Ein Set experimenteller Schreibinterfaces und ein Tool, mit dem man eigene Schreibregeln kombinieren kann."],
              ["Warum?", "Weil normale Textfelder so selbstverständlich wirken, dass man ihre Regeln kaum noch bemerkt."],
              ["Wie?", "Durch kleine Störungen: Text verschwindet, Pausen werden sichtbar, Korrekturen bleiben, Linien brechen aus."],
            ].map(([title, text]) => (
              <div key={title} style={{ border: `1px dashed ${DASH}`, borderRadius: 8, padding: "20px 22px", background: "rgba(252,246,239,0.72)" }}>
                <p style={{ margin: 0, fontFamily: SERIF, color: INK, fontSize: 30 }}>{title}</p>
                <p style={{ margin: "8px 0 0", fontFamily: SANS, color: TEXT, fontSize: 15, lineHeight: "23px" }}>{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="about-section" style={{ padding: "80px 100px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 24, alignItems: "end", marginBottom: 24 }}>
            <div>
              <p style={{ margin: 0, fontFamily: MONO, color: MUTED, fontSize: 11, letterSpacing: "0.08em" }}>DIE REISE</p>
              <h2 style={{ margin: "10px 0 0", fontFamily: SERIF, color: INK, fontSize: 50, lineHeight: "52px", fontWeight: 400 }}>Tagebuch als Mindmap</h2>
            </div>
            <p style={{ margin: 0, maxWidth: 360, fontFamily: SANS, color: TEXT, fontSize: 15, lineHeight: "23px" }}>
              Klick dich durch die Stationen. Links steht der schnelle Weg, rechts die Notiz aus dem Maschinenraum.
            </p>
          </div>

          <div className="about-diary-grid" style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 22 }}>
            <div style={{ display: "grid", gap: 12 }}>
              {chapters.map((chapter) => (
                <ChapterButton key={chapter.id} chapter={chapter} active={active.id === chapter.id} onClick={() => setActiveId(chapter.id)} />
              ))}
            </div>

            <article style={{ position: "relative", border: `1px dashed ${DASH}`, borderRadius: 12, background: "rgba(249,241,232,0.76)", padding: 26, minHeight: 540, overflow: "hidden" }}>
              <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", opacity: 0.72 }}>
                <path d="M40 120 C220 20 310 190 500 90" stroke={SOFT} strokeWidth="1" strokeDasharray="4 8" fill="none" />
                <path d="M120 430 C290 310 520 390 760 240" stroke={SOFT} strokeWidth="1" strokeDasharray="4 8" fill="none" />
              </svg>
              <div style={{ position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: "minmax(260px, 0.9fr) 1fr", gap: 26 }} className="about-grid-two">
                <VideoFrame auto video={active.video} title={active.label} note={active.date} shape="ticket" style={{ height: 360 }} />
                <div>
                  <p style={{ margin: 0, fontFamily: MONO, color: MUTED, fontSize: 12 }}>{active.number} / {active.label}</p>
                  <h3 style={{ margin: "14px 0 0", fontFamily: SERIF, color: INK, fontWeight: 400, fontSize: 44, lineHeight: "47px" }}>{active.title}</h3>
                  <p style={{ margin: "18px 0 0", fontFamily: SANS, color: TEXT, fontSize: 17, lineHeight: "27px" }}>{active.short}</p>
                  <div style={{ marginTop: 24, borderTop: `1px dashed ${DASH}`, paddingTop: 18, display: "grid", gap: 12 }}>
                    {active.detail.map((paragraph) => (
                      <p key={paragraph} style={{ margin: 0, fontFamily: MONO, color: TEXT, fontSize: 13, lineHeight: "22px" }}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="about-section" style={{ padding: "80px 100px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <p style={{ margin: 0, fontFamily: MONO, color: MUTED, fontSize: 11, letterSpacing: "0.08em" }}>DIE REGELN</p>
          <h2 style={{ margin: "10px 0 28px", fontFamily: SERIF, color: INK, fontSize: 50, lineHeight: "52px", fontWeight: 400 }}>Sechs Regler, viele Denkstimmungen</h2>
          <div className="about-rules-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 18 }}>
            {rules.map((rule) => <RuleCard key={rule.title} {...rule} />)}
          </div>
        </div>
      </section>

      <section className="about-section" style={{ padding: "80px 100px 120px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 24, alignItems: "end", marginBottom: 24 }}>
            <div>
              <p style={{ margin: 0, fontFamily: MONO, color: MUTED, fontSize: 11, letterSpacing: "0.08em" }}>FELDNOTIZEN ALS BILDER</p>
              <h2 style={{ margin: "10px 0 0", fontFamily: SERIF, color: INK, fontSize: 50, lineHeight: "52px", fontWeight: 400 }}>Ein kleines Album der Experimente</h2>
            </div>
            <p style={{ margin: 0, maxWidth: 380, fontFamily: SANS, color: TEXT, fontSize: 15, lineHeight: "23px" }}>
              Die Bilder sind nicht nur Deko. Sie zeigen, welche Regel jeweils verrutscht: Zeit, Fehler, Raum, Sichtbarkeit, Erinnerung.
            </p>
          </div>
          <div className="about-preview-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 20 }}>
            {previews.map((preview, index) => (
              <VideoFrame
                key={preview.video}
                video={preview.video}
                title={preview.label}
                note={preview.note}
                shape={index % 3 === 0 ? "circle" : index % 3 === 1 ? "ticket" : "tilt"}
                style={{ height: index === 0 || index === 3 ? 310 : 240, transform: `rotate(${[-3, 2, -1, 3, -2, 1][index]}deg)` }}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="about-section" style={{ padding: "0 100px 130px" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", border: `1px dashed ${DASH}`, borderRadius: 14, background: "rgba(249,241,232,0.82)", padding: "42px 46px", display: "grid", gridTemplateColumns: "1fr auto", gap: 28, alignItems: "center" }} className="about-grid-two">
          <div>
            <p style={{ margin: 0, fontFamily: MONO, color: MUTED, fontSize: 11, letterSpacing: "0.08em" }}>LETZTE NOTIZ</p>
            <h2 style={{ margin: "14px 0 0", fontFamily: SERIF, color: INK, fontSize: 48, lineHeight: "51px", fontWeight: 400 }}>
              Diese Erkenntnis lässt sich nicht nur lesen. Man muss kurz darin schreiben.
            </h2>
            <p style={{ margin: "18px 0 0", maxWidth: 720, fontFamily: SANS, color: TEXT, fontSize: 16, lineHeight: "25px" }}>
              Darum endet die Reise nicht mit einer Erklärung, sondern mit einem offenen Werkzeug: Wähle Regeln, baue eine Schreibsituation, beobachte was passiert.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <DottedButton onClick={() => navigate("/playgroundnew1")}>Tools ansehen</DottedButton>
            <DottedButton onClick={() => navigate("/new")}>Eigenes Tool bauen</DottedButton>
          </div>
        </div>
      </section>
    </main>
  );
}
