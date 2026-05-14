import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { useNavigate } from "react-router";
import { deleteNewTool, getAllNewTools, type NewToolData } from "./utils/storage";

const LIGHT_BG = "#fcf6ef";
const PANEL_BG = "#f3ebe0";
const TOOL_BG = "#f9f1e8";
const BORDER_COL = "#a4a4a4";
const LIGHT_TEXT = "#555555";
const MUTED = "#9a9daa";
const HEADLINE_TEXT = "#302e2c";
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

function ToolShape({ label, style, textStyle, href, video }: {
  label: string;
  style: CSSProperties;
  textStyle?: CSSProperties;
  href: string;
  video: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);

  function prepareVideo(target: HTMLVideoElement) {
    target.muted = true;
    target.defaultMuted = true;
    target.playsInline = true;
    if (target.readyState === 0) target.load();
  }

  function playPreview() {
    setIsPreviewing(true);
    const target = videoRef.current;
    if (!target) return;
    prepareVideo(target);
    try {
      if (target.readyState > 0) target.currentTime = 0;
    } catch {
      // Browser may block seeking before metadata is ready.
    }
    const play = () => target.play().catch(() => undefined);
    play();
    if (target.readyState < 2) target.addEventListener("canplay", play, { once: true });
  }

  function stopPreview() {
    setIsPreviewing(false);
    const target = videoRef.current;
    if (!target) return;
    target.pause();
    try {
      if (target.readyState > 0) target.currentTime = 0;
    } catch {
      // Browser may block seeking before metadata is ready.
    }
  }

  return (
    <a
      className="playground-tool-shape"
      href={href}
      onPointerEnter={playPreview}
      onPointerLeave={stopPreview}
      onFocus={playPreview}
      onBlur={stopPreview}
      style={{
        position: "absolute",
        border: `1px dashed ${BORDER_COL}`,
        color: LIGHT_TEXT,
        textDecoration: "none",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT_SANS,
        fontSize: 17,
        fontWeight: 400,
        lineHeight: "normal",
        background: TOOL_BG,
        overflow: "hidden",
        transformOrigin: "center",
        ...style,
      }}
    >
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        preload="auto"
        onLoadedMetadata={(event) => prepareVideo(event.currentTarget)}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: isPreviewing ? 1 : 0,
          transition: "opacity 120ms ease",
          pointerEvents: "none",
          transform: "translateZ(0)",
          zIndex: 0,
        }}
      >
        <source src={`/Diplom-Projekt/videos/${video}.mp4`} type="video/mp4" />
        <source src={`/Diplom-Projekt/videos/${video}.webm`} type="video/webm" />
      </video>
      <span
        className="playground-tool-label"
        style={{
          position: "relative",
          zIndex: 1,
          transition: "opacity 120ms ease",
          ...textStyle,
        }}
      >
        {label}
      </span>
    </a>
  );
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
              <span style={{ fontFamily: FONT_SANS, fontSize: "11px", color: MUTED, whiteSpace: "nowrap" }}>Löschen?</span>
              <button
                onClick={(event) => { event.stopPropagation(); onDelete(); }}
                style={{ height: "22px", padding: "0 8px", background: "rgba(180,60,60,0.12)", border: "1px dashed rgba(180,60,60,0.4)", borderRadius: "4px", cursor: "pointer", outline: "none", fontFamily: FONT_SANS, fontSize: "11px", color: "#b43c3c" }}
              >
                Ja
              </button>
              <button
                onClick={(event) => { event.stopPropagation(); setConfirming(false); }}
                style={{ height: "22px", padding: "0 8px", background: "rgba(252,246,239,0.85)", border: `1px dashed ${BORDER_COL}`, borderRadius: "4px", cursor: "pointer", outline: "none", fontFamily: FONT_SANS, fontSize: "11px", color: MUTED }}
              >
                Nein
              </button>
            </>
          ) : (
            <button
              onClick={(event) => { event.stopPropagation(); setConfirming(true); }}
              title="Aus meinen Tools entfernen"
              style={{ width: "24px", height: "24px", background: "rgba(252,246,239,0.85)", border: `1px dashed ${BORDER_COL}`, borderRadius: "50%", cursor: "pointer", outline: "none", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT_SANS, fontSize: "13px", color: MUTED, lineHeight: 1 }}
            >
              x
            </button>
          )}
        </div>
      )}
      <div onClick={onClick} style={{ width: "100%", aspectRatio: "3 / 2", background: PANEL_BG, overflow: "hidden", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
        {tool.params.asciiImage ? (
          <img src={tool.params.asciiImage} alt={tool.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <span style={{ fontFamily: FONT_SERIF, fontSize: "36px", color: BORDER_COL, userSelect: "none" }}>+</span>
        )}
      </div>
      <div onClick={onClick} style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: "4px", cursor: "pointer" }}>
        <span style={{ fontFamily: FONT_SERIF, fontSize: "17px", color: LIGHT_TEXT, lineHeight: "1.25", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {tool.name || "Unnamed Tool"}
        </span>
        {tool.description && (
          <span style={{ fontFamily: FONT_SANS, fontSize: "12px", color: MUTED, lineHeight: "1.45", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" as const, overflow: "hidden" }}>
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
      <div style={{ display: "flex", alignItems: "baseline", gap: "12px", borderBottom: `1px dashed ${BORDER_COL}`, paddingBottom: "12px" }}>
        <span style={{ fontFamily: FONT_SERIF, fontSize: "28px", color: LIGHT_TEXT }}>{title}</span>
        <span style={{ fontFamily: FONT_SANS, fontSize: "13px", color: MUTED }}>{tools.length}</span>
      </div>
      {tools.length === 0 ? (
        <p style={{ fontFamily: FONT_SANS, fontSize: "14px", color: MUTED, margin: 0 }}>{emptyMsg}</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "16px" }}>
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
      ? tools.filter((tool) => tool.params.sessionId === target.params.sessionId && (tool.params.displayName || tool.name) === (target.params.displayName || target.name))
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
        .playground-tool-shape:hover .playground-tool-label,
        .playground-tool-shape:focus-visible .playground-tool-label { opacity: 0 !important; }
      `}</style>

      <section
        aria-label="Writing tools playground"
        style={{
          position: "relative",
          minHeight: "100vh",
          overflow: "hidden",
          backgroundColor: LIGHT_BG,
          backgroundImage: "radial-gradient(circle, rgba(164,164,164,0.7) 1px, transparent 1.2px)",
          backgroundSize: "42px 42px",
        }}
      >
        <div style={{ position: "absolute", top: 44, right: 44, zIndex: 5 }}>
          <button
            onClick={() => setLang((current) => { const next = current === "de" ? "en" : "de"; localStorage.setItem("appLang", next); return next; })}
            style={{ height: 31, border: `1px dashed ${BORDER_COL}`, borderRadius: 4, background: "rgba(241,235,228,0.2)", color: LIGHT_TEXT, fontFamily: FONT_SANS, fontSize: 15, padding: "0 12px", cursor: "pointer", outline: "none" }}
          >
            {lang === "de" ? "DE" : "ENG"}
          </button>
        </div>

        <div style={{ position: "absolute", left: "50%", top: "50%", width: 1680, height: 858, transform: "translate(-50%, -50%)" }}>
          <ToolShape label="...without stopping" href="/Diplom-Projekt/dont-stop-writing" video="without-stopping" style={{ left: 40, top: 197, width: 236, height: 233, transform: "rotate(5.1deg)", borderRadius: 200 }} textStyle={{ transform: "rotate(-5.1deg)" }} />
          <ToolShape label="...uninvited thoughts" href="/Diplom-Projekt/uninvited-thoughts" video="uninvited-thoughts" style={{ left: 420, top: 57, width: 317, height: 155, transform: "rotate(-9.25deg)", borderRadius: 4 }} textStyle={{ transform: "rotate(9.25deg)" }} />
          <ToolShape label="...off the grid" href="/Diplom-Projekt/off-the-grid" video="off-the-grid" style={{ left: 1220, top: 112, width: 251, height: 163, transform: "rotate(4.18deg)", borderRadius: 4, justifyContent: "flex-start", alignItems: "flex-end", padding: 12 }} textStyle={{ transform: "rotate(-4.18deg)", marginBottom: 0 }} />
          <ToolShape label="...blind & then witness" href="/Diplom-Projekt/anonymously-in-public" video="blind-then-witness" style={{ left: 213, top: 579, width: 324, height: 163, transform: "rotate(6.45deg)", borderRadius: 100 }} textStyle={{ transform: "rotate(-6.45deg)" }} />
          <ToolShape label="...with visible corrections" href="/Diplom-Projekt/loschen-korrigieren" video="visible-corrections" style={{ left: 774, top: 526, width: 363, height: 174, borderRadius: "40px 4px 40px 4px" }} />
          <ToolShape label="...in a spiral" href="/Diplom-Projekt/in-a-spiral" video="in-a-spiral" style={{ left: 1321, top: 414, width: 211, height: 309, transform: "rotate(12.11deg)", borderRadius: 200 }} textStyle={{ transform: "rotate(-12.11deg)" }} />

          <div style={{ position: "absolute", left: 456, top: 300, width: 768 }}>
            <h1 style={{ margin: 0, fontFamily: FONT_SERIF, fontSize: 36, lineHeight: "45px", fontWeight: 400, color: HEADLINE_TEXT, textAlign: "center", whiteSpace: "nowrap" }}>
              Writing Tools shape how we think & write.<br />
              Explore Writing Tools that break their rules.
            </h1>
          </div>
        </div>
      </section>

      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "96px 24px 64px" }}>
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
