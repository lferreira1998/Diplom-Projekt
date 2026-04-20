import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";

const IMG_FLOWER = "https://www.figma.com/api/mcp/asset/bf221459-2dd3-4a06-aeda-2a2f31668b0d";
const IMG_RECTANGLE = "https://www.figma.com/api/mcp/asset/dbbc540d-4fea-42a3-a88a-e1d62e4b407a";
const IMG_SCREENSHOT = "https://www.figma.com/api/mcp/asset/be2da2ea-ed64-468a-bc60-35f4310e1cb1";
const IMG_VECTOR = "https://www.figma.com/api/mcp/asset/39f2aa4c-77e3-4c2e-9221-819b8781c7cc";

const BG = "#e6e1dd";
const BORDER = "1px dashed #14151b";
const FONT_UI = "'Area Inktrap', 'Space Grotesk', sans-serif";
const FONT_UI_EXT = "'Area Inktrap Extended', 'Area Inktrap', sans-serif";
const BROWNISH = "#484643";

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
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <p style={{ fontFamily: FONT_UI, fontSize: "20px", fontWeight: 400, letterSpacing: "0.1152px", lineHeight: "normal", color: "#313642", margin: 0 }}>
            Erstelle dein eigenes Writing-Tool
          </p>
          <div style={{ borderTop: "1px dashed #C3C4C8", width: "100%" }} />
          <p style={{ fontFamily: FONT_UI, fontSize: "11.52px", fontWeight: 400, letterSpacing: "0.1152px", lineHeight: "17.28px", color: "#313642", margin: 0 }}>
            Verändere die Parameter und erstelle dein eigenes Tool.{" "}
            <br />
            Wenn du fertig bist, kannst du es speichern und mit anderen teilen.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <p style={labelStyle}>Name</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <input type="text" placeholder="Name eingeben" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
            <p style={hintStyle}>Du kannst den Namen jederzeit ändern.</p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <p style={labelStyle}>Schreibanstoß oder Aufgaben</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <input type="text" placeholder="Beispiel: Schreibe etwas über dich..." value={prompt} onChange={e => setPrompt(e.target.value)} style={inputStyle} />
            <p style={hintStyle}>Das hilft Menschen beim Schreiben. Von allgemein bis sehr spezifisch. Du kannst auch mehrere anlegen.</p>
          </div>
        </div>

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
            <p style={hintStyle}>Das hilft Menschen beim Schreiben. Von allgemein bis sehr spezifisch. Du kannst auch mehrere anlegen.</p>
          </div>
        </div>

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

// ── Overview ──────────────────────────────────────────────────────────────────

const OTHER_TOOLS = [
  { label: "uninvited thoughts", path: "/uninvited-thoughts" },
  { label: "don't correct it", path: "/loschen-korrigieren" },
  { label: "write in a spiral", path: "/parametrisches-tool" },
  { label: "without seeing it", path: "/one-word-replay" },
  { label: "in a random order", path: "/parametrisches-tool" },
];

export default function Overview() {
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  return (
    <div
      style={{
        backgroundColor: BG,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "row",
        alignItems: "stretch",
        boxSizing: "border-box",
      }}
    >
      {/* ── Left Column ── */}
      <div
        style={{
          width: "307px",
          flexShrink: 0,
          padding: "40px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          boxSizing: "border-box",
        }}
      >
        {/* Shaping Thought card */}
        <div
          style={{
            backgroundColor: "rgba(255,255,255,0.4)",
            border: BORDER,
            borderRadius: "4px",
            padding: "24px",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          {/* Flower image — horizontally mirrored per design */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: "144.765px", height: "167.965px", position: "relative", overflow: "hidden" }}>
              <img
                alt=""
                src={IMG_FLOWER}
                style={{
                  position: "absolute",
                  width: "104.77%",
                  height: "106.75%",
                  left: "-4.77%",
                  top: "-6.75%",
                  maxWidth: "none",
                  transform: "scaleX(-1)",
                  mixBlendMode: "darken",
                }}
              />
            </div>
          </div>

          <p style={{ fontFamily: FONT_UI_EXT, fontSize: "25px", fontWeight: 600, letterSpacing: "-1.25px", color: BROWNISH, margin: 0, lineHeight: "normal" }}>
            Shaping Thought
          </p>

          <p style={{ fontFamily: FONT_UI, fontSize: "14px", fontWeight: 600, letterSpacing: "0.1152px", lineHeight: "17.28px", color: "#000000", margin: 0 }}>
            Schreibtools formen Denken.
            <br /><br />
            Shaping Thought verändert ihre Regeln.
          </p>

          <div
            style={{
              backgroundColor: "rgba(255,255,255,0.2)",
              border: BORDER,
              borderRadius: "2px",
              padding: "6px 12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <p style={{ fontFamily: FONT_UI, fontSize: "14px", fontWeight: 600, letterSpacing: "0.1152px", lineHeight: "17.28px", color: BROWNISH, margin: 0 }}>
              Mehr über das Projekt
            </p>
          </div>
        </div>

        {/* Create your own Writing Interface */}
        <div
          onClick={() => setShowModal(true)}
          style={{ position: "relative", cursor: "pointer", flexShrink: 0 }}
        >
          <img
            alt=""
            src={IMG_RECTANGLE}
            style={{ display: "block", width: "100%", height: "auto", borderRadius: "4px" }}
          />
          {/* Arrow — top right corner */}
          <img
            alt=""
            src={IMG_VECTOR}
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: "59.579px",
              height: "53.334px",
            }}
          />
          {/* Text overlay */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center",
              pointerEvents: "none",
            }}
          >
            <p style={{ fontFamily: FONT_UI, fontSize: "14px", fontWeight: 600, color: BROWNISH, margin: 0, lineHeight: "22px", whiteSpace: "nowrap" }}>
              Create your own<br />Writing Interface
            </p>
          </div>
        </div>
      </div>

      {/* ── Center Column ── */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          padding: "40px 0",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        {/* Writing tool preview card */}
        <div
          style={{
            backgroundColor: "rgba(255,255,255,0.4)",
            border: BORDER,
            borderRadius: "4px",
            padding: "24px 40px 40px",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
          }}
        >
          {/* Top bar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span
                style={{
                  fontFamily: FONT_UI,
                  fontSize: "10.88px",
                  color: "#313642",
                  letterSpacing: "2.176px",
                  textTransform: "uppercase",
                }}
              >
                Don't Stop Writing
              </span>
              <div style={{ display: "flex", gap: "16px" }}>
                <span style={{ fontFamily: FONT_UI, fontSize: "9.6px", color: "#313642", letterSpacing: "0.768px", opacity: 0.6 }}>8:58</span>
                <span style={{ fontFamily: FONT_UI, fontSize: "9.6px", color: "#313642", letterSpacing: "0.768px", opacity: 0.4 }}>7 words</span>
                <span style={{ fontFamily: FONT_UI, fontSize: "9.6px", color: "#313642", letterSpacing: "0.768px", opacity: 0.4 }}>40 chars</span>
              </div>
            </div>
            <div style={{ borderTop: "1px solid #E0E1E6" }} />
          </div>

          {/* Placeholder text */}
          <p
            style={{
              fontFamily: FONT_UI,
              fontSize: "24px",
              fontWeight: 600,
              letterSpacing: "0.1152px",
              lineHeight: "30px",
              color: "rgba(89,89,100,0.8)",
              margin: 0,
            }}
          >
            Write something or select a writing tool on the right side...
          </p>
        </div>

        {/* Screenshot */}
        <div style={{ overflow: "hidden" }}>
          <img
            alt=""
            src={IMG_SCREENSHOT}
            style={{ display: "block", width: "100%", height: "auto", mixBlendMode: "luminosity" }}
          />
        </div>
      </div>

      {/* ── Right Column ── */}
      <div
        style={{
          width: "307px",
          flexShrink: 0,
          padding: "40px",
          display: "flex",
          flexDirection: "column",
          gap: "24px",
          boxSizing: "border-box",
        }}
      >
        {/* Writing Tools header */}
        <div
          style={{
            backgroundColor: "rgba(255,255,255,0.4)",
            border: BORDER,
            borderRadius: "4px",
            height: "64px",
            display: "flex",
            alignItems: "center",
            padding: "16px 24px",
            boxSizing: "border-box",
          }}
        >
          <p style={{ fontFamily: FONT_UI_EXT, fontSize: "20px", fontWeight: 600, letterSpacing: "0.1152px", lineHeight: "17.28px", color: BROWNISH, margin: 0 }}>
            Writing Tools
          </p>
        </div>

        {/* Tools list */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {/* Standard interface — expanded, top item */}
          <div
            onClick={() => navigate("/dont-stop-writing")}
            style={{
              backgroundColor: "rgba(255,255,255,0.4)",
              borderTop: BORDER,
              borderLeft: BORDER,
              borderRight: BORDER,
              borderBottom: BORDER,
              borderRadius: "4px 4px 0 0",
              padding: "16px 24px",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              gap: "24px",
            }}
          >
            <p style={{ fontFamily: FONT_UI, fontSize: "13px", fontWeight: 600, color: "#11112d", margin: 0, lineHeight: "17.28px" }}>
              standard interface
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <p style={{ fontFamily: FONT_UI, fontSize: "12px", fontWeight: 600, color: "#434343", margin: 0, lineHeight: "17.28px", letterSpacing: "0.1152px" }}>
                This is the standard writing tool we all know. Write here or try new ones to explore.
              </p>
              <div style={{ backgroundColor: "rgba(255,255,255,0.2)", border: BORDER, borderRadius: "2px", padding: "6px 12px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <p style={{ fontFamily: FONT_UI, fontSize: "14px", fontWeight: 600, color: BROWNISH, margin: 0, lineHeight: "17.28px", letterSpacing: "0.1152px" }}>
                  Schreiben
                </p>
              </div>
            </div>
          </div>

          {/* Other tools */}
          {OTHER_TOOLS.map(({ label, path }, i) => (
            <div
              key={label}
              onClick={() => navigate(path)}
              style={{
                backgroundColor: "rgba(255,255,255,0.2)",
                borderLeft: BORDER,
                borderRight: BORDER,
                borderBottom: BORDER,
                borderTop: "none",
                borderRadius: i === OTHER_TOOLS.length - 1 ? "0 0 4px 4px" : "0",
                padding: "16px 24px",
                cursor: "pointer",
              }}
            >
              <p style={{ fontFamily: FONT_UI, fontSize: "13px", fontWeight: 600, color: BROWNISH, margin: 0, lineHeight: "17.28px" }}>
                {label}
              </p>
            </div>
          ))}
        </div>

        {/* Explore all experiments */}
        <div
          style={{
            backgroundColor: "rgba(255,255,255,0.4)",
            border: BORDER,
            borderRadius: "4px",
            height: "64px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px 24px",
            cursor: "pointer",
            boxSizing: "border-box",
          }}
        >
          <p style={{ fontFamily: FONT_UI, fontSize: "14px", fontWeight: 600, color: BROWNISH, margin: 0, lineHeight: "17.28px", letterSpacing: "0.1152px", textAlign: "center" }}>
            Explore all experiments
          </p>
        </div>
      </div>

      {/* Start Modal */}
      <AnimatePresence>
        {showModal && <StartModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </div>
  );
}
