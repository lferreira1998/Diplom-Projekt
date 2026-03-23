import { Link } from "react-router";

const projects = [
  { name: "One-Word Replay", path: "/one-word-replay" },
];

export default function Overview() {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-6">
      <div className="w-full max-w-lg">
        <h1
          style={{
            fontFamily: "'Space Grotesk', monospace, sans-serif",
            fontSize: "clamp(1.8rem, 5vw, 3rem)",
            color: "#313642",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            marginBottom: "0.5rem",
          }}
        >
          Diplom Projekte
        </h1>
        <p
          style={{
            fontFamily: "system-ui, sans-serif",
            fontSize: "0.9rem",
            color: "#6B6F7B",
            marginBottom: "3rem",
          }}
        >
          Eine Übersicht aller Projekte
        </p>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {projects.map((project, i) => (
            <li key={i} style={{ borderTop: "1px solid #E2E4EA" }}>
              <Link
                to={project.path}
                style={{
                  display: "block",
                  padding: "1.1rem 0",
                  fontFamily: "system-ui, sans-serif",
                  fontSize: "1rem",
                  color: "#313642",
                  textDecoration: "none",
                  transition: "color 0.15s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#6B6F7B")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#313642")}
              >
                {project.name} →
              </Link>
            </li>
          ))}
          <li style={{ borderTop: "1px solid #E2E4EA", borderBottom: "1px solid #E2E4EA" }} />
        </ul>
      </div>
    </div>
  );
}
