import { useRef, useState } from "react";
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

  if (videoUrl && !videoError) {
    return (
      <video
        ref={videoRef}
        src={videoUrl}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
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
