import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { deleteNewTool, getAllNewTools, type NewToolData } from "./utils/storage";
import New from "./New";

const LIGHT_BG = "#fcf6ef";
const PANEL_BG = "#f3ebe0";
const BORDER_COL = "#a4a4a4";
const LIGHT_TEXT = "#555555";
const MUTED = "#9a9daa";
const FONT_SERIF = "'freight-text-pro', 'EB Garamond', Georgia, serif";
const FONT_SANS = "'general-sans', 'Space Grotesk', sans-serif";

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

  const handleMouseLeave = () => {
    setHovered(false);
    setConfirming(false);
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        border: `1px dashed ${hovered ? LIGHT_TEXT : BORDER_COL}`,
        borderRadius: "8px",
        overflow: "hidden",
        background: LIGHT_BG,
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
            top: "8px",
            right: "8px",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            opacity: hovered ? 1 : 0,
            transition: "opacity 0.15s",
            zIndex: 2,
          }}
        >
          {confirming ? (
            <>
              <span style={{ fontFamily: FONT_SANS, fontSize: "11px", color: MUTED, whiteSpace: "nowrap" }}>Loschen?</span>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete();
                }}
                style={{
                  height: "22px",
                  padding: "0 8px",
                  background: "rgba(180,60,60,0.12)",
                  border: "1px dashed rgba(180,60,60,0.4)",
                  borderRadius: "4px",
                  cursor: "pointer",
                  outline: "none",
                  fontFamily: FONT_SANS,
                  fontSize: "11px",
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
                  height: "22px",
                  padding: "0 8px",
                  background: "rgba(252,246,239,0.85)",
                  border: `1px dashed ${BORDER_COL}`,
                  borderRadius: "4px",
                  cursor: "pointer",
                  outline: "none",
                  fontFamily: FONT_SANS,
                  fontSize: "11px",
                  color: MUTED,
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
                width: "24px",
                height: "24px",
                background: "rgba(252,246,239,0.85)",
                border: `1px dashed ${BORDER_COL}`,
                borderRadius: "50%",
                cursor: "pointer",
                outline: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: FONT_SANS,
                fontSize: "13px",
                color: MUTED,
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
          <span style={{ fontFamily: FONT_SERIF, fontSize: "36px", color: BORDER_COL, userSelect: "none" }}>+</span>
        )}
      </div>

      <div onClick={onClick} style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "4px", cursor: "pointer" }}>
        <span
          style={{
            fontFamily: FONT_SERIF,
            fontSize: "17px",
            color: LIGHT_TEXT,
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
              fontSize: "12px",
              color: MUTED,
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

function Section({ title, tools, onOpen, onDelete, emptyMsg }: {
  title: string;
  tools: NewToolData[];
  onOpen: (id: string) => void;
  onDelete?: (id: string) => void;
  emptyMsg: string;
}) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "12px",
          borderBottom: `1px dashed ${BORDER_COL}`,
          paddingBottom: "12px",
        }}
      >
        <span style={{ fontFamily: FONT_SERIF, fontSize: "28px", color: LIGHT_TEXT }}>{title}</span>
        <span style={{ fontFamily: FONT_SANS, fontSize: "13px", color: MUTED }}>{tools.length}</span>
      </div>
      {tools.length === 0 ? (
        <p style={{ fontFamily: FONT_SANS, fontSize: "14px", color: MUTED, margin: 0 }}>{emptyMsg}</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "16px",
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
  const [lang, setLang] = useState<"de" | "en">(() => (localStorage.getItem("appLang") as "de" | "en") ?? "de");

  const DE = lang === "de";

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
  const publicTools = tools.filter((tool) => tool.params.sessionId !== sessionId);

  const openTool = (id: string) => navigate(`/new?tool=${id}`);

  const handleDelete = (id: string) => {
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
  };

  return (
    <main
      style={{
        height: "100vh",
        width: "100vw",
        overflowX: "hidden",
        overflowY: "auto",
        position: "relative",
        background: LIGHT_BG,
        color: LIGHT_TEXT,
        fontFamily: FONT_SANS,
        WebkitOverflowScrolling: "touch",
      }}
    >
      <style>{`
        html, body, #root { height: 100%; overflow: hidden; }
      `}</style>

      <div
        style={{
          height: "100vh",
          width: "100%",
          flexShrink: 0,
          overflow: "hidden",
          position: "relative",
          transform: "translate(0, 0)",
        }}
      >
        <New />
      </div>

      <div style={{ paddingTop: "96px", paddingBottom: "64px", maxWidth: "1100px", margin: "0 auto", padding: "96px 24px 64px" }}>
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "200px" }}>
            <span style={{ fontFamily: FONT_SANS, fontSize: "14px", color: MUTED }}>{DE ? "Lädt..." : "Loading..."}</span>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "56px" }}>
            <Section
              title={DE ? "Meine Tools" : "My Tools"}
              tools={myTools}
              onOpen={openTool}
              onDelete={handleDelete}
              emptyMsg={DE ? "Noch keine Tools gespeichert. Erstelle eines unter /new." : "No tools saved yet. Create one at /new."}
            />
            <Section
              title={DE ? "Öffentliche Tools" : "Public Tools"}
              tools={publicTools}
              onOpen={openTool}
              emptyMsg={DE ? "Noch keine öffentlichen Tools vorhanden." : "No public tools yet."}
            />
          </div>
        )}
      </div>
    </main>
  );
}
