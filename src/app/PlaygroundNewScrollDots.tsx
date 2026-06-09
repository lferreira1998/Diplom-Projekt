import PlaygroundNew from "./PlaygroundNew";

// Renders the playground. variant "intro" = full landing page (hero + scroll
// reveal + collection); variant "collection" = only the tool-collection grid.
export default function PlaygroundNewScrollDots({ variant }: { variant?: "intro" | "collection" }) {
  return (
    <>
      <style>{`
        body #root main {
          background-attachment: local !important;
        }
      `}</style>
      <PlaygroundNew variant={variant} />
    </>
  );
}
