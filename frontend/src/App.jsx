import "./App.css";
import AdminDashboard from "./AdminDashboard";
import PuzzleGame from "./PuzzleGame";
import PuzzlePage from "./PuzzlePage";

export default function App() {
  const path = window.location.pathname;

  if (path.startsWith("/admin")) {
    return <AdminDashboard />;
  }

  if (path.startsWith("/p/")) {
    const slug = path.replace("/p/", "").split("/")[0];
    return <PuzzlePage slug={slug} />;
  }

  return (
    <div className="page-shell">
      <div className="card-panel">
        <h2>Welcome</h2>
        <p>Choose your path to start the Valentine puzzle experience.</p>
        <div className="field-row">
          <a className="button button-primary" href="/admin">
            Admin Dashboard
          </a>
          <a className="button button-primary" href="/p/your-slug">
            Open Puzzle
          </a>
        </div>
      </div>
      <PuzzleGame />
    </div>
  );
}
