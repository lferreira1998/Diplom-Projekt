import { Routes, Route } from "react-router";
import Overview from "./Overview";
import OneWordReplay from "./OneWordReplay";
import AboutTheProject from "./projects/abouttheproject/App";
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
import Playground from "./Playground";
import PlaygroundNew from "./PlaygroundNew";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Overview />} />
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
      <Route path="/about-the-project" element={<AboutTheProject />} />
      <Route path="/all-tools" element={<AllTools />} />
      <Route path="/playground" element={<Playground />} />
      <Route path="/playgroundnew" element={<PlaygroundNew />} />
      <Route path="/new" element={<New />} />
    </Routes>
  );
}
