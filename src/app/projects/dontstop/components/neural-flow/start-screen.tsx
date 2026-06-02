import { motion } from "motion/react";

interface StartScreenProps {
  onBegin: () => void;
}

const phases = [
  {
    num: "01",
    title: "The Baseline",
    duration: "2 min",
    desc: "Observe your thoughts for 60 seconds, then record their weight.",
  },
  {
    num: "02",
    title: "The Flush",
    duration: "3 min",
    desc: "High-intensity writing. Don't stop for a single second.",
  },
  {
    num: "03",
    title: "The Stillness",
    duration: "3 min",
    desc: "Close your eyes. Sit in the emptiness you created.",
  },
  {
    num: "04",
    title: "The Record",
    duration: "·",
    desc: "Measure the difference in your mental state.",
  },
];

export function StartScreen({ onBegin }: StartScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl mx-auto py-12"
    >
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center gap-3 mb-12"
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: "#313642" }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="5.5" stroke="#F2F3F6" strokeWidth="1.5" />
            <path d="M8 5V8L10 10" stroke="#F2F3F6" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <span
          style={{
            fontFamily: "'az-sans', sans-serif",
            fontSize: "0.8rem",
            color: "#313642",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
        >
          Neural Flow
        </span>
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center mb-3"
        style={{
          fontFamily: "'az-sans', sans-serif",
          fontSize: "clamp(1.5rem, 4vw, 2.25rem)",
          color: "#313642",
          lineHeight: 1.2,
        }}
      >
        The 8-Minute
        <br />
        Mind-Reset Protocol
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-center mb-12 max-w-md"
        style={{
          fontFamily: "'az-sans', sans-serif",
          fontSize: "0.9rem",
          color: "#9A9DAA",
          lineHeight: 1.6,
        }}
      >
        A structured experiment to observe, release, and measure the weight of
        your thoughts.
      </motion.p>

      {/* Phase Overview */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="w-full mb-12"
      >
        <div className="flex flex-col gap-0">
          {phases.map((p, i) => (
            <div
              key={p.num}
              className="flex items-start gap-4 py-4"
              style={{
                borderTop: i === 0 ? "1px solid #E0E1E6" : "none",
                borderBottom: "1px solid #E0E1E6",
              }}
            >
              <span
                style={{
                  fontFamily: "'az-sans', sans-serif",
                  fontSize: "0.65rem",
                  color: "#B0B3BC",
                  letterSpacing: "0.1em",
                  minWidth: "24px",
                  paddingTop: "2px",
                }}
              >
                {p.num}
              </span>
              <div className="flex-1">
                <div className="flex items-baseline justify-between gap-4">
                  <span
                    style={{
                      fontFamily: "'az-sans', sans-serif",
                      fontSize: "0.95rem",
                      color: "#313642",
                    }}
                  >
                    {p.title}
                  </span>
                  <span
                    style={{
                      fontFamily: "'az-sans', sans-serif",
                      fontSize: "0.7rem",
                      color: "#B0B3BC",
                      letterSpacing: "0.1em",
                    }}
                  >
                    {p.duration}
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: "'az-sans', sans-serif",
                    fontSize: "0.8rem",
                    color: "#9A9DAA",
                    lineHeight: 1.5,
                  }}
                >
                  {p.desc}
                </span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Begin Button */}
      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        onClick={onBegin}
        className="px-10 py-3.5 rounded-full cursor-pointer"
        style={{
          backgroundColor: "#313642",
          color: "#F2F3F6",
          fontFamily: "'az-sans', sans-serif",
          fontSize: "0.85rem",
          letterSpacing: "0.15em",
          border: "none",
          transition: "transform 0.2s ease, opacity 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.03)";
          e.currentTarget.style.opacity = "0.9";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.opacity = "1";
        }}
      >
        BEGIN PROTOCOL
      </motion.button>
    </motion.div>
  );
}
