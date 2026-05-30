import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { getSavedTools, deleteTool, type SavedTool } from "./utils/storage";

const FONT_EXT  = "'general-sans', sans-serif";
const FONT_BODY = "'general-sans', sans-serif";
const NAVY      = "#11112d";
const DASH      = "#b4b3b3";
const BG        = "#f5f5f6";

export default function AllTools() {
  const navigate = useNavigate();
  const [tools, setTools]   = useState<SavedTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    getSavedTools()
      .then(setTools)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = (tool: SavedTool) => {
    setDeletingId(tool.id);
    deleteTool(tool.id)
      .then(() => setTools(prev => prev.filter(t => t.id !== tool.id)))
      .catch(console.error)
      .finally(() => setDeletingId(null));
  };

  const copyLink = (tool: SavedTool) => {
    const url = `${window.location.origin}/parametrisches-tool?tool=${tool.id}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(tool.id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div style={{ width: "100vw", minHeight: "100vh", backgroundColor: BG, boxSizing: "border-box" }}>

      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "24px 48px 16px 48px" }}>
        <button
          onClick={() => navigate("/")}
          style={{ width: 271, height: 40, flexShrink: 0, backgroundColor: BG, border: `1px dashed ${DASH}`, fontFamily: FONT_EXT, fontSize: 12, color: NAVY, cursor: "pointer", letterSpacing: "-0.48px" }}
        >
          Zurück
        </button>
        <div style={{ flex: 1, height: 40, border: `1px dashed ${DASH}`, padding: "0 24px", display: "flex", alignItems: "center" }}>
          <span style={{ fontFamily: FONT_EXT, fontSize: 12, color: NAVY, letterSpacing: "-0.48px", textAlign: "center", width: "100%", whiteSpace: "nowrap" }}>
            All Tools
          </span>
        </div>
        <div style={{ width: 271, height: 40, flexShrink: 0 }} />
      </div>

      <div style={{ padding: "16px 48px 48px 48px" }}>
        {loading ? (
          <div style={{ border: `1px dashed ${DASH}`, padding: "32px 24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: DASH, margin: 0 }}>Lade Tools...</p>
          </div>
        ) : tools.length === 0 ? (
          <div style={{ border: `1px dashed ${DASH}`, padding: "32px 24px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: DASH, margin: 0, letterSpacing: "0.3264px" }}>
              Noch keine Tools gespeichert. Erstelle eines im parametrischen Tool.
            </p>
          </div>
        ) : (
          tools.map((tool, i) => (
            <div
              key={tool.id}
              style={{ border: `1px dashed ${DASH}`, borderTop: i === 0 ? `1px dashed ${DASH}` : "none", padding: "20px 24px", display: "flex", alignItems: "center", gap: 16 }}
            >
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
                <p style={{ fontFamily: FONT_BODY, fontSize: 14, color: NAVY, margin: 0, letterSpacing: "-0.14px" }}>{tool.name}</p>
                {tool.description ? (
                  <p style={{ fontFamily: FONT_BODY, fontSize: 12, color: "#5c5c6c", margin: 0, lineHeight: "19.8px", letterSpacing: "0.12px" }}>{tool.description}</p>
                ) : null}
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button
                  onClick={() => copyLink(tool)}
                  style={{ height: 36, padding: "0 16px", border: `1px dashed ${DASH}`, backgroundColor: BG, fontFamily: FONT_EXT, fontSize: 11, color: NAVY, cursor: "pointer", letterSpacing: "-0.44px", whiteSpace: "nowrap" }}
                >
                  {copiedId === tool.id ? "Kopiert ✓" : "Link kopieren"}
                </button>
                <button
                  onClick={() => navigate(`/parametrisches-tool?tool=${tool.id}`)}
                  style={{ height: 36, padding: "0 16px", border: `1px dashed ${NAVY}`, backgroundColor: NAVY, fontFamily: FONT_EXT, fontSize: 11, color: BG, cursor: "pointer", letterSpacing: "-0.44px", whiteSpace: "nowrap" }}
                >
                  Benutzen
                </button>
                <button
                  onClick={() => handleDelete(tool)}
                  disabled={deletingId === tool.id}
                  style={{ height: 36, padding: "0 12px", border: `1px dashed ${DASH}`, backgroundColor: BG, fontFamily: FONT_EXT, fontSize: 11, color: "#9a9a9a", cursor: deletingId === tool.id ? "wait" : "pointer", letterSpacing: "-0.44px", whiteSpace: "nowrap", opacity: deletingId === tool.id ? 0.5 : 1 }}
                >
                  ×
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
