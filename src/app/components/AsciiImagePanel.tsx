import React, { useCallback, useEffect, useRef, useState } from "react";

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

  // Lighter base than pure black so the resulting image reads brighter
  ctx.fillStyle = "#2a2a2a";
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

  // Color overlay
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = `hsl(${colorHue}, 70%, 64%)`;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.restore();

  // Final lift so the whole image is lighter
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.fillStyle = "rgba(255,255,255,0.26)";
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.restore();
}

type AsciiImagePanelProps = {
  dark: boolean;
  background: string;
  textColor: string;
  fontSans: string;
  snapshotRef?: React.MutableRefObject<() => string | null>;
  initialImage?: string | null;
};

export default function AsciiImagePanel({ dark, background, textColor, fontSans, snapshotRef, initialImage }: AsciiImagePanelProps) {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [draggingFile, setDraggingFile] = useState(false);
  const [hasRendered, setHasRendered] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [maxOffset, setMaxOffset] = useState({ x: 0, y: 0 });
  const [brightness, setBrightness] = useState(135);
  const [colorHue, setColorHue] = useState(() => Math.random() * 360);
  const [isPanning, setIsPanning] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [drawMode, setDrawMode] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const colorBarRef = useRef<HTMLDivElement>(null);
  const renderTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panRef = useRef({ sx: 0, sy: 0, ox: 0, oy: 0 });
  const drawingRef = useRef(false);
  const lastPtRef = useRef<{ x: number; y: number } | null>(null);

  const loadImageEl = useCallback((img: HTMLImageElement) => {
    const scale = Math.max(CANVAS_W / img.naturalWidth, CANVAS_H / img.naturalHeight);
    const maxX = Math.max(0, img.naturalWidth * scale - CANVAS_W);
    const maxY = Math.max(0, img.naturalHeight * scale - CANVAS_H);
    setMaxOffset({ x: maxX, y: maxY });
    setOffset({ x: maxX / 2, y: maxY / 2 });
    setColorHue(Math.random() * 360);
    setImage(img);
    setHasRendered(false);
  }, []);

  const loadImage = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => loadImageEl(img);
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, [loadImageEl]);

  useEffect(() => {
    if (!initialImage) return;
    const img = new window.Image();
    img.onload = () => {
      const scale = Math.max(CANVAS_W / img.naturalWidth, CANVAS_H / img.naturalHeight);
      const maxX = Math.max(0, img.naturalWidth * scale - CANVAS_W);
      const maxY = Math.max(0, img.naturalHeight * scale - CANVAS_H);
      setMaxOffset({ x: maxX, y: maxY });
      setOffset({ x: maxX / 2, y: maxY / 2 });
      setImage(img);
      setHasRendered(false);
    };
    img.src = initialImage;
  }, [initialImage]);

  useEffect(() => {
    if (!image || !canvasRef.current) return;
    if (renderTimer.current) clearTimeout(renderTimer.current);

    renderTimer.current = setTimeout(() => {
      renderAscii(image, canvasRef.current!, offset.x, offset.y, brightness, colorHue);
      setHasRendered(true);
      if (snapshotRef) {
        snapshotRef.current = () => canvasRef.current?.toDataURL("image/webp", 0.8) ?? null;
      }
    }, 16);

    return () => {
      if (renderTimer.current) clearTimeout(renderTimer.current);
    };
  }, [image, offset, brightness, colorHue]);

  // Prepare a blank white drawing canvas when entering draw mode
  useEffect(() => {
    if (!drawMode) return;
    const c = drawCanvasRef.current;
    if (!c) return;
    c.width = CANVAS_W;
    c.height = CANVAS_H;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }, [drawMode]);

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
    setPickerOpen(false);
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

  // ── Drawing ──────────────────────────────────────────────────────────────
  const drawPtFromEvent = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const c = drawCanvasRef.current!;
    const rect = c.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * CANVAS_W,
      y: ((event.clientY - rect.top) / rect.height) * CANVAS_H,
    };
  };

  const drawStrokeTo = (pt: { x: number; y: number }) => {
    const ctx = drawCanvasRef.current?.getContext("2d");
    if (!ctx) return;
    const last = lastPtRef.current ?? pt;
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 16;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
    lastPtRef.current = pt;
  };

  const handleDrawDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    drawingRef.current = true;
    const pt = drawPtFromEvent(event);
    lastPtRef.current = pt;
    drawStrokeTo(pt);
  };

  const handleDrawMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    drawStrokeTo(drawPtFromEvent(event));
  };

  const handleDrawUp = () => {
    drawingRef.current = false;
    lastPtRef.current = null;
  };

  const clearDrawing = () => {
    const ctx = drawCanvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  };

  const finishDrawing = () => {
    const c = drawCanvasRef.current;
    if (!c) return;
    const img = new window.Image();
    img.onload = () => {
      loadImageEl(img);
      setDrawMode(false);
      setPickerOpen(false);
    };
    img.src = c.toDataURL("image/png");
  };

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

  const indicatorPct = (colorHue / 360) * 100;

  const optionBtnStyle: React.CSSProperties = {
    background: dark ? "rgba(240,232,220,0.06)" : "#fcf6ef",
    border: `1px dashed ${BORDER_COL}`,
    borderRadius: "4px",
    color: textColor,
    cursor: "pointer",
    fontFamily: fontSans,
    fontSize: "14px",
    padding: "10px 18px",
  };

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
          cursor: image ? (isPanning ? "grabbing" : canPan ? "grab" : "default") : "default",
          touchAction: "none",
        }}
        onDrop={drawMode ? undefined : handleDrop}
        onDragOver={(event) => {
          if (drawMode) return;
          event.preventDefault();
          setDraggingFile(true);
        }}
        onDragLeave={() => setDraggingFile(false)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: "none" }} />

        {image ? (
          <canvas ref={canvasRef} style={{ display: "block", width: "100%", height: "100%" }} />
        ) : drawMode ? (
          <canvas
            ref={drawCanvasRef}
            onPointerDown={handleDrawDown}
            onPointerMove={handleDrawMove}
            onPointerUp={handleDrawUp}
            onPointerLeave={handleDrawUp}
            style={{ display: "block", width: "100%", height: "100%", cursor: "crosshair", touchAction: "none" }}
          />
        ) : pickerOpen ? (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
            }}
          >
            <button style={optionBtnStyle} onClick={() => fileInputRef.current?.click()}>
              Foto hochladen
            </button>
            <button style={optionBtnStyle} onClick={() => setDrawMode(true)}>
              Bild zeichnen
            </button>
          </div>
        ) : (
          <button
            onClick={() => setPickerOpen(true)}
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "transparent",
              border: "none",
              color: textColor,
              fontFamily: fontSans,
              fontSize: "15px",
              lineHeight: "20px",
              textAlign: "center",
              cursor: "pointer",
            }}
          >
            Bild hinzufügen
            <br />
            oder Drag and Drop
          </button>
        )}

        {image && (
          <button
            onClick={(event) => {
              event.stopPropagation();
              setImage(null);
              setPickerOpen(true);
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

      {drawMode && (
        <div style={{ display: "flex", gap: "8px" }}>
          <button style={{ ...optionBtnStyle, flex: 1, fontSize: "12px", padding: "7px 10px" }} onClick={clearDrawing}>
            Löschen
          </button>
          <button
            style={{ ...optionBtnStyle, flex: 1, fontSize: "12px", padding: "7px 10px" }}
            onClick={() => {
              setDrawMode(false);
              setPickerOpen(true);
            }}
          >
            Abbrechen
          </button>
          <button
            style={{
              ...optionBtnStyle,
              flex: 1,
              fontSize: "12px",
              padding: "7px 10px",
              borderStyle: "solid",
              background: dark ? "rgba(240,232,220,0.12)" : "rgba(85,85,85,0.08)",
            }}
            onClick={finishDrawing}
          >
            Fertig
          </button>
        </div>
      )}

      {image && (
        <>
          <div style={{ background, border: `1px dashed ${BORDER_COL}`, borderRadius: "8px", padding: "12px 16px 16px" }}>
            <div style={{ color: textColor, fontSize: "15px", marginBottom: "16px" }}>Helligkeit</div>
            <style>{`
              .bright-slider {
                -webkit-appearance: none; appearance: none;
                width: 100%; height: 2px; border-radius: 2px; cursor: pointer; outline: none;
                background: ${dark ? "rgba(240,232,220,0.22)" : "#c8bfb5"};
              }
              .bright-slider::-webkit-slider-thumb {
                -webkit-appearance: none; appearance: none;
                width: 18px; height: 18px; border-radius: 50%;
                background: ${dark ? "rgba(240,232,220,0.85)" : "#888"};
                cursor: grab; border: none;
              }
              .bright-slider::-moz-range-thumb {
                width: 18px; height: 18px; border-radius: 50%;
                background: ${dark ? "rgba(240,232,220,0.85)" : "#888"};
                cursor: grab; border: none;
              }
            `}</style>
            <input
              type="range"
              min={40}
              max={220}
              value={brightness}
              onChange={(event) => setBrightness(Number(event.target.value))}
              className="bright-slider"
            />
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
        </>
      )}
    </div>
  );
}
