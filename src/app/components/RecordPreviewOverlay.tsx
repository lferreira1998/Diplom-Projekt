import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import html2canvas from "html2canvas-pro";
import { uploadPreviewVideo } from "../utils/storage";

const FONT_SANS  = "'az-sans', sans-serif";
const FONT_SERIF = "'az-serif', serif";
const MAX_SECS   = 10;
const FPS        = 8;
const MIN_W      = 220;
const DEF_RATIO  = 2 / 3; // default card aspect ratio h/w
const HANDLE_PX  = 10;

// ── Shape definitions ─────────────────────────────────────────────────────────
type ShapeId = "round" | "portrait" | "landscape" | "wide-pill" | "fluid" | "tall-pill" | "spiral-leaf";

interface ShapeDef {
  id: ShapeId;
  label: string; labelDe: string;
  ratio: number; // h / w
  frameBorderRadius?: string;
  applyClip?: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
}

function rrPath(ctx: CanvasRenderingContext2D, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  if (typeof (ctx as unknown as { roundRect?: unknown }).roundRect === "function") {
    (ctx as unknown as { roundRect: (x: number, y: number, w: number, h: number, r: number) => void }).roundRect(0, 0, w, h, rr);
  } else {
    ctx.moveTo(rr, 0); ctx.lineTo(w - rr, 0); ctx.arcTo(w, 0, w, rr, rr);
    ctx.lineTo(w, h - rr); ctx.arcTo(w, h, w - rr, h, rr);
    ctx.lineTo(rr, h); ctx.arcTo(0, h, 0, h - rr, rr);
    ctx.lineTo(0, rr); ctx.arcTo(0, 0, rr, 0, rr);
    ctx.closePath();
  }
}

// Rounded-rect clip with per-corner radii [tl, tr, br, bl] (CSS order).
function rrPathVar(ctx: CanvasRenderingContext2D, w: number, h: number, radii: [number, number, number, number]) {
  ctx.beginPath();
  if (typeof (ctx as unknown as { roundRect?: unknown }).roundRect === "function") {
    (ctx as unknown as { roundRect: (x: number, y: number, w: number, h: number, r: number[]) => void }).roundRect(0, 0, w, h, radii);
  } else {
    const m = (r: number) => Math.min(r, w / 2, h / 2);
    const [tl, tr, br, bl] = radii.map(m);
    ctx.moveTo(tl, 0);
    ctx.lineTo(w - tr, 0); ctx.arcTo(w, 0, w, tr, tr);
    ctx.lineTo(w, h - br); ctx.arcTo(w, h, w - br, h, br);
    ctx.lineTo(bl, h); ctx.arcTo(0, h, 0, h - bl, bl);
    ctx.lineTo(0, tl); ctx.arcTo(0, 0, tl, 0, tl);
    ctx.closePath();
  }
}

const SHAPES: ShapeDef[] = [
  {
    id: "round", label: "Round", labelDe: "Rund", ratio: 1,
    frameBorderRadius: "50%",
    applyClip: (ctx, w, h) => {
      ctx.beginPath(); ctx.ellipse(w / 2, h / 2, w / 2, h / 2, 0, 0, Math.PI * 2); ctx.clip();
    },
  },
  {
    id: "portrait", label: "Portrait", labelDe: "Hochkant", ratio: 182 / 241,
    frameBorderRadius: "4px",
    applyClip: (ctx, w, h) => { rrPath(ctx, w, h, 4); ctx.clip(); },
  },
  {
    id: "landscape", label: "Landscape", labelDe: "Querformat", ratio: 163 / 251,
    frameBorderRadius: "4px",
    applyClip: (ctx, w, h) => { rrPath(ctx, w, h, 4); ctx.clip(); },
  },
  {
    id: "wide-pill", label: "Wide", labelDe: "Breit", ratio: 163 / 324,
    frameBorderRadius: "100px",
    applyClip: (ctx, w, h) => { rrPath(ctx, w, h, h / 2); ctx.clip(); },
  },
  {
    id: "fluid", label: "Fluid", labelDe: "Fließend", ratio: 174 / 363,
    frameBorderRadius: "40px 4px 40px 4px",
    applyClip: (ctx, w, h) => {
      const lg = Math.round(w * 40 / 363);
      const sm = Math.max(2, Math.round(w * 4 / 363));
      ctx.beginPath();
      ctx.moveTo(lg, 0);
      ctx.lineTo(w - sm, 0); ctx.arcTo(w, 0, w, sm, sm);
      ctx.lineTo(w, h - lg); ctx.arcTo(w, h, w - lg, h, lg);
      ctx.lineTo(sm, h); ctx.arcTo(0, h, 0, h - sm, sm);
      ctx.lineTo(0, lg); ctx.arcTo(0, 0, lg, 0, lg);
      ctx.closePath(); ctx.clip();
    },
  },
  {
    id: "tall-pill", label: "Oval", labelDe: "Hochoval", ratio: 309 / 211,
    frameBorderRadius: "200px",
    applyClip: (ctx, w, h) => { rrPath(ctx, w, h, w / 2); ctx.clip(); },
  },
  {
    id: "spiral-leaf", label: "Spiral", labelDe: "Spirale", ratio: 163 / 319,
    frameBorderRadius: "24px 200px 24px 200px",
    applyClip: (ctx, w, h) => {
      rrPathVar(ctx, w, h, [w * 24 / 319, w * 200 / 319, w * 24 / 319, w * 200 / 319]);
      ctx.clip();
    },
  },
];

// Shapes offered in the picker (full SHAPES list is kept so previously saved
// tools recorded in other shapes still render correctly).
const PICKABLE_IDS: ShapeId[] = ["wide-pill", "fluid", "landscape", "spiral-leaf"];
const PICKABLE_SHAPES: ShapeDef[] = PICKABLE_IDS.map(id => SHAPES.find(s => s.id === id)!);

// SVG icon for each shape (56×56 viewBox)
function ShapeIcon({ id, fill }: { id: ShapeId; fill: string }) {
  return (
    <svg width={48} height={48} viewBox="0 0 56 56" fill="none">
      {id === "round"     && <ellipse cx="28" cy="28" rx="26" ry="26" fill={fill} />}
      {id === "portrait"  && <rect x="10" y="4" width="36" height="48" rx="2" fill={fill} />}
      {id === "landscape" && <rect x="2" y="14" width="52" height="28" rx="2" fill={fill} />}
      {id === "wide-pill" && <rect x="2" y="17" width="52" height="22" rx="11" fill={fill} />}
      {id === "fluid"     && <path d="M 10 16 L 52 16 Q 54 16 54 18 L 54 38 Q 54 40 46 40 L 4 40 Q 2 40 2 38 L 2 24 Q 2 16 10 16 Z" fill={fill} />}
      {id === "tall-pill" && <rect x="16" y="2" width="24" height="52" rx="12" fill={fill} />}
      {id === "spiral-leaf" && <path d="M7 16 L41 16 A12 12 0 0 1 53 28 L53 36 A4 4 0 0 1 49 40 L15 40 A12 12 0 0 1 3 28 L3 20 A4 4 0 0 1 7 16 Z" fill={fill} />}
    </svg>
  );
}

type Phase = "shape-select" | "idle" | "countdown" | "recording" | "uploading" | "error";
type DragMode = "move" | "nw" | "ne" | "se" | "sw" | null;

interface Frame { x: number; y: number; w: number; }

function initFrame(ratio = DEF_RATIO): Frame {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const w  = Math.min(Math.round(vw * 0.50), 660);
  const h  = Math.round(w * ratio);
  return { x: Math.round((vw - w) / 2), y: Math.round((vh - h) / 2), w };
}

interface Props {
  zoneRef: React.RefObject<HTMLDivElement | null>;
  bg: string;
  dark: boolean;
  sessionId: string;
  toolName: string;
  lang: "de" | "en";
  onDone: (url: string, path: string, shapeId: string) => void;
  onClose: () => void;
}

export function RecordPreviewOverlay({
  zoneRef, bg, dark, sessionId, toolName, lang, onDone, onClose,
}: Props) {
  const DE = lang === "de";

  const borderCol  = dark ? "rgba(240,232,220,0.22)" : "#a4a4a4";
  const textCol    = dark ? "#f0e8dc" : "#555555";
  const mutedCol   = dark ? "rgba(240,232,220,0.45)" : "#9a9daa";
  const surfaceBg  = dark
    ? `color-mix(in srgb, ${bg} 72%, rgba(18,17,16,0.9))`
    : `color-mix(in srgb, ${bg} 80%, rgba(255,255,255,0.9))`;
  const btnPrimary = { bg: dark ? "#f0e8dc" : "#555555", text: dark ? "#1e1d1b" : "#fcf6ef" };

  const [shape,     setShape]   = useState<ShapeDef>(PICKABLE_SHAPES[0]); // default: Wide
  const [phase,     setPhase]   = useState<Phase>("shape-select");
  const [frame,     setFrame]   = useState<Frame>(initFrame);
  const [countdown, setCount]   = useState(3);
  const [elapsed,   setElapsed] = useState(0);
  const [errorMsg,  setError]   = useState("");

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

  useEffect(() => {
    if (phase !== "recording") return;
    const id = setInterval(() => setElapsed(e => Math.min(e + 1, MAX_SECS)), 1000);
    return () => clearInterval(id);
  }, [phase]);

  const frameH = Math.round(frame.w * shape.ratio);

  // ── Shape selection ──────────────────────────────────────────────────────
  const handlePickShape = useCallback((s: ShapeDef) => {
    setShape(s);
    // Recentre frame for the new ratio
    const vw = window.innerWidth, vh = window.innerHeight;
    const w = Math.min(Math.round(vw * 0.50), 660);
    const h = Math.round(w * s.ratio);
    const clampedW = h > vh * 0.72 ? Math.round(vh * 0.72 / s.ratio) : w;
    const ch = Math.round(clampedW * s.ratio);
    setFrame({ x: Math.round((vw - clampedW) / 2), y: Math.round((vh - ch) / 2), w: clampedW });
    setPhase("idle");
  }, []);

  // ── Drag ─────────────────────────────────────────────────────────────────
  const startDrag = useCallback((mode: DragMode, e: React.MouseEvent) => {
    if (phase !== "idle") return;
    e.preventDefault(); e.stopPropagation();
    dragRef.current = {
      mode, mx: e.clientX, my: e.clientY,
      fx: frame.x, fy: frame.y, fw: frame.w, ffh: frameH,
    };
  }, [frame, frameH, phase]);

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
            x = Math.max(0, Math.min(vw - w, d.fx + dx));
            y = Math.max(0, Math.min(vh - h, d.fy + dy));
            break;
          case "se": w = Math.max(MIN_W, Math.min(d.fw + dx, vw - d.fx)); break;
          case "sw": {
            const nw = Math.max(MIN_W, d.fw - dx);
            const nx = d.fx + d.fw - nw;
            if (nx >= 0) { x = nx; w = nw; } break;
          }
          case "ne": {
            const nw = Math.max(MIN_W, Math.min(d.fw + dx, vw - d.fx));
            const ny = d.fy + d.ffh - Math.round(nw * shape.ratio);
            if (ny >= 0) { y = ny; w = nw; } break;
          }
          case "nw": {
            const nw = Math.max(MIN_W, d.fw - dx);
            const nx = d.fx + d.fw - nw;
            const ny = d.fy + d.ffh - Math.round(nw * shape.ratio);
            if (nx >= 0 && ny >= 0) { x = nx; y = ny; w = nw; } break;
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
  }, [shape.ratio]);

  // ── Recording flow ────────────────────────────────────────────────────────
  const startFlow = useCallback(async () => {
    cancelledRef.current = false;
    stopRef.current = false;

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
    const ch = Math.round(frame.w * shape.ratio);
    const cx = frame.x;
    const cy = frame.y;

    const recCanvas  = document.createElement("canvas");
    recCanvas.width  = cw;
    recCanvas.height = ch;
    const ctx = recCanvas.getContext("2d");
    if (!ctx) { setError("Canvas unavailable."); setPhase("error"); return; }

    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, cw, ch);

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
          backgroundColor: bg, scale: 1, logging: false,
          useCORS: true, allowTaint: true,
          scrollX: 0, scrollY: 0,
          windowWidth: window.innerWidth, windowHeight: window.innerHeight,
        });
        // Fill bg first (covers area outside the shape clip)
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, cw, ch);
        // Apply shape clip then draw
        ctx.save();
        if (shape.applyClip) shape.applyClip(ctx, cw, ch);
        ctx.drawImage(snap, cx, cy, cw, ch, 0, 0, cw, ch);
        ctx.restore();
      } catch { /* skip frame */ }
      const wait = Math.max(0, frameMs - (performance.now() - t0));
      if (wait > 0) await new Promise(r => setTimeout(r, wait));
    }

    if (recorder.state !== "inactive") recorder.stop();
    await new Promise<void>(r => { recorder.onstop = () => r(); });
    if (cancelledRef.current) return;

    const blob = new Blob(chunks, { type: mimeType });
    if (blob.size < 1000) { setError(DE ? "Aufnahme leer, bitte erneut versuchen." : "Recording empty, please try again."); setPhase("error"); return; }

    setPhase("uploading");
    try {
      const ext = mimeType.includes("mp4") ? "mp4" : "webm";
      const { url, path } = await uploadPreviewVideo(blob, sessionId, toolName, ext);
      if (!cancelledRef.current) onDone(url, path, shape.id);
    } catch (err) {
      if (!cancelledRef.current) { setError(String(err)); setPhase("error"); }
    }
  }, [frame, shape, bg, sessionId, toolName, lang, onDone, DE]);

  const stopRecording = useCallback(() => { stopRef.current = true; }, []);
  const handleClose   = useCallback(() => { cancelledRef.current = true; stopRef.current = true; onClose(); }, [onClose]);

  const isIdle      = phase === "idle";
  const isRecording = phase === "recording";
  const shapeBr     = shape.frameBorderRadius;

  // ── Control strip ─────────────────────────────────────────────────────────
  const controlStrip = (
    <div style={{
      position: "absolute",
      left: frame.x, top: frame.y + frameH,
      width: frame.w,
      background: surfaceBg, backdropFilter: "blur(10px)",
      borderLeft: `1px dashed ${borderCol}`, borderRight: `1px dashed ${borderCol}`,
      borderBottom: `1px dashed ${borderCol}`, borderTop: `1px dashed ${borderCol}`,
      padding: "9px 12px",
      display: "flex", alignItems: "center", gap: "10px",
      pointerEvents: "auto", boxSizing: "border-box",
    }}>
      {phase === "idle" && (
        <>
          <button
            onClick={() => setPhase("shape-select")}
            title={DE ? "Form ändern" : "Change shape"}
            style={{
              background: "transparent", border: `1px dashed ${borderCol}`,
              borderRadius: "4px", padding: "4px 8px", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}
          >
            <ShapeIcon id={shape.id} fill={mutedCol} />
          </button>
          <span style={{ fontFamily: FONT_SANS, fontSize: "12px", color: mutedCol, flex: 1, lineHeight: "1.4", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {DE ? "Max. 10 Sek. · Während der Aufnahme weiterschreiben möglich." : "Max. 10 sec · Keep writing during recording."}
          </span>
          <button onClick={handleClose} style={{ fontFamily: FONT_SANS, fontSize: "12px", padding: "6px 14px", background: "transparent", border: `1px dashed ${borderCol}`, borderRadius: "5px", color: mutedCol, cursor: "pointer", flexShrink: 0 }}>
            {DE ? "Abbrechen" : "Cancel"}
          </button>
          <button onClick={startFlow} style={{ fontFamily: FONT_SANS, fontSize: "12px", padding: "6px 16px", background: btnPrimary.bg, border: "none", borderRadius: "5px", color: btnPrimary.text, cursor: "pointer", fontWeight: 500, flexShrink: 0 }}>
            {DE ? "Starten →" : "Start →"}
          </button>
        </>
      )}
      {phase === "countdown" && (
        <>
          <span style={{ fontFamily: FONT_SANS, fontSize: "12px", color: mutedCol, flex: 1 }}>
            {DE ? "Gleich startet die Aufnahme…" : "Recording starts soon…"}
          </span>
          <button onClick={handleClose} style={{ fontFamily: FONT_SANS, fontSize: "12px", padding: "6px 14px", background: "transparent", border: `1px dashed ${borderCol}`, borderRadius: "5px", color: mutedCol, cursor: "pointer" }}>
            {DE ? "Abbrechen" : "Cancel"}
          </button>
        </>
      )}
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
          <button onClick={stopRecording} style={{ fontFamily: FONT_SANS, fontSize: "12px", padding: "6px 14px", background: "transparent", border: `1px dashed ${borderCol}`, borderRadius: "5px", color: textCol, cursor: "pointer", flexShrink: 0 }}>
            ■ Stop
          </button>
        </>
      )}
      {phase === "uploading" && (
        <span style={{ fontFamily: FONT_SANS, fontSize: "12px", color: mutedCol }}>
          {DE ? "Wird hochgeladen…" : "Uploading…"}
        </span>
      )}
      {phase === "error" && (
        <>
          <span style={{ fontFamily: FONT_SANS, fontSize: "12px", color: "#e05252", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {errorMsg || (DE ? "Aufnahme fehlgeschlagen." : "Recording failed.")}
          </span>
          <button onClick={handleClose} style={{ fontFamily: FONT_SANS, fontSize: "12px", padding: "6px 14px", background: "transparent", border: `1px dashed ${borderCol}`, borderRadius: "5px", color: mutedCol, cursor: "pointer" }}>
            {DE ? "Schließen" : "Close"}
          </button>
        </>
      )}
    </div>
  );

  return createPortal(
    <>
      <style>{`@keyframes recPulse { 0%,100%{opacity:1} 50%{opacity:0.2} }`}</style>

      {/* Shape picker modal */}
      {phase === "shape-select" && (
        <div
          data-html2canvas-ignore="true"
          style={{
            position: "fixed", inset: 0, zIndex: 200,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: dark ? "rgba(0,0,0,0.55)" : "rgba(0,0,0,0.22)",
            backdropFilter: "blur(2px)",
          }}
        >
          <div style={{
            background: surfaceBg,
            border: `1px dashed ${borderCol}`,
            borderRadius: "10px",
            padding: "28px 28px 24px",
            minWidth: "320px",
            boxShadow: dark ? "0 8px 40px rgba(0,0,0,0.5)" : "0 8px 40px rgba(0,0,0,0.12)",
          }}>
            <p style={{ fontFamily: FONT_SANS, fontSize: "13px", color: mutedCol, margin: "0 0 20px 0", letterSpacing: "0.03em" }}>
              {DE ? "Form auswählen" : "Choose a shape"}
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px" }}>
              {PICKABLE_SHAPES.map(s => (
                <button
                  key={s.id}
                  onClick={() => handlePickShape(s)}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                    gap: "8px", padding: "14px 8px 10px",
                    background: shape.id === s.id
                      ? (dark ? "rgba(240,232,220,0.14)" : "rgba(0,0,0,0.07)")
                      : "transparent",
                    border: `1px dashed ${shape.id === s.id ? (dark ? "rgba(240,232,220,0.55)" : "#888") : borderCol}`,
                    borderRadius: "7px", cursor: "pointer",
                    transition: "background 0.15s, border-color 0.15s",
                  }}
                >
                  <ShapeIcon id={s.id} fill={dark ? "rgba(240,232,220,0.75)" : "rgba(85,85,85,0.7)"} />
                  <span style={{ fontFamily: FONT_SANS, fontSize: "11px", color: mutedCol, letterSpacing: "0.03em" }}>
                    {DE ? s.labelDe : s.label}
                  </span>
                </button>
              ))}
            </div>
            <div style={{ marginTop: "18px", display: "flex", justifyContent: "flex-end" }}>
              <button onClick={handleClose} style={{ fontFamily: FONT_SANS, fontSize: "12px", padding: "6px 14px", background: "transparent", border: `1px dashed ${borderCol}`, borderRadius: "5px", color: mutedCol, cursor: "pointer" }}>
                {DE ? "Abbrechen" : "Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recording frame + controls (all non-shape-select phases) */}
      {phase !== "shape-select" && (
        <div data-html2canvas-ignore="true" style={{ position: "fixed", inset: 0, zIndex: 200, pointerEvents: "none" }}>

          {/* Recording frame */}
          <div style={{
            position: "absolute", left: frame.x, top: frame.y,
            width: frame.w, height: frameH,
            pointerEvents: "none",
            borderRadius: shapeBr,
            overflow: shapeBr ? "hidden" : undefined,
          }}>
            {/* Move handle */}
            {isIdle && (
              <div
                onMouseDown={(e) => startDrag("move", e)}
                style={{ position: "absolute", top: 0, left: HANDLE_PX, right: HANDLE_PX, height: "100%", cursor: "move", pointerEvents: "auto", zIndex: 1 }}
              />
            )}

            {/* Border */}
            <div style={{
              position: "absolute", inset: 0, boxSizing: "border-box",
              borderRadius: shapeBr,
              border: isRecording
                ? "1.5px solid rgba(195,32,32,0.55)"
                : `1.5px dashed ${borderCol}`,
              pointerEvents: "none",
            }} />

            {/* Hint label */}
            {isIdle && (
              <div style={{
                position: "absolute", bottom: "100%", left: 0, marginBottom: "6px",
                fontFamily: FONT_SANS, fontSize: "11px", color: mutedCol,
                letterSpacing: "0.04em", pointerEvents: "none", whiteSpace: "nowrap",
              }}>
                {DE ? "Verschieben & Ecken ziehen zum Skalieren" : "Drag to move · drag corners to resize"}
              </div>
            )}

            {/* Corner handles */}
            {isIdle && (["nw", "ne", "se", "sw"] as const).map(c => (
              <div
                key={c}
                onMouseDown={(e) => { e.stopPropagation(); startDrag(c, e); }}
                style={{
                  position: "absolute", pointerEvents: "auto",
                  width: HANDLE_PX, height: HANDLE_PX, zIndex: 2,
                  background: dark ? "rgba(240,232,220,0.4)" : "rgba(85,85,85,0.4)",
                  borderRadius: "2px",
                  ...(c === "nw" ? { top: 0,    left: 0,    cursor: "nw-resize" } :
                      c === "ne" ? { top: 0,    right: 0,   cursor: "ne-resize" } :
                      c === "se" ? { bottom: 0, right: 0,   cursor: "se-resize" } :
                                   { bottom: 0, left: 0,    cursor: "sw-resize" }),
                }}
              />
            ))}

            {/* Countdown */}
            {phase === "countdown" && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
                <span style={{ fontFamily: FONT_SERIF, fontSize: Math.round(frameH * 0.55) + "px", lineHeight: 1, color: dark ? "rgba(240,232,220,0.65)" : "rgba(42,42,40,0.5)" }}>
                  {countdown}
                </span>
              </div>
            )}
          </div>

          {/* Control strip */}
          {controlStrip}
        </div>
      )}
    </>,
    document.body
  );
}
