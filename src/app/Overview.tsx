import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";

const projects = [
  {
    name: "Don't Stop Writing",
    path: "/dont-stop-writing",
    description: "Write continuously. Your typing rhythm shapes the text. Pauses leave visible gaps.",
  },
  {
    name: "One-Word Replay",
    path: "/one-word-replay",
    description: "Type in the dark. Watch your words appear one by one in the exact rhythm you wrote them.",
  },
  {
    name: "Uninvited Thoughts",
    path: "/uninvited-thoughts",
    description: "A cursor wanders autonomously across the screen. Type to anchor it momentarily.",
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

const BG = "#060613";
const B = "1px dashed rgba(89, 89, 100, 0.8)";

function ExperimentCard({
  name,
  description,
  path,
  style,
}: {
  name: string;
  description: string;
  path: string;
  style?: React.CSSProperties;
}) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(path)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: hovered ? "#e8e8e8" : BG,
        border: B,
        borderRadius: "4px",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        cursor: "pointer",
        transition: "background-color 0.2s ease",
        minWidth: 0,
        minHeight: 0,
        ...style,
      }}
    >
      <p
        style={{
          fontFamily: "'Area Inktrap', 'Space Grotesk', sans-serif",
          fontSize: "20px",
          fontWeight: 400,
          letterSpacing: "-0.4px",
          lineHeight: "normal",
          color: hovered ? "#000000" : "#ffffff",
          margin: 0,
          flexShrink: 0,
          transition: "color 0.2s ease",
        }}
      >
        {name}
      </p>
      <p
        style={{
          fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
          fontSize: "14px",
          letterSpacing: "-0.02em",
          color: hovered ? "#000000" : "#8c8c9e",
          margin: 0,
          lineHeight: 1.5,
          flexShrink: 0,
          opacity: hovered ? 1 : 0,
          transition: "opacity 0.2s ease, color 0.2s ease",
        }}
      >
        {description}
      </p>
    </div>
  );
}

function LogoBox() {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderTop: B, borderRight: B, borderBottom: B, borderLeft: "none",
        borderRadius: "0 4px 4px 0",
        padding: "20px 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end",
        flexShrink: 0,
        cursor: "default",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "138px",
          overflow: "hidden",
        }}
      >
        <motion.p
          layout
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{
            fontFamily: hovered
              ? "'Area Inktrap', sans-serif"
              : "'Area Inktrap Extended', 'Area Inktrap', sans-serif",
            fontSize: "18px",
            fontWeight: 700,
            letterSpacing: "-0.72px",
            color: "#ffffff",
            margin: 0,
            lineHeight: "normal",
            alignSelf: hovered ? "flex-end" : "flex-start",
            whiteSpace: "nowrap",
          }}
        >
          Shaping
        </motion.p>
        <motion.p
          layout
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{
            fontFamily: hovered
              ? "'Area Inktrap', sans-serif"
              : "'Area Inktrap Extended', 'Area Inktrap', sans-serif",
            fontSize: "18px",
            fontWeight: 700,
            letterSpacing: "-0.72px",
            color: "#ffffff",
            margin: 0,
            lineHeight: "normal",
            alignSelf: hovered ? "flex-start" : "flex-end",
            whiteSpace: "nowrap",
          }}
        >
          Thoughts
        </motion.p>
      </div>
    </div>
  );
}

export default function Overview() {
  return (
    <div
      style={{
        backgroundColor: BG,
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "16px",
        boxSizing: "border-box",
        minHeight: "100vh",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          height: "88px",
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <LogoBox />

        {/* Nav */}
        <div
          style={{
            borderTop: B, borderLeft: B, borderBottom: B, borderRight: "none",
            borderRadius: "4px 0 0 4px",
            flex: 1,
            padding: "20px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
          }}
        >
          <p
            style={{
              fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
              fontSize: "18px",
              letterSpacing: "-0.72px",
              margin: 0,
              lineHeight: "normal",
            }}
          >
            <span style={{ color: "#737382" }}>About, </span>
            <span style={{ color: "#ffffff" }}>Experiments, </span>
            <span style={{ color: "#747482" }}>Create</span>
          </p>
        </div>
      </div>

      {/* Hero */}
      <div
        style={{
          borderTop: B, borderBottom: B, borderLeft: "none", borderRight: "none",
          borderRadius: "0",
          padding: "72px 48px 96px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              fontFamily: "'Area Inktrap Extended', 'Area Inktrap', sans-serif",
              fontSize: "60px",
              fontWeight: 400,
              letterSpacing: "-3px",
              color: "#ffffff",
              lineHeight: "70px",
            }}
          >
            <p style={{ margin: 0 }}>Writing tools shape </p>
            <p style={{ margin: 0 }}>how and what we think.</p>
          </div>
          <p
            style={{
              fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
              fontSize: "26px",
              letterSpacing: "-1.04px",
              color: "#8c8c9e",
              margin: 0,
              lineHeight: "normal",
            }}
          >
            Explore what happens when the rules change.
          </p>
        </div>

        {/* CTA Button */}
        <div
          onClick={() => navigate("/parametrisches-tool")}
          style={{
            border: B,
            borderRadius: "4px",
            padding: "8px 16px 9px",
            display: "inline-flex",
            alignItems: "center",
            cursor: "pointer",
            alignSelf: "flex-start",
          }}
        >
          <p
            style={{
              fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
              fontSize: "16px",
              color: "#ffffff",
              margin: 0,
              lineHeight: "normal",
              whiteSpace: "nowrap",
            }}
          >
            Create a writing tool
          </p>
        </div>
      </div>

      {/* Experiment Grid */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          height: "822px",
          flexShrink: 0,
        }}
      >
        {/* Left section: 2×2 grid — 4 experiments */}
        <div
          style={{
            flex: 867,
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            minWidth: 0,
          }}
        >
          {/* Row 1 */}
          <div style={{ flex: 1, display: "flex", gap: "16px", minHeight: 0 }}>
            <ExperimentCard {...projects[0]} style={{ flex: "0 0 51.4%", borderLeft: "none", borderRadius: "0 4px 4px 0" }} />
            <ExperimentCard {...projects[1]} style={{ flex: 1 }} />
          </div>
          {/* Row 2 */}
          <div style={{ flex: 1, display: "flex", gap: "16px", minHeight: 0 }}>
            <ExperimentCard {...projects[2]} style={{ flex: "0 0 35.5%", borderLeft: "none", borderRadius: "0 4px 4px 0" }} />
            <ExperimentCard {...projects[3]} style={{ flex: 1 }} />
          </div>
        </div>

        {/* Middle column — 1 experiment */}
        <ExperimentCard
          {...projects[4]}
          style={{ flex: 288, minWidth: 0 }}
        />

        {/* Right column — 1 experiment */}
        <ExperimentCard
          {...projects[5]}
          style={{ flex: 461, minWidth: 0, borderRight: "none", borderRadius: "4px 0 0 4px" }}
        />
      </div>
    </div>
  );
}
