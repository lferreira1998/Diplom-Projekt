import { Routes, Route, Navigate } from "react-router";
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

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/playground" replace />} />
      <Route path="/one-word-replay" element={<OneWordReplay />} />
      <Route path="/dont-stop-writing" element={<DontStopWriting />} />
      <Route path="/uninvited-thoughts" element={<UninvitedThoughts />} />
      <Route path="/loschen-korrigieren" element={<LoschenKorrigieren />} />
      <Route path="/drifting-following-words" element={<DriftingFollowingWords />} />
      <Route path="/drifting-disappearing-words" element={<DriftingDisappearingWords />} />
      <Route path="/parametrisches-tool" element={<ParametrischesTool />} />
      <Route path="/anonymously-in-public" element={<AnonymouslyInPublic />} />
      <Route path="/visual-timer" element={<VisualTimer />} />
      <Route path="/off-the-grid" element={<OffTheGrid />} />
      <Route path="/in-a-spiral" element={<InASpiral />} />
      <Route path="/randomly-spatially" element={<RandomlySpatially />} />
      <Route path="/new-experiments/uninvited-thoughts" element={<StyledUninvitedThoughts />} />
      <Route path="/new-experiments/without-stopping" element={<StyledWithoutStopping />} />
      <Route path="/new-experiments/blind-then-witness" element={<StyledBlindThenWitness />} />
      <Route path="/new-experiments/visible-corrections" element={<StyledVisibleCorrections />} />
      <Route path="/new-experiments/off-the-grid" element={<StyledOffTheGrid />} />
      <Route path="/new-experiments/in-a-spiral" element={<StyledInASpiral />} />
      <Route path="/about-the-project" element={<AboutNew />} />
      <Route path="/aboutnew" element={<AboutNew />} />
      <Route path="/all-tools" element={<AllTools />} />
      <Route path="/playground" element={<PlaygroundNewScrollDots />} />
      <Route path="/my-tools" element={<MyToolsPage />} />
      <Route path="/playgroundnew" element={<PlaygroundNewScrollDots />} />
      <Route path="/playgroundnew1" element={<PlaygroundNewScrollDots />} />
      <Route path="/playgroundcodex" element={<PlaygroundCodex />} />
      <Route path="/playgroundcodex/my-tools" element={<PlaygroundCodexMyTools />} />
      <Route path="/playgroundcodex2" element={<PlaygroundCodex2 />} />
      <Route path="/playgroundcodex2/my-tools" element={<PlaygroundCodex2MyTools />} />
      <Route path="/new" element={<New />} />
    </Routes>
  );
}
