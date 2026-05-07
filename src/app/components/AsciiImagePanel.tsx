import { useCallback, useEffect, useRef, useState } from "react";

const CANVAS_W = 900;
const CANVAS_H = 600;
const CHARS = "$@B%8&WM#*oahkbdpqwmZO0QLCJUYXzcvunxrjft/|()1{}[]?-_+~<>i!lI;:,. ";
const FONT_SIZE = 16;
const BORDER_COL = "#a4a4a4";

function renderAscii(
  img: HTMLImageElement,
  canvas: HTMLCanvasElement,
  offsetX: number,
  offsetY: number,
  brightness: number,
  colorHue: number
) {
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const fontStr = `${FONT_SIZE}px "Courier New", Courier, monospace`;
  ctx.font = fontStr;

  const charWidth = ctx.measureText("M").width;
  const charHeight = FONT_SIZE;
  const cols = Math.floor(CANVAS_W / charWidth);
  const rows = Math.ceil(CANVAS_H / charHeight);

  const scale = Math.max(CANVAS_W / img.naturalWidth, CANVAS_H / img.naturalHeight);
  const srcW = CANVAS_W / scale;
  const srcH = CANVAS_H / scale;
  const srcX = offsetX / scale;
  const srcY = offsetY / scale;

  const tmp = document.createElement("canvas");
  tmp.width = cols;
  tmp.height = rows;
  const tctx = tmp.getContext("2d");
  if (!tctx) return;

  tctx.filter = `grayscale(1) brightness(${brightness}%) contrast(140%)`;
  tctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, cols, rows);
  const pixels = tctx.getImageData(0, 0, cols, rows).data;

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.font = fontStr;
  ctx.textBaseline = "top";
  ctx.fillStyle = "#ffffff";

  for (let row = 0; row < rows; row++) {
    let line = "";
    for (let col = 0; col < cols; col++) {
      const lum = pixels[(row * cols + col) * 4] / 255;
      const charIndex = Math.min(Math.floor((1 - lum) * (CHARS.length - 1)), CHARS.length - 1);
      line += CHARS[charIndex];
    }
    ctx.fillText(line, 0, row * charHeight);
  }

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = `hsl(${colorHue}, 75%, 55%)`;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.restore();
}

function buildSliderChars(value: number, min: number, max: number, total = 18) {
  const ratio = (value - min) / (max - min);
  const filled = Math.round(ratio * (total - 1));
  return "═".repeat(filled) + "⬤" + "─".repeat(total - 1 - filled);
}

type AsciiImagePanelProps = {
  dark: boolean;
  background: string;
  textColor: string;
  fontSans: string;
};

export default function AsciiImagePanel({ dark, background, textColor, fontSans }: AsciiImagePanelProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [draggingFile, setDraggingFile] = useState(false);
  const [hasRendered, setHasRendered] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [maxOffset, setMaxOffset] = useState({ x: 0, y: 0 });
  const [brightness, setBrightness] = useState(110);
  const [colorHue, setColorHue] = useState(() => Math.random() * 360);
  const [isPanning, setIsPanning] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorBarRef = useRef<HTMLDivElement>(null);
  const renderTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panRef = useRef({ sx: 0, sy: 0, ox: 0, oy: 0 });

  const loadImage = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const scale = Math.max(CANVAS_W / img.naturalWidth, CANVAS_H / img.naturalHeight);
        const maxX = Math.max(0, img.naturalWidth * scale - CANVAS_W);
        const maxY = Math.max(0, img.naturalHeight * scale - CANVAS_H);

        setMaxOffset({ x: maxX, y: maxY });
        setOffset({ x: maxX / 2, y: maxY / 2 });
        setColorHue(Math.random() * 360);
        setImage(img);
        setHasRendered(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  useEffect(() => {
    if (!image || !canvasRef.current) return;
    if (renderTimer.current) clearTimeout(renderTimer.current);

    renderTimer.current = setTimeout(() => {
      renderAscii(image, canvasRef.current!, offset.x, offset.y, brightness, colorHue);
      setHasRendered(true);
    }, 16);

    return () => {
      if (renderTimer.current) clearTimeout(renderTimer.current);
    };
  }, [image, offset, brightness, colorHue]);

  const canPan = maxOffset.x > 0 || maxOffset.y > 0;

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDraggingFile(false);
      const file = event.dataTransfer.files[0];
      if (file) loadImage(file);
    },
    [loadImage]
  );

  const handleFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) loadImage(file);
    event.target.value = "";
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!image || !canPan) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsPanning(true);
    panRef.current = { sx: event.clientX, sy: event.clientY, ox: offset.x, oy: offset.y };
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isPanning || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const rx = CANVAS_W / rect.width;
    const ry = CANVAS_H / rect.height;
    const { sx, sy, ox, oy } = panRef.current;

    setOffset({
      x: Math.max(0, Math.min(maxOffset.x, ox - (event.clientX - sx) * rx)),
      y: Math.max(0, Math.min(maxOffset.y, oy - (event.clientY - sy) * ry)),
    });
  };

  const handlePointerUp = () => setIsPanning(false);

  const updateHueFromEvent = (clientX: number) => {
    const bar = colorBarRef.current;
    if (!bar) return;

    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    setColorHue(ratio * 360);
  };

  const handleColorBarMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    updateHueFromEvent(event.clientX);
    const onMove = (moveEvent: MouseEvent) => updateHueFromEvent(moveEvent.clientX);
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  };

  const exportWebP = () => {
    if (!canvasRef.current || !hasRendered) return;

    canvasRef.current.toBlob(
      (blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = `ascii-art-${Date.now()}.webp`;
        anchor.click();
        URL.revokeObjectURL(url);
      },
      "image/webp",
      0.95
    );
  };

  const indicatorPct = (colorHue / 360) * 100;
  const sliderChars = buildSliderChars(brightness, 40, 220);
  const sliderParts = sliderChars.split("⬤");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontFamily: fontSans }}>
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "900 / 600",
          background: dark ? "#1d1d1d" : "#fcf6ef",
          border: `1px dashed ${draggingFile ? textColor : BORDER_COL}`,
          borderRadius: "4px",
          overflow: "hidden",
          cursor: image ? (isPanning ? "grabbing" : canPan ? "grab" : "default") : "pointer",
          touchAction: "none",
        }}
        onDrop={handleDrop}
        onDragOver={(event) => {
          event.preventDefault();
          setDraggingFile(true);
        }}
        onDragLeave={() => setDraggingFile(false)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onClick={!image ? () => fileInputRef.current?.click() : undefined}
      >
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />

        {image ? (
          <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
        ) : (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: textColor,
              fontSize: "15px",
              lineHeight: "20px",
              textAlign: "center",
              userSelect: "none",
              pointerEvents: "none",
            }}
          >
            Foto hinzufügen
            <br />
            oder Drag and Drop
          </div>
        )}

        {image && (
          <button
            onClick={(event) => {
              event.stopPropagation();
              fileInputRef.current?.click();
            }}
            style={{
              position: "absolute",
              right: "8px",
              bottom: "8px",
              background: dark ? "rgba(30,29,28,0.76)" : "rgba(252,246,239,0.78)",
              border: `1px dashed ${BORDER_COL}`,
              borderRadius: "4px",
              color: textColor,
              cursor: "pointer",
              fontFamily: fontSans,
              fontSize: "11px",
              padding: "3px 8px",
            }}
          >
            ersetzen
          </button>
        )}
      </div>

      <div style={{ background, border: `1px dashed ${BORDER_COL}`, borderRadius: "8px", padding: "12px 16px" }}>
        <div style={{ color: textColor, fontSize: "15px", marginBottom: "12px" }}>Helligkeit</div>
        <div style={{ position: "relative", height: "18px", overflow: "hidden" }}>
          <input
            type="range"
            min={40}
            max={220}
            value={brightness}
            onChange={(event) => setBrightness(Number(event.target.value))}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer", zIndex: 2 }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "15px",
              lineHeight: "18px",
              pointerEvents: "none",
              userSelect: "none",
              color: dark ? "#fcf6ef" : "#313642",
            }}
          >
            <span>{sliderParts[0]}</span>
            <span style={{ color: dark ? "#8f8f8f" : "#9a9daa" }}>{"⬤" + sliderParts[1]}</span>
          </div>
        </div>
      </div>

      <div style={{ background, border: `1px dashed ${BORDER_COL}`, borderRadius: "8px", padding: "12px 16px 16px" }}>
        <div style={{ color: textColor, fontSize: "15px", marginBottom: "12px" }}>Bildfarbe</div>
        <div
          ref={colorBarRef}
          style={{
            position: "relative",
            height: "42px",
            border: `1px dashed ${BORDER_COL}`,
            borderRadius: "8px",
            backgroundImage:
              "linear-gradient(90deg, rgba(255,174,174,0.45) 0%, rgba(255,225,174,0.45) 15%, rgba(227,255,174,0.45) 28%, rgba(174,255,208,0.45) 43%, rgba(174,247,255,0.45) 59%, rgba(174,186,255,0.45) 73%, rgba(229,174,255,0.45) 87%, rgba(255,174,219,0.45) 100%)",
            cursor: "crosshair",
          }}
          onMouseDown={handleColorBarMouseDown}
        >
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: `calc(${indicatorPct}% - 2px)`,
              width: "4px",
              height: "28px",
              borderRadius: "100px",
              background: BORDER_COL,
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
          />
        </div>
      </div>

      <button
        onClick={exportWebP}
        disabled={!hasRendered}
        style={{
          width: "100%",
          height: "36px",
          background,
          border: `1px dashed ${BORDER_COL}`,
          borderRadius: "4px",
          color: textColor,
          cursor: hasRendered ? "pointer" : "not-allowed",
          fontFamily: fontSans,
          fontSize: "15px",
          opacity: hasRendered ? 1 : 0.45,
        }}
      >
        Save ASCII image
      </button>
    </div>
  );
}
