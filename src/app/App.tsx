import { useState } from "react";
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

export default function App() {
  return (
    <MobileGate>
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
