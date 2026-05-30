import { Routes, Route, Navigate, useLocation } from "react-router";
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

export default function App() {
  return (
    <Routes>
      {/* ── Main routes ── */}
      <Route path="/" element={<Navigate to="/tool-collection" replace />} />
      <Route path="/tool-collection" element={<PlaygroundNewScrollDots />} />
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
      <Route path="/all-tools" element={<AllTools />} />

      {/* ── New experiments ── */}
      <Route path="/new-experiments/uninvited-thoughts" element={<StyledUninvitedThoughts />} />
      <Route path="/new-experiments/without-stopping" element={<StyledWithoutStopping />} />
      <Route path="/new-experiments/blind-then-witness" element={<StyledBlindThenWitness />} />
      <Route path="/new-experiments/visible-corrections" element={<StyledVisibleCorrections />} />
      <Route path="/new-experiments/off-the-grid" element={<StyledOffTheGrid />} />
      <Route path="/new-experiments/in-a-spiral" element={<StyledInASpiral />} />

      {/* ── Experimental layouts ── */}
      <Route path="/playgroundcodex" element={<PlaygroundCodex />} />
      <Route path="/playgroundcodex/my-tools" element={<PlaygroundCodexMyTools />} />
      <Route path="/playgroundcodex2" element={<PlaygroundCodex2 />} />
      <Route path="/playgroundcodex2/my-tools" element={<PlaygroundCodex2MyTools />} />

      {/* ── Redirects for old URLs ── */}
      <Route path="/playground" element={<Navigate to="/tool-collection" replace />} />
      <Route path="/playgroundnew" element={<Navigate to="/tool-collection" replace />} />
      <Route path="/playgroundnew1" element={<Navigate to="/tool-collection" replace />} />
      <Route path="/new" element={<SearchRedirect to="/create-tool" />} />
      <Route path="/parametrisches-tool" element={<SearchRedirect to="/write" />} />
      <Route path="/dont-stop-writing" element={<Navigate to="/without-stopping" replace />} />
      <Route path="/anonymously-in-public" element={<Navigate to="/blind-then-witness" replace />} />
      <Route path="/loschen-korrigieren" element={<Navigate to="/visible-corrections" replace />} />
      <Route path="/aboutnew" element={<Navigate to="/about-the-project" replace />} />
    </Routes>
  );
}
