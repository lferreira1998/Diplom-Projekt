import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Download, RotateCcw } from "lucide-react";

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

function ptAtDist(
  pts: Point[],
  d: number
): { x: number; y: number; angle: number } | null {
  if (pts.length < 2) return null;
  let gone = 0;
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i - 1].x;
    const dy = pts[i].y - pts[i - 1].y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 1e-4) continue;
    if (gone + len >= d) {
      const t = (d - gone) / len;
      return {
        x: pts[i - 1].x + dx * t,
        y: pts[i - 1].y + dy * t,
        angle: Math.atan2(dy, dx),
      };
    }
    gone += len;
  }
  const n = pts.length;
  const dx = pts[n - 1].x - pts[n - 2].x;
  const dy = pts[n - 1].y - pts[n - 2].y;
  return {
    x: pts[n - 1].x,
    y: pts[n - 1].y,
    angle: Math.atan2(dy, dx),
  };
}

function ptOnPath(
  segs: SegmentExt[],
  offset: number
): { x: number; y: number; angle: number } | null {
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

const FONT_SIZE = 17;
const FONT_FAMILY = "'az-sans', sans-serif";

const _measCanvas =
  typeof document !== "undefined" ? document.createElement("canvas") : null;
const _measCtx = _measCanvas?.getContext("2d") ?? null;
const _widthCache: Record<string, number> = {};

function charWidth(ch: string): number {
  if (_widthCache[ch] !== undefined) return _widthCache[ch];
  if (_measCtx) {
    _measCtx.font = `${FONT_SIZE}px ${FONT_FAMILY}`;
    return (_widthCache[ch] = _measCtx.measureText(ch).width);
  }
  return (_widthCache[ch] = FONT_SIZE * 0.605);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FallingText() {
  const svgRef = useRef<SVGSVGElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [dims, setDims] = useState({
    w: window.innerWidth,
    h: window.innerHeight,
  });
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
    return segs.map((s) => {
      const r = { ...s, startOffset: acc };
      acc += s.length;
      return r;
    });
  }, [segs]);

  const total = useMemo(
    () => segs.reduce((s, seg) => s + seg.length, 0),
    [segs]
  );

  useEffect(() => {
    segsExtRef.current = segsExt;
    totalRef.current = total;
  }, [segsExt, total]);

  const isFull = total > 0 && offset >= total - charWidth("M") * 1.5;

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
    const r = () => setDims({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener("resize", r);
    return () => window.removeEventListener("resize", r);
  }, []);

  // ── SVG pointer helpers ───────────────────────────────────────────────────
  const getXY = useCallback((e: React.MouseEvent<SVGSVGElement>): Point => {
    const r = svgRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }, []);

  const getTouchXY = useCallback(
    (e: React.TouchEvent<SVGSVGElement>): Point => {
      const r = svgRef.current!.getBoundingClientRect();
      const t = e.touches[0];
      return { x: t.clientX - r.left, y: t.clientY - r.top };
    },
    []
  );

  // ── Drawing handlers ──────────────────────────────────────────────────────
  const endDraw = useCallback(() => {
    if (!isDrawingRef.current) return;
    const pts = livePointsRef.current;
    if (pts.length >= 2) {
      const len = segLength(pts);
      if (len > 5) {
        const id = `seg${Date.now()}${Math.random().toString(36).slice(2, 5)}`;
        setSegs((prev) => [...prev, { id, points: pts, length: len }]);
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

  const startDraw = useCallback(
    (pt: Point) => {
      inputRef.current?.focus();
      setIsDrawing(true);
      setLivePoints([pt]);
      setShowHint(false);
    },
    []
  );

  const continueDraw = useCallback((pt: Point) => {
    if (!isDrawingRef.current) return;
    setLivePoints((prev) => {
      if (!prev.length) return [pt];
      const l = prev[prev.length - 1];
      const dx = pt.x - l.x,
        dy = pt.y - l.y;
      return dx * dx + dy * dy >= 9 ? [...prev, pt] : prev;
    });
  }, []);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (e.button !== 0) return;
      e.preventDefault();
      startDraw(getXY(e));
    },
    [getXY, startDraw]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      if (!isDrawingRef.current) return;
      continueDraw(getXY(e));
    },
    [getXY, continueDraw]
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<SVGSVGElement>) => {
      e.preventDefault();
      startDraw(getTouchXY(e));
    },
    [getTouchXY, startDraw]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent<SVGSVGElement>) => {
      e.preventDefault();
      continueDraw(getTouchXY(e));
    },
    [getTouchXY, continueDraw]
  );

  // ── Keyboard handler ──────────────────────────────────────────────────────
  const handleKey = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if ((e.nativeEvent as KeyboardEvent).isComposing) return;

      if (e.key === "Backspace") {
        e.preventDefault();
        setChars((prev) => {
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
      const w = charWidth(ch);
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
          setChars((prev) => [
            ...prev,
            {
              id: `c${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
              char: ch,
              x: pt.x,
              y: pt.y,
              angleDeg: (pt.angle * 180) / Math.PI,
              startOffset: start,
            },
          ]);
        }
      } else {
        setChars((prev) => [
          ...prev,
          {
            id: `sp${Date.now()}`,
            char: " ",
            x: 0,
            y: 0,
            angleDeg: 0,
            startOffset: start,
          },
        ]);
      }

      setOffset(next);
      offsetRef.current = next;
    },
    []
  );

  // ── Clear ─────────────────────────────────────────────────────────────────
  const handleClear = () => {
    setSegs([]);
    setChars([]);
    setOffset(0);
    offsetRef.current = 0;
    setLivePoints([]);
    setIsDrawing(false);
    setShowHint(true);
  };

  // ── Export SVG ────────────────────────────────────────────────────────────
  const handleExport = () => {
    const visChars = chars.filter((c) => c.char !== " ");
    if (!visChars.length) return;

    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("xmlns", ns);
    svg.setAttribute("width", String(dims.w));
    svg.setAttribute("height", String(dims.h));
    svg.setAttribute("viewBox", `0 0 ${dims.w} ${dims.h}`);

    const bg = document.createElementNS(ns, "rect");
    bg.setAttribute("width", "100%");
    bg.setAttribute("height", "100%");
    bg.setAttribute("fill", "white");
    svg.appendChild(bg);

    visChars.forEach((c) => {
      const t = document.createElementNS(ns, "text");
      t.setAttribute(
        "transform",
        `translate(${c.x.toFixed(2)},${c.y.toFixed(2)}) rotate(${c.angleDeg.toFixed(2)})`
      );
      t.setAttribute("font-size", String(FONT_SIZE));
      t.setAttribute("font-family", FONT_FAMILY);
      t.setAttribute("fill", "#111");
      t.setAttribute("dominant-baseline", "alphabetic");
      t.setAttribute("text-anchor", "middle");
      t.textContent = c.char;
      svg.appendChild(t);
    });

    const str = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([str], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "writing.svg";
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasContent = segs.length > 0 || livePoints.length > 0;
  const visCharCount = chars.filter((c) => c.char !== " ").length;

  return (
    <div
      className="size-full relative overflow-hidden bg-white select-none"
      style={{ cursor: "crosshair" }}
    >
      <input
        ref={inputRef}
        className="absolute opacity-0 pointer-events-none"
        style={{ top: -200, left: 0, width: 1, height: 1 }}
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
        <rect width="100%" height="100%" fill="white" />

        {segsExt.map((seg) => {
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
                <path
                  d={svgPath(usedPts)}
                  fill="none"
                  stroke="#e8e2db"
                  strokeWidth="1"
                  strokeLinecap="round"
                />
              )}
              {!fullyUsed && availPts.length >= 2 && (
                <path
                  d={svgPath(availPts)}
                  fill="none"
                  stroke="#b0a89e"
                  strokeWidth="1"
                  strokeDasharray="3 7"
                  strokeLinecap="round"
                  opacity={0.65}
                />
              )}
              {notYetUsed && (
                <path
                  d={svgPath(seg.points)}
                  fill="none"
                  stroke="#b0a89e"
                  strokeWidth="1"
                  strokeDasharray="3 7"
                  strokeLinecap="round"
                  opacity={0.65}
                />
              )}
            </g>
          );
        })}

        {isDrawing && livePoints.length >= 2 && (
          <path
            d={svgPath(livePoints)}
            fill="none"
            stroke="#b8b0a5"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {chars
          .filter((c) => c.char !== " ")
          .map((c) => (
            <text
              key={c.id}
              transform={`translate(${c.x.toFixed(2)},${c.y.toFixed(2)}) rotate(${c.angleDeg.toFixed(2)})`}
              fontSize={FONT_SIZE}
              fontFamily={FONT_FAMILY}
              fill="#111"
              dominantBaseline="alphabetic"
              textAnchor="middle"
            >
              {c.char}
            </text>
          ))}

        {cursorPt && !isFull && (
          <circle cx={cursorPt.x} cy={cursorPt.y} r="1.8" fill="#444">
            <animate
              attributeName="opacity"
              values="0.7;0;0.7"
              dur="1.1s"
              repeatCount="indefinite"
            />
          </circle>
        )}

        {endPt && isFull && (
          <g>
            {!fullWarn && (
              <circle
                cx={endPt.x}
                cy={endPt.y}
                r="6"
                fill="none"
                stroke={fullWarn ? "#cc4433" : "#c0a898"}
                strokeWidth="1"
                opacity="0.4"
              >
                <animate attributeName="r" values="4;9;4" dur="2.2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.4;0;0.4" dur="2.2s" repeatCount="indefinite" />
              </circle>
            )}
            <circle
              cx={endPt.x}
              cy={endPt.y}
              r={fullWarn ? 4 : 2.5}
              fill={fullWarn ? "#cc3322" : "#c8a898"}
              opacity={fullWarn ? 0.9 : 0.65}
              style={{ transition: "r 0.15s ease, fill 0.2s ease, opacity 0.2s ease" }}
            />
          </g>
        )}
      </svg>

      {showHint && !hasContent && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="flex flex-col items-center gap-3">
            <svg width="200" height="40" viewBox="0 0 200 40" opacity="0.3">
              <path
                d="M 10 28 Q 40 10 70 24 Q 100 38 130 18 Q 160 6 190 22"
                fill="none"
                stroke="#888"
                strokeWidth="1.5"
                strokeDasharray="3 6"
                strokeLinecap="round"
              />
              <circle cx="190" cy="22" r="2.5" fill="#888">
                <animate attributeName="opacity" values="0.8;0;0.8" dur="1.1s" repeatCount="indefinite" />
              </circle>
            </svg>
            <span
              className="text-xs tracking-[0.3em] uppercase"
              style={{ color: "#c0b8b0", fontFamily: FONT_FAMILY }}
            >
              draw a line · then type
            </span>
          </div>
        </div>
      )}

      {isFull && (
        <div className="absolute bottom-7 left-0 right-0 flex justify-center pointer-events-none">
          <span
            className="text-[11px] tracking-[0.28em] uppercase"
            style={{
              color: fullWarn ? "#bf3a2a" : "#bfb0a5",
              fontFamily: FONT_FAMILY,
              transition: "color 0.25s ease",
            }}
          >
            draw more to continue
          </span>
        </div>
      )}

      <div className="absolute top-5 right-5 flex gap-1 opacity-60 hover:opacity-100 transition-opacity">
        <button
          onClick={handleExport}
          disabled={visCharCount === 0}
          className="p-2 rounded transition-colors hover:bg-stone-100 disabled:opacity-30"
          style={{ color: "#888" }}
          title="Export as SVG"
        >
          <Download size={16} />
        </button>
        <button
          onClick={handleClear}
          disabled={!hasContent && chars.length === 0}
          className="p-2 rounded transition-colors hover:bg-stone-100 disabled:opacity-30"
          style={{ color: "#888" }}
          title="Clear all"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      <style>{`
        @keyframes fadein {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
