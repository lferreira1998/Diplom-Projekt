import PlaygroundNew from "./PlaygroundNew";

// The tool-collection page. Hero tools link straight to the new
// /create-tool?preset=… viewer, so no link rewriting to legacy pages is needed.
export default function PlaygroundNewScrollDots() {
  return (
    <>
      <style>{`
        body #root main {
          background-attachment: local !important;
        }
      `}</style>
      <PlaygroundNew />
    </>
  );
}
