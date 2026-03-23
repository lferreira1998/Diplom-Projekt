import { useRef, useEffect, useCallback, useState } from "react";

export interface CharData {
  char: string;
  gapBefore: number; // pixels of gap before this character
}

interface WritingZoneProps {
  chars: CharData[];
  onCharsChange: (chars: CharData[]) => void;
  disabled: boolean;
  lastKeyPressTimestamp: React.MutableRefObject<number>;
}

export function WritingZone({
  chars,
  onCharsChange,
  disabled,
  lastKeyPressTimestamp,
}: WritingZoneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const gapRef = useRef<HTMLSpanElement>(null);
  const cursorWrapRef = useRef<HTMLSpanElement>(null);
  const animFrameRef = useRef<number>(0);
  const hasTyped = chars.length > 0;

  // Focus on mount and after restart
  useEffect(() => {
    if (!disabled && containerRef.current) {
      containerRef.current.focus();
    }
  }, [disabled]);

  // Real-time gap animation via requestAnimationFrame
  useEffect(() => {
    if (disabled) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      // Hide the live gap when disabled
      if (gapRef.current) gapRef.current.style.width = "0px";
      return;
    }

    const animate = () => {
      if (lastKeyPressTimestamp.current > 0 && gapRef.current) {
        const elapsed = performance.now() - lastKeyPressTimestamp.current;
        const gap = elapsed / 40; // 1px per 40ms
        gapRef.current.style.width = `${gap}px`;
      }
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [disabled, lastKeyPressTimestamp]);

  // Auto-scroll cursor into view
  useEffect(() => {
    if (cursorWrapRef.current) {
      cursorWrapRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
    }
  }, [chars]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled) return;
      if (e.key === "Tab") return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      e.preventDefault();

      const now = performance.now();
      const gap =
        lastKeyPressTimestamp.current > 0
          ? (now - lastKeyPressTimestamp.current) / 40 // 1px per 40ms
          : 0;

      if (e.key === "Backspace") {
        if (chars.length > 0) {
          onCharsChange(chars.slice(0, -1));
        }
        lastKeyPressTimestamp.current = now;
        // Reset gap element immediately
        if (gapRef.current) gapRef.current.style.width = "0px";
        return;
      }

      if (e.key === "Enter") {
        const newChar: CharData = {
          char: "\n",
          gapBefore: gap,
        };
        onCharsChange([...chars, newChar]);
        lastKeyPressTimestamp.current = now;
        if (gapRef.current) gapRef.current.style.width = "0px";
        return;
      }

      // Only handle printable characters (single char keys)
      if (e.key.length === 1) {
        const newChar: CharData = {
          char: e.key,
          gapBefore: gap,
        };
        onCharsChange([...chars, newChar]);
        lastKeyPressTimestamp.current = now;
        if (gapRef.current) gapRef.current.style.width = "0px";
      }
    },
    [chars, onCharsChange, disabled, lastKeyPressTimestamp]
  );

  const renderChars = () => {
    const elements: React.ReactNode[] = [];

    chars.forEach((c, i) => {
      if (c.char === "\n") {
        // If there was a gap before the Enter, show it, then break
        if (c.gapBefore > 1) {
          elements.push(
            <span
              key={`gap-${i}`}
              className="inline-block"
              style={{
                width: `${c.gapBefore}px`,
                height: "1em",
              }}
            />
          );
        }
        elements.push(<br key={`br-${i}`} />);
      } else {
        // Gap spacer before this character
        if (c.gapBefore > 1) {
          elements.push(
            <span
              key={`gap-${i}`}
              className="inline-block"
              style={{
                width: `${c.gapBefore}px`,
                height: "1em",
              }}
            />
          );
        }
        // The character itself
        elements.push(
          <span
            key={`char-${i}`}
            className="inline"
            style={c.char === " " ? { display: "inline-block", width: "0.6em" } : undefined}
          >
            {c.char}
          </span>
        );
      }
    });

    return elements;
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex-1 flex items-start justify-center pt-8 md:pt-16">
      <div
        ref={containerRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="w-full outline-none cursor-text min-h-[200px] relative"
        style={{
          color: "#313642",
          fontFamily: "'IBM Plex Sans', sans-serif",
          fontSize: "clamp(1.25rem, 3vw, 1.75rem)",
          lineHeight: 1.9,
          caretColor: "transparent",
          wordBreak: "break-all",
          overflowWrap: "anywhere",
        }}
      >
        {!hasTyped && !disabled && (
          <span
            className="select-none absolute top-0 left-0 pointer-events-none"
            style={{ color: "#B0B3BC", fontStyle: "italic" }}
          >
            Don't stop writing. Let every thought pour out...
          </span>
        )}

        {renderChars()}

        {/* Live growing gap — width updated by rAF */}
        {!disabled && (
          <>
            <span
              ref={gapRef}
              className="inline-block"
              style={{
                width: "0px",
                height: "1em",
                transition: "none",
              }}
            />
            {/* Blinking cursor */}
            <span
              ref={cursorWrapRef}
              className="inline-block w-[2px] h-[1.15em] align-middle"
              style={{
                backgroundColor: "#313642",
                animation: "cursorBlink 1s step-end infinite",
                verticalAlign: "text-bottom",
                marginLeft: "1px",
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}