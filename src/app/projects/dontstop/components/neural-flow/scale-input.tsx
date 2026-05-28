interface ScaleInputProps {
  value: number;
  onChange: (v: number) => void;
  label: string;
  lowLabel: string;
  highLabel: string;
}

export function ScaleInput({
  value,
  onChange,
  label,
  lowLabel,
  highLabel,
}: ScaleInputProps) {
  return (
    <div className="flex flex-col gap-3">
      <span
        style={{
          fontFamily: "'general-sans', sans-serif",
          fontSize: "0.7rem",
          color: "#9A9DAA",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <div className="flex items-center gap-1.5 flex-wrap">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
          const isSelected = n <= value;
          return (
            <button
              key={n}
              onClick={() => onChange(n)}
              className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer transition-all duration-150"
              style={{
                backgroundColor: isSelected ? "#313642" : "transparent",
                color: isSelected ? "#F2F3F6" : "#9A9DAA",
                border: isSelected ? "2px solid #313642" : "1.5px solid #D0D1D6",
                fontFamily: "'general-sans', sans-serif",
                fontSize: "0.75rem",
              }}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div className="flex justify-between">
        <span
          style={{
            fontFamily: "'general-sans', sans-serif",
            fontSize: "0.65rem",
            color: "#B0B3BC",
          }}
        >
          {lowLabel}
        </span>
        <span
          style={{
            fontFamily: "'general-sans', sans-serif",
            fontSize: "0.65rem",
            color: "#B0B3BC",
          }}
        >
          {highLabel}
        </span>
      </div>
    </div>
  );
}
