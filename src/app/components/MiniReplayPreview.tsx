import { useEffect, useRef, useCallback, useMemo } from "react";
import type { NewToolParams } from "../utils/storage";

// Mulberry32 — fast seeded PRNG
function mulberry32(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function simpleHash(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

interface CharData {
  x: number; y: number;
  vx: number; vy: number;
  opacity: number;
}

const TYPE_MS   = 62;
const EFFECT_MS = 3800;
const PAUSE_MS  = 650;

export function MiniReplayPreview({
  params, active, dark, toolId,
}: {
  params: NewToolParams;
  active: boolean;
  dark: boolean;
  toolId?: string;
}) {
  const text = useMemo(() =>
    (params as any).preview?.text
    || params.prompts?.[0]?.trim().slice(0, 38)
    || "I write differently.",
  [params]);

  const seed = useMemo(() =>
    (params as any).preview?.seed ?? simpleHash(toolId || "preview"),
  [params, toolId]);

  const bgColor = useMemo(() =>
    params.bgHue != null
      ? (dark ? `hsl(${params.bgHue},20%,15%)` : `hsl(${params.bgHue},35%,95%)`)
      : (dark ? "#1e1d1b" : "#f5f0ea"),
  [params.bgHue, dark]);

  const textColor = dark ? "#f0e8dc" : "#2a2a28";
  const fontSize  = Math.round(11 + (params.textSizeLevel / 100) * 11);

  // Which chars get tipp-ex (stable, seed-based)
  const tippexMask = useMemo(() => {
    if (!params.correctionVisible) return [] as boolean[];
    const r = mulberry32(seed + 8321);
    return text.split("").map(c => c !== " " && r() < 0.22);
  }, [text, seed, params.correctionVisible]);

  const spanRefs  = useRef<(HTMLSpanElement | null)[]>([]);
  const charData  = useRef<CharData[]>([]);
  const rafRef    = useRef(0);
  const phaseRef  = useRef<"typing" | "effect">("typing");

  // Initialise per-char velocities (reset drift offsets each loop)
  const initChars = useCallback(() => {
    const r = mulberry32(seed);
    charData.current = text.split("").map(() => ({
      x: 0, y: 0,
      vx: (r() - 0.5) * 2.6,
      vy: (r() - 0.5) * 2.6,
      opacity: 0,
    }));
  }, [text, seed]);

  // Write current charData state directly to DOM spans
  const flush = useCallback(() => {
    const vis    = params.visibility;
    const isEff  = phaseRef.current === "effect";
    const lastSp = text.lastIndexOf(" ");
    const lastEnd = Math.max(
      text.lastIndexOf(". "), text.lastIndexOf("? "), text.lastIndexOf("! ")
    );

    charData.current.forEach((d, i) => {
      const span = spanRefs.current[i];
      if (!span) return;

      let op = d.opacity;
      if (isEff) {
        if (vis === "hidden" || vis === "invisible") {
          op *= 0.04;
        } else if (vis === "word") {
          if (i <= lastSp) op *= 0.06;
        } else if (vis === "sentence" && lastEnd > 0) {
          if (i <= lastEnd + 1) op *= 0.06;
        }
      }

      span.style.opacity   = String(Math.max(0, Math.min(1, op)));
      span.style.transform = `translate(${d.x.toFixed(1)}px,${d.y.toFixed(1)}px)`;

      // Tipp-Ex: paint char with bg colour
      if (isEff && tippexMask[i] && d.opacity > 0.5) {
        span.style.color      = bgColor;
        span.style.background = bgColor;
      } else {
        span.style.color      = textColor;
        span.style.background = "transparent";
      }
    });
  }, [text, params.visibility, tippexMask, bgColor, textColor]);

  useEffect(() => {
    initChars();
    cancelAnimationFrame(rafRef.current);
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const later = (fn: () => void, ms: number) => {
      const id = setTimeout(() => { if (!cancelled) fn(); }, ms);
      timers.push(id);
    };

    if (!active) {
      // Static: show full text in tool's style
      phaseRef.current = "effect"; // apply visibility tint even statically
      charData.current.forEach(d => { d.opacity = 1; d.x = 0; d.y = 0; });
      flush();
      return () => { cancelled = true; timers.forEach(clearTimeout); };
    }

    // Reset all chars to invisible
    charData.current.forEach(d => { d.opacity = 0; d.x = 0; d.y = 0; });
    phaseRef.current = "typing";
    flush();

    const startEffect = () => {
      if (cancelled) return;
      phaseRef.current = "effect";
      const start = performance.now();
      let last  = start;

      const tick = (now: number) => {
        if (cancelled) return;
        const dt      = Math.min((now - last) / 16.67, 3);
        last          = now;
        const elapsed = now - start;

        if (params.textFliegtEnabled) {
          const spd = Math.max(0.04, params.fliegtSchnelligkeit * 0.1);
          charData.current.forEach((d, i) => {
            if (text[i] === " ") return;
            d.x += d.vx * spd * dt;
            d.y += d.vy * spd * dt;
          });
        }

        if (params.textVerblassEnabled) {
          const t = elapsed / EFFECT_MS;
          charData.current.forEach(d => {
            d.opacity = Math.max(0, 1 - t * 0.88);
          });
        }

        flush();

        if (elapsed < EFFECT_MS) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          later(() => {
            initChars();
            charData.current.forEach(d => { d.opacity = 0; });
            phaseRef.current = "typing";
            flush();
            later(() => type(0), 200);
          }, PAUSE_MS);
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    };

    const type = (idx: number) => {
      if (cancelled) return;
      if (idx >= text.length) { later(startEffect, 420); return; }
      charData.current[idx].opacity = 1;
      flush();
      later(() => type(idx + 1), TYPE_MS);
    };

    type(0);

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
      cancelAnimationFrame(rafRef.current);
    };
  }, [active, initChars, flush, text,
      params.textFliegtEnabled, params.fliegtSchnelligkeit,
      params.textVerblassEnabled]);

  return (
    <div style={{
      width: "100%", aspectRatio: "3 / 2",
      background: bgColor,
      overflow: "hidden",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "12px 16px",
      boxSizing: "border-box",
      cursor: "pointer",
    }}>
      <div style={{ lineHeight: 1.6, maxWidth: "90%", position: "relative" }}>
        {text.split("").map((char, i) => (
          <span
            key={i}
            ref={el => { spanRefs.current[i] = el; }}
            style={{
              display: "inline-block",
              fontSize: `${fontSize}px`,
              fontFamily: "'Courier Prime', 'Courier New', monospace",
              color: textColor,
              opacity: 0,
              willChange: "transform, opacity",
              whiteSpace: "pre",
            }}
          >
            {char}
          </span>
        ))}
      </div>
    </div>
  );
}
