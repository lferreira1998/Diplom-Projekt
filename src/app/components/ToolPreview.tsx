import { useEffect, useRef, useState } from "react";
import { MiniReplayPreview } from "./MiniReplayPreview";
import type { CSSProperties } from "react";
import type { NewToolData } from "../utils/storage";

type SavedToolPreviewProps = {
  tool: NewToolData;
  active: boolean;
  dark: boolean;
  style?: CSSProperties;
};

type StaticVideoPreviewProps = {
  videoName: string;
  dark: boolean;
  style?: CSSProperties;
};

type Props = SavedToolPreviewProps | StaticVideoPreviewProps;

export function ToolPreview(props: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoError, setVideoError] = useState(false);
  const isSavedTool = "tool" in props;

  const videoUrl = isSavedTool
    ? props.tool.params.previewVideo
    : `/videos/${props.videoName}.webm`;

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
          ...props.style,
        }}
      />
    );
  }

  if (!isSavedTool) return null;

  return (
    <MiniReplayPreview
      params={props.tool.params}
      active={props.active}
      dark={props.dark}
      toolId={props.tool.id}
    />
  );
}
