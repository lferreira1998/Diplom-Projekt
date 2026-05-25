import { useEffect, useRef, useCallback, useMemo } from "react";
import type { NewToolParams } from "../utils/storage";

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

const TYPE_MS   = 40;
const EFFECT_MS = 2200;
const PAUSE_MS  = 400;

// Fixed preview speeds — independent of saved param values
const DRIFT_SPD = 0.55;

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

  const tippexMask = useMemo(() => {
    if (!params.correctionVisible) return [] as boolean[];
    const r = mulberry32(seed + 8321);
    return text.split("").map(c => c !== " " && r() < 0.38);
  }, [text, seed, params.correctionVisible]);

  const spanRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const charData = useRef<CharData[]>([]);
  const rafRef   = useRef(0);
  const phaseRef = useRef<"typing" | "effect">("typing");

  const initChars = useCallback(() => {
    const r = mulberry32(seed);
    charData.current = text.split("").map(() => ({
      x: 0, y: 0,
      vx: (r() - 0.5) * 5,
      vy: (r() - 0.5) * 5,
      opacity: 0,
    }));
  }, [text, seed]);

  // Returns the target opacity for char i at effect progress t (0–1)
  const visTarget = useCallback((i: number, t: number): number => {
    const vis    = params.visibility;
    const lastSp = text.lastIndexOf(" ");
    const lastEnd = Math.max(
      text.lastIndexOf(". "), text.lastIndexOf("? "), text.lastIndexOf("! ")
    );

    let hide = false;
    if (vis === "hidden" || vis === "invisible") {
      hide = true;
    } else if (vis === "word" && lastSp > 0 && i <= lastSp) {
      hide = true;
    } else if (vis === "sentence" && lastEnd > 0 && i <= lastEnd + 1) {
      hide = true;
    }
    if (hide) return Math.max(0, 1 - t * 2.2);
    return 1;
  }, [text, params.visibility]);

  const flush = useCallback((effectProg?: number) => {
    const isEff = phaseRef.current === "effect";
    const prog  = effectProg ?? 0;

    charData.current.forEach((d, i) => {
      const span = spanRefs.current[i];
      if (!span) return;

      let op = d.opacity;

      if (isEff) {
        // Visibility masking — chars ramp to 0
        op = Math.min(op, visTarget(i, prog));

        // Global fade
        if (params.textVerblassEnabled) {
          op *= Math.max(0, 1 - prog);
        }
      }

      span.style.opacity   = String(Math.max(0, Math.min(1, op)));
      span.style.transform = `translate(${d.x.toFixed(1)}px,${d.y.toFixed(1)}px)`;

      if (isEff && tippexMask[i] && d.opacity > 0.3) {
        span.style.color      = bgColor;
        span.style.background = bgColor;
      } else {
        span.style.color      = textColor;
        span.style.background = "transparent";
      }
    });
  }, [text, visTarget, params.textVerblassEnabled, tippexMask, bgColor, textColor]);

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
      // Static snapshot: show text mid-effect so the effect is immediately obvious
      phaseRef.current = "effect";
      charData.current.forEach(d => { d.opacity = 1; d.x = 0; d.y = 0; });

      if (params.textFliegtEnabled) {
        const r = mulberry32(seed + 777);
        charData.current.forEach((d, i) => {
          if (text[i] !== " ") {
            d.x = (r() - 0.5) * 18;
            d.y = (r() - 0.5) * 18;
          }
        });
      }

      flush(0.55);
      return () => { cancelled = true; timers.forEach(clearTimeout); };
    }

    charData.current.forEach(d => { d.opacity = 0; d.x = 0; d.y = 0; });
    phaseRef.current = "typing";
    flush();

    const startEffect = () => {
      if (cancelled) return;
      phaseRef.current = "effect";
      const start = performance.now();
      let last    = start;

      const tick = (now: number) => {
        if (cancelled) return;
        const dt   = Math.min((now - last) / 16.67, 3);
        last       = now;
        const prog = Math.min(1, (now - start) / EFFECT_MS);

        if (params.textFliegtEnabled) {
          charData.current.forEach((d, i) => {
            if (text[i] === " ") return;
            d.x += d.vx * DRIFT_SPD * dt;
            d.y += d.vy * DRIFT_SPD * dt;
          });
        }

        if (params.textVerblassEnabled) {
          charData.current.forEach(d => {
            d.opacity = Math.max(0, 1 - prog);
          });
        }

        flush(prog);

        if (prog < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          later(() => {
            initChars();
            charData.current.forEach(d => { d.opacity = 0; });
            phaseRef.current = "typing";
            flush();
            later(() => type(0), 180);
          }, PAUSE_MS);
        }
      };
      rafRef.current = requestAnimationFrame(tick);
    };

    const type = (idx: number) => {
      if (cancelled) return;
      if (idx >= text.length) { later(startEffect, 280); return; }
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
      params.textFliegtEnabled,
      params.textVerblassEnabled,
      params.visibility,
      seed]);

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
