import { motion } from "motion/react";
import type { InputData } from "./phase-input";
import type { CharData } from "./writing-zone";

interface PhaseResultsProps {
  baseline: InputData;
  final: InputData;
  chars: CharData[];
  onRestart: () => void;
}

export function PhaseResults({
  baseline,
  final: finalData,
  chars,
  onRestart,
}: PhaseResultsProps) {
  const fullnessDiff = finalData.fullness - baseline.fullness;
  const qualityDiff = finalData.quality - baseline.quality;

  const formatDiff = (d: number) => {
    if (d > 0) return `+${d}`;
    if (d < 0) return `${d}`;
    return "0";
  };

  const renderChars = () => {
    const elements: React.ReactNode[] = [];
    chars.forEach((c, i) => {
      if (c.char === "\n") {
        if (c.gapBefore > 1) {
          elements.push(
            <span
              key={`gap-${i}`}
              className="inline-block"
              style={{ width: `${c.gapBefore}px`, height: "1em" }}
            />
          );
        }
        elements.push(<br key={`br-${i}`} />);
      } else {
        if (c.gapBefore > 1) {
          elements.push(
            <span
              key={`gap-${i}`}
              className="inline-block"
              style={{ width: `${c.gapBefore}px`, height: "1em" }}
            />
          );
        }
        elements.push(
          <span
            key={`char-${i}`}
            className="inline"
            style={
              c.char === " "
                ? { display: "inline-block", width: "0.6em" }
                : undefined
            }
          >
            {c.char}
          </span>
        );
      }
    });
    return elements;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
      className="flex-1 flex flex-col items-center w-full max-w-3xl mx-auto py-8"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-10 flex items-center gap-2"
      >
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: "#313642" }}
        />
        <span
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "0.75rem",
            color: "#9A9DAA",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
        >
          Protocol Complete
        </span>
      </motion.div>

      {/* Before / After Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10"
      >
        {/* Before Card */}
        <div
          className="rounded-xl p-6"
          style={{ backgroundColor: "#EAEBF0" }}
        >
          <span
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "0.65rem",
              color: "#9A9DAA",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            Before
          </span>
          <div className="mt-4 flex gap-6">
            <MetricBlock label="Fullness" value={baseline.fullness} />
            <MetricBlock label="Quality" value={baseline.quality} />
          </div>
          {baseline.text && (
            <p
              className="mt-4"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "0.8rem",
                color: "#9A9DAA",
                fontStyle: "italic",
                lineHeight: 1.5,
              }}
            >
              "{baseline.text}"
            </p>
          )}
        </div>

        {/* After Card */}
        <div
          className="rounded-xl p-6"
          style={{ backgroundColor: "#313642" }}
        >
          <span
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "0.65rem",
              color: "#9A9DAA",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            After
          </span>
          <div className="mt-4 flex gap-6">
            <MetricBlock
              label="Fullness"
              value={finalData.fullness}
              light
            />
            <MetricBlock
              label="Quality"
              value={finalData.quality}
              light
            />
          </div>
          {finalData.text && (
            <p
              className="mt-4"
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "0.8rem",
                color: "#9A9DAA",
                fontStyle: "italic",
                lineHeight: 1.5,
              }}
            >
              "{finalData.text}"
            </p>
          )}
        </div>
      </motion.div>

      {/* Difference Summary */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="w-full flex gap-4 mb-10"
      >
        <DiffBadge
          label="Fullness"
          diff={fullnessDiff}
          good={fullnessDiff < 0}
        />
        <DiffBadge
          label="Quality"
          diff={qualityDiff}
          good={qualityDiff > 0}
        />
      </motion.div>

      {/* Writing Artifact */}
      {chars.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="w-full mb-10"
        >
          <div
            className="mb-3"
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "0.65rem",
              color: "#9A9DAA",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            Your Writing Artifact
          </div>
          <div
            className="rounded-xl p-6"
            style={{
              backgroundColor: "#EAEBF0",
              color: "#313642",
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "clamp(0.85rem, 2vw, 1.1rem)",
              lineHeight: 1.9,
              wordBreak: "break-all",
              overflowWrap: "anywhere",
              maxHeight: "300px",
              overflowY: "auto",
            }}
          >
            {renderChars()}
          </div>
        </motion.div>
      )}

      {/* Restart */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        onClick={onRestart}
        className="px-10 py-3.5 rounded-full cursor-pointer"
        style={{
          backgroundColor: "#313642",
          color: "#F2F3F6",
          fontFamily: "'Space Grotesk', sans-serif",
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
        NEW SESSION
      </motion.button>
    </motion.div>
  );
}

function MetricBlock({
  label,
  value,
  light,
}: {
  label: string;
  value: number;
  light?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <span
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "0.6rem",
          color: "#9A9DAA",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          marginBottom: "2px",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "1.75rem",
          color: light ? "#F2F3F6" : "#313642",
        }}
      >
        {value}
        <span
          style={{
            fontSize: "0.75rem",
            color: "#9A9DAA",
            marginLeft: "2px",
          }}
        >
          /10
        </span>
      </span>
    </div>
  );
}

function DiffBadge({
  label,
  diff,
  good,
}: {
  label: string;
  diff: number;
  good: boolean;
}) {
  const formatted = diff > 0 ? `+${diff}` : `${diff}`;
  return (
    <div
      className="flex-1 rounded-lg p-4 flex items-center justify-between"
      style={{ backgroundColor: "#EAEBF0" }}
    >
      <span
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "0.7rem",
          color: "#9A9DAA",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "1.1rem",
          color:
            diff === 0
              ? "#9A9DAA"
              : good
                ? "#3B9B62"
                : "#C05050",
        }}
      >
        {formatted}
      </span>
    </div>
  );
}
