import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { deleteNewTool, getAllNewTools, type NewToolData } from "./utils/storage";
import New from "./New";

const FONT_SERIF = "'FreightTextCmp Pro', 'freight-text-compressed-pro', 'freight-text-pro', 'EB Garamond', Georgia, serif";
const FONT_SANS = "'General Sans', 'general-sans', 'Space Grotesk', sans-serif";
const PAGE_BG = "#fcf6ef";
const PANEL_BG = "#f3ebe0";
const TOOL_BG = "#f9f1e8";
const BORDER = "#a4a4a4";
const TOOL_TEXT = "#555555";
const MUTED_TEXT = "#9a9daa";
const HEADLINE_TEXT = "#302e2c";

function getSessionId(): string {
  const key = "diplom_session_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}


function ToolCard({ tool, onClick, onDelete }: { tool: NewToolData; onClick: () => void; onDelete?: () => void }) {
  const [hovered, setHovered] = useState(false);
  const [confirming, setConfirming] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setConfirming(false);
      }}
      style={{
        border: `1px dashed ${hovered ? TOOL_TEXT : BORDER}`,
        borderRadius: 8,
        overflow: "hidden",
        background: PAGE_BG,
        display: "flex",
        flexDirection: "column",
        transition: "border-color 0.15s, transform 0.15s",
        transform: hovered ? "translateY(-2px)" : "none",
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      {onDelete && (
        <div
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            display: "flex",
            alignItems: "center",
            gap: 4,
            opacity: hovered ? 1 : 0,
            transition: "opacity 0.15s",
            zIndex: 2,
          }}
        >
          {confirming ? (
            <>
              <span style={{ fontFamily: FONT_SANS, fontSize: 11, color: MUTED_TEXT, whiteSpace: "nowrap" }}>Loschen?</span>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete();
                }}
                style={{
                  height: 22,
                  padding: "0 8px",
                  background: "rgba(180,60,60,0.12)",
                  border: "1px dashed rgba(180,60,60,0.4)",
                  borderRadius: 4,
                  cursor: "pointer",
                  outline: "none",
                  fontFamily: FONT_SANS,
                  fontSize: 11,
                  color: "#b43c3c",
                }}
              >
                Ja
              </button>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  setConfirming(false);
                }}
                style={{
                  height: 22,
                  padding: "0 8px",
                  background: "rgba(252,246,239,0.85)",
                  border: `1px dashed ${BORDER}`,
                  borderRadius: 4,
                  cursor: "pointer",
                  outline: "none",
                  fontFamily: FONT_SANS,
                  fontSize: 11,
                  color: MUTED_TEXT,
                }}
              >
                Nein
              </button>
            </>
          ) : (
            <button
              onClick={(event) => {
                event.stopPropagation();
                setConfirming(true);
              }}
              title="Aus meinen Tools entfernen"
              style={{
                width: 24,
                height: 24,
                background: "rgba(252,246,239,0.85)",
                border: `1px dashed ${BORDER}`,
                borderRadius: "50%",
                cursor: "pointer",
                outline: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: FONT_SANS,
                fontSize: 13,
                color: MUTED_TEXT,
                lineHeight: 1,
              }}
            >
              x
            </button>
          )}
        </div>
      )}

      <div
        onClick={onClick}
        style={{
          width: "100%",
          aspectRatio: "3 / 2",
          background: PANEL_BG,
          overflow: "hidden",
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        {tool.params.asciiImage ? (
          <img src={tool.params.asciiImage} alt={tool.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <span style={{ fontFamily: FONT_SERIF, fontSize: 36, color: BORDER, userSelect: "none" }}>+</span>
        )}
      </div>

      <div onClick={onClick} style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 4, cursor: "pointer" }}>
        <span
          style={{
            fontFamily: FONT_SERIF,
            fontSize: 17,
            color: TOOL_TEXT,
            lineHeight: "1.25",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {tool.name || "Unnamed Tool"}
        </span>
        {tool.description && (
          <span
            style={{
              fontFamily: FONT_SANS,
              fontSize: 12,
              color: MUTED_TEXT,
              lineHeight: "1.45",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical" as const,
              overflow: "hidden",
            }}
          >
            {tool.description}
          </span>
        )}
      </div>
    </div>
  );
}

function ToolSection({ title, tools, onOpen, onDelete, emptyMessage }: {
  title: string;
  tools: NewToolData[];
  onOpen: (id: string) => void;
  onDelete?: (id: string) => void;
  emptyMessage: string;
}) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 12,
          borderBottom: `1px dashed ${BORDER}`,
          paddingBottom: 12,
        }}
      >
        <span style={{ fontFamily: FONT_SERIF, fontSize: 28, color: TOOL_TEXT }}>{title}</span>
        <span style={{ fontFamily: FONT_SANS, fontSize: 13, color: MUTED_TEXT }}>{tools.length}</span>
      </div>
      {tools.length === 0 ? (
        <p style={{ fontFamily: FONT_SANS, fontSize: 14, color: MUTED_TEXT, margin: 0 }}>{emptyMessage}</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: 16,
          }}
        >
          {tools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} onClick={() => onOpen(tool.id)} onDelete={onDelete ? () => onDelete(tool.id) : undefined} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function PlaygroundNew() {
  const navigate = useNavigate();
  const sessionId = useMemo(() => getSessionId(), []);
  const [tools, setTools] = useState<NewToolData[]>([]);
  const [loading, setLoading] = useState(true);
  const isDe = (localStorage.getItem("appLang") ?? "de") === "de";

  useEffect(() => {
    getAllNewTools()
      .then(setTools)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const myToolsRaw = tools.filter((tool) => tool.params.sessionId === sessionId);
  const myToolsMap = new Map<string, NewToolData>();
  for (const tool of myToolsRaw) {
    const key = tool.params.displayName || tool.name || tool.id;
    const existing = myToolsMap.get(key);
    if (!existing || tool.savedAt > existing.savedAt) myToolsMap.set(key, tool);
  }
  const myTools = Array.from(myToolsMap.values()).sort((a, b) => b.savedAt.localeCompare(a.savedAt));
  const allTools = tools.filter((tool) => tool.params.sessionId !== sessionId);

  function openTool(id: string) {
    navigate(`/new?tool=${id}`);
  }

  function handleDelete(id: string) {
    const target = tools.find((tool) => tool.id === id);
    const toDelete = target
      ? tools.filter(
          (tool) =>
            tool.params.sessionId === target.params.sessionId &&
            (tool.params.displayName || tool.name) === (target.params.displayName || target.name),
        )
      : tools.filter((tool) => tool.id === id);
    const ids = toDelete.map((tool) => tool.id);
    Promise.all(ids.map(deleteNewTool))
      .then(() => setTools((current) => current.filter((tool) => !ids.includes(tool.id))))
      .catch(console.error);
  }

  return (
    <main
      style={{
        height: "100vh",
        width: "100vw",
        overflowX: "hidden",
        overflowY: "auto",
        position: "relative",
        color: HEADLINE_TEXT,
        WebkitOverflowScrolling: "touch",
      }}
    >
      <style>{`
        html, body, #root { height: 100%; overflow: hidden; }
      `}</style>

      {/* Writing zone — New.tsx embedded via transform containment */}
      <div
        style={{
          height: "100vh",
          width: "100%",
          flexShrink: 0,
          overflow: "hidden",
          position: "relative",
          /* transform creates a new containing block for position:fixed children */
          transform: "translate(0, 0)",
        }}
      >
        <New />
      </div>

      {loading ? (
        <section style={{ padding: "70px 44px 86px", borderTop: `1px dashed ${BORDER}` }}>
          <div
            style={{
              maxWidth: 1500,
              margin: "0 auto",
              minHeight: 260,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: `1px dashed ${BORDER}`,
              borderRadius: 4,
              background: TOOL_BG,
            }}
          >
            <span style={{ fontFamily: FONT_SANS, fontSize: 15, color: MUTED_TEXT }}>{isDe ? "Lädt..." : "Loading..."}</span>
          </div>
        </section>
      ) : (
        <section style={{ padding: "70px 44px 86px", borderTop: `1px dashed ${BORDER}` }}>
          <div style={{ maxWidth: 1500, margin: "0 auto", display: "flex", flexDirection: "column", gap: 56 }}>
            <ToolSection
              title={isDe ? "Meine Tools" : "My Tools"}
              tools={myTools}
              onOpen={openTool}
              onDelete={handleDelete}
              emptyMessage={isDe ? "Noch keine Tools gespeichert. Erstelle eines unter /new." : "No tools saved yet. Create one at /new."}
            />
            <ToolSection
              title={isDe ? "Alle Tools" : "All Tools"}
              tools={allTools}
              onOpen={openTool}
              emptyMessage={isDe ? "Noch keine Tools vorhanden." : "No tools yet."}
            />
          </div>
        </section>
      )}
    </main>
  );
}
