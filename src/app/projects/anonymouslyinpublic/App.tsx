import { useState, useRef, useCallback, useEffect } from "react";

export default function App() {
  const [chars, setChars] = useState<string[]>([]);
  const [cursor, setCursor] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [blinkVisible, setBlinkVisible] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const id = setInterval(() => setBlinkVisible((v) => !v), 530);
    return () => clearInterval(id);
  }, []);

  const resetBlink = useCallback(() => setBlinkVisible(true), []);

  useEffect(() => {
    cursorRef.current?.scrollIntoView({ block: "nearest" });
  }, [cursor]);

  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      resetBlink();

      if (e.key === "Backspace") {
        e.preventDefault();
        if (cursor > 0) {
          setChars((prev) => [...prev.slice(0, cursor - 1), ...prev.slice(cursor)]);
          setCursor((c) => c - 1);
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
        setCursor((c) => Math.min(chars.length, c + 1));
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        setChars((prev) => [...prev.slice(0, cursor), "\n", ...prev.slice(cursor)]);
        setCursor((c) => c + 1);
        return;
      }

      if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        setChars((prev) => [...prev.slice(0, cursor), e.key, ...prev.slice(cursor)]);
        setCursor((c) => c + 1);
      }
    },
    [cursor, chars.length, resetBlink]
  );

  const renderChars = () => {
    const elements: React.ReactNode[] = [];
    const currentIdx = cursor - 1;

    for (let i = 0; i <= chars.length; i++) {
      if (i === cursor) {
        elements.push(
          <span
            key="cursor"
            ref={cursorRef}
            className="inline-block w-[2px]"
            style={{
              backgroundColor: blinkVisible ? "#333" : "transparent",
              height: "1.2em",
              verticalAlign: "text-bottom",
              marginLeft: "-1px",
              marginRight: "-1px",
            }}
          />
        );
      }

      if (i >= chars.length) break;

      const ch = chars[i];

      if (ch === "\n") {
        elements.push(<br key={`br-${i}`} />);
        continue;
      }

      const isCurrent = i === currentIdx;
      const blurred = !revealed && !isCurrent;

      elements.push(
        <span
          key={`ch-${i}`}
          style={{
            display: "inline-block",
            filter: blurred ? "blur(6px)" : "none",
            transition: "filter 0.25s ease",
            userSelect: "none",
          }}
        >
          {ch === " " ? " " : ch}
        </span>
      );
    }

    return elements;
  };

  return (
    <div className="size-full flex flex-col items-center bg-[#f8f7f4]">
      <div className="w-full max-w-2xl px-8 pt-16 pb-8 flex justify-between items-center">
        <p
          className="text-[#aaa] tracking-wide"
          style={{ fontSize: "13px", fontFamily: "'az-serif', serif" }}
        >
          Schreib, als ob niemand zuschaut.
        </p>
        <button
          onClick={() => setRevealed((v) => !v)}
          style={{
            fontSize: "11px",
            letterSpacing: "0.08em",
            color: revealed ? "#333" : "#aaa",
            fontFamily: "'general-sans', sans-serif",
            border: `1px solid ${revealed ? "#333" : "#ccc"}`,
            padding: "5px 14px",
            background: "transparent",
            cursor: "pointer",
            borderRadius: "2px",
            transition: "color 0.2s, border-color 0.2s",
          }}
        >
          {revealed ? "Verbergen" : "Zeigen"}
        </button>
      </div>

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
            fontFamily: "'az-serif', serif",
          }}
        >
          {chars.length === 0 ? (
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
            renderChars()
          )}
        </div>
      </div>

      <div className="w-full max-w-2xl px-8 pb-8">
        <p
          className="text-[#ccc] text-center"
          style={{ fontSize: "11px", letterSpacing: "0.08em" }}
        >
          Nur der aktuelle Buchstabe ist sichtbar.
        </p>
      </div>
    </div>
  );
}
