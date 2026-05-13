import { useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

const FONT_SERIF = "'FreightTextCmp Pro', 'freight-text-compressed-pro', 'freight-text-pro', 'EB Garamond', Georgia, serif";
const FONT_SANS = "'General Sans', 'general-sans', 'Space Grotesk', sans-serif";
const PAGE_BG = "#fcf6ef";
const TOOL_BG = "#f9f1e8";
const BORDER = "#a4a4a4";
const TOOL_TEXT = "#555555";
const HEADLINE_TEXT = "#302e2c";

function TopButton({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <button
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
      <path
        d="M2.4 9C4.8 5.7 8 4.05 12 4.05C16 4.05 19.2 5.7 21.6 9C20.78 10.13 19.87 11.08 18.87 11.84M15.85 13.28C14.67 13.73 13.39 13.95 12 13.95C8 13.95 4.8 12.3 2.4 9Z"
        stroke={TOOL_TEXT}
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.35 9.04C9.35 7.58 10.54 6.39 12 6.39C13.46 6.39 14.65 7.58 14.65 9.04C14.65 10.5 13.46 11.69 12 11.69C10.54 11.69 9.35 10.5 9.35 9.04Z"
        stroke={TOOL_TEXT}
        strokeWidth="1.7"
      />
      <path d="M4.1 2.1L19.9 15.9" stroke={TOOL_TEXT} strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function ToolShape({
  label,
  style,
  textStyle,
  href,
  video,
}: {
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

    if (target.readyState < 2) {
      target.addEventListener("canplay", play, { once: true });
    }
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
      <span style={{ position: "relative", zIndex: 2, ...textStyle }}>{label}</span>
    </a>
  );
}

export default function PlaygroundNew() {
  return (
    <main
      style={{
        minHeight: "100vh",
        width: "100vw",
        overflow: "hidden",
        position: "relative",
        backgroundColor: PAGE_BG,
        backgroundImage: "radial-gradient(circle, rgba(164,164,164,0.7) 1px, transparent 1.2px)",
        backgroundSize: "42px 42px",
        color: HEADLINE_TEXT,
      }}
    >
      <style>{`
        .playground-tool-shape:hover .playground-preview-video,
        .playground-tool-shape:focus-visible .playground-preview-video,
        .playground-tool-shape:hover .playground-preview-wash,
        .playground-tool-shape:focus-visible .playground-preview-wash {
          opacity: 1 !important;
        }
      `}</style>

      <div style={{ position: "fixed", top: 44, left: 44, display: "flex", gap: 10, zIndex: 5 }}>
        <TopButton style={{ width: 31, padding: 6 }}>
          <HalfCircleIcon />
        </TopButton>
        <TopButton style={{ width: 60 }}>Rules</TopButton>
      </div>

      <div style={{ position: "fixed", top: 44, right: 44, display: "flex", gap: 10, zIndex: 5 }}>
        <TopButton style={{ width: 60 }}>Menu</TopButton>
        <TopButton style={{ width: 48, padding: "6px 12px" }}>
          <HiddenEyeIcon />
        </TopButton>
      </div>

      <section
        aria-label="Writing tools playground"
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
        <ToolShape
          label="...without stopping"
          href="/Diplom-Projekt/dont-stop-writing"
          video="without-stopping"
          style={{ left: 40, top: 197, width: 236, height: 233, transform: "rotate(5.1deg)", borderRadius: 200 }}
          textStyle={{ transform: "rotate(-5.1deg)" }}
        />
        <ToolShape
          label="...uninvited thoughts"
          href="/Diplom-Projekt/uninvited-thoughts"
          video="uninvited-thoughts"
          style={{ left: 420, top: 57, width: 317, height: 155, transform: "rotate(-9.25deg)", borderRadius: 4 }}
          textStyle={{ transform: "rotate(9.25deg)" }}
        />
        <ToolShape
          label="...off the grid"
          href="/Diplom-Projekt/off-the-grid"
          video="off-the-grid"
          style={{ left: 1220, top: 112, width: 251, height: 163, transform: "rotate(4.18deg)", borderRadius: 4, justifyContent: "flex-start", alignItems: "flex-end", padding: 12 }}
          textStyle={{ transform: "rotate(-4.18deg)", marginBottom: 0 }}
        />
        <ToolShape
          label="...blind & then witness"
          href="/Diplom-Projekt/anonymously-in-public"
          video="blind-then-witness"
          style={{ left: 213, top: 579, width: 324, height: 163, transform: "rotate(6.45deg)", borderRadius: 100 }}
          textStyle={{ transform: "rotate(-6.45deg)" }}
        />
        <ToolShape
          label="...with visible corrections"
          href="/Diplom-Projekt/loschen-korrigieren"
          video="visible-corrections"
          style={{ left: 774, top: 526, width: 363, height: 174, borderRadius: "40px 4px 40px 4px" }}
        />
        <ToolShape
          label="...in a spiral"
          href="/Diplom-Projekt/in-a-spiral"
          video="in-a-spiral"
          style={{ left: 1321, top: 414, width: 211, height: 309, transform: "rotate(12.11deg)", borderRadius: 200 }}
          textStyle={{ transform: "rotate(-12.11deg)" }}
        />

        <div
          style={{
            position: "absolute",
            left: 456,
            top: 300,
            width: 768,
          }}
        >
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
      </section>
    </main>
  );
}
