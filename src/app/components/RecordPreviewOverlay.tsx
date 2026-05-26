import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import html2canvas from "html2canvas-pro";
import { uploadPreviewVideo } from "../utils/storage";

const FONT_SANS  = "'general-sans', 'Space Grotesk', sans-serif";
const FONT_SERIF = "'freight-text-pro', 'EB Garamond', Georgia, serif";
const MAX_SECS   = 10;
const FPS        = 8;
const MIN_W      = 220;
const RATIO      = 2 / 3; // card aspect ratio h/w
const HANDLE_PX  = 10;

type Phase    = "idle" | "countdown" | "recording" | "uploading" | "error";
type DragMode = "move" | "nw" | "ne" | "se" | "sw" | null;

interface Frame { x: number; y: number; w: number; }
function fh(w: number) { return Math.round(w * RATIO); }

function initFrame(): Frame {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const w  = Math.min(Math.round(vw * 0.50), 660);
  const h  = fh(w);
  return { x: Math.round((vw - w) / 2), y: Math.round((vh - h) / 2), w };
}

interface Props {
  zoneRef: React.RefObject<HTMLDivElement | null>;
  bg: string;
  dark: boolean;
  sessionId: string;
  toolName: string;
  lang: "de" | "en";
  onDone: (url: string, path: string) => void;
  onClose: () => void;
}

export function RecordPreviewOverlay({
  zoneRef, bg, dark, sessionId, toolName, lang, onDone, onClose,
}: Props) {
  const DE = lang === "de";

  // Design tokens matching the app
  const borderCol  = dark ? "rgba(240,232,220,0.22)" : "#a4a4a4";
  const textCol    = dark ? "#f0e8dc" : "#555555";
  const mutedCol   = dark ? "rgba(240,232,220,0.45)" : "#9a9daa";
  const surfaceBg  = dark ? "rgba(28,27,25,0.93)" : "rgba(252,246,239,0.95)";
  const btnPrimary = { bg: dark ? "#f0e8dc" : "#555555", text: dark ? "#1e1d1b" : "#fcf6ef" };

  const [frame, setFrame]     = useState<Frame>(initFrame);
  const [phase, setPhase]     = useState<Phase>("idle");
  const [countdown, setCount] = useState(3);
  const [elapsed, setElapsed] = useState(0);
  const [errorMsg, setError]  = useState("");

  const cancelledRef = useRef(false);
  const stopRef      = useRef(false);
  const dragRef      = useRef<{
    mode: DragMode; mx: number; my: number;
    fx: number; fy: number; fw: number; ffh: number;
  } | null>(null);

  useEffect(() => {
    cancelledRef.current = false;
    return () => { cancelledRef.current = true; stopRef.current = true; };
  }, []);

  // Elapsed counter while recording
  useEffect(() => {
    if (phase !== "recording") return;
    const id = setInterval(() => setElapsed(e => Math.min(e + 1, MAX_SECS)), 1000);
    return () => clearInterval(id);
  }, [phase]);

  // ── Drag ──────────────────────────────────────────────────────────────
  const startDrag = useCallback((mode: DragMode, e: React.MouseEvent) => {
    if (phase !== "idle") return;
    e.preventDefault(); e.stopPropagation();
    dragRef.current = {
      mode, mx: e.clientX, my: e.clientY,
      fx: frame.x, fy: frame.y, fw: frame.w, ffh: fh(frame.w),
    };
  }, [frame, phase]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const d = dragRef.current;
      if (!d?.mode) return;
      const dx = e.clientX - d.mx;
      const dy = e.clientY - d.my;
      const vw = window.innerWidth, vh = window.innerHeight;

      setFrame(() => {
        let x = d.fx, y = d.fy, w = d.fw;
        const h = d.ffh;

        switch (d.mode) {
          case "move":
            x = Math.max(0, Math.min(vw - w,  d.fx + dx));
            y = Math.max(0, Math.min(vh - h,  d.fy + dy));
            break;
          case "se":
            w = Math.max(MIN_W, Math.min(d.fw + dx, vw - d.fx));
            break;
          case "sw": {
            const nw = Math.max(MIN_W, d.fw - dx);
            const nx = d.fx + d.fw - nw;
            if (nx >= 0) { x = nx; w = nw; }
            break;
          }
          case "ne": {
            const nw = Math.max(MIN_W, Math.min(d.fw + dx, vw - d.fx));
            const ny = d.fy + d.ffh - fh(nw);
            if (ny >= 0) { y = ny; w = nw; }
            break;
          }
          case "nw": {
            const nw = Math.max(MIN_W, d.fw - dx);
            const nx = d.fx + d.fw - nw;
            const ny = d.fy + d.ffh - fh(nw);
            if (nx >= 0 && ny >= 0) { x = nx; y = ny; w = nw; }
            break;
          }
        }
        return { x, y, w };
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

  // ── Recording flow ────────────────────────────────────────────────────
  const startFlow = useCallback(async () => {
    cancelledRef.current = false;
    stopRef.current = false;

    // Countdown 3 → 1
    setPhase("countdown");
    for (let c = 3; c >= 1; c--) {
      if (cancelledRef.current) return;
      setCount(c);
      await new Promise(r => setTimeout(r, 1000));
    }
    if (cancelledRef.current) return;

    setPhase("recording");
    setElapsed(0);

    const mimeType = [
      "video/webm;codecs=vp9", "video/webm;codecs=vp8", "video/webm",
      "video/mp4;codecs=avc1", "video/mp4",
    ].find(t => MediaRecorder.isTypeSupported(t));
    if (!mimeType) { setError(DE ? "Browser unterstützt keine Aufnahme." : "Browser does not support recording."); setPhase("error"); return; }

    const cw = Math.round(frame.w);
    const ch = fh(cw);
    const cx = frame.x;
    const cy = frame.y;

    const recCanvas   = document.createElement("canvas");
    recCanvas.width   = cw;
    recCanvas.height  = ch;
    const ctx = recCanvas.getContext("2d");
    if (!ctx) { setError("Canvas unavailable."); setPhase("error"); return; }

    const stream   = recCanvas.captureStream(FPS);
    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => { if (e.data.size > 0) chunks.push(e.data); };
    recorder.start(200);

    const startTs = performance.now();
    const frameMs = 1000 / FPS;

    while (performance.now() - startTs < MAX_SECS * 1000 && !stopRef.current) {
      if (cancelledRef.current) { if (recorder.state !== "inactive") recorder.stop(); return; }
      const t0 = performance.now();
      try {
        const snap = await html2canvas(document.documentElement, {
          backgroundColor: bg,
          scale: 1,
          logging: false,
          useCORS: true,
          allowTaint: true,
          scrollX: 0,
          scrollY: 0,
          windowWidth: window.innerWidth,
          windowHeight: window.innerHeight,
        });
        ctx.clearRect(0, 0, cw, ch);
        ctx.drawImage(snap, cx, cy, cw, ch, 0, 0, cw, ch);
      } catch { /* skip frame */ }
      const wait = Math.max(0, frameMs - (performance.now() - t0));
      if (wait > 0) await new Promise(r => setTimeout(r, wait));
    }

    if (recorder.state !== "inactive") recorder.stop();
    await new Promise<void>(r => { recorder.onstop = () => r(); });
    if (cancelledRef.current) return;

    const blob = new Blob(chunks, { type: mimeType });
    if (blob.size < 1000) { setError(DE ? `Aufnahme leer — bitte erneut versuchen.` : `Recording empty — please try again.`); setPhase("error"); return; }

    setPhase("uploading");
    try {
      const ext = mimeType.includes("mp4") ? "mp4" : "webm";
      const { url, path } = await uploadPreviewVideo(blob, sessionId, toolName, ext);
      if (!cancelledRef.current) onDone(url, path);
    } catch (err) {
      if (!cancelledRef.current) { setError(String(err)); setPhase("error"); }
    }
  }, [frame, bg, sessionId, toolName, lang, onDone, DE]);

  const stopRecording = useCallback(() => { stopRef.current = true; }, []);

  const handleClose = useCallback(() => {
    cancelledRef.current = true;
    stopRef.current = true;
    onClose();
  }, [onClose]);

  // ── Render ────────────────────────────────────────────────────────────
  const frameHeight = fh(frame.w);
  const isIdle      = phase === "idle";
  const isRecording = phase === "recording";

  return createPortal(
    <>
      <style>{`@keyframes recPulse { 0%,100%{opacity:1} 50%{opacity:0.2} }`}</style>

      {/* Root layer — data-html2canvas-ignore prevents it from appearing in recorded frames */}
      <div data-html2canvas-ignore="true" style={{ position: "fixed", inset: 0, zIndex: 200, pointerEvents: "none" }}>

        {/* ── Frame ── */}
        <div style={{
          position: "absolute",
          left: frame.x, top: frame.y,
          width: frame.w, height: frameHeight,
          pointerEvents: "none",
        }}>

          {/* Drag body handle (top strip) */}
          {isIdle && (
            <div
              onMouseDown={(e) => startDrag("move", e)}
              style={{
                position: "absolute", top: 0, left: HANDLE_PX, right: HANDLE_PX,
                height: "36px", cursor: "move", pointerEvents: "auto", zIndex: 1,
              }}
            />
          )}

          {/* Frame border */}
          <div style={{
            position: "absolute", inset: 0, boxSizing: "border-box",
            border: isRecording
              ? "1.5px solid rgba(195,32,32,0.55)"
              : `1.5px dashed ${borderCol}`,
            pointerEvents: "none",
          }} />

          {/* Hint label above frame */}
          {isIdle && (
            <div style={{
              position: "absolute", bottom: "100%", left: 0, marginBottom: "7px",
              fontFamily: FONT_SANS, fontSize: "11px", color: mutedCol,
              letterSpacing: "0.04em", pointerEvents: "none", whiteSpace: "nowrap",
            }}>
              {DE ? "Verschieben & skalieren — Ecken ziehen" : "Drag to move & resize — drag corners"}
            </div>
          )}

          {/* Corner resize handles (idle only) */}
          {isIdle && (["nw", "ne", "se", "sw"] as const).map(c => (
            <div
              key={c}
              onMouseDown={(e) => { e.stopPropagation(); startDrag(c, e); }}
              style={{
                position: "absolute", pointerEvents: "auto",
                width: HANDLE_PX, height: HANDLE_PX,
                background: dark ? "rgba(240,232,220,0.35)" : "rgba(85,85,85,0.35)",
                borderRadius: "2px", zIndex: 2,
                ...(c === "nw" ? { top: 0,    left: 0,    cursor: "nw-resize" } :
                    c === "ne" ? { top: 0,    right: 0,   cursor: "ne-resize" } :
                    c === "se" ? { bottom: 0, right: 0,   cursor: "se-resize" } :
                                 { bottom: 0, left: 0,    cursor: "sw-resize" }),
              }}
            />
          ))}

          {/* Countdown number */}
          {phase === "countdown" && (
            <div style={{
              position: "absolute", inset: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              pointerEvents: "none",
            }}>
              <span style={{
                fontFamily: FONT_SERIF,
                fontSize: Math.round(frameHeight * 0.55) + "px",
                lineHeight: 1,
                color: dark ? "rgba(240,232,220,0.7)" : "rgba(42,42,40,0.55)",
              }}>{countdown}</span>
            </div>
          )}

          {/* ── Control strip ── */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0,
            background: surfaceBg,
            backdropFilter: "blur(10px)",
            borderTop: `1px dashed ${borderCol}`,
            padding: "10px 14px",
            display: "flex", alignItems: "center", gap: "10px",
            pointerEvents: "auto",
            boxSizing: "border-box",
          }}>

            {/* idle */}
            {phase === "idle" && (
              <>
                <span style={{ fontFamily: FONT_SANS, fontSize: "12px", color: mutedCol, flex: 1, lineHeight: "1.4" }}>
                  {DE
                    ? "Max. 10 Sek. · Du kannst während der Aufnahme weiterschreiben."
                    : "Max. 10 sec · You can keep writing during recording."}
                </span>
                <button
                  onClick={handleClose}
                  style={{ fontFamily: FONT_SANS, fontSize: "12px", padding: "6px 14px", background: "transparent", border: `1px dashed ${borderCol}`, borderRadius: "5px", color: mutedCol, cursor: "pointer", flexShrink: 0 }}
                >{DE ? "Abbrechen" : "Cancel"}</button>
                <button
                  onClick={startFlow}
                  style={{ fontFamily: FONT_SANS, fontSize: "12px", padding: "6px 16px", background: btnPrimary.bg, border: "none", borderRadius: "5px", color: btnPrimary.text, cursor: "pointer", fontWeight: 500, flexShrink: 0 }}
                >{DE ? "Aufnahme starten →" : "Start recording →"}</button>
              </>
            )}

            {/* countdown */}
            {phase === "countdown" && (
              <>
                <span style={{ fontFamily: FONT_SANS, fontSize: "12px", color: mutedCol, flex: 1 }}>
                  {DE ? "Gleich startet die Aufnahme…" : "Recording starts soon…"}
                </span>
                <button
                  onClick={handleClose}
                  style={{ fontFamily: FONT_SANS, fontSize: "12px", padding: "6px 14px", background: "transparent", border: `1px dashed ${borderCol}`, borderRadius: "5px", color: mutedCol, cursor: "pointer" }}
                >{DE ? "Abbrechen" : "Cancel"}</button>
              </>
            )}

            {/* recording */}
            {phase === "recording" && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                  <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "rgb(195,32,32)", animation: "recPulse 1s ease infinite" }} />
                  <span style={{ fontFamily: FONT_SANS, fontSize: "12px", color: textCol, fontWeight: 600, letterSpacing: "0.05em" }}>REC</span>
                  <span style={{ fontFamily: FONT_SANS, fontSize: "12px", color: mutedCol }}>{elapsed}s / {MAX_SECS}s</span>
                </div>
                <div style={{ flex: 1, height: "2px", background: dark ? "rgba(240,232,220,0.12)" : "rgba(0,0,0,0.1)", borderRadius: "1px" }}>
                  <div style={{ height: "100%", width: `${(elapsed / MAX_SECS) * 100}%`, background: "rgb(195,32,32)", borderRadius: "1px", transition: "width 1s linear" }} />
                </div>
                <button
                  onClick={stopRecording}
                  style={{ fontFamily: FONT_SANS, fontSize: "12px", padding: "6px 14px", background: "transparent", border: `1px dashed ${borderCol}`, borderRadius: "5px", color: textCol, cursor: "pointer", flexShrink: 0 }}
                >{DE ? "■  Stoppen" : "■  Stop"}</button>
              </>
            )}

            {/* uploading */}
            {phase === "uploading" && (
              <span style={{ fontFamily: FONT_SANS, fontSize: "12px", color: mutedCol }}>
                {DE ? "Wird hochgeladen…" : "Uploading…"}
              </span>
            )}

            {/* error */}
            {phase === "error" && (
              <>
                <span style={{ fontFamily: FONT_SANS, fontSize: "12px", color: "#e05252", flex: 1, lineHeight: "1.4" }}>
                  {errorMsg || (DE ? "Aufnahme fehlgeschlagen." : "Recording failed.")}
                </span>
                <button
                  onClick={handleClose}
                  style={{ fontFamily: FONT_SANS, fontSize: "12px", padding: "6px 14px", background: "transparent", border: `1px dashed ${borderCol}`, borderRadius: "5px", color: mutedCol, cursor: "pointer" }}
                >{DE ? "Schließen" : "Close"}</button>
              </>
            )}

          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
