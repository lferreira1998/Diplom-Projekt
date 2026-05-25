import { useState, useEffect } from "react";
import type { NewToolData } from "../utils/storage";

const FONT_SANS  = "'Inter', 'Helvetica Neue', Arial, sans-serif";
const FONT_SERIF = "'Cormorant Garamond', Georgia, serif";

const QUICK_MINS = [5, 10, 15, 20, 30];

interface Props {
  tool: NewToolData | null;
  dark: boolean;
  onConfirm: (toolId: string, timerMinutes: number | null) => void;
  onClose: () => void;
}

export function ToolLaunchModal({ tool, dark, onConfirm, onClose }: Props) {
  const [timerOn, setTimerOn]   = useState(false);
  const [minutes, setMinutes]   = useState(10);

  useEffect(() => {
    if (!tool) return;
    const hasTimer = tool.params.timerEnabled === true;
    setTimerOn(hasTimer);
    setMinutes(typeof tool.params.timerMinutes === "number" ? tool.params.timerMinutes : 10);
  }, [tool]);

  if (!tool) return null;

  const bg      = dark ? "#1e1d1b" : "#f5f0ea";
  const cardBg  = dark ? "#2a2927" : "#fff";
  const text     = dark ? "#f0e8dc" : "#2a2a28";
  const muted    = dark ? "rgba(240,232,220,0.45)" : "#888";
  const border   = dark ? "rgba(240,232,220,0.14)" : "rgba(0,0,0,0.1)";
  const inputBg  = dark ? "#1e1d1b" : "#f5f0ea";
  const accent   = dark ? "#f0e8dc" : "#2a2a28";

  const handleConfirm = () => {
    onConfirm(tool.id, timerOn ? (minutes || 10) : null);
  };

  const name = tool.params.displayName || tool.name;
  const desc = tool.description || "";

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: dark ? "rgba(0,0,0,0.65)" : "rgba(0,0,0,0.25)",
        display: "flex", alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: cardBg,
          border: `1px solid ${border}`,
          borderRadius: "20px",
          padding: "40px 44px",
          maxWidth: "440px",
          width: "90vw",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: "28px",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <span style={{ fontFamily: FONT_SERIF, fontSize: "30px", lineHeight: 1.15, color: text }}>
            {name}
          </span>
          {desc && (
            <span style={{ fontFamily: FONT_SANS, fontSize: "14px", color: muted, lineHeight: 1.55 }}>
              {desc}
            </span>
          )}
        </div>

        {/* Timer */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <button
            onClick={() => setTimerOn(v => !v)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "transparent", border: `1px dashed ${border}`,
              borderRadius: "10px", padding: "12px 16px",
              cursor: "pointer", outline: "none",
            }}
          >
            <span style={{ fontFamily: FONT_SANS, fontSize: "14px", color: text }}>Timer</span>
            <span style={{
              width: "36px", height: "20px", borderRadius: "10px",
              background: timerOn ? accent : (dark ? "rgba(240,232,220,0.15)" : "rgba(0,0,0,0.12)"),
              position: "relative", transition: "background 0.18s", flexShrink: 0,
            }}>
              <span style={{
                position: "absolute",
                top: "3px", left: timerOn ? "19px" : "3px",
                width: "14px", height: "14px",
                borderRadius: "50%",
                background: timerOn ? (dark ? "#1e1d1b" : "#fff") : (dark ? "#f0e8dc" : "#fff"),
                transition: "left 0.18s",
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }} />
            </span>
          </button>

          {timerOn && (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {QUICK_MINS.map(m => (
                  <button
                    key={m}
                    onClick={() => setMinutes(m)}
                    style={{
                      height: "30px", padding: "0 12px",
                      border: `1px solid ${minutes === m ? accent : border}`,
                      borderRadius: "6px", background: minutes === m ? accent : "transparent",
                      color: minutes === m ? (dark ? "#1e1d1b" : "#fff") : muted,
                      fontFamily: FONT_SANS, fontSize: "13px",
                      cursor: "pointer", outline: "none", transition: "all 0.12s",
                    }}
                  >
                    {m} min
                  </button>
                ))}
                <input
                  type="number"
                  min={1}
                  max={180}
                  value={minutes}
                  onChange={e => setMinutes(Math.max(1, Math.min(180, Number(e.target.value))))}
                  style={{
                    height: "30px", width: "64px", padding: "0 10px",
                    border: `1px solid ${border}`,
                    borderRadius: "6px", background: inputBg,
                    color: text, fontFamily: FONT_SANS, fontSize: "13px",
                    outline: "none", boxSizing: "border-box", textAlign: "center",
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* CTA */}
        <button
          onClick={handleConfirm}
          style={{
            height: "48px",
            background: accent,
            color: dark ? "#1e1d1b" : "#fff",
            border: "none",
            borderRadius: "12px",
            fontFamily: FONT_SERIF,
            fontSize: "20px",
            letterSpacing: "0.01em",
            cursor: "pointer",
            outline: "none",
          }}
        >
          Think &amp; Write
        </button>
      </div>
    </div>
  );
}
