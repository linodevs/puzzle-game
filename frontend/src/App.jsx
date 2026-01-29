import "./App.css";
import CreatePage from "./CreatePage";
import GamePage from "./GamePage";

export default function App() {
  const path = window.location.pathname;

  if (path.startsWith("/create")) {
    return <CreatePage />;
  }

  if (path.startsWith("/game/") || path.includes("id=")) {
    return <GamePage />;
  }

  return (
    <div className="page-shell">
      <div className="card-panel">
        <h2>Welcome</h2>
        <p>Choose your path to start the Valentine puzzle experience.</p>
        <div className="field-row">
          <a className="button button-primary" href="/create">
            Create a Gift
          </a>
          <a className="button button-primary" href="/game/love-12345">
            Open Puzzle
          </a>
        </div>
      </div>
    </div>
  );
}
