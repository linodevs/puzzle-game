import { useEffect, useMemo, useState } from "react";
import PuzzleGame from "./PuzzleGame";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

function resolveImageUrl(photoUrl) {
  if (!photoUrl) return "";
  if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) {
    return photoUrl;
  }
  return `${API_BASE}${photoUrl}`;
}

export default function PuzzlePage({ slug: slugProp }) {
  const [slugInput, setSlugInput] = useState("");
  const slug = slugProp || slugInput || "";
  const [puzzle, setPuzzle] = useState(null);
  const [status, setStatus] = useState({ loading: false, error: "" });

  useEffect(() => {
    if (!slug) return;
    setStatus({ loading: true, error: "" });
    fetch(`${API_BASE}/api/puzzle/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error("Puzzle not found");
        return res.json();
      })
      .then((data) => {
        setPuzzle(data);
        setStatus({ loading: false, error: "" });
      })
      .catch((err) => {
        setStatus({ loading: false, error: err.message || "Failed to load puzzle" });
      });
  }, [slug]);

  const puzzleConfig = useMemo(() => {
    if (!puzzle) return null;
    return {
      id: puzzle._id,
      name: puzzle.name,
      imageUrl: resolveImageUrl(puzzle.photo_url),
      puzzlePieces: puzzle.puzzle_pieces,
      secretMessage: puzzle.secret_message,
    };
  }, [puzzle]);

  const handleComplete = async (id) => {
    try {
      await fetch(`${API_BASE}/api/puzzle/complete/${id}`, { method: "POST" });
    } catch {
      // no-op
    }
  };

  return (
    <div className="page-shell">
      <div className="card-panel">
        <h2>Open Your Puzzle</h2>
        <p>Paste the unique slug to unlock your Valentine surprise.</p>
        <div className="field-row">
          <input
            className="text-input"
            placeholder="customer-name-xY2z"
            value={slugInput}
            onChange={(e) => setSlugInput(e.target.value.trim())}
          />
          <button
            className="button button-primary"
            onClick={() => setSlugInput(slugInput)}
            type="button"
          >
            Load Puzzle
          </button>
        </div>
        {status.error && <div className="error-text">{status.error}</div>}
      </div>

      {status.loading && <div className="card-panel">Loading puzzle...</div>}
      {puzzleConfig && (
        <PuzzleGame puzzleConfig={puzzleConfig} showUploader={false} onComplete={handleComplete} />
      )}
    </div>
  );
}
