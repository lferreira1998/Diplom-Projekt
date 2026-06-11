import { useEffect, useState } from "react";
import { Routes, Route, Navigate, useLocation, useParams } from "react-router";
import MobileGate from "./components/MobileGate";
import TopNav from "./components/TopNav";
import Overview from "./Overview";
import OneWordReplay from "./OneWordReplay";
import AboutNew from "./AboutNew";
import AllTools from "./AllTools";
import DontStopWriting from "./projects/dontstop/App";
import UninvitedThoughts from "./projects/uninvitedthoughts/App";
import LoschenKorrigieren from "./projects/loschenkorrigieren/App";
import DriftingFollowingWords from "./projects/driftingfollowing/App";
import DriftingDisappearingWords from "./projects/driftingdisappearing/App";
import ParametrischesTool from "./projects/parametrischestool/App";
import AnonymouslyInPublic from "./projects/anonymouslyinpublic/App";
import VisualTimer from "./projects/visualtimer/App";
import OffTheGrid from "./projects/offthegrid/App";
import InASpiral from "./projects/inaspiral/App";
import RandomlySpatially from "./projects/randomlyspatially/App";
import New from "./New";
import PlaygroundNewScrollDots from "./PlaygroundNewScrollDots";
import PlaygroundCodex, { PlaygroundCodexMyTools } from "./PlaygroundCodex";
import PlaygroundCodex2, { PlaygroundCodex2MyTools } from "./PlaygroundCodex2";
import { MyToolsPage } from "./PlaygroundNew";
import {
  StyledBlindThenWitness,
  StyledInASpiral,
  StyledOffTheGrid,
  StyledUninvitedThoughts,
  StyledVisibleCorrections,
  StyledWithoutStopping,
} from "./StyledExperiments";

function SearchRedirect({ to }: { to: string }) {
  const { search } = useLocation();
  return <Navigate to={`${to}${search}`} replace />;
}

// Legacy experiment pages (/new-experiments/:preset) are replaced by the new
// create-tool preset viewer so every preset opens in the current design.
function PresetRedirect() {
  const { preset } = useParams();
  return <Navigate to={`/create-tool?preset=${preset ?? ""}`} replace />;
}

function GlobalRouteTopNav() {
  const { pathname } = useLocation();
  const [lang, setLang] = useState<"de" | "en">(() => (localStorage.getItem("appLang") as "de" | "en") ?? "en");
  const [dark, setDark] = useState<boolean>(() => localStorage.getItem("appTheme") === "dark");

  const localNavRoutes = [
    "/introduction",
    "/tool-collection",
    "/about-the-project",
  ];
  if (localNavRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    return null;
  }

  const current = pathname.startsWith("/create-tool") ? "Create" : "Playground";

  return (
    <>
      {pathname.startsWith("/create-tool") && (
        <style>{`
          div[data-html2canvas-ignore="true"][style*="top: 24px"][style*="right: 24px"][style*="z-index: 20"],
          button[data-html2canvas-ignore="true"][style*="top: 12px"][style*="right: 12px"][style*="z-index: 20"] {
            display: none !important;
          }
        `}</style>
      )}
      <TopNav current={current} dark={dark} setDark={setDark} lang={lang} setLang={setLang} />
    </>
  );
}

function NormalizeVisibleDashes() {
  useEffect(() => {
    const statusIcons: Record<string, string> = {
      "✓": `<svg viewBox="0 0 13.6 15.91" aria-hidden="true" style="width:13.6px;height:15.91px;display:block;overflow:visible;color:currentColor"><path fill="currentColor" d="M.93,8.28l1.78,2.85-.93.58-1.78-2.85.93-.58Z"/><text fill="currentColor" x="0" y="0" transform="translate(11.17 5.41) rotate(-143.6) scale(.97 1)" style="font-family:'az-sans',sans-serif;font-size:15.4px;font-variation-settings:'SRFF' 0,'wdth' 100,'wght' 350,'slnt' 0">l</text></svg>`,
      "○": `<svg viewBox="0 0 8.4 16.69" aria-hidden="true" style="width:8.4px;height:16.69px;display:block;overflow:visible;color:currentColor"><text fill="currentColor" x="0" y="12.71" style="font-family:'az-sans',sans-serif;font-size:15px;font-variation-settings:'SRFF' 0,'wdth' 100,'wght' 350,'slnt' 0">o</text></svg>`,
    };
    const saveIcon = `<span data-save-icon-wrap="true" aria-hidden="true" style="position:relative;width:14.08px;height:21.51px;display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;color:currentColor;margin-right:8px;vertical-align:middle"><svg class="st-save-icon-normal" viewBox="0 0 14.08 21.51" style="position:absolute;width:14.08px;height:21.51px;display:block;overflow:visible;transition:opacity 120ms ease"><path fill="currentColor" d="M6.5,11.86l-4.53,4.53-.77-.77,4.53-4.53.77.77Z"/><path fill="currentColor" d="M12.9,1.09H1.2V0s11.7,0,11.7,0v1.09Z"/><path fill="currentColor" d="M8.47,11.09l4.43,4.57-.71.73-4.43-4.57.71-.73Z"/><text fill="currentColor" x="0" y="0" transform="translate(0 16.39) scale(.78 1)" style="font-family:'az-sans',sans-serif;font-size:19.3px;font-variation-settings:'SRFF' 0,'wdth' 100,'wght' 350,'slnt' 0">l</text><text fill="currentColor" x="0" y="0" transform="translate(10.5 16.34) scale(.78 1)" style="font-family:'az-sans',sans-serif;font-size:19.24px;font-variation-settings:'SRFF' 0,'wdth' 100,'wght' 350,'slnt' 0">l</text></svg><svg class="st-save-icon-selected" viewBox="0 0 11.7 16.39" style="position:absolute;width:11.7px;height:16.39px;display:block;overflow:visible;opacity:0;transition:opacity 120ms ease"><path fill="currentColor" d="M11.35,15.78h.33v-.31l-.33.31Z"/><polygon fill="currentColor" points="11.7 0 11.7 1.1 11.68 1.1 11.68 15.47 11.35 15.78 10.69 16.39 5.54 11.62 .77 16.39 .23 15.84 0 15.61 0 0 11.7 0"/></svg></span>`;
    if (!document.getElementById("st-save-icon-style")) {
      const style = document.createElement("style");
      style.id = "st-save-icon-style";
      style.textContent = `
        button[data-save-icon="true"]:hover .st-save-icon-normal,
        button[data-save-icon="true"]:focus-visible .st-save-icon-normal,
        button[data-save-icon="true"]:active .st-save-icon-normal { opacity: 0; }
        button[data-save-icon="true"]:hover .st-save-icon-selected,
        button[data-save-icon="true"]:focus-visible .st-save-icon-selected,
        button[data-save-icon="true"]:active .st-save-icon-selected { opacity: 1 !important; }
      `;
      document.head.appendChild(style);
    }

    const replaceStatusIcons = (root: ParentNode) => {
      root.querySelectorAll?.("span").forEach((span) => {
        const symbol = span.textContent?.trim() ?? "";
        const icon = statusIcons[symbol];
        if (!icon || span.dataset.statusIcon === "true") return;
        span.dataset.statusIcon = "true";
        span.innerHTML = icon;
        span.style.display = "inline-flex";
        span.style.alignItems = "center";
        span.style.justifyContent = "center";
        span.style.width = symbol === "✓" ? "13.6px" : "8.4px";
        span.style.height = "16.69px";
        span.style.flex = "0 0 auto";
      });
    };

    const replaceSaveIcons = (root: ParentNode) => {
      root.querySelectorAll?.("button").forEach((button) => {
        if (button.dataset.saveIcon === "true") return;
        const text = button.textContent?.trim() ?? "";
        const isSaveButton = /^(Save tool to collection|Tool zur Sammlung hinzufügen|Save privately|Privat speichern|Speichert|Saving)/i.test(text);
        if (!isSaveButton) return;
        button.dataset.saveIcon = "true";
        button.style.display = "inline-flex";
        button.style.alignItems = "center";
        button.style.justifyContent = "center";
        button.style.gap = button.style.gap || "0px";
        button.insertAdjacentHTML("afterbegin", saveIcon);
      });
    };

    const normalizeText = (root: ParentNode) => {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      while (node) {
        if (node.nodeValue && /[—–]/.test(node.nodeValue)) {
          node.nodeValue = node.nodeValue
            .replace(/\s[—–]\s/g, ", ")
            .replace(/[—–]/g, "-");
        }
        node = walker.nextNode();
      }
    };

    normalizeText(document.body);
    replaceStatusIcons(document.body);
    replaceSaveIcons(document.body);
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE && node.nodeValue && /[—–]/.test(node.nodeValue)) {
            node.nodeValue = node.nodeValue
              .replace(/\s[—–]\s/g, ", ")
              .replace(/[—–]/g, "-");
          } else if (node instanceof HTMLElement) {
            normalizeText(node);
            replaceStatusIcons(node);
            replaceSaveIcons(node);
          }
        });
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return null;
}

export default function App() {
  return (
    <MobileGate>
    <NormalizeVisibleDashes />
    <GlobalRouteTopNav />
    <Routes>
      {/* ── Main routes ── */}
      <Route path="/" element={<Navigate to="/introduction" replace />} />
      <Route path="/introduction" element={<PlaygroundNewScrollDots />} />
      <Route path="/tool-collection" element={<PlaygroundNewScrollDots variant="collection" />} />
      <Route path="/create-tool" element={<New />} />
      <Route path="/my-tools" element={<MyToolsPage />} />
      <Route path="/about-the-project" element={<AboutNew />} />
      <Route path="/write" element={<ParametrischesTool />} />

      {/* ── Individual writing tools ── */}
      <Route path="/without-stopping" element={<DontStopWriting />} />
      <Route path="/uninvited-thoughts" element={<UninvitedThoughts />} />
      <Route path="/visible-corrections" element={<LoschenKorrigieren />} />
      <Route path="/blind-then-witness" element={<AnonymouslyInPublic />} />
      <Route path="/off-the-grid" element={<OffTheGrid />} />
      <Route path="/in-a-spiral" element={<InASpiral />} />
      <Route path="/one-word-replay" element={<OneWordReplay />} />
      <Route path="/drifting-following-words" element={<DriftingFollowingWords />} />
      <Route path="/drifting-disappearing-words" element={<DriftingDisappearingWords />} />
      <Route path="/visual-timer" element={<VisualTimer />} />
      <Route path="/randomly-spatially" element={<RandomlySpatially />} />

      {/* ── Legacy preset pages → new create-tool preset viewer ── */}
      <Route path="/new-experiments/:preset" element={<PresetRedirect />} />

      {/* ── Redirects for old URLs → new pages only ── */}
      <Route path="/all-tools" element={<Navigate to="/tool-collection" replace />} />
      <Route path="/playgroundcodex" element={<Navigate to="/tool-collection" replace />} />
      <Route path="/playgroundcodex/my-tools" element={<Navigate to="/tool-collection" replace />} />
      <Route path="/playgroundcodex2" element={<Navigate to="/tool-collection" replace />} />
      <Route path="/playgroundcodex2/my-tools" element={<Navigate to="/tool-collection" replace />} />
      <Route path="/playground" element={<Navigate to="/introduction" replace />} />
      <Route path="/playgroundnew" element={<Navigate to="/introduction" replace />} />
      <Route path="/playgroundnew1" element={<Navigate to="/introduction" replace />} />
      <Route path="/new" element={<SearchRedirect to="/create-tool" />} />
      <Route path="/parametrisches-tool" element={<SearchRedirect to="/write" />} />
      <Route path="/dont-stop-writing" element={<Navigate to="/without-stopping" replace />} />
      <Route path="/anonymously-in-public" element={<Navigate to="/blind-then-witness" replace />} />
      <Route path="/loschen-korrigieren" element={<Navigate to="/visible-corrections" replace />} />
      <Route path="/aboutnew" element={<Navigate to="/about-the-project" replace />} />

      {/* ── Catch-all → introduction ── */}
      <Route path="*" element={<Navigate to="/introduction" replace />} />
    </Routes>
    </MobileGate>
  );
}
