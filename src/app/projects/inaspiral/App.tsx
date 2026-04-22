import { SpiralText } from "./components/SpiralText";

export default function App() {
  return (
    <div
      className="size-full flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: "radial-gradient(ellipse at center 60%, #12121a 0%, #08080e 70%, #050508 100%)",
      }}
    >
      <div className="w-full h-full relative">
        <SpiralText />
        <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none">
          <p
            className="text-xs tracking-widest uppercase opacity-25"
            style={{ color: "#b0a890", letterSpacing: "0.25em" }}
          >
            Klicke und schreibe
          </p>
        </div>
      </div>
    </div>
  );
}
