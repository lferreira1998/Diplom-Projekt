import { useState } from "react";
import { useNavigate } from "react-router";

const projects = [
  {
    name: "One-Word Replay",
    path: "/one-word-replay",
    description: "Type in the dark. Watch your words appear one by one in the exact rhythm you wrote them.",
  },
  {
    name: "Don't Stop Writing",
    path: "/dont-stop-writing",
    description: "Write continuously. Your typing rhythm shapes the text. Pauses leave visible gaps.",
  },
  {
    name: "Uninvited Thoughts",
    path: "/uninvited-thoughts",
    description: "A cursor wanders autonomously. Type to anchor it momentarily.",
  },
  {
    name: "Löschen & Korrigieren",
    path: "/loschen-korrigieren",
    description: "Corrections accumulate as layers. Every deletion leaves a trace.",
  },
  {
    name: "Drifting Following Words",
    path: "/drifting-following-words",
    description: "Words drift in formation, drawn together by invisible forces.",
  },
  {
    name: "Drifting Disappearing Words",
    path: "/drifting-disappearing-words",
    description: "Words drift and slowly fade. Nothing written lasts forever.",
  },
];

function Tile({ name, description, path }: { name: string; description: string; path: string }) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(path)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: "1 0 0",
        minHeight: 0,
        minWidth: 0,
        padding: "24px",
        borderRadius: "4px",
        border: `1px dashed ${hovered ? "#6f6f6f" : "#b6b6b6"}`,
        backgroundColor: hovered ? "#e8e8e8" : "#151515",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        cursor: "pointer",
        transition: "background-color 0.2s ease, border-color 0.2s ease",
      }}
    >
      <p
        style={{
          fontFamily: "'Area Inktrap', 'Space Grotesk', sans-serif",
          fontSize: "24px",
          fontWeight: 600,
          letterSpacing: "-0.02em",
          color: hovered ? "#000000" : "#ffffff",
          margin: 0,
          transition: "color 0.2s ease",
        }}
      >
        {name}
      </p>
      <p
        style={{
          fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
          fontSize: "16px",
          letterSpacing: "-0.02em",
          color: "#000000",
          margin: 0,
          lineHeight: 1.5,
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.2s ease",
        }}
      >
        {description}
      </p>
    </div>
  );
}

export default function Overview() {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#161617",
        padding: "12px",
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {/* Grid */}
      <div
        style={{
          flex: 1,
          display: "flex",
          gap: "12px",
          alignItems: "stretch",
        }}
      >
        {/* Left column: 2×2 grid */}
        <div
          style={{
            flex: "2 0 0",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div style={{ flex: 1, display: "flex", gap: "12px" }}>
            <Tile {...projects[0]} />
            <Tile {...projects[1]} />
          </div>
          <div style={{ flex: 1, display: "flex", gap: "12px" }}>
            <Tile {...projects[2]} />
            <Tile {...projects[3]} />
          </div>
        </div>

        {/* Right column: 2 stacked tiles */}
        <div
          style={{
            flex: "1 0 0",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <Tile {...projects[4]} />
          <Tile {...projects[5]} />
        </div>
      </div>

      {/* Title badge */}
      <div
        style={{
          position: "absolute",
          bottom: "24px",
          left: "50%",
          transform: "translateX(-50%)",
          backgroundColor: "rgba(222, 222, 222, 0.8)",
          border: "1px dashed #6f6f6f",
          borderRadius: "8px",
          padding: "16px 48px",
          whiteSpace: "nowrap",
        }}
      >
        <p
          style={{
            fontFamily: "'Area Inktrap', 'Space Grotesk', sans-serif",
            fontSize: "15px",
            fontWeight: 600,
            color: "#000000",
            margin: 0,
          }}
        >
          Shape of Thought
        </p>
      </div>
    </div>
  );
}
