import { motion } from "motion/react";

interface PhaseAwarenessProps {
  timeLeft: number;
}

export function PhaseAwareness({ timeLeft }: PhaseAwarenessProps) {
  const seconds = timeLeft % 60;
  const display = `0:${seconds.toString().padStart(2, "0")}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl mx-auto"
    >
      {/* Breathing Circle */}
      <div className="relative mb-16">
        <div
          className="w-32 h-32 rounded-full"
          style={{
            backgroundColor: "#313642",
            animation: "breathe 8s ease-in-out infinite",
          }}
        />
        <div
          className="absolute inset-0 w-32 h-32 rounded-full"
          style={{
            border: "1px solid #D0D1D6",
            animation: "breathe 8s ease-in-out infinite",
            animationDelay: "0.5s",
          }}
        />
      </div>

      {/* Instructions */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center mb-3"
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "clamp(1.1rem, 2.5vw, 1.4rem)",
          color: "#313642",
          lineHeight: 1.6,
        }}
      >
        Just sit.
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-center mb-12 max-w-sm"
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "0.9rem",
          color: "#9A9DAA",
          lineHeight: 1.6,
        }}
      >
        Watch your thoughts like cars passing on a highway.
        <br />
        Don't try to change anything.
      </motion.p>

      {/* Timer */}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="tabular-nums"
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "1.5rem",
          color: "#D0D1D6",
          letterSpacing: "0.2em",
        }}
      >
        {display}
      </motion.span>
    </motion.div>
  );
}
