import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { useNavigate } from "react-router";
import { deleteNewTool, getAllNewTools, type NewToolData } from "./utils/storage";

const FONT_SERIF = "'FreightTextCmp Pro', 'freight-text-compressed-pro', 'freight-text-pro', 'EB Garamond', Georgia, serif";
const FONT_SANS = "'General Sans', 'general-sans', 'Space Grotesk', sans-serif";
const PAGE_BG = "#fcf6ef";
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

function TopButton({ children, style, onClick }: { children: ReactNode; style?: CSSProperties; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        height: 31,
        border: `1px dashed ${BORDER}`,
        borderRadius: 4,
        background: "rgba(241,235,228,0.2)",
        color: TOOL_TEXT,
        fontFamily: FONT_SANS,
        fontSize: 15,
        fontWeight: 400,
        lineHeight: "normal",
        padding: "0 12px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        outline: "none",
        boxSizing: "border-box",
        ...style,
      }}
    >
      {children}
    </button>
  );
}

function HalfCircleIcon() {
  return (
    <span
      aria-hidden
      style={{
        width: 15.48,
        height: 15.98,
        border: `1.4px solid ${TOOL_TEXT}`,
        borderRadius: "50%",
        display: "inline-block",
        background: `linear-gradient(90deg, ${TOOL_TEXT} 0 50%, transparent 50% 100%)`,
      }}
    />
  );
}

function HiddenEyeIcon() {
  return (
    <svg width="18" height="13" viewBox="0 0 24 18" fill="none" aria-hidden>
      <path d="M2.4 9C4.8 5.7 8 4.05 12 4.05C16 4.05 19.2 5.7 21.6 9C20.78 10.13 19.87 11.08 18.87 11.84M15.85 13.28C14.67 13.73 13.39 13.95 12 13.95C8 13.95 4.8 12.3 2.4 9Z" stroke={TOOL_TEXT} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.35 9.04C9.35 7.58 10.54 6.39 12 6.39C13.46 6.39 14.65 7.58 14.65 9.04C14.65 10.5 13.46 11.69 12 11.69C10.54 11.69 9.35 10.5 9.35 9.04Z" stroke={TOOL_TEXT} strokeWidth="1.7" />
      <path d="M4.1 2.1L19.9 15.9" stroke={TOOL_TEXT} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
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
      // Some browsers disallow seeking before metadata is ready.
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
      // Keep hover-out quiet if the browser is still loading metadata.
    }
  }

  return (
    <a
      className="playground-tool-shape"
      href={href}
      onPointerEnter={playPreview}
      onPointerLeave={stopPreview}
      onMouseEnter={playPreview}
      onMouseLeave={stopPreview}
      onMouseOver={playPreview}
      onMouseOut={stopPreview}
      onFocus={playPreview}
      onBlur={stopPreview}
      style={{
        position: "absolute",
        border: `1px dashed ${BORDER}`,
        color: TOOL_TEXT,
        textDecoration: "none",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT_SANS,
        fontSize: 17,
        fontStyle: "normal",
        fontWeight: 400,
        letterSpacing: 0,
        lineHeight: "normal",
        background: TOOL_BG,
        overflow: "hidden",
        transformOrigin: "center",
        ...style,
      }}
    >
      <video
        ref={videoRef}
        className="playground-preview-video"
        autoPlay
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
        aria-hidden
        className="playground-preview-wash"
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(249,241,232,0.08)",
          opacity: isPreviewing ? 1 : 0,
          transition: "opacity 120ms ease",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      <span className="playground-tool-label" style={{ position: "relative", zIndex: 2, transition: "opacity 120ms ease", ...textStyle }}>{label}</span>
    </a>
  );
}

function SavedToolCard({ tool, onOpen, onDelete }: { tool: NewToolData; onOpen: () => void; onDelete?: () => void }) {
  const [hovered, setHovered] = useState(false);
  const [confirming, setConfirming] = useState(false);

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setConfirming(false);
      }}
      style={{
        width: 286,
        minWidth: 286,
        border: `1px dashed ${hovered ? TOOL_TEXT : BORDER}`,
        borderRadius: 4,
        background: TOOL_BG,
        overflow: "hidden",
        position: "relative",
        cursor: "pointer",
        transition: "border-color 150ms ease, transform 150ms ease",
        transform: hovered ? "translateY(-3px)" : "none",
      }}
    >
      {onDelete && (
        <div
          style={{
            position: "absolute",
            top: 10,
            right: 10,
            display: "flex",
            alignItems: "center",
            gap: 6,
            opacity: hovered ? 1 : 0,
            transition: "opacity 150ms ease",
            zIndex: 3,
          }}
        >
          {confirming ? (
            <>
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete();
                }}
                style={{
                  height: 25,
                  border: "1px dashed rgba(180,60,60,0.5)",
                  borderRadius: 4,
                  background: "rgba(180,60,60,0.1)",
                  color: "#b43c3c",
                  fontFamily: FONT_SANS,
                  fontSize: 12,
                  cursor: "pointer",
                  padding: "0 10px",
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
                  height: 25,
                  border: `1px dashed ${BORDER}`,
                  borderRadius: 4,
                  background: PAGE_BG,
                  color: MUTED_TEXT,
                  fontFamily: FONT_SANS,
                  fontSize: 12,
                  cursor: "pointer",
                  padding: "0 10px",
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
              aria-label="Tool entfernen"
              style={{
                width: 28,
                height: 28,
                border: `1px dashed ${BORDER}`,
                borderRadius: 4,
                background: PAGE_BG,
                color: MUTED_TEXT,
                fontFamily: FONT_SANS,
                fontSize: 17,
                lineHeight: 1,
                cursor: "pointer",
              }}
            >
              x
            </button>
          )}
        </div>
      )}

      <button
        onClick={onOpen}
        style={{
          width: "100%",
          aspectRatio: "1 / 1",
          border: "none",
          borderBottom: `1px dashed ${BORDER}`,
          background: PAGE_BG,
          padding: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          overflow: "hidden",
        }}
      >
        {tool.params.asciiImage ? (
          <img
            src={tool.params.asciiImage}
            alt={tool.name || "Saved tool"}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <span style={{ fontFamily: FONT_SERIF, fontSize: 58, color: BORDER, lineHeight: 1 }}>+</span>
        )}
      </button>

      <button
        onClick={onOpen}
        style={{
          width: "100%",
          minHeight: 124,
          border: "none",
          background: "transparent",
          padding: "17px 18px 18px",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 8,
          textAlign: "left",
          cursor: "pointer",
        }}
      >
        <span
          style={{
            fontFamily: FONT_SERIF,
            fontSize: 25,
            lineHeight: "27px",
            color: HEADLINE_TEXT,
            maxWidth: "100%",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {tool.name || "Unnamed Tool"}
        </span>
        <span
          style={{
            fontFamily: FONT_SANS,
            fontSize: 13,
            lineHeight: "18px",
            color: MUTED_TEXT,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical" as const,
            overflow: "hidden",
          }}
        >
          {tool.description || "No description yet."}
        </span>
      </button>
    </article>
  );
}

function ToolShelf({
  title,
  kicker,
  tools,
  emptyMessage,
  onOpen,
  onDelete,
}: {
  title: string;
  kicker: string;
  tools: NewToolData[];
  emptyMessage: string;
  onOpen: (id: string) => void;
  onDelete?: (id: string) => void;
}) {
  return (
    <section style={{ padding: "70px 44px 86px", borderTop: `1px dashed ${BORDER}` }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(260px, 360px) 1fr",
          gap: 34,
          alignItems: "start",
          maxWidth: 1500,
          margin: "0 auto",
        }}
      >
        <div style={{ position: "sticky", top: 94, display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                height: 31,
                minWidth: 31,
                border: `1px dashed ${BORDER}`,
                borderRadius: 4,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: FONT_SANS,
                fontSize: 13,
                color: MUTED_TEXT,
              }}
            >
              {tools.length}
            </span>
            <span style={{ fontFamily: FONT_SANS, fontSize: 13, color: MUTED_TEXT }}>{kicker}</span>
          </div>
          <h2
            style={{
              margin: 0,
              fontFamily: FONT_SERIF,
              fontSize: 54,
              lineHeight: "56px",
              fontWeight: 400,
              color: HEADLINE_TEXT,
              letterSpacing: 0,
            }}
          >
            {title}
          </h2>
        </div>

        {tools.length === 0 ? (
          <div
            style={{
              minHeight: 260,
              border: `1px dashed ${BORDER}`,
              borderRadius: 4,
              background: TOOL_BG,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 28,
              boxSizing: "border-box",
            }}
          >
            <span style={{ fontFamily: FONT_SANS, fontSize: 15, color: MUTED_TEXT, textAlign: "center" }}>{emptyMessage}</span>
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              gap: 18,
              overflowX: "auto",
              padding: "2px 2px 18px",
              scrollSnapType: "x proximity",
            }}
          >
            {tools.map((tool) => (
              <div key={tool.id} style={{ scrollSnapAlign: "start" }}>
                <SavedToolCard tool={tool} onOpen={() => onOpen(tool.id)} onDelete={onDelete ? () => onDelete(tool.id) : undefined} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default function PlaygroundNew() {
  const navigate = useNavigate();
  const sessionId = useMemo(() => getSessionId(), []);
  const [tools, setTools] = useState<NewToolData[]>([]);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<"de" | "en">(() => (localStorage.getItem("appLang") as "de" | "en") ?? "de");
  const isDe = lang === "de";

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
  const allTools = [...tools].sort((a, b) => b.savedAt.localeCompare(a.savedAt));

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
        backgroundColor: PAGE_BG,
        backgroundImage: "radial-gradient(circle, rgba(164,164,164,0.7) 1px, transparent 1.2px)",
        backgroundSize: "42px 42px",
        color: HEADLINE_TEXT,
        WebkitOverflowScrolling: "touch",
      }}
    >
      <style>{`
        html, body, #root { height: 100%; overflow: hidden; }
        .playground-tool-shape:hover .playground-preview-video,
        .playground-tool-shape:focus-visible .playground-preview-video,
        .playground-tool-shape:hover .playground-preview-wash,
        .playground-tool-shape:focus-visible .playground-preview-wash {
          opacity: 1 !important;
        }
        .playground-tool-shape:hover .playground-tool-label,
        .playground-tool-shape:focus-visible .playground-tool-label {
          opacity: 0 !important;
        }
      `}</style>

      <div style={{ position: "fixed", top: 44, left: 44, display: "flex", gap: 10, zIndex: 5 }}>
        <TopButton style={{ width: 31, padding: 6 }}>
          <HalfCircleIcon />
        </TopButton>
        <TopButton style={{ width: 60 }}>Rules</TopButton>
      </div>

      <div style={{ position: "fixed", top: 44, right: 44, display: "flex", gap: 10, zIndex: 5 }}>
        <TopButton
          style={{ width: 48, padding: "0 10px" }}
          onClick={() =>
            setLang((current) => {
              const next = current === "de" ? "en" : "de";
              localStorage.setItem("appLang", next);
              return next;
            })
          }
        >
          {lang === "de" ? "DE" : "ENG"}
        </TopButton>
        <TopButton style={{ width: 60 }}>Menu</TopButton>
        <TopButton style={{ width: 48, padding: "6px 12px" }}>
          <HiddenEyeIcon />
        </TopButton>
      </div>

      <section aria-label="Writing tools playground" style={{ position: "relative", minHeight: "100vh", overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: 1680,
            height: 858,
            transform: "translate(-50%, -50%)",
            transformOrigin: "center",
          }}
        >
          <ToolShape label="...without stopping" href="/Diplom-Projekt/dont-stop-writing" video="without-stopping" style={{ left: 40, top: 197, width: 236, height: 233, transform: "rotate(5.1deg)", borderRadius: 200 }} textStyle={{ transform: "rotate(-5.1deg)" }} />
          <ToolShape label="...uninvited thoughts" href="/Diplom-Projekt/uninvited-thoughts" video="uninvited-thoughts" style={{ left: 420, top: 57, width: 317, height: 155, transform: "rotate(-9.25deg)", borderRadius: 4 }} textStyle={{ transform: "rotate(9.25deg)" }} />
          <ToolShape label="...off the grid" href="/Diplom-Projekt/off-the-grid" video="off-the-grid" style={{ left: 1220, top: 112, width: 251, height: 163, transform: "rotate(4.18deg)", borderRadius: 4, justifyContent: "flex-start", alignItems: "flex-end", padding: 12 }} textStyle={{ transform: "rotate(-4.18deg)", marginBottom: 0 }} />
          <ToolShape label="...blind & then witness" href="/Diplom-Projekt/anonymously-in-public" video="blind-then-witness" style={{ left: 213, top: 579, width: 324, height: 163, transform: "rotate(6.45deg)", borderRadius: 100 }} textStyle={{ transform: "rotate(-6.45deg)" }} />
          <ToolShape label="...with visible corrections" href="/Diplom-Projekt/loschen-korrigieren" video="visible-corrections" style={{ left: 774, top: 526, width: 363, height: 174, borderRadius: "40px 4px 40px 4px" }} />
          <ToolShape label="...in a spiral" href="/Diplom-Projekt/in-a-spiral" video="in-a-spiral" style={{ left: 1321, top: 414, width: 211, height: 309, transform: "rotate(12.11deg)", borderRadius: 200 }} textStyle={{ transform: "rotate(-12.11deg)" }} />

          <div style={{ position: "absolute", left: 456, top: 300, width: 768 }}>
            <h1
              style={{
                margin: 0,
                fontFamily: FONT_SERIF,
                fontSize: 36,
                lineHeight: "45px",
                fontWeight: 400,
                letterSpacing: 0,
                color: HEADLINE_TEXT,
                textAlign: "center",
                whiteSpace: "nowrap",
              }}
            >
              Writing Tools shape how we think & write.<br />
              Explore Writing Tools that break their rules.
            </h1>
          </div>
        </div>
      </section>

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
        <>
          <ToolShelf
            title={isDe ? "Meine Tools" : "My Tools"}
            kicker={isDe ? "deine gespeicherten Experimente" : "your saved experiments"}
            tools={myTools}
            onOpen={openTool}
            onDelete={handleDelete}
            emptyMessage={isDe ? "Noch keine Tools gespeichert. Erstelle eines unter /new." : "No tools saved yet. Create one at /new."}
          />
          <ToolShelf
            title={isDe ? "Alle Tools" : "All Tools"}
            kicker={isDe ? "alles aus dem Playground" : "everything in the playground"}
            tools={allTools}
            onOpen={openTool}
            emptyMessage={isDe ? "Noch keine Tools vorhanden." : "No tools yet."}
          />
        </>
      )}
    </main>
  );
}
