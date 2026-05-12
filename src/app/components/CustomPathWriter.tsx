import { useState, useRef, useEffect, useCallback, useMemo } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Point { x: number; y: number }

interface PathSegment {
  id: string;
  points: Point[];
  length: number;
}

interface SegmentExt extends PathSegment {
  startOffset: number;
}

interface PlacedChar {
  id: string;
  char: string;
  x: number;
  y: number;
  angleDeg: number;
  startOffset: number;
}

// ─── Path math ────────────────────────────────────────────────────────────────

function segLength(pts: Point[]): number {
  let l = 0;
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i - 1].x;
    const dy = pts[i].y - pts[i - 1].y;
    l += Math.sqrt(dx * dx + dy * dy);
  }
  return l;
}

function ptAtDist(pts: Point[], d: number): { x: number; y: number; angle: number } | null {
  if (pts.length < 2) return null;
  let gone = 0;
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i - 1].x;
    const dy = pts[i].y - pts[i - 1].y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1e-4) continue;
    if (gone + len >= d) {
      const t = (d - gone) / len;
      return { x: pts[i - 1].x + dx * t, y: pts[i - 1].y + dy * t, angle: Math.atan2(dy, dx) };
    }
    gone += len;
  }
  const n = pts.length;
  const dx = pts[n - 1].x - pts[n - 2].x;
  const dy = pts[n - 1].y - pts[n - 2].y;
  return { x: pts[n - 1].x, y: pts[n - 1].y, angle: Math.atan2(dy, dx) };
}

function ptOnPath(segs: SegmentExt[], offset: number): { x: number; y: number; angle: number } | null {
  for (const s of segs) {
    if (offset >= s.startOffset && offset <= s.startOffset + s.length + 0.1) {
      return ptAtDist(s.points, Math.min(offset - s.startOffset, s.length));
    }
  }
  return null;
}

function svgPath(pts: Point[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = ((pts[i].x + pts[i + 1].x) / 2).toFixed(1);
    const my = ((pts[i].y + pts[i + 1].y) / 2).toFixed(1);
    d += ` Q ${pts[i].x.toFixed(1)} ${pts[i].y.toFixed(1)} ${mx} ${my}`;
  }
  const last = pts[pts.length - 1];
  d += ` L ${last.x.toFixed(1)} ${last.y.toFixed(1)}`;
  return d;
}

// ─── Character width measurement ─────────────────────────────────────────────

const _measCanvas = typeof document !== "undefined" ? document.createElement("canvas") : null;
const _measCtx = _measCanvas?.getContext("2d") ?? null;

function charWidth(ch: string, fontSize: number, fontFamily: string): number {
  if (_measCtx) {
    _measCtx.font = `${fontSize}px ${fontFamily}`;
    return _measCtx.measureText(ch).width;
  }
  return fontSize * 0.605;
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface CustomPathWriterProps {
  textColor: string;
  bgColor: string;
  fontSize: number;
  fontFamily: string;
  dark: boolean;
  writingPrompt: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CustomPathWriter({ textColor, bgColor, fontSize, fontFamily, dark, writingPrompt }: CustomPathWriterProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [dims, setDims] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [segs, setSegs] = useState<PathSegment[]>([]);
  const [livePoints, setLivePoints] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [chars, setChars] = useState<PlacedChar[]>([]);
  const [offset, setOffset] = useState(0);
  const [fullWarn, setFullWarn] = useState(false);
  const [showHint, setShowHint] = useState(true);

  const offsetRef = useRef(0);
  const segsExtRef = useRef<SegmentExt[]>([]);
  const totalRef = useRef(0);
  const isDrawingRef = useRef(false);
  const livePointsRef = useRef<Point[]>([]);

  useEffect(() => { offsetRef.current = offset; }, [offset]);
  useEffect(() => { isDrawingRef.current = isDrawing; }, [isDrawing]);
  useEffect(() => { livePointsRef.current = livePoints; }, [livePoints]);

  const segsExt = useMemo<SegmentExt[]>(() => {
    let acc = 0;
    return segs.map(s => {
      const r = { ...s, startOffset: acc };
      acc += s.length;
      return r;
    });
  }, [segs]);

  const total = useMemo(() => segs.reduce((s, seg) => s + seg.length, 0), [segs]);

  useEffect(() => {
    segsExtRef.current = segsExt;
    totalRef.current = total;
  }, [segsExt, total]);

  const isFull = total > 0 && offset >= total - charWidth("M", fontSize, fontFamily) * 1.5;

  const cursorPt = useMemo(() => {
    if (isFull || total === 0) return null;
    return ptOnPath(segsExt, offset);
  }, [isFull, total, segsExt, offset]);

  const endPt = useMemo(() => {
    if (segs.length === 0) return null;
    const last = segs[segs.length - 1].points;
    return last[last.length - 1] ?? null;
  }, [segs]);

  // ── Resize ────────────────────────────────────────────────────────────────
  useEffect(() => {
    const r = () => {
      const el = containerRef.current;
      if (el) setDims({ w: el.offsetWidth, h: el.offsetHeight });
      else setDims({ w: window.innerWidth, h: window.innerHeight });
    };
    r();
    window.addEventListener("resize", r);
    return () => window.removeEventListener("resize", r);
  }, []);

  // ── SVG pointer helpers ───────────────────────────────────────────────────
  const getXY = useCallback((e: React.MouseEvent<SVGSVGElement>): Point => {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }, []);

  const getTouchXY = useCallback((e: React.TouchEvent<SVGSVGElement>): Point => {
    const r = svgRef.current!.getBoundingClientRect();
    const t = e.touches[0];
    return { x: t.clientX - r.left, y: t.clientY - r.top };
  }, []);

  // ── Drawing handlers ──────────────────────────────────────────────────────
  const endDraw = useCallback(() => {
    if (!isDrawingRef.current) return;
    const pts = livePointsRef.current;
    if (pts.length >= 2) {
      const len = segLength(pts);
      if (len > 5) {
        const id = `seg${Date.now()}${Math.random().toString(36).slice(2, 5)}`;
        setSegs(prev => [...prev, { id, points: pts, length: len }]);
      }
    }
    setLivePoints([]);
    setIsDrawing(false);
    isDrawingRef.current = false;
  }, []);

  useEffect(() => {
    window.addEventListener("mouseup", endDraw);
    window.addEventListener("touchend", endDraw);
    return () => {
      window.removeEventListener("mouseup", endDraw);
      window.removeEventListener("touchend", endDraw);
    };
  }, [endDraw]);

  const startDraw = useCallback((pt: Point) => {
    inputRef.current?.focus();
    setIsDrawing(true);
    setLivePoints([pt]);
    setShowHint(false);
  }, []);

  const continueDraw = useCallback((pt: Point) => {
    if (!isDrawingRef.current) return;
    setLivePoints(prev => {
      if (!prev.length) return [pt];
      const l = prev[prev.length - 1];
      const dx = pt.x - l.x, dy = pt.y - l.y;
      return dx * dx + dy * dy >= 9 ? [...prev, pt] : prev;
    });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    startDraw(getXY(e));
  }, [getXY, startDraw]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDrawingRef.current) return;
    continueDraw(getXY(e));
  }, [getXY, continueDraw]);

  const handleTouchStart = useCallback((e: React.TouchEvent<SVGSVGElement>) => {
    e.preventDefault();
    startDraw(getTouchXY(e));
  }, [getTouchXY, startDraw]);

  const handleTouchMove = useCallback((e: React.TouchEvent<SVGSVGElement>) => {
    e.preventDefault();
    continueDraw(getTouchXY(e));
  }, [getTouchXY, continueDraw]);

  // ── Keyboard handler ──────────────────────────────────────────────────────
  const handleKey = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.nativeEvent as KeyboardEvent).isComposing) return;

    if (e.key === "Backspace") {
      e.preventDefault();
      setChars(prev => {
        if (!prev.length) return prev;
        const last = prev[prev.length - 1];
        setOffset(last.startOffset);
        offsetRef.current = last.startOffset;
        return prev.slice(0, -1);
      });
      return;
    }

    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key.length !== 1) return;
    e.preventDefault();

    const ch = e.key;
    const w = charWidth(ch, fontSize, fontFamily);
    const cur = offsetRef.current;
    const tot = totalRef.current;

    if (cur + w > tot) {
      setFullWarn(true);
      setTimeout(() => setFullWarn(false), 650);
      return;
    }

    const start = cur;
    const next = cur + w;

    if (ch !== " ") {
      const pt = ptOnPath(segsExtRef.current, start + w / 2);
      if (pt) {
        setChars(prev => [...prev, {
          id: `c${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
          char: ch, x: pt.x, y: pt.y,
          angleDeg: (pt.angle * 180) / Math.PI,
          startOffset: start,
        }]);
      }
    } else {
      setChars(prev => [...prev, { id: `sp${Date.now()}`, char: " ", x: 0, y: 0, angleDeg: 0, startOffset: start }]);
    }

    setOffset(next);
    offsetRef.current = next;
  }, [fontSize, fontFamily]);

  const pathStroke = dark ? "rgba(240,232,220,0.25)" : "#b0a89e";
  const pathUsedStroke = dark ? "rgba(240,232,220,0.10)" : "#e8e2db";

  const hasContent = segs.length > 0 || livePoints.length > 0;

  return (
    <div
      ref={containerRef}
      style={{ position: "absolute", inset: 0, overflow: "hidden", cursor: "crosshair" }}
      onClick={() => inputRef.current?.focus()}
    >
      <input
        ref={inputRef}
        style={{ position: "absolute", top: -200, left: 0, width: 1, height: 1, opacity: 0, pointerEvents: "none" }}
        onKeyDown={handleKey}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        tabIndex={-1}
      />

      <svg
        ref={svgRef}
        width={dims.w}
        height={dims.h}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        style={{ display: "block", userSelect: "none", touchAction: "none" }}
      >
        <rect width="100%" height="100%" fill={bgColor} />

        {segsExt.map(seg => {
          const segEnd = seg.startOffset + seg.length;
          const fullyUsed = offset >= segEnd;
          const notYetUsed = offset <= seg.startOffset;

          let splitIdx = seg.points.length - 1;
          if (!fullyUsed && !notYetUsed) {
            const localOff = offset - seg.startOffset;
            const ratio = localOff / seg.length;
            splitIdx = Math.max(1, Math.floor(ratio * (seg.points.length - 1)));
          }

          const usedPts = seg.points.slice(0, splitIdx + 1);
          const availPts = seg.points.slice(splitIdx);

          return (
            <g key={seg.id}>
              {!notYetUsed && usedPts.length >= 2 && (
                <path d={svgPath(usedPts)} fill="none" stroke={pathUsedStroke} strokeWidth="1" strokeLinecap="round" />
              )}
              {!fullyUsed && availPts.length >= 2 && (
                <path d={svgPath(availPts)} fill="none" stroke={pathStroke} strokeWidth="1" strokeDasharray="3 7" strokeLinecap="round" opacity={0.65} />
              )}
              {notYetUsed && (
                <path d={svgPath(seg.points)} fill="none" stroke={pathStroke} strokeWidth="1" strokeDasharray="3 7" strokeLinecap="round" opacity={0.65} />
              )}
            </g>
          );
        })}

        {isDrawing && livePoints.length >= 2 && (
          <path d={svgPath(livePoints)} fill="none" stroke={pathStroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        )}

        {chars.filter(c => c.char !== " ").map(c => (
          <text
            key={c.id}
            transform={`translate(${c.x.toFixed(2)},${c.y.toFixed(2)}) rotate(${c.angleDeg.toFixed(2)})`}
            fontSize={fontSize}
            fontFamily={fontFamily}
            fill={textColor}
            dominantBaseline="alphabetic"
            textAnchor="middle"
          >
            {c.char}
          </text>
        ))}

        {cursorPt && !isFull && (
          <circle cx={cursorPt.x} cy={cursorPt.y} r="1.8" fill={textColor}>
            <animate attributeName="opacity" values="0.7;0;0.7" dur="1.1s" repeatCount="indefinite" />
          </circle>
        )}

        {endPt && isFull && (
          <g>
            {!fullWarn && (
              <circle cx={endPt.x} cy={endPt.y} r="6" fill="none" stroke={fullWarn ? "#cc4433" : pathStroke} strokeWidth="1" opacity="0.4">
                <animate attributeName="r" values="4;9;4" dur="2.2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0;0.4" dur="2.2s" repeatCount="indefinite" />
              </circle>
            )}
            <circle cx={endPt.x} cy={endPt.y} r={fullWarn ? 4 : 2.5} fill={fullWarn ? "#cc3322" : pathStroke} opacity={fullWarn ? 0.9 : 0.65} style={{ transition: "r 0.15s ease, fill 0.2s ease, opacity 0.2s ease" }} />
          </g>
        )}
      </svg>

      {/* Hint overlay */}
      {showHint && !hasContent && (
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", flexDirection: "column", gap: "16px" }}>
          <svg width="200" height="40" viewBox="0 0 200 40" opacity="0.3">
            <path d="M 10 28 Q 40 10 70 24 Q 100 38 130 18 Q 160 6 190 22" fill="none" stroke={textColor} strokeWidth="1.5" strokeDasharray="3 6" strokeLinecap="round" />
            <circle cx="190" cy="22" r="2.5" fill={textColor}>
              <animate attributeName="opacity" values="0.8;0;0.8" dur="1.1s" repeatCount="indefinite" />
            </circle>
          </svg>
          <span style={{ fontFamily, fontSize: "11px", letterSpacing: "0.3em", textTransform: "uppercase", color: textColor, opacity: 0.4 }}>
            Linie zeichnen · dann tippen
          </span>
          {writingPrompt && (
            <span style={{ fontFamily, fontSize: "13px", color: textColor, opacity: 0.35, maxWidth: "340px", textAlign: "center", lineHeight: "1.5", marginTop: "8px" }}>
              {writingPrompt}
            </span>
          )}
        </div>
      )}

      {/* "Draw more to continue" when path is full */}
      {isFull && (
        <div style={{ position: "absolute", bottom: "28px", left: 0, right: 0, display: "flex", justifyContent: "center", pointerEvents: "none" }}>
          <span style={{ fontFamily, fontSize: "11px", letterSpacing: "0.28em", textTransform: "uppercase", color: fullWarn ? "#cc3322" : textColor, opacity: fullWarn ? 0.8 : 0.4, transition: "color 0.25s ease" }}>
            Weitere Linie zeichnen
          </span>
        </div>
      )}
    </div>
  );
}
