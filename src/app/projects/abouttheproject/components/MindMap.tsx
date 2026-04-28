import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { nodes as allNodes } from "./mindmap-data";

const COURIER = "'Courier Prime', 'Courier New', monospace";
const MONO    = "'IBM Plex Mono', monospace";
const INKTRAP = "'Area Inktrap Extended', 'Area Inktrap', sans-serif";

const DASH      = "#b4b3b3";
const TEXT_MAIN = "#11112d";
const TEXT_SUB  = "#5c5c6c";
const TEXT_BODY = "#2e2e2c";
const TEXT_DASH = "#6a6a66";
const META      = "#8a8a82";
const BG        = "#f5f5f6";

export function MindMap() {
  const navigate = useNavigate();
  const [opened, setOpened] = useState<Set<string>>(
    () => new Set(allNodes.filter((n) => n.initiallyVisible).map((n) => n.id))
  );
  const [active, setActive] = useState<string | null>(null);

  const visibleIds = useMemo(() => {
    const v = new Set<string>();
    allNodes.forEach((n) => n.initiallyVisible && v.add(n.id));
    opened.forEach((id) => {
      v.add(id);
      allNodes.find((x) => x.id === id)?.reveals?.forEach((r) => v.add(r));
    });
    return v;
  }, [opened]);

  const visibleNodes = allNodes.filter((n) => visibleIds.has(n.id));
  const activeNode = active ? allNodes.find((n) => n.id === active) ?? null : null;

  const handleOpen = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActive(id);
    setOpened((prev) => new Set([...prev, id]));
  };

  type Line = { fx: number; fy: number; tx: number; ty: number; main: boolean };
  const lines = useMemo<Line[]>(() => {
    const result: Line[] = [];
    visibleNodes.forEach((n) => {
      n.connections?.forEach((c) => {
        const t = allNodes.find((x) => x.id === c.to);
        if (!t || !visibleIds.has(t.id)) return;
        result.push({
          fx: n.x, fy: n.y, tx: t.x, ty: t.y,
          main: n.nodeType === "main" && t.nodeType === "main",
        });
      });
    });
    return result;
  }, [visibleNodes, visibleIds]);

  return (
    <div
      style={{
        position: "relative", width: "100%", height: "100%",
        overflow: "hidden", userSelect: "none", backgroundColor: BG,
      }}
      onClick={() => setActive(null)}
    >
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div
        style={{
          position: "absolute", left: 0, right: 0, top: 0, zIndex: 20,
          display: "flex", alignItems: "center", gap: 16,
          padding: "24px 48px 16px 48px",
        }}
      >
        {/* Zurück */}
        <button
          onClick={(e) => { e.stopPropagation(); navigate("/"); }}
          style={{
            width: 271, height: 40, flexShrink: 0,
            backgroundColor: BG,
            border: `1px dashed ${DASH}`,
            fontFamily: INKTRAP,
            fontSize: 12,
            color: TEXT_MAIN,
            cursor: "pointer",
          }}
        >
          Zurück
        </button>

        {/* Title */}
        <div
          style={{
            flex: 1, height: 40,
            border: `1px dashed ${DASH}`,
            padding: "0 24px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <span style={{
            fontFamily: INKTRAP,
            fontSize: 12,
            color: TEXT_MAIN,
            letterSpacing: "-0.04em",
            textAlign: "center",
          }}>
            Shaping Thought — Research Map
          </span>
        </div>

        {/* Information */}
        <button
          onClick={(e) => e.stopPropagation()}
          style={{
            width: 271, height: 40, flexShrink: 0,
            backgroundColor: BG,
            border: `1px dashed ${DASH}`,
            padding: "0 24px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            fontFamily: INKTRAP,
            fontSize: 12,
            color: TEXT_MAIN,
            cursor: "pointer",
          }}
        >
          <span>Information</span>
          <span style={{ display: "inline-block", transform: "rotate(-45deg)", fontSize: 14, lineHeight: 1 }}>+</span>
        </button>
      </div>

      {/* ── Connection lines ─────────────────────────────────────────────── */}
      <svg
        style={{
          position: "absolute", inset: 0, width: "100%", height: "100%",
          pointerEvents: "none", overflow: "visible",
        }}
      >
        <defs>
          <marker id="dashArr" markerWidth="10" markerHeight="10" refX="8" refY="4" orient="auto">
            <polyline
              points="1,1 7,4 1,7"
              fill="none"
              stroke={DASH}
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </marker>
        </defs>
        <AnimatePresence>
          {lines.map((l, i) => (
            <motion.line
              key={`${l.fx}-${l.fy}-${l.tx}-${l.ty}-${i}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              x1={`${l.fx}%`} y1={`${l.fy}%`}
              x2={`${l.tx}%`} y2={`${l.ty}%`}
              stroke={DASH}
              strokeWidth={1}
              strokeDasharray="4 4"
              markerEnd="url(#dashArr)"
            />
          ))}
        </AnimatePresence>
      </svg>

      {/* ── Nodes ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {visibleNodes.map((n) => {
          const isMain   = n.nodeType === "main";
          const isActive = active === n.id;
          return (
            <motion.button
              key={n.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              onClick={(e) => handleOpen(n.id, e)}
              style={{
                position: "absolute",
                left: `${n.x}%`,
                top: `${n.y}%`,
                transform: "translate(-50%, -50%)",
                padding: 16,
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              <p
                style={{
                  fontFamily: COURIER,
                  fontSize: isMain ? 14 : 12,
                  lineHeight: "14.3px",
                  color: isMain ? TEXT_MAIN : TEXT_SUB,
                  textAlign: "center",
                  whiteSpace: "pre",
                  margin: 0,
                  textDecoration: isActive ? "underline" : "none",
                  textDecorationStyle: "dashed",
                  textUnderlineOffset: 4,
                }}
              >
                {n.label}
              </p>
            </motion.button>
          );
        })}
      </AnimatePresence>

      {/* ── Right detail panel ───────────────────────────────────────────── */}
      <AnimatePresence>
        {activeNode && (
          <motion.div
            key={activeNode.id}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "absolute", zIndex: 30,
              top: 80, right: 48, bottom: 24, width: 271,
              backgroundColor: BG,
              border: `1px dashed ${DASH}`,
              padding: "16px 24px",
              display: "flex", flexDirection: "column", gap: 16,
              overflowY: "auto", scrollbarWidth: "none",
              boxSizing: "border-box",
            }}
          >
            {/* Title */}
            <p style={{
              fontFamily: COURIER, fontSize: 14.5, lineHeight: "20.01px",
              color: TEXT_MAIN, whiteSpace: "pre-wrap", margin: 0,
            }}>
              {activeNode.title}
            </p>

            <div style={{ height: 0, borderTop: `1px dashed ${DASH}` }} />

            {/* Body */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {activeNode.body.map((p, i) => {
                if (!p) return <div key={i} style={{ height: 4 }} />;
                const isHeading = p === p.toUpperCase() && p.length < 60;
                const isDash    = p.startsWith("—") || p.startsWith("–");
                return (
                  <p key={i} style={{
                    fontFamily: isHeading ? MONO : COURIER,
                    fontSize: isHeading ? 7.5 : 12,
                    lineHeight: isHeading ? "10.5px" : "19.8px",
                    color: isHeading ? META : isDash ? TEXT_DASH : TEXT_BODY,
                    letterSpacing: isHeading ? "0.18em" : "0.01em",
                    paddingLeft: isDash ? 4 : 0,
                    margin: 0,
                  }}>
                    {p}
                  </p>
                );
              })}
            </div>

            {/* → führt weiter zu */}
            {activeNode.reveals && activeNode.reveals.length > 0 && (
              <>
                <div style={{ height: 0, borderTop: `1px dashed ${DASH}` }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <p style={{
                    fontFamily: MONO, fontSize: 7.5,
                    letterSpacing: "0.18em", color: META, margin: 0,
                  }}>
                    → FÜHRT WEITER ZU
                  </p>
                  {activeNode.reveals.map((r) => {
                    const t = allNodes.find((x) => x.id === r);
                    if (!t) return null;
                    const isMain = t.nodeType === "main";
                    return (
                      <button
                        key={r}
                        onClick={(e) => handleOpen(r, e)}
                        style={{
                          fontFamily: COURIER,
                          fontSize: isMain ? 12 : 11,
                          color: isMain ? TEXT_MAIN : TEXT_SUB,
                          background: "none", border: "none",
                          padding: 0, cursor: "pointer",
                          textAlign: "left",
                        }}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
