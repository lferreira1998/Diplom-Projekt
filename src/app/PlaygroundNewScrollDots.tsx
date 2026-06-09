import PlaygroundNew from "./PlaygroundNew";

// Renders the playground. variant "intro" = full landing page (hero + scroll
// reveal + collection); variant "collection" = only the tool-collection grid.
export default function PlaygroundNewScrollDots({ variant }: { variant?: "intro" | "collection" }) {
  return (
    <>
      <style>{`
        body #root main {
          background-attachment: local !important;
          scroll-timeline-name: --playground-scroll;
          scroll-timeline-axis: block;
        }

        body #root main > button[style*="bottom: 24px"][style*="right: 24px"] {
          animation: _createToolFabLateGrow 1s linear both;
          animation-timeline: --playground-scroll;
          animation-range: 95% 100%;
        }

        @keyframes _createToolFabLateGrow {
          from {
            width: 104px;
          }
          to {
            width: calc(100vw - 48px);
            background: #FFFDFA;
          }
        }
      `}</style>
      <PlaygroundNew variant={variant} />
    </>
  );
}
