import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import html2canvas from "html2canvas-pro";
import { uploadPreviewVideo } from "../utils/storage";

const FONT_SANS  = "'general-sans', 'Space Grotesk', sans-serif";
const FONT_SERIF = "'freight-text-pro', 'EB Garamond', Georgia, serif";

const RECORDING_MS    = 10_000;
const FPS             = 8;
const COUNTDOWN_START = 3;
const MIN_CROP_PCT    = 10;

interface CropRect { x: number; y: number; w: number; h: number; } // 0–100 percent
type DragMode = "move" | "nw" | "ne" | "se" | "sw" | null;
type Phase    = "selecting" | "countdown" | "recording" | "uploading" | "error";

function clamp(v: number, lo: number, hi: number) { return Math.max(lo, Math.min(hi, v)); }

interface Props {
  zoneRef: React.RefObject<HTMLDivElement | null>;
  bg: string;
  sessionId: string;
  toolName: string;
  lang: "de" | "en";
  onDone: (url: string, path: string) => void;
  onClose: () => void;
}

export function RecordPreviewOverlay({ zoneRef, bg, sessionId, toolName, lang, onDone, onClose }: Props) {
  const DE = lang === "de";

  const [crop, setCrop]         = useState<CropRect>({ x: 5, y: 5, w: 90, h: 90 });
  const [phase, setPhase]       = useState<Phase>("selecting");
  const [countdown, setCountdown] = useState(COUNTDOWN_START);
  const [progress, setProgress]   = useState(0);
  const [errorMsg, setErrorMsg]   = useState("");

  const cancelledRef = useRef(false);
  const dragRef      = useRef<{
    mode: DragMode;
    startX: number; startY: number;
    startCrop: CropRect;
    zW: number; zH: number;
  } | null>(null);

  useEffect(() => {
    cancelledRef.current = false;
    return () => { cancelledRef.current = true; };
  }, []);

  const handleClose = useCallback(() => {
    cancelledRef.current = true;
    onClose();
  }, [onClose]);

  const startDrag = useCallback((mode: DragMode, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragRef.current = {
      mode,
      startX: e.clientX,
      startY: e.clientY,
      startCrop: { ...crop },
      zW: window.innerWidth,
      zH: window.innerHeight,
    };
  }, [crop]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const d = dragRef.current;
      if (!d?.mode) return;
      const dx = ((e.clientX - d.startX) / d.zW) * 100;
      const dy = ((e.clientY - d.startY) / d.zH) * 100;
      const s  = d.startCrop;
      setCrop(() => {
        let { x, y, w, h } = s;
        switch (d.mode) {
          case "move":
            x = clamp(s.x + dx, 0, 100 - s.w);
            y = clamp(s.y + dy, 0, 100 - s.h);
            break;
          case "se":
            w = clamp(s.w + dx, MIN_CROP_PCT, 100 - s.x);
            h = clamp(s.h + dy, MIN_CROP_PCT, 100 - s.y);
            break;
          case "sw": {
            const nx = clamp(s.x + dx, 0, s.x + s.w - MIN_CROP_PCT);
            x = nx; w = s.x + s.w - nx;
            h = clamp(s.h + dy, MIN_CROP_PCT, 100 - s.y);
            break;
          }
          case "ne": {
            w = clamp(s.w + dx, MIN_CROP_PCT, 100 - s.x);
            const ny = clamp(s.y + dy, 0, s.y + s.h - MIN_CROP_PCT);
            y = ny; h = s.y + s.h - ny;
            break;
          }
          case "nw": {
            const nx = clamp(s.x + dx, 0, s.x + s.w - MIN_CROP_PCT);
            const ny = clamp(s.y + dy, 0, s.y + s.h - MIN_CROP_PCT);
            x = nx; w = s.x + s.w - nx;
            y = ny; h = s.y + s.h - ny;
            break;
          }
        }
        return { x, y, w, h };
      });
    };
    const onUp = () => { dragRef.current = null; };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup",   onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup",   onUp);
    };
  }, []);

  const startRecording = useCallback(async () => {
    cancelledRef.current = false;
    setPhase("countdown");
    setCountdown(COUNTDOWN_START);

    for (let c = COUNTDOWN_START; c >= 1; c--) {
      if (cancelledRef.current) return;
      setCountdown(c);
      await new Promise(r => setTimeout(r, 1000));
    }
    if (cancelledRef.current) return;

    setPhase("recording");
    setProgress(0);

    const node = zoneRef.current;
    if (!node) { setPhase("error"); setErrorMsg("Zone element not found"); return; }

    const mimeType = [
      "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm",
      "video/mp4;codecs=avc1", "video/mp4",
    ].find(t => MediaRecorder.isTypeSupported(t));
    if (!mimeType) { setPhase("error"); setErrorMsg("MediaRecorder not supported in this browser"); return; }

    const vW = window.innerWidth;
    const vH = window.innerHeight;
    const cropPx = {
      x: (crop.x / 100) * vW,
      y: (crop.y / 100) * vH,
      w: (crop.w / 100) * vW,
      h: (crop.h / 100) * vH,
    };

    const recCanvas    = document.createElement("canvas");
    recCanvas.width    = Math.round(cropPx.w);
    recCanvas.height   = Math.round(cropPx.h);
    const ctx = recCanvas.getContext("2d");
    if (!ctx) { setPhase("error"); setErrorMsg("Canvas context unavailable"); return; }

    const stream   = recCanvas.captureStream(FPS);
    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.start(200);

    const startTs = performance.now();
    const frameMs = 1000 / FPS;

    while (performance.now() - startTs < RECORDING_MS) {
      if (cancelledRef.current) { recorder.stop(); return; }
      const t0 = performance.now();
      try {
        const snap = await html2canvas(node, {
          backgroundColor: bg, scale: 1, logging: false, useCORS: true,
        });
        ctx.clearRect(0, 0, recCanvas.width, recCanvas.height);
        ctx.drawImage(snap, cropPx.x, cropPx.y, cropPx.w, cropPx.h, 0, 0, recCanvas.width, recCanvas.height);
        setProgress(Math.min(1, (performance.now() - startTs) / RECORDING_MS));
      } catch { /* skip frame */ }
      const wait = Math.max(0, frameMs - (performance.now() - t0));
      if (wait > 0) await new Promise(r => setTimeout(r, wait));
    }

    if (cancelledRef.current) { recorder.stop(); return; }
    recorder.stop();
    await new Promise<void>(r => { recorder.onstop = () => r(); });

    const blob = new Blob(chunks, { type: mimeType });
    if (blob.size < 1000) { setPhase("error"); setErrorMsg(`Aufnahme leer (${blob.size}B). Versuche es erneut.`); return; }

    setPhase("uploading");
    try {
      const ext = mimeType.includes("mp4") ? "mp4" : "webm";
      const { url, path } = await uploadPreviewVideo(blob, sessionId, toolName, ext);
      if (!cancelledRef.current) onDone(url, path);
    } catch (err) {
      if (!cancelledRef.current) { setPhase("error"); setErrorMsg(String(err)); }
    }
  }, [crop, zoneRef, bg, sessionId, toolName, onDone]);

  const SHADE = "rgba(0,0,0,0.58)";

  return createPortal(
    <>
      <style>{`@keyframes recBlink { 0%,100%{opacity:1} 50%{opacity:0.15} }`}</style>
      <div style={{ position: "fixed", inset: 0, zIndex: 200, userSelect: "none" }}>

        {/* ── Selecting ── */}
        {phase === "selecting" && (
          <>
            {/* 4-panel dim */}
            <div style={{ position:"absolute", left:0, top:0, right:0, height:`${crop.y}%`, background:SHADE, pointerEvents:"none" }} />
            <div style={{ position:"absolute", left:0, bottom:0, right:0, top:`${crop.y+crop.h}%`, background:SHADE, pointerEvents:"none" }} />
            <div style={{ position:"absolute", top:`${crop.y}%`, left:0, width:`${crop.x}%`, height:`${crop.h}%`, background:SHADE, pointerEvents:"none" }} />
            <div style={{ position:"absolute", top:`${crop.y}%`, left:`${crop.x+crop.w}%`, right:0, height:`${crop.h}%`, background:SHADE, pointerEvents:"none" }} />

            {/* Selection box */}
            <div
              onMouseDown={(e) => startDrag("move", e)}
              style={{
                position: "absolute",
                left: `${crop.x}%`, top: `${crop.y}%`,
                width: `${crop.w}%`, height: `${crop.h}%`,
                border: "1.5px solid rgba(255,255,255,0.85)",
                boxSizing: "border-box",
                cursor: "move",
              }}
            >
              {/* Rule-of-thirds guide */}
              <div style={{
                position: "absolute", inset: 0, pointerEvents: "none",
                backgroundImage: "linear-gradient(rgba(255,255,255,0.12) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.12) 1px,transparent 1px)",
                backgroundSize: "33.33% 33.33%",
              }} />

              {/* Corner handles */}
              {(["nw","ne","se","sw"] as const).map(c => (
                <div
                  key={c}
                  onMouseDown={(e) => { e.stopPropagation(); startDrag(c, e); }}
                  style={{
                    position: "absolute", width: "14px", height: "14px",
                    background: "white", borderRadius: "2px",
                    ...(c === "nw" ? { left:"-1px", top:"-1px",       cursor:"nw-resize" } :
                        c === "ne" ? { right:"-1px", top:"-1px",      cursor:"ne-resize" } :
                        c === "se" ? { right:"-1px", bottom:"-1px",   cursor:"se-resize" } :
                                     { left:"-1px",  bottom:"-1px",   cursor:"sw-resize" }),
                  }}
                />
              ))}
            </div>

            {/* Instruction bar */}
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              padding: "14px 24px",
              background: "rgba(8,8,8,0.82)",
              backdropFilter: "blur(10px)",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px",
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                <span style={{ fontFamily: FONT_SANS, fontSize: "14px", color: "rgba(255,255,255,0.88)", fontWeight: 500 }}>
                  {DE ? "Ausschnitt wählen" : "Choose crop area"}
                </span>
                <span style={{ fontFamily: FONT_SANS, fontSize: "12px", color: "rgba(255,255,255,0.5)", lineHeight: "1.4" }}>
                  {DE
                    ? "Ziehe die Ecken, um den Rahmen anzupassen. Aufnahme: 10 Sek."
                    : "Drag corners to resize the frame. Recording: 10 sec."}
                </span>
              </div>
              <div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
                <button
                  onClick={handleClose}
                  style={{
                    fontFamily: FONT_SANS, fontSize: "13px", padding: "9px 18px",
                    background: "rgba(255,255,255,0.07)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: "7px", color: "rgba(255,255,255,0.65)", cursor: "pointer",
                  }}
                >{DE ? "Abbrechen" : "Cancel"}</button>
                <button
                  onClick={startRecording}
                  style={{
                    fontFamily: FONT_SANS, fontSize: "13px", padding: "9px 20px",
                    background: "white", border: "none",
                    borderRadius: "7px", color: "#111", cursor: "pointer", fontWeight: 500,
                  }}
                >{DE ? "Aufnahme starten →" : "Start recording →"}</button>
              </div>
            </div>
          </>
        )}

        {/* ── Countdown ── */}
        {phase === "countdown" && (
          <div style={{
            position: "absolute", inset: 0,
            background: "rgba(0,0,0,0.42)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexDirection: "column", gap: "10px",
            pointerEvents: "none",
          }}>
            <div style={{
              fontFamily: FONT_SERIF,
              fontSize: "128px", lineHeight: 1,
              color: "white", fontWeight: 400,
              textShadow: "0 4px 40px rgba(0,0,0,0.45)",
            }}>{countdown}</div>
            <span style={{ fontFamily: FONT_SANS, fontSize: "14px", color: "rgba(255,255,255,0.6)", letterSpacing: "0.04em" }}>
              {DE ? "Gleich startet die Aufnahme…" : "Recording starts soon…"}
            </span>
          </div>
        )}

        {/* ── Recording ── */}
        {phase === "recording" && (
          <>
            {/* Crop border */}
            <div style={{
              position: "absolute",
              left: `${crop.x}%`, top: `${crop.y}%`,
              width: `${crop.w}%`, height: `${crop.h}%`,
              border: "2px solid rgba(220,40,40,0.65)",
              boxSizing: "border-box",
              pointerEvents: "none",
            }} />
            {/* REC badge */}
            <div style={{
              position: "absolute",
              top: `${crop.y}%`,
              left: `${crop.x}%`,
              transform: "translateY(-100%) translateY(-8px)",
              display: "flex", alignItems: "center", gap: "6px",
              padding: "4px 10px",
              background: "rgba(205,30,30,0.92)",
              borderRadius: "4px",
              pointerEvents: "none",
            }}>
              <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:"white", animation:"recBlink 1s ease infinite" }} />
              <span style={{ fontFamily:FONT_SANS, fontSize:"12px", color:"white", fontWeight:600, letterSpacing:"0.07em" }}>
                REC {Math.round(progress * 10)}s / 10s
              </span>
            </div>
            {/* Progress bar */}
            <div style={{ position:"absolute", bottom:0, left:0, right:0, height:"3px", background:"rgba(0,0,0,0.25)" }}>
              <div style={{ height:"100%", width:`${progress*100}%`, background:"rgba(210,35,35,0.85)", transition:"width 0.15s linear" }} />
            </div>
          </>
        )}

        {/* ── Uploading ── */}
        {phase === "uploading" && (
          <div style={{
            position: "absolute", inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            pointerEvents: "none",
          }}>
            <span style={{ fontFamily: FONT_SANS, fontSize: "14px", color: "rgba(255,255,255,0.85)" }}>
              {DE ? "Wird hochgeladen…" : "Uploading…"}
            </span>
          </div>
        )}

        {/* ── Error ── */}
        {phase === "error" && (
          <div style={{
            position: "absolute", inset: 0,
            background: "rgba(0,0,0,0.62)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexDirection: "column", gap: "16px",
          }}>
            <span style={{ fontFamily: FONT_SERIF, fontSize: "22px", color: "rgba(255,255,255,0.9)" }}>
              {DE ? "Aufnahme fehlgeschlagen." : "Recording failed."}
            </span>
            {errorMsg && (
              <span style={{ fontFamily: FONT_SANS, fontSize: "12px", color: "rgba(255,255,255,0.4)", maxWidth: "340px", textAlign: "center", lineHeight: "1.5" }}>
                {errorMsg}
              </span>
            )}
            <button
              onClick={handleClose}
              style={{
                fontFamily: FONT_SANS, fontSize: "13px", padding: "9px 20px",
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: "7px", color: "rgba(255,255,255,0.8)", cursor: "pointer",
              }}
            >{DE ? "Schließen" : "Close"}</button>
          </div>
        )}

      </div>
    </>,
    document.body
  );
}
