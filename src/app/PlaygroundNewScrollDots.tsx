import { useEffect } from "react";
import PlaygroundNew from "./PlaygroundNew";

const linkMap: Record<string, string> = {
  "/uninvited-thoughts": "/new-experiments/uninvited-thoughts",
  "/dont-stop-writing": "/new-experiments/without-stopping",
  "/anonymously-in-public": "/new-experiments/blind-then-witness",
  "/one-word-replay": "/new-experiments/blind-then-witness",
  "/loschen-korrigieren": "/new-experiments/visible-corrections",
  "/off-the-grid": "/new-experiments/off-the-grid",
  "/in-a-spiral": "/new-experiments/in-a-spiral",
};

export default function PlaygroundNewScrollDots() {
  useEffect(() => {
    const rewriteLinks = () => {
      document.querySelectorAll<HTMLAnchorElement>(".playground-tool-shape[href]").forEach((anchor) => {
        const url = new URL(anchor.href);
        const next = linkMap[url.pathname];
        if (next) anchor.href = next;
      });
    };

    rewriteLinks();
    const raf = requestAnimationFrame(rewriteLinks);
    return () => cancelAnimationFrame(raf);
  }, []);

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
