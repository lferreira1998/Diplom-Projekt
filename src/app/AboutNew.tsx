import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { nodes as allNodes } from "./projects/abouttheproject/components/mindmap-data";

const BG = "#fcf6ef";
const PANEL = "#f9f1e8";
const PANEL_DARK = "#f3ebe0";
const INK = "#302e2c";
const TEXT = "#555555";
const MUTED = "#8f8f89";
const DASH = "#a4a4a4";
const DOT_GRID = "radial-gradient(circle, rgba(164,164,164,0.64) 1px, transparent 1.2px)";
const SERIF = "'freight-text-pro', 'EB Garamond', Georgia, serif";
const SANS = "'general-sans', 'Space Grotesk', sans-serif";
const MONO = "'Courier Prime', 'Courier New', monospace";

const CANVAS_W = 1700;
const CANVAS_H = 1000;

function DottedButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        height: 38,
        minWidth: 132,
        padding: "0 18px",
        border: `1px dashed ${DASH}`,
        borderRadius: 4,
        background: "rgba(249,241,232,0.78)",
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

export default function AboutNew() {
  const navigate = useNavigate();
  const [opened, setOpened] = useState<Set<string>>(
    () => new Set(allNodes.filter((node) => node.initiallyVisible).map((node) => node.id))
  );
  const [active, setActive] = useState<string | null>(null);

  const visibleIds = useMemo(() => {
    const ids = new Set<string>();
    allNodes.forEach((node) => node.initiallyVisible && ids.add(node.id));
    opened.forEach((id) => {
      ids.add(id);
      allNodes.find((node) => node.id === id)?.reveals?.forEach((revealedId) => ids.add(revealedId));
    });
    return ids;
  }, [opened]);

  const visibleNodes = allNodes.filter((node) => visibleIds.has(node.id));
  const activeNode = active ? allNodes.find((node) => node.id === active) ?? null : null;

  const lines = useMemo(() => {
    const result: { fx: number; fy: number; tx: number; ty: number }[] = [];
    visibleNodes.forEach((node) => {
      node.connections?.forEach((connection) => {
        const target = allNodes.find((candidate) => candidate.id === connection.to);
        if (!target || !visibleIds.has(target.id)) return;
        result.push({ fx: node.x, fy: node.y, tx: target.x, ty: target.y });
      });
    });
    return result;
  }, [visibleNodes, visibleIds]);

  const handleOpen = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    setActive(id);
    setOpened((previous) => new Set([...previous, id]));
  };

  return (
    <main
      onClick={() => setActive(null)}
      style={{
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        position: "relative",
        backgroundColor: BG,
        backgroundImage: DOT_GRID,
        backgroundSize: "42px 42px",
        color: TEXT,
        fontFamily: SANS,
      }}
    >
      <style>{`
        html, body, #root { height: 100%; overflow: hidden; background: ${BG}; }
        .aboutnew-node:hover p { color: ${INK} !important; text-decoration: underline; text-decoration-style: dashed; text-underline-offset: 5px; }
        .aboutnew-node:hover { transform: translate(-50%, -54%) !important; }
        .aboutnew-line { animation: aboutnewDash 22s linear infinite; }
        @keyframes aboutnewDash { to { stroke-dashoffset: -220; } }
      `}</style>

      <header
        onClick={(event) => event.stopPropagation()}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "24px 44px 16px",
          background: "linear-gradient(180deg, rgba(252,246,239,0.96), rgba(252,246,239,0.74))",
          backdropFilter: "blur(6px)",
        }}
      >
        <DottedButton onClick={() => navigate("/")}>Zurück</DottedButton>
        <div
          style={{
            flex: 1,
            height: 38,
            border: `1px dashed ${DASH}`,
            borderRadius: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(249,241,232,0.52)",
          }}
        >
          <span style={{ fontFamily: SERIF, color: INK, fontSize: 21, lineHeight: 1 }}>Shaping Thought — Research Map</span>
        </div>
        <DottedButton onClick={() => navigate("/playgroundnew1")}>Playground</DottedButton>
        <DottedButton onClick={() => navigate("/new")}>Tool bauen</DottedButton>
      </header>

      <div
        style={{
          position: "absolute",
          top: 78,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: "auto",
        }}
      >
        <div
          style={{
            position: "relative",
            width: CANVAS_W,
            height: CANVAS_H,
            minWidth: "100%",
            minHeight: "calc(100vh - 78px)",
          }}
        >
          <svg
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
              overflow: "visible",
            }}
          >
            <defs>
              <marker id="aboutnewArrow" markerWidth="10" markerHeight="10" refX="7" refY="4" orient="auto">
                <polyline points="1,1 7,4 1,7" fill="none" stroke={DASH} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
              </marker>
            </defs>
            <AnimatePresence>
              {lines.map((line) => (
                <motion.line
                  key={`${line.fx}-${line.fy}-${line.tx}-${line.ty}`}
                  className="aboutnew-line"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.42 }}
                  x1={line.fx}
                  y1={line.fy}
                  x2={line.tx}
                  y2={line.ty}
                  stroke={DASH}
                  strokeWidth={1}
                  strokeDasharray="5 8"
                  markerEnd="url(#aboutnewArrow)"
                />
              ))}
            </AnimatePresence>
          </svg>

          <AnimatePresence>
            {visibleNodes.map((node) => {
              const isMain = node.nodeType === "main";
              const isActive = active === node.id;
              return (
                <motion.button
                  key={node.id}
                  className="aboutnew-node"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.26, ease: "easeOut" }}
                  onClick={(event) => handleOpen(node.id, event)}
                  style={{
                    position: "absolute",
                    left: node.x,
                    top: node.y,
                    transform: "translate(-50%, -50%)",
                    padding: isMain ? "15px 18px" : "12px 14px",
                    minWidth: isMain ? 170 : 132,
                    maxWidth: isMain ? 230 : 190,
                    background: isActive ? PANEL_DARK : "rgba(249,241,232,0.68)",
                    border: `1px dashed ${isActive ? INK : DASH}`,
                    borderRadius: isMain ? 999 : 8,
                    cursor: "pointer",
                    boxShadow: isActive ? "0 18px 58px rgba(48,46,44,0.08)" : "none",
                    transition: "background 160ms ease, border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontFamily: isMain ? SERIF : MONO,
                      fontSize: isMain ? 22 : 12,
                      lineHeight: isMain ? "24px" : "15px",
                      color: isMain ? INK : TEXT,
                      textAlign: "center",
                      whiteSpace: "pre-wrap",
                      textDecoration: isActive ? "underline" : "none",
                      textDecorationStyle: "dashed",
                      textUnderlineOffset: 5,
                    }}
                  >
                    {node.label}
                  </p>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {activeNode && (
          <motion.aside
            key={activeNode.id}
            initial={{ opacity: 0, x: 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 18 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={(event) => event.stopPropagation()}
            style={{
              position: "fixed",
              zIndex: 30,
              top: 94,
              right: 44,
              bottom: 28,
              width: 320,
              boxSizing: "border-box",
              background: "rgba(249,241,232,0.92)",
              border: `1px dashed ${DASH}`,
              borderRadius: 10,
              padding: "20px 22px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
              overflowY: "auto",
              boxShadow: "0 24px 90px rgba(48,46,44,0.1)",
              backdropFilter: "blur(8px)",
            }}
          >
            <p style={{ margin: 0, fontFamily: SERIF, fontSize: 30, lineHeight: "33px", color: INK }}>
              {activeNode.title}
            </p>

            <div style={{ height: 0, borderTop: `1px dashed ${DASH}` }} />

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {activeNode.body.map((paragraph, index) => {
                if (!paragraph) return <div key={index} style={{ height: 4 }} />;
                const isHeading = paragraph === paragraph.toUpperCase() && paragraph.length < 60;
                const isDash = paragraph.startsWith("—") || paragraph.startsWith("–");
                return (
                  <p
                    key={index}
                    style={{
                      margin: 0,
                      fontFamily: isHeading ? MONO : isDash ? SANS : MONO,
                      fontSize: isHeading ? 10 : 12,
                      lineHeight: isHeading ? "14px" : "20px",
                      color: isHeading ? MUTED : isDash ? TEXT : "#3d3a36",
                      letterSpacing: isHeading ? "0.12em" : 0,
                      paddingLeft: isDash ? 4 : 0,
                    }}
                  >
                    {paragraph}
                  </p>
                );
              })}
            </div>

            {activeNode.reveals && activeNode.reveals.length > 0 && (
              <>
                <div style={{ height: 0, borderTop: `1px dashed ${DASH}` }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <p style={{ margin: 0, fontFamily: MONO, fontSize: 10, letterSpacing: "0.12em", color: MUTED }}>
                    FÜHRT WEITER ZU
                  </p>
                  {activeNode.reveals.map((revealedId) => {
                    const target = allNodes.find((node) => node.id === revealedId);
                    if (!target) return null;
                    return (
                      <button
                        key={revealedId}
                        onClick={(event) => handleOpen(revealedId, event)}
                        style={{
                          fontFamily: target.nodeType === "main" ? SERIF : MONO,
                          fontSize: target.nodeType === "main" ? 17 : 12,
                          lineHeight: target.nodeType === "main" ? "20px" : "16px",
                          color: target.nodeType === "main" ? INK : TEXT,
                          background: "none",
                          border: "none",
                          padding: 0,
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        {target.label}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </motion.aside>
        )}
      </AnimatePresence>
    </main>
  );
}
