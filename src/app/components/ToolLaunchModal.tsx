import { useState, useEffect } from "react";
import type { NewToolData } from "../utils/storage";

const FONT_SANS  = "'az-sans', sans-serif";
const FONT_SERIF = "'az-serif', serif";

const QUICK_MINS = [5, 10, 15, 20, 30];

interface Props {
  tool: NewToolData | null;
  dark: boolean;
  onConfirm: (toolId: string, timerMinutes: number | null) => void;
  onClose: () => void;
}

export function ToolLaunchModal({ tool, dark, onConfirm, onClose }: Props) {
  const [timerOn, setTimerOn] = useState(false);
  const [minutes, setMinutes] = useState(10);

  useEffect(() => {
    if (!tool) return;
    setTimerOn(tool.params.timerEnabled === true);
    setMinutes(typeof tool.params.timerMinutes === "number" ? tool.params.timerMinutes : 10);
  }, [tool]);

  if (!tool) return null;

  const borderCol  = dark ? "rgba(240,232,220,0.16)" : "#a4a4a4";
  const textCol    = dark ? "#f0e8dc"                : "#555555";
  const mutedCol   = dark ? "rgba(240,232,220,0.4)"  : "#9a9daa";
  const cardBg     = dark ? "#1e1d1b"                : "#fcf6ef";
  const innerBg    = dark ? "rgba(240,232,220,0.04)" : "#f5f0ea";

  const name = tool.params.displayName || tool.name;
  const desc = tool.description || "";

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 300,
        background: dark ? "rgba(20,19,17,0.72)" : "rgba(200,195,188,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
        backdropFilter: "blur(5px)",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: cardBg,
          border: `1px dashed ${borderCol}`,
          borderRadius: "12px",
          padding: "24px",
          maxWidth: "380px",
          width: "90vw",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {/* Name + description */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ fontFamily: FONT_SANS, fontSize: "20px", fontWeight: 500, lineHeight: 1.25, color: textCol }}>
            {name}
          </span>
          {desc && (
            <span style={{ fontFamily: FONT_SANS, fontSize: "13px", color: mutedCol, lineHeight: 1.5 }}>
              {desc}
            </span>
          )}
        </div>

        {/* Divider */}
        <div style={{ borderTop: `1px dashed ${borderCol}` }} />

        {/* Timer section */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button
            onClick={() => setTimerOn(v => !v)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              background: innerBg,
              border: `1px dashed ${borderCol}`,
              borderRadius: "6px", padding: "10px 14px",
              cursor: "pointer", outline: "none", width: "100%",
            }}
          >
            <span style={{ fontFamily: FONT_SANS, fontSize: "15px", color: textCol }}>Timer</span>
            {/* Toggle pill */}
            <span style={{
              width: "34px", height: "18px", borderRadius: "9px", flexShrink: 0,
              background: timerOn
                ? (dark ? "#f0e8dc" : "#555555")
                : (dark ? "rgba(240,232,220,0.14)" : "rgba(164,164,164,0.35)"),
              position: "relative", transition: "background 0.16s",
              border: `1px dashed ${timerOn ? "transparent" : borderCol}`,
            }}>
              <span style={{
                position: "absolute",
                top: "2px", left: timerOn ? "17px" : "2px",
                width: "12px", height: "12px", borderRadius: "50%",
                background: timerOn ? (dark ? "#1e1d1b" : "#fcf6ef") : (dark ? "#f0e8dc" : "#a4a4a4"),
                transition: "left 0.16s",
              }} />
            </span>
          </button>

          {timerOn && (
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", paddingLeft: "2px" }}>
              {QUICK_MINS.map(m => (
                <button
                  key={m}
                  onClick={() => setMinutes(m)}
                  style={{
                    height: "28px", padding: "0 11px",
                    border: `1px ${minutes === m ? "solid" : "dashed"} ${minutes === m ? textCol : borderCol}`,
                    borderRadius: "4px",
                    background: minutes === m ? textCol : innerBg,
                    color: minutes === m ? (dark ? "#1e1d1b" : "#fcf6ef") : mutedCol,
                    fontFamily: FONT_SANS, fontSize: "12px",
                    cursor: "pointer", outline: "none",
                  }}
                >
                  {m} min
                </button>
              ))}
              <input
                type="number"
                min={1} max={180}
                value={minutes}
                onChange={e => setMinutes(Math.max(1, Math.min(180, Number(e.target.value))))}
                style={{
                  height: "28px", width: "58px", padding: "0 8px",
                  border: `1px dashed ${borderCol}`,
                  borderRadius: "4px", background: innerBg,
                  color: textCol, fontFamily: FONT_SANS, fontSize: "12px",
                  outline: "none", boxSizing: "border-box", textAlign: "center",
                }}
              />
            </div>
          )}
        </div>

        {/* CTA */}
        <button
          onClick={() => onConfirm(tool.id, timerOn ? (minutes || 10) : null)}
          style={{
            height: "44px",
            background: "transparent",
            color: textCol,
            border: `1px dashed ${borderCol}`,
            borderRadius: "6px",
            fontFamily: FONT_SERIF,
            fontSize: "19px",
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
