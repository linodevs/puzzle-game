import { useEffect, useMemo, useState } from "react";
import PuzzleGame from "./PuzzleGame";

function getIdFromUrl() {
  const path = window.location.pathname;
  if (path.startsWith("/game/")) {
    return path.replace("/game/", "").split("/")[0];
  }
  const params = new URLSearchParams(window.location.search);
  return params.get("id") || "";
}

export default function GamePage() {
  const [giftId] = useState(() => getIdFromUrl());
  const [gift, setGift] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!giftId) {
      setError("Missing gift link.");
      return;
    }

    const stored = localStorage.getItem(`puzzleGift:${giftId}`);
    if (!stored) {
      setError("Gift link not found.");
      return;
    }
    try {
      setGift(JSON.parse(stored));
    } catch {
      setError("Gift link is corrupted.");
    }
  }, [giftId]);

  const puzzleConfig = useMemo(() => {
    if (!gift) return null;
    return {
      id: gift.id,
      name: gift.name,
      imageUrl: gift.imageUrl,
      puzzlePieces: gift.puzzlePieces,
      secretMessage: gift.secretMessage,
    };
  }, [gift]);

  if (error) {
    return (
      <div className="page-shell">
        <div className="card-panel">
          <h2>Unable to open puzzle</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!puzzleConfig) {
    return (
      <div className="page-shell">
        <div className="card-panel">Loading your puzzle...</div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <PuzzleGame puzzleConfig={puzzleConfig} showUploader={false} />
    </div>
  );
}
