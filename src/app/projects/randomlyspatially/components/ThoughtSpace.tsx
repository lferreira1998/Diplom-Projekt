import { useState, useRef, useEffect, useCallback } from "react";

const PERSPECTIVE = 900;
const Z_MIN = -800;
const Z_MAX = 300;
const DAMP = 0.985;

function rnd(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

const FILLER_WORDS = new Set([
  "der", "die", "das", "ein", "eine", "und", "oder", "aber", "ist", "war",
  "hat", "ich", "du", "er", "sie", "es", "wir", "ihr", "sich", "mit", "von",
  "zu", "an", "auf", "in", "für", "als", "wie", "so", "auch", "noch", "schon",
  "dann", "wenn", "weil", "dass", "nicht", "nur", "the", "a", "an", "and",
  "or", "but", "is", "was", "has", "have", "you", "he", "it", "we", "they",
  "with", "from", "to", "at", "on", "for", "as", "that", "not",
]);

interface FloatingWord {
  id: number;
  text: string;
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  wanderAngle: number; wanderAngleZ: number;
  baseSpeed: number;
  spawnedAt: number;
  isFiller: boolean;
  ghostTimer: number;
  ghostCooldown: number;
  ghostDuration: number;
  isGhost: boolean;
  opacity: number;
  breathPhase: number;
}

export function ThoughtSpace() {
  const containerRef = useRef<HTMLDivElement>(null);
  const wordsRef = useRef<FloatingWord[]>([]);
  const elMapRef = useRef<Map<number, HTMLDivElement>>(new Map());
  const rafRef = useRef(0);
  const lastTRef = useRef(0);
  const idRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const [currentWord, setCurrentWord] = useState("");
  const [mode, setMode] = useState<"words" | "sentences">("words");
  const modeRef = useRef<"words" | "sentences">("words");
  const [, tick] = useState(0);
  const currentWordRef = useRef("");

  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { currentWordRef.current = currentWord; }, [currentWord]);

  // Animation loop
  useEffect(() => {
    const loop = (time: number) => {
      if (!lastTRef.current) lastTRef.current = time;
      const dt = Math.min((time - lastTRef.current) / 1000, 0.1);
      lastTRef.current = time;

      const now = time / 1000;
      const words = wordsRef.current;
      const container = containerRef.current;
      const W = container ? container.clientWidth : 800;
      const H = container ? container.clientHeight : 600;

      for (let i = words.length - 1; i >= 0; i--) {
        const w = words[i];

        // Filler word fade & remove
        if (w.isFiller) {
          const age = now - w.spawnedAt;
          const fadeStart = rnd(5, 14);
          if (age > fadeStart) {
            w.opacity = Math.max(0, w.opacity - dt * 0.4);
            if (w.opacity <= 0) {
              words.splice(i, 1);
              elMapRef.current.delete(w.id);
              continue;
            }
          }
        }

        // Ghost effect
        w.ghostTimer += dt;
        if (!w.isGhost) {
          if (w.ghostTimer >= w.ghostCooldown) {
            w.isGhost = true;
            w.ghostTimer = 0;
          }
        } else {
          if (w.ghostTimer >= w.ghostDuration) {
            w.isGhost = false;
            w.ghostTimer = 0;
            w.ghostCooldown = rnd(10, 35);
            w.ghostDuration = rnd(1.5, 5);
          }
        }

        const ghostFactor = w.isGhost
          ? Math.max(0, 1 - w.ghostTimer / 0.8)
          : Math.min(1, w.ghostTimer / 0.8);

        // Physics: wandering
        w.wanderAngle  += rnd(-0.25, 0.25) * dt;
        w.wanderAngleZ += rnd(-0.15, 0.15) * dt;
        w.vx += Math.cos(w.wanderAngle)  * w.baseSpeed * dt;
        w.vy += Math.sin(w.wanderAngle)  * w.baseSpeed * dt;
        w.vz += Math.sin(w.wanderAngleZ) * w.baseSpeed * 0.1 * dt;
        w.vx *= DAMP; w.vy *= DAMP; w.vz *= DAMP;
        w.x += w.vx * dt * 60;
        w.y += w.vy * dt * 60;
        w.z += w.vz * dt * 30;

        // Z bounds
        w.z = Math.max(Z_MIN, Math.min(Z_MAX, w.z));
        if (w.z <= Z_MIN) w.vz = Math.abs(w.vz) * 0.3;
        if (w.z >= Z_MAX) w.vz = -Math.abs(w.vz) * 0.3;

        // Perspective projection
        const s = PERSPECTIVE / (PERSPECTIVE - w.z);
        const sx = w.x * s;
        const sy = w.y * s;
        const maxX = W * 0.48, maxY = H * 0.47;
        if (sx >  maxX) w.vx -= (sx - maxX) * 0.002;
        if (sx < -maxX) w.vx -= (sx + maxX) * 0.002;
        if (sy >  maxY) w.vy -= (sy - maxY) * 0.002;
        if (sy < -maxY) w.vy -= (sy + maxY) * 0.002;

        // Depth opacity + breathing
        const depthOp = 0.15 + ((w.z - Z_MIN) / (Z_MAX - Z_MIN)) * 0.75;
        const breath = 0.88 + 0.12 * Math.sin(now * 1.3 + w.breathPhase);
        const finalOp = depthOp * breath * ghostFactor * (w.isFiller ? w.opacity : 1);

        // Depth blur
        const blur = w.z < -400 ? ((-400 - w.z) / 300) * 2 : 0;

        // Update DOM
        const el = elMapRef.current.get(w.id);
        if (el) {
          el.style.transform = `translate(-50%,-50%) translate(${sx}px,${sy}px) scale(${s})`;
          el.style.opacity = `${Math.max(0, finalOp)}`;
          el.style.filter = blur > 0 ? `blur(${blur.toFixed(1)}px)` : "none";
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const releaseWord = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    const isFiller = FILLER_WORDS.has(trimmed.toLowerCase());
    const z = rnd(Z_MIN * 0.4, Z_MAX * 0.6);
    const s = PERSPECTIVE / (PERSPECTIVE - z);
    const word: FloatingWord = {
      id: idRef.current++,
      text: trimmed,
      x: rnd(-200 / s, 200 / s),
      y: rnd(-150 / s, 150 / s),
      z,
      vx: rnd(-0.5, 0.5), vy: rnd(-0.5, 0.5), vz: rnd(-0.1, 0.1),
      wanderAngle: rnd(0, Math.PI * 2),
      wanderAngleZ: rnd(0, Math.PI * 2),
      baseSpeed: rnd(0.2, 0.6),
      spawnedAt: performance.now() / 1000,
      isFiller,
      opacity: 1,
      ghostTimer: 0,
      ghostCooldown: rnd(10, 35),
      ghostDuration: rnd(1.5, 5),
      isGhost: false,
      breathPhase: rnd(0, Math.PI * 2),
    };
    wordsRef.current.push(word);
    tick(n => n + 1);
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    const m = modeRef.current;
    const cur = currentWordRef.current;

    if (e.key === "Backspace") {
      setCurrentWord(prev => prev.slice(0, -1));
      return;
    }

    if (e.key === "Enter" || (e.key === " " && m === "words")) {
      e.preventDefault();
      releaseWord(cur);
      setCurrentWord("");
      return;
    }

    if (m === "sentences" && (e.key === "." || e.key === "!" || e.key === "?")) {
      const newText = cur + e.key;
      releaseWord(newText);
      setCurrentWord("");
      return;
    }

    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
      if (m === "words" && e.key === " ") {
        e.preventDefault();
        releaseWord(cur);
        setCurrentWord("");
      } else {
        setCurrentWord(prev => prev + e.key);
      }
    }
  }, [releaseWord]);

  // Focus on mount and click
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const words = wordsRef.current;

  return (
    <div
      className="size-full relative overflow-hidden"
      style={{
        background: "radial-gradient(ellipse at center, #16161f 0%, #0c0c14 55%, #07070e 100%)",
        cursor: "text",
      }}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Hidden input */}
      <input
        ref={inputRef}
        value={currentWord}
        onChange={() => {}}
        onKeyDown={handleKeyDown}
        style={{ position: "absolute", left: -9999, opacity: 0, width: 1, height: 1 }}
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
      />

      {/* 3D word field */}
      <div
        style={{
          position: "absolute", inset: 0,
          perspective: `${PERSPECTIVE}px`,
          perspectiveOrigin: "50% 50%",
          pointerEvents: "none",
        }}
      >
        <div style={{ position: "absolute", inset: 0, transformStyle: "preserve-3d" }}>
          {words.map(w => (
            <div
              key={w.id}
              ref={el => { if (el) elMapRef.current.set(w.id, el); }}
              style={{
                position: "absolute", left: "50%", top: "50%",
                fontFamily: "'az-sans', sans-serif",
                fontSize: "16px", fontWeight: 400,
                color: "rgba(230, 225, 210, 1)",
                letterSpacing: "0.04em",
                whiteSpace: "nowrap",
                userSelect: "none",
                willChange: "transform, opacity",
                transformStyle: "preserve-3d",
              }}
            >
              {w.text}
            </div>
          ))}
        </div>
      </div>

      {/* Current word being typed */}
      {currentWord && (
        <div style={{
          position: "absolute", bottom: "80px", left: "50%",
          transform: "translateX(-50%)",
          fontFamily: "'az-sans', sans-serif",
          fontSize: "16px", color: "rgba(230,225,210,0.9)",
          letterSpacing: "0.04em", whiteSpace: "nowrap",
          pointerEvents: "none",
        }}>
          {currentWord}
          <span style={{
            display: "inline-block", width: "2px", height: "1em",
            backgroundColor: "rgba(230,225,210,0.7)",
            verticalAlign: "text-bottom", marginLeft: "2px",
            animation: "blink 1s step-end infinite",
          }} />
        </div>
      )}

      {/* Prompt — only when empty */}
      {words.length === 0 && !currentWord && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          pointerEvents: "none",
        }}>
          <p style={{
            fontFamily: "'az-sans', sans-serif",
            fontSize: "13px", color: "rgba(200,195,180,0.3)",
            letterSpacing: "0.12em", margin: 0,
          }}>
            Fang an zu tippen. Lass es los.
          </p>
        </div>
      )}

      {/* Mode toggle */}
      <div style={{
        position: "absolute", top: "24px", left: "50%",
        transform: "translateX(-50%)",
        display: "flex", gap: "2px",
        backgroundColor: "rgba(255,255,255,0.06)",
        borderRadius: "100px", padding: "3px",
        pointerEvents: "all",
      }}>
        {(["words", "sentences"] as const).map(m => (
          <button
            key={m}
            onClick={e => { e.stopPropagation(); setMode(m); inputRef.current?.focus(); }}
            style={{
              fontFamily: "'az-sans', sans-serif",
              fontSize: "10px", letterSpacing: "0.06em",
              padding: "5px 14px", borderRadius: "100px",
              border: "none", cursor: "pointer",
              backgroundColor: mode === m ? "rgba(230,225,210,0.15)" : "transparent",
              color: mode === m ? "rgba(230,225,210,0.85)" : "rgba(230,225,210,0.35)",
              transition: "background-color 0.2s, color 0.2s",
            }}
          >
            {m === "words" ? "Wörter" : "Sätze"}
          </button>
        ))}
      </div>

      {/* Vignette */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at center, transparent 40%, rgba(7,7,14,0.7) 100%)",
      }} />

      <style>{`@keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
    </div>
  );
}
