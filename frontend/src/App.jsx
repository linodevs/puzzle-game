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
        <h2>Xoş Gəldin</h2>
        <p>Valentin pazl macərasına başlamaq üçün yolunu seç.</p>
        <div className="field-row">
          <a className="button button-primary" href="/create">
            Hədiyyə Yarat
          </a>
          <a className="button button-primary" href="/game/sevgi-12345">
            Pazlı Aç
          </a>
        </div>
      </div>
    </div>
  );
}
