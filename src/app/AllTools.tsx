import { useState } from "react";
import { useNavigate } from "react-router";
import { getSavedTools } from "./utils/storage";

const FONT_EXT  = "'Area Inktrap Extended', 'Area Inktrap', sans-serif";
const FONT_BODY = "'Courier Prime', 'Courier New', monospace";
const NAVY      = "#11112d";
const DASH      = "#b4b3b3";
const BG        = "#f5f5f6";

export default function AllTools() {
  const navigate = useNavigate();
  const [tools]  = useState(() => getSavedTools());

  return (
    <div style={{ width: "100vw", minHeight: "100vh", backgroundColor: BG, boxSizing: "border-box" }}>

      {/* Header — same pattern as other pages */}
      <div style={{
        display: "flex", alignItems: "center", gap: 16,
        padding: "24px 48px 16px 48px",
      }}>
        <button
          onClick={() => navigate("/")}
          style={{
            width: 271, height: 40, flexShrink: 0,
            backgroundColor: BG, border: `1px dashed ${DASH}`,
            fontFamily: FONT_EXT, fontSize: 12, color: NAVY,
            cursor: "pointer", letterSpacing: "-0.48px",
          }}
        >
          Zurück
        </button>
        <div style={{
          flex: 1, height: 40, border: `1px dashed ${DASH}`,
          padding: "0 24px", display: "flex", alignItems: "center",
        }}>
          <span style={{
            fontFamily: FONT_EXT, fontSize: 12, color: NAVY,
            letterSpacing: "-0.48px", textAlign: "center", width: "100%",
            whiteSpace: "nowrap",
          }}>
            All Tools
          </span>
        </div>
        {/* spacer to match Zurück width */}
        <div style={{ width: 271, height: 40, flexShrink: 0 }} />
      </div>

      {/* List */}
      <div style={{ padding: "16px 48px 48px 48px" }}>
        {tools.length === 0 ? (
          <div style={{
            border: `1px dashed ${DASH}`,
            padding: "32px 24px",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <p style={{
              fontFamily: FONT_BODY, fontSize: 12, color: DASH,
              margin: 0, letterSpacing: "0.3264px",
            }}>
              Noch keine Tools gespeichert. Erstelle eines im parametrischen Tool.
            </p>
          </div>
        ) : (
          tools.map((tool, i) => (
            <div
              key={tool.id}
              style={{
                border: `1px dashed ${DASH}`,
                borderTop: i === 0 ? `1px dashed ${DASH}` : "none",
                padding: "20px 24px",
                display: "flex", flexDirection: "column", gap: 6,
              }}
            >
              <p style={{
                fontFamily: FONT_BODY, fontSize: 14,
                color: NAVY, margin: 0, letterSpacing: "-0.14px",
              }}>
                {tool.name}
              </p>
              {tool.description ? (
                <p style={{
                  fontFamily: FONT_BODY, fontSize: 12,
                  color: "#5c5c6c", margin: 0,
                  lineHeight: "19.8px", letterSpacing: "0.12px",
                }}>
                  {tool.description}
                </p>
              ) : null}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
