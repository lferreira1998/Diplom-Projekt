import { useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";

const IMG_RECTANGLE = "https://www.figma.com/api/mcp/asset/6f056d20-7603-49b9-a17f-a5d406b9fc38";
const IMG_SCREENSHOT = "https://www.figma.com/api/mcp/asset/55b27563-956e-47ef-94a0-8ace12926a53";
const IMG_VECTOR = "https://www.figma.com/api/mcp/asset/591ed8f5-e969-47dd-aff0-39c6a195fc7b";

const BG = "#e5dde6";
const BORDER = "1px dashed #14151b";
const FONT_UI = "'Area Inktrap', 'Space Grotesk', sans-serif";
const FONT_UI_EXT = "'Area Inktrap Extended', 'Area Inktrap', sans-serif";
const BROWNISH = "#484643";

const OTHER_TOOLS = [
  { label: "uninvited thoughts", path: "/uninvited-thoughts" },
  { label: "don't correct it", path: "/loschen-korrigieren" },
  { label: "write in a spiral", path: "/parametrisches-tool" },
  { label: "without seeing it", path: "/one-word-replay" },
  { label: "in a random order", path: "/parametrisches-tool" },
];

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
          <p style={{ fontFamily: FONT_UI, fontSize: "20px", fontWeight: 400, letterSpacing: "0.1152px", color: "#313642", margin: 0 }}>
            Erstelle dein eigenes Writing-Tool
          </p>
          <div style={{ borderTop: "1px dashed #C3C4C8" }} />
          <p style={{ fontFamily: FONT_UI, fontSize: "11.52px", letterSpacing: "0.1152px", lineHeight: "17.28px", color: "#313642", margin: 0 }}>
            Verändere die Parameter und erstelle dein eigenes Tool.<br />
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
              placeholder="Beispiel: Dieses Tool hilft anonym in öffentlichen Plätzen zu schreiben..."
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
            <p style={hintStyle}>Das hilft Menschen beim Schreiben. Von allgemein bis sehr spezifisch.</p>
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

export default function Overview() {
  const [showModal, setShowModal] = useState(false);
  const [text, setText] = useState("");
  const navigate = useNavigate();

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const charCount = text.length;

  return (
    <>
      <style>{`
        .overview-textarea::placeholder {
          color: rgba(89, 89, 100, 0.8);
          font-weight: 600;
        }
      `}</style>

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
              flexShrink: 0,
            }}
          >
            <p
              style={{
                fontFamily: FONT_UI_EXT,
                fontSize: "25px",
                fontWeight: 600,
                letterSpacing: "-1.25px",
                color: BROWNISH,
                margin: 0,
                lineHeight: "normal",
              }}
            >
              Shaping Thought
            </p>

            <p
              style={{
                fontFamily: FONT_UI,
                fontSize: "14px",
                fontWeight: 600,
                letterSpacing: "0.1152px",
                lineHeight: "17.28px",
                color: "#000000",
                margin: 0,
                whiteSpace: "pre-wrap",
              }}
            >
              {"Schreibtools formen Denken.\n\nShaping Thought verändert ihre Regeln."}
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
              <p
                style={{
                  fontFamily: FONT_UI,
                  fontSize: "14px",
                  fontWeight: 600,
                  letterSpacing: "0.1152px",
                  lineHeight: "17.28px",
                  color: BROWNISH,
                  margin: 0,
                  width: "157px",
                }}
              >
                Mehr über das Projekt
              </p>
            </div>
          </div>

          {/* Create your own Writing Interface — grid overlay */}
          <div
            onClick={() => setShowModal(true)}
            style={{
              flex: "1 0 0",
              position: "relative",
              cursor: "pointer",
              minHeight: 0,
            }}
          >
            {/* Background image */}
            <img
              alt=""
              src={IMG_RECTANGLE}
              style={{
                display: "block",
                width: "227px",
                height: "475px",
                objectFit: "cover",
              }}
            />

            {/* "Create your own Writing Interface" text overlay */}
            <div
              style={{
                position: "absolute",
                top: "209.15px",
                left: "44.16px",
                width: "136.2px",
                fontFamily: FONT_UI,
                fontSize: "14px",
                fontWeight: 600,
                color: BROWNISH,
                textAlign: "center",
                lineHeight: "22px",
                pointerEvents: "none",
              }}
            >
              <p style={{ margin: 0 }}>Create your own</p>
              <p style={{ margin: 0 }}>Writing Interface</p>
            </div>

            {/* Vector arrow — top right */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: "167.42px",
                width: "59.579px",
                height: "87.047px",
                pointerEvents: "none",
              }}
            >
              <img
                alt=""
                src={IMG_VECTOR}
                style={{
                  position: "absolute",
                  inset: "-0.32% -0.69% -0.57% -0.84%",
                  width: "101.53%",
                  height: "100.89%",
                  maxWidth: "none",
                }}
              />
            </div>
          </div>
        </div>

        {/* ── Center Column ── */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            paddingTop: "40px",
            paddingBottom: "40px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {/* Writing preview card */}
          <div
            style={{
              backgroundColor: "rgba(255,255,255,0.4)",
              border: BORDER,
              borderRadius: "4px",
              paddingTop: "24px",
              paddingBottom: "40px",
              paddingLeft: "40px",
              paddingRight: "40px",
              display: "flex",
              flexDirection: "column",
              gap: "24px",
              height: "778px",
              boxSizing: "border-box",
              flexShrink: 0,
            }}
          >
            {/* Top bar */}
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
                {/* Tool name */}
                <div style={{ height: "16.32px", position: "relative", flexShrink: 0, width: "162.07px" }}>
                  <p
                    style={{
                      position: "absolute",
                      fontFamily: FONT_UI,
                      fontWeight: 400,
                      fontSize: "10.88px",
                      lineHeight: "16.32px",
                      color: "#313642",
                      letterSpacing: "2.176px",
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                      margin: 0,
                      left: 0,
                      top: "-0.5px",
                    }}
                  >
                    Don't Stop Writing
                  </p>
                </div>

                {/* Stats */}
                <div style={{ display: "flex", gap: "16px", alignItems: "center", height: "14.398px" }}>
                  <div style={{ opacity: 0.6, position: "relative", height: "14.398px" }}>
                    <p
                      style={{
                        position: "absolute",
                        fontFamily: FONT_UI,
                        fontWeight: 400,
                        fontSize: "9.6px",
                        lineHeight: "14.4px",
                        color: "#313642",
                        letterSpacing: "0.768px",
                        whiteSpace: "nowrap",
                        margin: 0,
                        left: 0,
                        top: "0.5px",
                      }}
                    >
                      8:58
                    </p>
                  </div>
                  {wordCount > 0 && (
                    <div style={{ opacity: 0.4, position: "relative", height: "14.398px" }}>
                      <p style={{ position: "absolute", fontFamily: FONT_UI, fontWeight: 400, fontSize: "9.6px", lineHeight: "14.4px", color: "#313642", letterSpacing: "0.768px", whiteSpace: "nowrap", margin: 0, left: 0, top: "0.5px" }}>
                        {wordCount} {wordCount === 1 ? "word" : "words"}
                      </p>
                    </div>
                  )}
                  {charCount > 0 && (
                    <div style={{ opacity: 0.4, position: "relative", height: "14.398px" }}>
                      <p style={{ position: "absolute", fontFamily: FONT_UI, fontWeight: 400, fontSize: "9.6px", lineHeight: "14.4px", color: "#313642", letterSpacing: "0.768px", whiteSpace: "nowrap", margin: 0, left: 0, top: "0.5px" }}>
                        {charCount} chars
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ borderTop: "1px solid #e0e1e6" }} />
            </div>

            {/* Textarea */}
            <textarea
              className="overview-textarea"
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Write something or select a writing tool on the right side..."
              style={{
                flex: 1,
                backgroundColor: "transparent",
                border: "none",
                outline: "none",
                resize: "none",
                width: "100%",
                fontFamily: FONT_UI,
                fontSize: "24px",
                fontWeight: 600,
                lineHeight: "30px",
                letterSpacing: "0.1152px",
                color: "#313642",
                padding: 0,
              }}
            />
          </div>

          {/* Screenshot */}
          <div
            style={{
              position: "relative",
              height: "860.508px",
              flexShrink: 0,
              width: "888.275px",
            }}
          >
            <div
              style={{
                position: "absolute",
                height: "780.508px",
                left: "58.16px",
                top: "40px",
                width: "771.963px",
                overflow: "hidden",
              }}
            >
              <img
                alt=""
                src={IMG_SCREENSHOT}
                style={{
                  position: "absolute",
                  width: "201.85%",
                  height: "125.68%",
                  left: "-49.31%",
                  top: "-16.16%",
                  maxWidth: "none",
                  mixBlendMode: "luminosity",
                }}
              />
            </div>
            <div
              style={{
                position: "absolute",
                backgroundColor: "#f5f5f6",
                height: "251.529px",
                left: "255.48px",
                top: "306.76px",
                width: "397.041px",
              }}
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
          <div style={{ display: "flex", flexDirection: "column", flexShrink: 0 }}>
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
              <p
                style={{
                  fontFamily: FONT_UI_EXT,
                  fontSize: "20px",
                  fontWeight: 600,
                  letterSpacing: "0.1152px",
                  lineHeight: "17.28px",
                  color: BROWNISH,
                  margin: 0,
                  whiteSpace: "nowrap",
                }}
              >
                Writing Tools
              </p>
            </div>
          </div>

          {/* Tools list */}
          <div style={{ display: "flex", flexDirection: "column", flexShrink: 0 }}>
            {/* Standard interface — expanded, top */}
            <button
              onClick={() => navigate("/dont-stop-writing")}
              style={{
                backgroundColor: "rgba(255,255,255,0.4)",
                border: BORDER,
                borderRadius: "4px 4px 0 0",
                padding: "16px 24px",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                gap: "24px",
                alignItems: "flex-start",
                width: "227px",
                boxSizing: "border-box",
                textAlign: "left",
              }}
            >
              <p style={{ fontFamily: FONT_UI, fontSize: "13px", fontWeight: 600, color: "#11112d", margin: 0, lineHeight: "17.28px", whiteSpace: "nowrap" }}>
                standard interface
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "24px", width: "100%" }}>
                <p style={{ fontFamily: FONT_UI, fontSize: "12px", fontWeight: 600, color: "#434343", margin: 0, lineHeight: "17.28px", letterSpacing: "0.1152px" }}>
                  This is the standard writing tool we all know. Write here or try new ones to explore.
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
                  }}
                >
                  <p style={{ fontFamily: FONT_UI, fontSize: "14px", fontWeight: 600, color: BROWNISH, margin: 0, lineHeight: "17.28px", letterSpacing: "0.1152px", width: "157px", textAlign: "center" }}>
                    Schreiben
                  </p>
                </div>
              </div>
            </button>

            {/* Other tools */}
            {OTHER_TOOLS.map(({ label, path }, i) => (
              <button
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
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                  boxSizing: "border-box",
                  textAlign: "left",
                }}
              >
                <p style={{ fontFamily: FONT_UI, fontSize: "13px", fontWeight: 600, color: BROWNISH, margin: 0, lineHeight: "17.28px", whiteSpace: "nowrap" }}>
                  {label}
                </p>
              </button>
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
              flexShrink: 0,
            }}
          >
            <p style={{ fontFamily: FONT_UI, fontSize: "14px", fontWeight: 600, color: BROWNISH, margin: 0, lineHeight: "17.28px", letterSpacing: "0.1152px", textAlign: "center", flex: 1 }}>
              Explore all experiments
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showModal && <StartModal onClose={() => setShowModal(false)} />}
      </AnimatePresence>
    </>
  );
}
