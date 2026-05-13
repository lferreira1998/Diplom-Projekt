import { useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";

const FONT_SERIF = "'freight-text-pro', 'EB Garamond', Georgia, serif";
const FONT_SANS = "'general-sans', 'Space Grotesk', sans-serif";

function TopButton({ children, style }: { children: ReactNode; style?: CSSProperties }) {
  return (
    <button
      style={{
        height: 31,
        border: "1px dashed #a4a4a4",
        borderRadius: 4,
        background: "transparent",
        color: "#555555",
        fontFamily: FONT_SANS,
        fontSize: 15,
        lineHeight: 1,
        padding: "0 13px",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        outline: "none",
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
        width: 15,
        height: 15,
        border: "1.4px solid #555555",
        borderRadius: "50%",
        display: "inline-block",
        background: "linear-gradient(90deg, #555555 0 50%, transparent 50% 100%)",
      }}
    />
  );
}

function HiddenEyeIcon() {
  return (
    <svg width="18" height="14" viewBox="0 0 24 18" fill="none" aria-hidden>
      <path
        d="M2.4 9C4.8 5.7 8 4.05 12 4.05C16 4.05 19.2 5.7 21.6 9C20.78 10.13 19.87 11.08 18.87 11.84M15.85 13.28C14.67 13.73 13.39 13.95 12 13.95C8 13.95 4.8 12.3 2.4 9Z"
        stroke="#555555"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.35 9.04C9.35 7.58 10.54 6.39 12 6.39C13.46 6.39 14.65 7.58 14.65 9.04C14.65 10.5 13.46 11.69 12 11.69C10.54 11.69 9.35 10.5 9.35 9.04Z"
        stroke="#555555"
        strokeWidth="1.7"
      />
      <path d="M4.1 2.1L19.9 15.9" stroke="#555555" strokeWidth="1.7" strokeLinecap="round" />
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

  function playPreview() {
    setIsPreviewing(true);
    if (!videoRef.current) return;

    videoRef.current.currentTime = 0;
    videoRef.current.play().catch(() => undefined);
  }

  function stopPreview() {
    setIsPreviewing(false);
    if (!videoRef.current) return;

    videoRef.current.pause();
    videoRef.current.currentTime = 0;
  }

  return (
    <a
      href={href}
      onMouseEnter={playPreview}
      onMouseLeave={stopPreview}
      onFocus={playPreview}
      onBlur={stopPreview}
      style={{
        position: "absolute",
        border: "1px dashed rgba(85,85,85,0.38)",
        color: "#555555",
        textDecoration: "none",
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: FONT_SANS,
        fontSize: 17,
        fontStyle: "italic",
        fontWeight: 400,
        letterSpacing: 0,
        background: "rgba(252,246,239,0.1)",
        overflow: "hidden",
        ...style,
      }}
    >
      <video
        ref={videoRef}
        muted
        loop
        playsInline
        preload="auto"
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
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(252,246,239,0.06)",
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
        backgroundColor: "#fcf6ef",
        backgroundImage: "radial-gradient(circle, rgba(85,85,85,0.34) 1px, transparent 1.2px)",
        backgroundSize: "42px 42px",
        color: "#3f3f3f",
      }}
    >
      <div style={{ position: "fixed", top: 44, left: 44, display: "flex", gap: 10, zIndex: 5 }}>
        <TopButton style={{ width: 31, padding: 0 }}>
          <HalfCircleIcon />
        </TopButton>
        <TopButton>Rules</TopButton>
      </div>

      <div style={{ position: "fixed", top: 44, right: 44, display: "flex", gap: 10, zIndex: 5 }}>
        <TopButton>Menu</TopButton>
        <TopButton style={{ width: 42, padding: 0 }}>
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
          style={{ left: 50, top: 210, width: 240, height: 240, borderRadius: "50%" }}
        />
        <ToolShape
          label="...uninvited thoughts"
          href="/Diplom-Projekt/uninvited-thoughts"
          video="uninvited-thoughts"
          style={{ left: 425, top: 72, width: 322, height: 160, transform: "rotate(-9deg)", borderRadius: 4 }}
          textStyle={{ transform: "rotate(9deg)" }}
        />
        <ToolShape
          label="...off the grid"
          href="/Diplom-Projekt/off-the-grid"
          video="off-the-grid"
          style={{ left: 1232, top: 112, width: 256, height: 170, transform: "rotate(4deg)", borderRadius: 4 }}
          textStyle={{ transform: "rotate(-4deg)", alignSelf: "flex-end", marginBottom: 31, marginRight: 84 }}
        />
        <ToolShape
          label="...blind & then witness"
          href="/Diplom-Projekt/anonymously-in-public"
          video="blind-then-witness"
          style={{ left: 213, top: 578, width: 330, height: 155, transform: "rotate(8deg)", borderRadius: "46% 54% 45% 55% / 48% 48% 52% 52%" }}
          textStyle={{ transform: "rotate(-8deg)" }}
        />
        <ToolShape
          label="...with visible corrections"
          href="/Diplom-Projekt/loschen-korrigieren"
          video="visible-corrections"
          style={{ left: 780, top: 530, width: 366, height: 176, borderRadius: "30px 0 30px 0" }}
        />
        <ToolShape
          label="...in a spiral"
          href="/Diplom-Projekt/in-a-spiral"
          video="in-a-spiral"
          style={{ left: 1320, top: 424, width: 220, height: 310, transform: "rotate(11deg)", borderRadius: "50%" }}
          textStyle={{ transform: "rotate(-1deg)", marginTop: -16 }}
        />

        <div
          style={{
            position: "absolute",
            left: 460,
            top: 300,
            width: 760,
          }}
        >
          <h1
            style={{
              margin: 0,
              fontFamily: FONT_SERIF,
              fontSize: 35,
              lineHeight: 1.18,
              fontWeight: 400,
              letterSpacing: 0,
              color: "#3f3f3f",
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
