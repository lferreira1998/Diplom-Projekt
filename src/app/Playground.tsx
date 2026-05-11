import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { getAllNewTools, type NewToolData } from "./utils/storage";

const LIGHT_BG   = "#fcf6ef";
const PANEL_BG   = "#f3ebe0";
const BORDER_COL = "#a4a4a4";
const LIGHT_TEXT = "#555555";
const MUTED      = "#9a9daa";
const FONT_SERIF = "'freight-text-pro', 'EB Garamond', Georgia, serif";
const FONT_SANS  = "'general-sans', 'Space Grotesk', sans-serif";

function getSessionId(): string {
  const key = "diplom_session_id";
  let id = localStorage.getItem(key);
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(key, id); }
  return id;
}

// ── Tool Card ─────────────────────────────────────────────────────────────────
function ToolCard({ tool, onClick }: { tool: NewToolData; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor: "pointer",
        border: `1px dashed ${hovered ? LIGHT_TEXT : BORDER_COL}`,
        borderRadius: "8px",
        overflow: "hidden",
        background: LIGHT_BG,
        display: "flex",
        flexDirection: "column",
        transition: "border-color 0.15s, transform 0.15s",
        transform: hovered ? "translateY(-2px)" : "none",
        boxSizing: "border-box",
      }}
    >
      {/* Image area */}
      <div style={{
        width: "100%",
        aspectRatio: "3 / 2",
        background: PANEL_BG,
        overflow: "hidden",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        {tool.params.asciiImage ? (
          <img
            src={tool.params.asciiImage}
            alt={tool.name}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <span style={{ fontFamily: FONT_SERIF, fontSize: "36px", color: BORDER_COL, userSelect: "none" }}>✦</span>
        )}
      </div>

      {/* Info */}
      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "4px" }}>
        <span style={{
          fontFamily: FONT_SERIF, fontSize: "17px", color: LIGHT_TEXT,
          lineHeight: "1.25", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>
          {tool.name || "Unnamed Tool"}
        </span>
        {tool.description && (
          <span style={{
            fontFamily: FONT_SANS, fontSize: "12px", color: MUTED,
            lineHeight: "1.45",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical" as const,
            overflow: "hidden",
          }}>
            {tool.description}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Section ───────────────────────────────────────────────────────────────────
function Section({ title, tools, onOpen, emptyMsg }: {
  title: string;
  tools: NewToolData[];
  onOpen: (id: string) => void;
  emptyMsg: string;
}) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div style={{
        display: "flex", alignItems: "baseline", gap: "12px",
        borderBottom: `1px dashed ${BORDER_COL}`, paddingBottom: "12px",
      }}>
        <span style={{ fontFamily: FONT_SERIF, fontSize: "28px", color: LIGHT_TEXT }}>{title}</span>
        <span style={{ fontFamily: FONT_SANS, fontSize: "13px", color: MUTED }}>{tools.length}</span>
      </div>
      {tools.length === 0 ? (
        <p style={{ fontFamily: FONT_SANS, fontSize: "14px", color: MUTED, margin: 0 }}>{emptyMsg}</p>
      ) : (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
          gap: "16px",
        }}>
          {tools.map(tool => (
            <ToolCard key={tool.id} tool={tool} onClick={() => onOpen(tool.id)} />
          ))}
        </div>
      )}
    </section>
  );
}

// ── Playground page ───────────────────────────────────────────────────────────
export default function Playground() {
  const navigate = useNavigate();
  const sessionId = useMemo(() => getSessionId(), []);
  const [tools, setTools]   = useState<NewToolData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lang, setLang]     = useState<"de" | "en">("de");

  const DE = lang === "de";

  useEffect(() => {
    getAllNewTools()
      .then(setTools)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const myToolsRaw = tools.filter(t => t.params.sessionId === sessionId);
  const myToolsMap = new Map<string, NewToolData>();
  for (const tool of myToolsRaw) {
    const key = tool.params.displayName || tool.name || tool.id;
    const existing = myToolsMap.get(key);
    if (!existing || tool.savedAt > existing.savedAt) myToolsMap.set(key, tool);
  }
  const myTools  = Array.from(myToolsMap.values()).sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  const allTools = tools.filter(t => t.params.sessionId !== sessionId);

  const openTool = (id: string) => navigate(`/new?tool=${id}`);

  return (
    <div style={{
      minHeight: "100vh",
      background: LIGHT_BG,
      boxSizing: "border-box",
      fontFamily: FONT_SANS,
    }}>
      {/* Top bar */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, height: "64px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 24px",
        background: LIGHT_BG,
        borderBottom: `1px dashed ${BORDER_COL}`,
        zIndex: 10,
        boxSizing: "border-box",
      }}>
        <button
          onClick={() => navigate("/new")}
          style={{
            background: "transparent", border: `1px dashed ${BORDER_COL}`,
            borderRadius: "4px", cursor: "pointer", outline: "none",
            fontFamily: FONT_SANS, fontSize: "14px", color: LIGHT_TEXT,
            height: "31px", padding: "0 14px",
          }}
        >← {DE ? "Zurück" : "Back"}</button>

        <span style={{ fontFamily: FONT_SERIF, fontSize: "20px", color: LIGHT_TEXT }}>Playground</span>

        <button
          onClick={() => setLang(l => l === "de" ? "en" : "de")}
          style={{
            background: "transparent", border: `1px dashed ${BORDER_COL}`,
            borderRadius: "4px", cursor: "pointer", outline: "none",
            fontFamily: FONT_SANS, fontSize: "14px", color: LIGHT_TEXT,
            height: "31px", padding: "0 12px",
          }}
        >{lang === "de" ? "DE" : "ENG"}</button>
      </div>

      {/* Content */}
      <div style={{ paddingTop: "96px", paddingBottom: "64px", maxWidth: "1100px", margin: "0 auto", padding: "96px 24px 64px" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px" }}>
            <span style={{ fontFamily: FONT_SANS, fontSize: "14px", color: MUTED }}>
              {DE ? "Lädt…" : "Loading…"}
            </span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "56px" }}>
            <Section
              title={DE ? "Meine Tools" : "My Tools"}
              tools={myTools}
              onOpen={openTool}
              emptyMsg={DE
                ? "Noch keine Tools gespeichert. Erstelle eines unter /new."
                : "No tools saved yet. Create one at /new."}
            />
            <Section
              title={DE ? "Alle Tools" : "All Tools"}
              tools={allTools}
              onOpen={openTool}
              emptyMsg={DE ? "Noch keine Tools vorhanden." : "No tools yet."}
            />
          </div>
        )}
      </div>
    </div>
  );
}
