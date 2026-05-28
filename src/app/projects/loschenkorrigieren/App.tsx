import { useState, useRef, useCallback, useEffect } from "react";

type Layer =
  | { type: "char"; char: string }
  | { type: "cover" };

interface Position {
  layers: Layer[];
}

export default function App() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [cursor, setCursor] = useState(0);
  const [blinkVisible, setBlinkVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);

  // Blink cursor
  useEffect(() => {
    const id = setInterval(() => setBlinkVisible((v) => !v), 530);
    return () => clearInterval(id);
  }, []);

  // Reset blink on any action
  const resetBlink = useCallback(() => setBlinkVisible(true), []);

  // Keep cursor in view
  useEffect(() => {
    cursorRef.current?.scrollIntoView({ block: "nearest" });
  }, [cursor, positions]);

  // Focus on mount
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      resetBlink();

      if (e.key === "Backspace") {
        e.preventDefault();
        if (cursor > 0) {
          const newCursor = cursor - 1;
          setPositions((prev) => {
            const next = prev.map((p) => ({ ...p, layers: [...p.layers] }));
            // Add a cover layer to the position we're "deleting"
            next[newCursor] = {
              layers: [...next[newCursor].layers, { type: "cover" }],
            };
            return next;
          });
          setCursor(newCursor);
        }
        return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setCursor((c) => Math.max(0, c - 1));
        return;
      }

      if (e.key === "ArrowRight") {
        e.preventDefault();
        setCursor((c) => Math.min(positions.length, c + 1));
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        const charLayer: Layer = { type: "char", char: "\n" };
        setPositions((prev) => {
          if (cursor < prev.length) {
            // Overwrite position: add char layer on top
            const next = prev.map((p) => ({ ...p, layers: [...p.layers] }));
            next[cursor] = {
              layers: [...next[cursor].layers, charLayer],
            };
            return next;
          } else {
            // Append new position
            return [...prev, { layers: [charLayer] }];
          }
        });
        setCursor((c) => c + 1);
        return;
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const charLayer: Layer = { type: "char", char: e.key };
        setPositions((prev) => {
          if (cursor < prev.length) {
            // Overwrite: add new char layer on top of existing position
            const next = prev.map((p) => ({ ...p, layers: [...p.layers] }));
            next[cursor] = {
              layers: [...next[cursor].layers, charLayer],
            };
            return next;
          } else {
            // Append
            return [...prev, { layers: [charLayer] }];
          }
        });
        setCursor((c) => c + 1);
      }
    },
    [cursor, positions.length, resetBlink]
  );

  const getTopChar = (pos: Position): string | null => {
    for (let i = pos.layers.length - 1; i >= 0; i--) {
      if (pos.layers[i].type === "char") {
        return (pos.layers[i] as { type: "char"; char: string }).char;
      }
    }
    return null;
  };

  const isTopCover = (pos: Position): boolean => {
    return pos.layers.length > 0 && pos.layers[pos.layers.length - 1].type === "cover";
  };

  const renderPositions = () => {
    const elements: React.ReactNode[] = [];

    for (let i = 0; i <= positions.length; i++) {
      // Render cursor
      if (i === cursor) {
        elements.push(
          <span
            key={`cursor`}
            ref={cursorRef}
            className="inline-block w-[2px]"
            style={{
              backgroundColor: blinkVisible ? "#333" : "transparent",
              height: "1.2em",
              verticalAlign: "text-bottom",
              marginLeft: "-1px",
              marginRight: "-1px",
              position: "relative",
              zIndex: 10,
            }}
          />
        );
      }

      if (i >= positions.length) break;

      const pos = positions[i];
      const topChar = getTopChar(pos);
      const hasCover = pos.layers.some((l) => l.type === "cover");
      const topIsCover = isTopCover(pos);

      // Handle newlines
      if (topChar === "\n" && !topIsCover) {
        if (hasCover) {
          // There was a newline that got covered and then a new newline typed
          elements.push(
            <span key={`pos-${i}`} className="relative inline-block" style={{ width: "0.6em" }}>
              {renderLayers(pos, true)}
            </span>
          );
          elements.push(<br key={`br-${i}`} />);
        } else {
          elements.push(<br key={`br-${i}`} />);
        }
        continue;
      }

      // Check if the first char was a newline (position was originally a line break)
      const firstChar = pos.layers[0]?.type === "char" ? (pos.layers[0] as { type: "char"; char: string }).char : null;

      if (firstChar === "\n" && topIsCover) {
        // Original newline got covered - show as covered space, no line break
        elements.push(
          <span key={`pos-${i}`} className="relative inline-block" style={{ width: "0.6em", height: "1.2em", verticalAlign: "text-bottom" }}>
            {renderLayers(pos, true)}
          </span>
        );
        continue;
      }

      // Normal character position
      elements.push(
        <span key={`pos-${i}`} className="relative inline-block" style={{ verticalAlign: "text-bottom" }}>
          {renderLayers(pos, false)}
        </span>
      );
    }

    return elements;
  };

  const renderLayers = (pos: Position, isNewlineBase: boolean) => {
    const layerElements: React.ReactNode[] = [];

    // Find the index of the LAST char layer — that one should be relative (sets width)
    let lastCharIdx = -1;
    for (let i = pos.layers.length - 1; i >= 0; i--) {
      if (pos.layers[i].type === "char") {
        lastCharIdx = i;
        break;
      }
    }

    pos.layers.forEach((layer, idx) => {
      if (layer.type === "char") {
        const ch = layer.char;
        const isTopChar = idx === lastCharIdx;
        const displayChar = ch === "\n" || ch === " " ? "\u00A0" : ch;

        layerElements.push(
          <span
            key={idx}
            style={{
              position: isTopChar ? "relative" : "absolute",
              left: isTopChar ? undefined : 0,
              top: isTopChar ? undefined : 0,
              zIndex: idx,
              display: "inline-block",
              width: !isTopChar ? "100%" : undefined,
              textAlign: "center",
            }}
          >
            {displayChar}
          </span>
        );
      } else if (layer.type === "cover") {
        layerElements.push(
          <span
            key={idx}
            style={{
              position: "absolute",
              inset: "-1px -0.5px",
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              zIndex: idx,
              borderRadius: "1px",
              boxShadow: "0 0 0 0.5px rgba(230,230,225,0.5)",
            }}
          />
        );
      }
    });

    return layerElements;
  };

  return (
    <div className="size-full flex flex-col items-center bg-[#f8f7f4]">
      {/* Prompt */}
      <div className="w-full max-w-2xl px-8 pt-16 pb-8">
        <p
          className="text-[#aaa] tracking-wide"
          style={{ fontSize: "13px", fontFamily: "'freight-text-pro', serif" }}
        >
          Schreib etwas & ändere dann deine Meinung.
        </p>
      </div>

      {/* Writing surface */}
      <div
        ref={containerRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onClick={() => containerRef.current?.focus()}
        className="w-full max-w-2xl flex-1 px-8 pb-16 outline-none cursor-text"
        style={{ caretColor: "transparent" }}
      >
        <div
          className="min-h-[60vh] whitespace-pre-wrap break-words"
          style={{
            fontSize: "22px",
            lineHeight: "1.9",
            color: "#222",
            fontFamily: "'freight-text-pro', serif",
          }}
        >
          {positions.length === 0 ? (
            <span className="relative">
              <span
                className="absolute pointer-events-none select-none text-[#d0cfc8]"
                style={{ fontSize: "22px" }}
              >
                Beginne zu schreiben…
              </span>
              <span
                ref={cursorRef}
                className="inline-block w-[2px]"
                style={{
                  backgroundColor: blinkVisible ? "#333" : "transparent",
                  height: "1.2em",
                  verticalAlign: "text-bottom",
                }}
              />
            </span>
          ) : (
            renderPositions()
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="w-full max-w-2xl px-8 pb-8">
        <p
          className="text-[#ccc] text-center"
          style={{ fontSize: "11px", letterSpacing: "0.08em" }}
        >
          Backspace löscht nicht. Es überdeckt.
        </p>
      </div>
    </div>
  );
}