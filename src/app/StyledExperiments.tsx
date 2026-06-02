import type { CSSProperties, ReactNode } from "react";
import { useNavigate } from "react-router";
import UninvitedThoughts from "./projects/uninvitedthoughts/App";
import WithoutStopping from "./projects/dontstop/App";
import BlindThenWitness from "./OneWordReplay";
import VisibleCorrections from "./projects/loschenkorrigieren/App";
import OffTheGrid from "./projects/offthegrid/App";
import InASpiral from "./projects/inaspiral/App";

const BG = "#fcf6ef";
const PANEL = "#f9f1e8";
const PANEL_DARK = "#f3ebe0";
const INK = "#302e2c";
const TEXT = "#555555";
const MUTED = "#8f8f89";
const DASH = "#a4a4a4";
const DOT_GRID = "radial-gradient(circle, rgba(164,164,164,0.66) 1px, transparent 1.2px)";
const SERIF = "'az-serif', serif";
const SANS = "'az-sans', sans-serif";
const MONO = "'az-sans', sans-serif";

type ExperimentInfo = {
  slug: string;
  title: string;
  kicker: string;
  rule: string;
  note: string;
  video: string;
  oldPath: string;
  shape?: "oval" | "ticket" | "rect";
  rotate?: string;
};

const experiments = {
  uninvited: {
    slug: "uninvited-thoughts",
    title: "...uninvited thoughts",
    kicker: "Aufmerksamkeit",
    rule: "Versuche dich auf den Punkt zu konzentrieren. Jeder störende Gedanke wird sichtbar.",
    note: "Gedanken kommen nicht als Linie. Sie tauchen auf, unterbrechen, verschwinden wieder.",
    video: "uninvited-thoughts",
    oldPath: "/uninvited-thoughts",
    shape: "ticket",
    rotate: "-4deg",
  },
  withoutStopping: {
    slug: "without-stopping",
    title: "...without stopping",
    kicker: "Zeit",
    rule: "Wenn du pausierst, läuft der Cursor weiter. Zögern bekommt Raum.",
    note: "Nicht-Schreiben wird Teil der Typografie. Der Rhythmus schreibt mit.",
    video: "without-stopping",
    oldPath: "/dont-stop-writing",
    shape: "oval",
    rotate: "3deg",
  },
  blind: {
    slug: "blind-then-witness",
    title: "...blind & then witness",
    kicker: "Sichtbarkeit",
    rule: "Schreibe ohne deinen Text zu sehen. Danach beobachtest du dich beim Denken.",
    note: "Das Ergebnis ist weniger Text als Spur: ein Playback von Aufmerksamkeit.",
    video: "blind-then-witness",
    oldPath: "/one-word-replay",
    shape: "rect",
    rotate: "-2deg",
  },
  corrections: {
    slug: "visible-corrections",
    title: "...with visible corrections",
    kicker: "Korrektur",
    rule: "Löschen radiert nicht weg. Jede Korrektur bleibt als helle Schicht sichtbar.",
    note: "Das Dokument wird zur Landschaft aus Entscheidungen, Rücknahmen und kleinen Zweifeln.",
    video: "visible-corrections",
    oldPath: "/loschen-korrigieren",
    shape: "ticket",
    rotate: "2deg",
  },
  offGrid: {
    slug: "off-the-grid",
    title: "...off the grid",
    kicker: "Position",
    rule: "Zeichne zuerst deine eigene Linie. Erst danach kann Text darauf wohnen.",
    note: "Die Zeile ist keine Naturkonstante. Sie ist eine Vereinbarung, die man verschieben kann.",
    video: "off-the-grid",
    oldPath: "/off-the-grid",
    shape: "rect",
    rotate: "4deg",
  },
  spiral: {
    slug: "in-a-spiral",
    title: "...in a spiral",
    kicker: "Stabilität",
    rule: "Neuer Text bleibt außen präsent, älterer Text rollt sich nach innen ein.",
    note: "Vergangenheit verschwindet nicht. Sie wird kleiner, dichter, schwerer zu greifen.",
    video: "in-a-spiral",
    oldPath: "/in-a-spiral",
    shape: "oval",
    rotate: "-3deg",
  },
} satisfies Record<string, ExperimentInfo>;

function videoPath(video: string) {
  return `/videos/${video}.mp4`;
}

function ExperimentButton({ children, onClick, style }: { children: ReactNode; onClick: () => void; style?: CSSProperties }) {
  return (
    <button
      onClick={onClick}
      style={{
        height: 34,
        padding: "0 13px",
        border: `1px dashed ${DASH}`,
        borderRadius: 4,
        background: "rgba(249,241,232,0.78)",
        color: TEXT,
        fontFamily: SANS,
        fontSize: 14,
        cursor: "pointer",
        outline: "none",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function PreviewShape({ info }: { info: ExperimentInfo }) {
  const clipPath = info.shape === "oval"
    ? "ellipse(49% 44% at 50% 50%)"
    : info.shape === "ticket"
      ? "polygon(4% 7%, 96% 0, 100% 88%, 8% 100%)"
      : "inset(0 round 8px)";

  return (
    <div
      style={{
        position: "relative",
        height: 178,
        border: `1px dashed ${DASH}`,
        background: PANEL,
        overflow: "hidden",
        clipPath,
        transform: `rotate(${info.rotate ?? "0deg"})`,
      }}
    >
      <video muted loop autoPlay playsInline preload="auto" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: 0.9 }}>
        <source src={videoPath(info.video)} type="video/mp4" />
      </video>
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(252,246,239,0.04), rgba(48,46,44,0.22))" }} />
    </div>
  );
}

function StyledExperimentShell({ info, children }: { info: ExperimentInfo; children: ReactNode }) {
  const navigate = useNavigate();

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
        .styled-experiment-stage, .styled-experiment-stage * { letter-spacing: 0 !important; }
        .styled-experiment-stage h1,
        .styled-experiment-stage h2,
        .styled-experiment-stage h3,
        .styled-experiment-stage p,
        .styled-experiment-stage button,
        .styled-experiment-stage textarea,
        .styled-experiment-stage input,
        .styled-experiment-stage div[contenteditable="true"] {
          font-family: ${SERIF} !important;
        }
        .styled-experiment-stage .min-h-screen { min-height: 100% !important; }
        .styled-experiment-stage .h-screen { height: 100% !important; }
        .styled-experiment-stage .size-full { width: 100% !important; height: 100% !important; }
        .styled-experiment-stage .max-w-lg { max-width: 620px !important; }
        .styled-experiment-stage .max-w-4xl { max-width: 980px !important; }
        .styled-experiment-stage button {
          border-style: dashed !important;
          border-radius: 4px !important;
        }
        .styled-experiment-stage textarea,
        .styled-experiment-stage [tabindex="0"] {
          outline: none !important;
        }
        @media (max-width: 1000px) {
          .styled-experiment-layout { grid-template-columns: 1fr !important; padding: 76px 20px 20px !important; overflow: auto !important; }
          .styled-experiment-side { display: none !important; }
          .styled-experiment-stage { height: calc(100vh - 112px) !important; }
        }
      `}</style>

      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          padding: "28px 42px 0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          pointerEvents: "none",
        }}
      >
        <div style={{ display: "flex", gap: 10, pointerEvents: "auto" }}>
          <ExperimentButton onClick={() => navigate("/playgroundnew1")}>Zurück</ExperimentButton>
          <ExperimentButton onClick={() => navigate("/aboutnew")}>About</ExperimentButton>
        </div>
        <div style={{ display: "flex", gap: 10, pointerEvents: "auto" }}>
          <ExperimentButton onClick={() => navigate("/new")}>Tool bauen</ExperimentButton>
        </div>
      </nav>

      <section
        className="styled-experiment-layout"
        style={{
          height: "100%",
          boxSizing: "border-box",
          padding: "86px 42px 32px",
        }}
      >
        <div
          className="styled-experiment-stage"
          data-experiment={info.slug}
          style={{
            position: "relative",
            height: "calc(100vh - 118px)",
            minHeight: 580,
            overflow: "hidden",
            border: `1px dashed ${DASH}`,
            borderRadius: 10,
            background: `linear-gradient(180deg, rgba(249,241,232,0.78), rgba(252,246,239,0.9)), ${PANEL_DARK}`,
            boxShadow: "0 28px 100px rgba(48,46,44,0.08)",
          }}
        >
          <div style={{ width: "100%", height: "100%" }}>{children}</div>
        </div>
      </section>
    </main>
  );
}

export function StyledUninvitedThoughts() {
  return <StyledExperimentShell info={experiments.uninvited}><UninvitedThoughts /></StyledExperimentShell>;
}

export function StyledWithoutStopping() {
  return <StyledExperimentShell info={experiments.withoutStopping}><WithoutStopping /></StyledExperimentShell>;
}

export function StyledBlindThenWitness() {
  return <StyledExperimentShell info={experiments.blind}><BlindThenWitness /></StyledExperimentShell>;
}

export function StyledVisibleCorrections() {
  return <StyledExperimentShell info={experiments.corrections}><VisibleCorrections /></StyledExperimentShell>;
}

export function StyledOffTheGrid() {
  return <StyledExperimentShell info={experiments.offGrid}><OffTheGrid /></StyledExperimentShell>;
}

export function StyledInASpiral() {
  return <StyledExperimentShell info={experiments.spiral}><InASpiral /></StyledExperimentShell>;
}
