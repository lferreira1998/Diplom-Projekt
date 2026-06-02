import { motion } from "motion/react";

interface PhaseStillnessProps {
  timeLeft: number;
}

export function PhaseStillness({ timeLeft }: PhaseStillnessProps) {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const display = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
      className="flex-1 flex flex-col items-center justify-center w-full max-w-2xl mx-auto"
    >
      {/* Pulsing dot */}
      <div className="mb-16">
        <div
          className="w-3 h-3 rounded-full"
          style={{
            backgroundColor: "#313642",
            animation: "pulse 4s ease-in-out infinite",
          }}
        />
      </div>

      {/* Instruction */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-center mb-2"
        style={{
          fontFamily: "'az-sans', sans-serif",
          fontSize: "clamp(1.1rem, 2.5vw, 1.4rem)",
          color: "#313642",
          lineHeight: 1.6,
        }}
      >
        Close your eyes.
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="text-center mb-16"
        style={{
          fontFamily: "'az-sans', sans-serif",
          fontSize: "0.9rem",
          color: "#B0B3BC",
          lineHeight: 1.6,
        }}
      >
        Sit in the emptiness you just created.
      </motion.p>

      {/* Timer — visible if they peek */}
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="tabular-nums"
        style={{
          fontFamily: "'az-sans', sans-serif",
          fontSize: "1.5rem",
          color: "#E0E1E6",
          letterSpacing: "0.2em",
        }}
      >
        {display}
      </motion.span>
    </motion.div>
  );
}
