import { useEffect, useState, type ReactNode } from "react";
import { motion } from "motion/react";

const BG          = "#fcf6ef";
const TEXT        = "#555555";
const MUTED       = "#9a9daa";
const BORDER      = "#a4a4a4";
const SERIF       = "'az-serif', serif";
const SANS        = "'az-sans', sans-serif";
const DOT_GRID    = "radial-gradient(circle, rgba(164,164,164,0.7) 1px, transparent 1.2px)";
const BREAKPOINT  = 1000;

const TOOLS = [
  "...without stopping",
  "...uninvited thoughts",
  "...off the grid",
  "...blind & then witness",
  "...with visible corrections",
  "...in a spiral",
];

export default function MobileGate({ children }: { children: ReactNode }) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < BREAKPOINT);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < BREAKPOINT);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  if (!isMobile) return <>{children}</>;

  return (
    <div style={{
      minHeight: "100dvh",
      background: BG,
      backgroundImage: DOT_GRID,
      backgroundSize: "42px 42px",
      color: TEXT,
      fontFamily: SANS,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "60px 28px 80px",
      boxSizing: "border-box",
      overflowY: "auto",
    }}>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ maxWidth: 400, width: "100%", display: "flex", flexDirection: "column", gap: 48 }}
      >
        {/* Title */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <span style={{ fontFamily: SERIF, fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: MUTED }}>
            Shaping Thoughts
          </span>
          <h1 style={{
            fontFamily: SERIF,
            fontSize: 36,
            fontWeight: 300,
            lineHeight: 1.18,
            margin: 0,
            color: "#302e2c",
          }}>
            Write differently.
          </h1>
          <p style={{ fontFamily: SANS, fontSize: 15, lineHeight: 1.6, color: TEXT, margin: 0 }}>
            A collection of experimental writing tools that change the rules of writing: the cursor, the text, the space, time itself. Each tool is a different constraint, a different invitation.
          </p>
        </div>

        {/* Tool list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          <span style={{ fontFamily: SANS, fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED, marginBottom: 12 }}>
            The tools
          </span>
          {TOOLS.map((name, i) => (
            <div key={i} style={{
              padding: "14px 0",
              borderTop: `1px dashed ${BORDER}`,
              fontFamily: SERIF,
              fontSize: 19,
              fontWeight: 300,
              color: TEXT,
            }}>
              {name}
            </div>
          ))}
          <div style={{ borderTop: `1px dashed ${BORDER}` }} />
        </div>

        {/* Desktop-only notice */}
        <div style={{
          border: `1px dashed ${BORDER}`,
          borderRadius: 8,
          padding: "24px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}>
          <span style={{ fontFamily: SERIF, fontSize: 17, color: "#302e2c" }}>
            This is a desktop experience.
          </span>
          <p style={{ fontFamily: SANS, fontSize: 14, lineHeight: 1.6, color: MUTED, margin: 0 }}>
            Put down your phone. Find a computer. Give yourself a real moment to write. That's the whole point.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
