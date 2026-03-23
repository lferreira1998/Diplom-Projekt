import { Routes, Route } from "react-router";
import Overview from "./Overview";
import OneWordReplay from "./OneWordReplay";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Overview />} />
      <Route path="/one-word-replay" element={<OneWordReplay />} />
    </Routes>
  );
}
