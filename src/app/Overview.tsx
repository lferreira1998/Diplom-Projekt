import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";

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
const FONT_UI = "'Area Inktrap', 'Space Grotesk', sans-serif";
const FONT_BODY = "'IBM Plex Sans', system-ui, sans-serif";

// ── Start Modal ───────────────────────────────────────────────────────────────

function StartModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [prompt, setPrompt] = useState("");
  const [description, setDescription] = useState("");

  const inputStyle: React.CSSProperties = {
    backgroundColor: "#F4F5F7",
    border: "1px dashed #D0D1D6",
    borderRadius: "12px",
    height: "40px",
    width: "100%",
    padding: "0 12px",
    fontFamily: FONT_UI,
    fontSize: "10.88px",
    color: "#313642",
    letterSpacing: "0.3264px",
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: FONT_UI,
    fontSize: "11.52px",
    fontWeight: 600,
    letterSpacing: "0.1152px",
    lineHeight: "17.28px",
    color: "#313642",
    margin: 0,
  };

  const hintStyle: React.CSSProperties = {
    fontFamily: FONT_UI,
    fontSize: "9.6px",
    letterSpacing: "0.768px",
    lineHeight: "14.4px",
    color: "#7A7D89",
    margin: 0,
  };

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(6,6,19,0.65)",
        backdropFilter: "blur(8px)",
        padding: "24px",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.97 }}
        transition={{ duration: 0.24, delay: 0.06 }}
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: "#ECEDF0",
          border: "1px dashed #C3C4C8",
          borderRadius: "12px",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          width: "100%",
          maxWidth: "420px",
          boxSizing: "border-box",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <p style={{
            fontFamily: FONT_UI,
            fontSize: "20px",
            fontWeight: 400,
            letterSpacing: "0.1152px",
            lineHeight: "normal",
            color: "#313642",
            margin: 0,
          }}>
            Erstelle dein eigenes Writing-Tool
          </p>
          <div style={{ borderTop: "1px dashed #C3C4C8", width: "100%" }} />
          <p style={{
            fontFamily: FONT_UI,
            fontSize: "11.52px",
            fontWeight: 400,
            letterSpacing: "0.1152px",
            lineHeight: "17.28px",
            color: "#313642",
            margin: 0,
          }}>
            Verändere die Parameter und erstelle dein eigenes Tool.{" "}
            <br />
            Wenn du fertig bist, kannst du es speichern und mit anderen teilen.
          </p>
        </div>

        {/* Name */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <p style={labelStyle}>Name</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <input
              type="text"
              placeholder="Name eingeben"
              value={name}
              onChange={e => setName(e.target.value)}
              style={inputStyle}
            />
            <p style={hintStyle}>Du kannst den Namen jederzeit ändern.</p>
          </div>
        </div>

        {/* Schreibanstoß */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <p style={labelStyle}>Schreibanstoß oder Aufgaben</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <input
              type="text"
              placeholder="Beispiel: Schreibe etwas über dich..."
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              style={inputStyle}
            />
            <p style={hintStyle}>
              Das hilft Menschen beim Schreiben. Von allgemein bis sehr spezifisch.
              Du kannst auch mehrere anlegen.
            </p>
          </div>
        </div>

        {/* Beschreibung */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <p style={labelStyle}>Beschreibung oder Regel</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <textarea
              placeholder="Beispiel: Dieses Tool hilft anonym in öffentlichen Plätzen zu schreiben, indem immer nur das aktuelle Wort sichtbar ist."
              value={description}
              onChange={e => setDescription(e.target.value)}
              style={{
                backgroundColor: "#F4F5F7",
                border: "1px dashed #D0D1D6",
                borderRadius: "12px",
                height: "120px",
                width: "100%",
                padding: "12px",
                fontFamily: FONT_UI,
                fontSize: "10.88px",
                color: "#313642",
                letterSpacing: "0.3264px",
                lineHeight: "16.32px",
                outline: "none",
                resize: "none",
                boxSizing: "border-box",
              }}
            />
            <p style={hintStyle}>
              Das hilft Menschen beim Schreiben. Von allgemein bis sehr spezifisch.
              Du kannst auch mehrere anlegen.
            </p>
          </div>
        </div>

        {/* Loslegen */}
        <button
          onClick={() => navigate("/parametrisches-tool")}
          style={{
            width: "100%",
            height: "29px",
            backgroundColor: "#313642",
            color: "#ECEDF0",
            border: "none",
            borderRadius: "100px",
            cursor: "pointer",
            fontFamily: FONT_UI,
            fontSize: "10.88px",
            fontWeight: 600,
            letterSpacing: "0.3264px",
            lineHeight: "16.32px",
          }}
        >
          Loslegen
        </button>
      </motion.div>
    </motion.div>,
    document.body
  );
}

// ── ExperimentCard ────────────────────────────────────────────────────────────

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
          fontFamily: FONT_UI,
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
          fontFamily: FONT_BODY,
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

// ── LogoBox ───────────────────────────────────────────────────────────────────

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

// ── Overview ──────────────────────────────────────────────────────────────────

export default function Overview() {
  const [showModal, setShowModal] = useState(false);

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
        <LogoBox />
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
              fontFamily: FONT_BODY,
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
              fontFamily: FONT_BODY,
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
          onClick={() => setShowModal(true)}
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
              fontFamily: FONT_BODY,
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
        <div
          style={{
            flex: 867,
            display: "flex",
            flexDirection: "column",
            gap: "16px",
            minWidth: 0,
          }}
        >
          <div style={{ flex: 1, display: "flex", gap: "16px", minHeight: 0 }}>
            <ExperimentCard {...projects[0]} style={{ flex: "0 0 51.4%", borderLeft: "none", borderRadius: "0 4px 4px 0" }} />
            <ExperimentCard {...projects[1]} style={{ flex: 1 }} />
          </div>
          <div style={{ flex: 1, display: "flex", gap: "16px", minHeight: 0 }}>
            <ExperimentCard {...projects[2]} style={{ flex: "0 0 35.5%", borderLeft: "none", borderRadius: "0 4px 4px 0" }} />
            <ExperimentCard {...projects[3]} style={{ flex: 1 }} />
          </div>
        </div>
        <ExperimentCard {...projects[4]} style={{ flex: 288, minWidth: 0 }} />
        <ExperimentCard {...projects[5]} style={{ flex: 461, minWidth: 0, borderRight: "none", borderRadius: "4px 0 0 4px" }} />
      </div>

      {/* Start Modal */}
      <AnimatePresence>
        {showModal && <StartModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </div>
  );
}
