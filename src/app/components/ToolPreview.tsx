import { useEffect, useRef, useState } from "react";
import { MiniReplayPreview } from "./MiniReplayPreview";
import type { NewToolData } from "../utils/storage";

interface Props {
  tool: NewToolData;
  active: boolean;
  dark: boolean;
}

export function ToolPreview({ tool, active, dark }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoError, setVideoError] = useState(false);

  const videoUrl = tool.params.previewVideo;

  // Lazy playback: only load + play the video while it's on (or near) screen,
  // and pause it when it scrolls away. Avoids dozens of videos downloading and
  // decoding at once, which is the main cause of the slow first paint.
  useEffect(() => {
    if (!videoUrl || videoError) return;
    const el = videoRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (el.preload !== "auto") el.preload = "auto";
          el.play().catch(() => undefined);
        } else {
          el.pause();
        }
      },
      { rootMargin: "300px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [videoUrl, videoError]);

  if (videoUrl && !videoError) {
    return (
      <video
        ref={videoRef}
        src={videoUrl}
        loop
        muted
        playsInline
        preload="none"
        onError={() => setVideoError(true)}
        onCanPlay={() => {
          if (videoRef.current) videoRef.current.playbackRate = 1.75;
        }}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          pointerEvents: "none",
        }}
      />
    );
  }

  return (
    <MiniReplayPreview
      params={tool.params}
      active={active}
      dark={dark}
      toolId={tool.id}
    />
  );
}
