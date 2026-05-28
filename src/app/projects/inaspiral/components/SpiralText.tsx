import { useState, useRef, useEffect, useCallback } from 'react';

function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export function SpiralText() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hiddenInputRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState('');
  const [cursorVisible, setCursorVisible] = useState(true);
  const [isFocused, setIsFocused] = useState(false);
  const [dims, setDims] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const interval = setInterval(() => setCursorVisible(v => !v), 530);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    hiddenInputRef.current?.focus();
    setIsFocused(true);
  }, []);

  useEffect(() => {
    const container = canvasRef.current?.parentElement;
    if (!container) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDims({ w: width, h: height });
      }
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const W = dims.w || canvas.parentElement!.getBoundingClientRect().width;
    const H = dims.h || canvas.parentElement!.getBoundingClientRect().height;
    if (W === 0 || H === 0) return;

    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const cx = W / 2;
    const cy = H * 0.44;

    const displayText = text.replace(/\n/g, '  ');
    const chars = displayText.split('');
    const N = chars.length;

    const minR = 15;
    const maxR = Math.min(W, H) * 0.36;
    const minFont = 5;
    const maxFont = 30;

    const cursorAngle = Math.PI * 0.5;

    if (N > 30) {
      const noiseCount = Math.min(N, 200);
      for (let k = 0; k < noiseCount; k++) {
        const pr = pseudoRandom(k + 7777);
        const pr2 = pseudoRandom(k + 3333);
        const pr3 = pseudoRandom(k + 9999);
        const charIdx = Math.floor(pr3 * Math.min(N, 100));
        const ch = chars[charIdx] || '.';
        const r = minR + (maxR * 0.9) * pr;
        const a = pr2 * Math.PI * 6;
        const nx = cx + r * Math.cos(a);
        const ny = cy + r * Math.sin(a);
        const fs = 4 + pr * 8;
        ctx.save();
        ctx.translate(nx, ny);
        ctx.rotate(pr * Math.PI * 2);
        ctx.font = `${fs}px freight-text-pro, serif`;
        ctx.fillStyle = `rgba(180, 175, 160, ${0.02 + pr * 0.04})`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(ch, 0, 0);
        ctx.restore();
      }
    }

    if (N === 0) {
      if (cursorVisible && isFocused) {
        const cursorX = cx + maxR * Math.cos(cursorAngle);
        const cursorY = cy + maxR * Math.sin(cursorAngle);
        ctx.save();
        ctx.translate(cursorX, cursorY);
        ctx.fillStyle = 'rgba(200, 195, 180, 0.7)';
        ctx.fillRect(-1.5, -maxFont * 0.55, 3, maxFont * 1.1);
        ctx.restore();
      }
      return;
    }

    let estAngle = 0;
    for (let i = N - 1; i >= 0; i--) {
      const frac = (N - 1 - i) / Math.max(N, 1);
      const r = maxR - (maxR - minR) * Math.pow(frac, 0.65);
      const fs = minFont + (maxFont - minFont) * Math.pow(1 - frac, 0.55);
      const cw = fs * 0.52;
      estAngle += (cw + fs * 0.08) / Math.max(r, 5);
    }
    const spiralTightness = (maxR - minR) / Math.max(estAngle, Math.PI * 1.2);

    let currentAngle = cursorAngle;
    let currentRadius = maxR;

    interface CharPos {
      x: number; y: number; char: string;
      fontSize: number; opacity: number; rotation: number;
    }
    const positions: CharPos[] = [];

    const cursorX = cx + maxR * Math.cos(cursorAngle);
    const cursorY = cy + maxR * Math.sin(cursorAngle);

    for (let i = N - 1; i >= 0; i--) {
      const distFromNewest = N - 1 - i;
      const radiusProg = Math.max(0, (currentRadius - minR) / (maxR - minR));
      const fontSize = minFont + (maxFont - minFont) * Math.pow(radiusProg, 0.55);
      const opacity = 0.04 + 0.96 * Math.pow(radiusProg, 0.35);

      ctx.font = `${fontSize}px freight-text-pro, serif`;
      const cw = ctx.measureText(chars[i]).width;
      const arcStep = (cw * 0.78 + fontSize * 0.1) / Math.max(currentRadius, 4);

      currentAngle += arcStep;
      currentRadius -= spiralTightness * arcStep;
      currentRadius = Math.max(currentRadius, 2);

      const x = cx + currentRadius * Math.cos(currentAngle);
      const y = cy + currentRadius * Math.sin(currentAngle);
      const rotation = currentAngle - Math.PI / 2;

      const show =
        radiusProg > 0.22 ||
        pseudoRandom(i * 31 + distFromNewest * 7) > (0.75 - radiusProg * 2);

      if (show && currentRadius > 2) {
        positions.unshift({ x, y, char: chars[i], fontSize, opacity, rotation });
      }
    }

    for (const cp of positions) {
      ctx.save();
      ctx.translate(cp.x, cp.y);
      ctx.rotate(cp.rotation);
      ctx.font = `${cp.fontSize}px freight-text-pro, serif`;
      ctx.fillStyle = `rgba(225, 220, 205, ${cp.opacity})`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(cp.char, 0, 0);
      ctx.restore();
    }

    const glowCount = Math.min(12, N);
    for (let g = 0; g < glowCount; g++) {
      const cp = positions[positions.length - 1 - g];
      if (!cp) break;
      const glowOpacity = 0.06 * (1 - g / glowCount);
      ctx.save();
      ctx.translate(cp.x, cp.y);
      ctx.beginPath();
      ctx.arc(0, 0, cp.fontSize * 1.2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(220, 215, 195, ${glowOpacity})`;
      ctx.fill();
      ctx.restore();
    }

    if (cursorVisible && isFocused) {
      ctx.save();
      ctx.translate(cursorX, cursorY);
      ctx.fillStyle = 'rgba(225, 220, 205, 0.85)';
      ctx.fillRect(-1.5, -maxFont * 0.55, 3, maxFont * 1.1);
      ctx.restore();
    }
  }, [text, cursorVisible, isFocused, dims]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    setCursorVisible(true);
  }, []);

  return (
    <div
      className="w-full h-full relative cursor-text overflow-hidden"
      onClick={() => {
        hiddenInputRef.current?.focus();
        setIsFocused(true);
      }}
      style={{ perspective: '900px' }}
    >
      <div
        className="w-full h-full"
        style={{
          transform: 'rotateX(40deg)',
          transformOrigin: 'center 68%',
          transformStyle: 'preserve-3d',
        }}
      >
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center 65%, transparent 30%, rgba(8,8,14,0.6) 100%)',
        }}
      />

      <textarea
        ref={hiddenInputRef}
        value={text}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        aria-label="Spiral text input"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: '-9999px',
          opacity: 0,
          width: '1px',
          height: '1px',
        }}
        autoFocus
      />
    </div>
  );
}
