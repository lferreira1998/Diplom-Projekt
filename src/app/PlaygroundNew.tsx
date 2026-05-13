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
    <svg width="18" height="14" viewBox="0 0 36 25" fill="none" aria-hidden>
      <path d="M23.318 2.9355V4.46104C21.7844 2.56568 19.7599 1.61799 17.7232 1.61799C15.6988 1.61799 13.6744 2.56568 12.1407 4.46104V2.9355C13.6744 1.04014 15.6988 0 17.7232 0C19.7599 0 21.7844 1.04014 23.318 2.9355Z" fill="#555555" />
      <path d="M11.7952 21.6912V20.1656C13.3289 22.061 15.3533 23.0087 17.39 23.0087C19.4144 23.0087 21.4389 22.061 22.9725 20.1656V21.6912C21.4389 23.5865 19.4144 24.6267 17.39 24.6267C15.3533 24.6267 13.3289 23.5865 11.7952 21.6912Z" fill="#555555" />
      <path d="M35.113 11.2229L26.682 2.65537V5.03092L33.8989 12.3133L26.682 19.5957V21.9713L35.113 13.4037V11.2229Z" fill="#555555" />
      <path d="M0 13.4037L8.43094 21.9713V19.5957L1.21406 12.3133L8.43094 5.03092V2.65537L0 11.2229V13.4037Z" fill="#555555" />
      <path d="M21.9794 12.3497C21.9794 14.9757 20.0828 16.9453 17.3839 16.9453C14.7579 16.9453 12.7883 14.9757 12.7883 12.3497C12.7883 9.57782 14.7579 7.68125 17.3839 7.68125C20.0828 7.68125 21.9794 9.57782 21.9794 12.3497Z" fill="#555555" />
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
        preload="metadata"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: isPreviewing ? 1 : 0,
          transition: "opacity 180ms ease",
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        <source src={`/Diplom-Projekt/videos/${video}.webm`} type="video/webm" />
        <source src={`/Diplom-Projekt/videos/${video}.mp4`} type="video/mp4" />
      </video>
      <span
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(252,246,239,0.18)",
          opacity: isPreviewing ? 1 : 0,
          transition: "opacity 180ms ease",
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
            left: 585,
            top: 306,
            width: 610,
            display: "flex",
            alignItems: "flex-start",
            gap: 15,
          }}
        >
          <div style={{ width: 1, height: 36, background: "#555555", marginTop: 8 }} />
          <h1
            style={{
              margin: 0,
              fontFamily: FONT_SERIF,
              fontSize: 35,
              lineHeight: 1.18,
              fontWeight: 400,
              letterSpacing: 0,
              color: "#3f3f3f",
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
