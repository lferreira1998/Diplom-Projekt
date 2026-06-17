import { useEffect } from "react";
import PlaygroundNew from "./PlaygroundNew";

const FAB_START = 95;
const FAB_END = 100;
const FAB_START_WIDTH = 104;
const FAB_START_RIGHT = 24;
const FAB_START_BOTTOM = 24;
const TOOL_COLLECTION_INSET = 96;
const FAB_END_COLOR = "#FFFDFA";
const VIRTUAL_SCROLL_PIXELS = 520;
const FOOTER_HEIGHT = 60;

// Renders the playground. variant "intro" = full landing page (hero + scroll
// reveal + collection); variant "collection" = only the tool-collection grid.
function ensureEnglishDefaultLanguage() {
  if (typeof window === "undefined") return;
  if (!window.localStorage.getItem("appLang")) {
    window.localStorage.setItem("appLang", "en");
  }
}

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function lerp(from: number, to: number, amount: number) {
  return from + (to - from) * amount;
}

function hexToRgb(hex: string) {
  const value = hex.replace("#", "");
  return {
    r: Number.parseInt(value.slice(0, 2), 16),
    g: Number.parseInt(value.slice(2, 4), 16),
    b: Number.parseInt(value.slice(4, 6), 16),
  };
}

function mixHex(from: string, to: string, amount: number) {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  const channel = (start: number, end: number) => Math.round(lerp(start, end, amount));
  return `rgb(${channel(a.r, b.r)}, ${channel(a.g, b.g)}, ${channel(a.b, b.b)})`;
}

function getFabStartColor() {
  return window.localStorage.getItem("appTheme") === "dark" ? "#252321" : "#fcf6ef";
}

function useExtendedCreateToolFab() {
  useEffect(() => {
    const main = document.querySelector<HTMLElement>("body #root main");
    if (!main) return;

    let frame = 0;
    let virtualOverscroll = 0;
    const virtualRange = FAB_END - 100;

    const getScrollMax = () => Math.max(1, main.scrollHeight - main.clientHeight);

    const updateFab = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const scrollMax = getScrollMax();
        const naturalProgress = (main.scrollTop / scrollMax) * 100;
        const progress = naturalProgress + virtualOverscroll * virtualRange;
        const grow = clamp01((progress - FAB_START) / (FAB_END - FAB_START));
        const move = clamp01((progress - 92) / 8);
        const finalInset = window.innerWidth < 900 ? FAB_START_RIGHT : TOOL_COLLECTION_INSET;
        const finalWidth = Math.max(FAB_START_WIDTH, window.innerWidth - finalInset * 2);

        main.style.setProperty("--create-tool-fab-width", `${lerp(FAB_START_WIDTH, finalWidth, grow)}px`);
        main.style.setProperty("--create-tool-fab-right", `${lerp(FAB_START_RIGHT, finalInset, move)}px`);
        main.style.setProperty("--create-tool-fab-bg", mixHex(getFabStartColor(), FAB_END_COLOR, grow));
        main.style.setProperty("--create-tool-fab-bottom", `${lerp(FAB_START_BOTTOM, FOOTER_HEIGHT + 110, grow)}px`);
      });
    };

    const handleScroll = () => {
      const scrollMax = getScrollMax();
      if (main.scrollTop < scrollMax - 2 && virtualOverscroll > 0) {
        virtualOverscroll = 0;
      }
      updateFab();
    };

    const handleWheel = (event: WheelEvent) => {
      const scrollMax = getScrollMax();
      const atBottom = main.scrollTop >= scrollMax - 2;
      const scrollingDownAtBottom = event.deltaY > 0 && atBottom;
      const unwindingVirtualScroll = event.deltaY < 0 && virtualOverscroll > 0;

      if (!scrollingDownAtBottom && !unwindingVirtualScroll) return;

      const nextOverscroll = clamp01(virtualOverscroll + event.deltaY / VIRTUAL_SCROLL_PIXELS);
      if (nextOverscroll === virtualOverscroll && !scrollingDownAtBottom) return;

      event.preventDefault();
      virtualOverscroll = nextOverscroll;
      updateFab();
    };

    updateFab();
    window.setTimeout(updateFab, 500);
    window.setTimeout(updateFab, 1500);

    const mutationObserver = new MutationObserver(updateFab);
    mutationObserver.observe(main, { childList: true, subtree: true });
    main.addEventListener("scroll", handleScroll, { passive: true });
    main.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("resize", updateFab);

    return () => {
      cancelAnimationFrame(frame);
      mutationObserver.disconnect();
      main.removeEventListener("scroll", handleScroll);
      main.removeEventListener("wheel", handleWheel);
      window.removeEventListener("resize", updateFab);
      main.style.removeProperty("--create-tool-fab-width");
      main.style.removeProperty("--create-tool-fab-right");
      main.style.removeProperty("--create-tool-fab-bg");
      main.style.removeProperty("--create-tool-fab-bottom");
    };
  }, []);
}

export default function PlaygroundNewScrollDots({ variant }: { variant?: "intro" | "collection" }) {
  ensureEnglishDefaultLanguage();
  useExtendedCreateToolFab();

  return (
    <>
      <style>{`
        body #root main {
          background-attachment: local !important;
        }

        body #root main > button[style*="bottom: 24px"][style*="right: 24px"] {
          width: var(--create-tool-fab-width, 104px) !important;
          right: var(--create-tool-fab-right, 24px) !important;
          background: var(--create-tool-fab-bg, #fcf6ef) !important;
          bottom: var(--create-tool-fab-bottom, 24px) !important;
        }
      `}</style>
      <PlaygroundNew variant={variant} />
    </>
  );
}
