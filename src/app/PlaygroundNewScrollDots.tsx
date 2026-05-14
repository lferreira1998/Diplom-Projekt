import PlaygroundNew from "./PlaygroundNew";

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
