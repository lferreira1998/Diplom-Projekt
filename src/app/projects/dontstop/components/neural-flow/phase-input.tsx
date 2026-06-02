import { useState } from "react";
import { motion } from "motion/react";
import { ScaleInput } from "./scale-input";

export interface InputData {
  fullness: number;
  quality: number;
  text: string;
}

interface PhaseInputProps {
  type: "baseline" | "final";
  onSubmit: (data: InputData) => void;
}

export function PhaseInput({ type, onSubmit }: PhaseInputProps) {
  const [fullness, setFullness] = useState(0);
  const [quality, setQuality] = useState(0);
  const [text, setText] = useState("");

  const isBaseline = type === "baseline";
  const canSubmit = fullness > 0 && quality > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({ fullness, quality, text });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.6 }}
      className="flex-1 flex flex-col items-center w-full max-w-xl mx-auto py-8 md:py-12"
    >
      {/* Title */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-10 text-center"
      >
        <h2
          style={{
            fontFamily: "'az-sans', sans-serif",
            fontSize: "clamp(1.1rem, 2.5vw, 1.4rem)",
            color: "#313642",
            marginBottom: "6px",
          }}
        >
          {isBaseline
            ? "Record Your Baseline"
            : "Post-Exercise Observations"}
        </h2>
        <p
          style={{
            fontFamily: "'az-sans', sans-serif",
            fontSize: "0.8rem",
            color: "#9A9DAA",
          }}
        >
          {isBaseline
            ? "After observing your thoughts, record how they feel right now."
            : "The protocol is complete. Record how your mind feels now."}
        </p>
      </motion.div>

      {/* Fullness Scale */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full mb-8"
      >
        <ScaleInput
          value={fullness}
          onChange={setFullness}
          label="Head Fullness"
          lowLabel="1 = empty"
          highLabel="10 = crowded"
        />
      </motion.div>

      {/* Quality Scale */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full mb-8"
      >
        <ScaleInput
          value={quality}
          onChange={setQuality}
          label="Feeling Quality"
          lowLabel="1 = poor / heavy"
          highLabel="10 = great / inspired"
        />
      </motion.div>

      {/* Text Input */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="w-full mb-10"
      >
        <label
          style={{
            fontFamily: "'az-sans', sans-serif",
            fontSize: "0.7rem",
            color: "#9A9DAA",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            display: "block",
            marginBottom: "8px",
          }}
        >
          {isBaseline ? "Thought Vibe" : "Describe the Difference"}
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={
            isBaseline
              ? 'e.g., "Static and buzzing" or "One big worry repeating"'
              : 'Describe the change in the weight of your thoughts...'
          }
          rows={3}
          className="w-full outline-none resize-none rounded-lg p-4"
          style={{
            fontFamily: "'az-sans', sans-serif",
            fontSize: "0.9rem",
            color: "#313642",
            backgroundColor: "#EAEBF0",
            border: "none",
            lineHeight: 1.6,
          }}
        />
      </motion.div>

      {/* Submit Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="px-10 py-3.5 rounded-full cursor-pointer"
        style={{
          backgroundColor: canSubmit ? "#313642" : "#D0D1D6",
          color: "#F2F3F6",
          fontFamily: "'az-sans', sans-serif",
          fontSize: "0.85rem",
          letterSpacing: "0.15em",
          border: "none",
          transition: "all 0.2s ease",
          cursor: canSubmit ? "pointer" : "not-allowed",
        }}
        onMouseEnter={(e) => {
          if (canSubmit) {
            e.currentTarget.style.transform = "scale(1.03)";
            e.currentTarget.style.opacity = "0.9";
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.opacity = "1";
        }}
      >
        {isBaseline ? "CONTINUE" : "VIEW RESULTS"}
      </motion.button>
    </motion.div>
  );
}
