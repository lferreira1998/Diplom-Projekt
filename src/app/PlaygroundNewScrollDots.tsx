import { useEffect } from "react";
import PlaygroundNew from "./PlaygroundNew";

const linkMap: Record<string, string> = {
  "/Diplom-Projekt/uninvited-thoughts": "/Diplom-Projekt/new-experiments/uninvited-thoughts",
  "/Diplom-Projekt/dont-stop-writing": "/Diplom-Projekt/new-experiments/without-stopping",
  "/Diplom-Projekt/anonymously-in-public": "/Diplom-Projekt/new-experiments/blind-then-witness",
  "/Diplom-Projekt/one-word-replay": "/Diplom-Projekt/new-experiments/blind-then-witness",
  "/Diplom-Projekt/loschen-korrigieren": "/Diplom-Projekt/new-experiments/visible-corrections",
  "/Diplom-Projekt/off-the-grid": "/Diplom-Projekt/new-experiments/off-the-grid",
  "/Diplom-Projekt/in-a-spiral": "/Diplom-Projekt/new-experiments/in-a-spiral",
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
