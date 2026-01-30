import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Stage,
  Layer,
  Rect,
  Line,
  Group,
  Shape,
  Image as KonvaImage,
} from "react-konva";

/* =========================
   Helpers
========================= */

function loadHtmlImage(src) {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 0 = düz, +1 = çıxıntı, -1 = girinti
function generateEdges(rows, cols) {
  const edges = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
    }))
  );

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (r === 0) edges[r][c].top = 0;
      if (c === 0) edges[r][c].left = 0;
      if (r === rows - 1) edges[r][c].bottom = 0;
      if (c === cols - 1) edges[r][c].right = 0;

      // right <-> left
      if (c < cols - 1) {
        const v = Math.random() > 0.5 ? 1 : -1;
        edges[r][c].right = v;
        edges[r][c + 1].left = -v;
      }

      // bottom <-> top
      if (r < rows - 1) {
        const v = Math.random() > 0.5 ? 1 : -1;
        edges[r][c].bottom = v;
        edges[r + 1][c].top = -v;
      }
    }
  }

  return edges;
}

function drawJigsawPath(ctx, w, h, e) {
  // e: {top,right,bottom,left} => 0/+1/-1
  const tab = Math.min(w, h) * 0.18; // diş ölçüsü
  const thirdW = w / 3;
  const thirdH = h / 3;

  ctx.beginPath();
  ctx.moveTo(0, 0);

  // TOP: (0,0) -> (w,0)
  if (e.top === 0) {
    ctx.lineTo(w, 0);
  } else {
    ctx.lineTo(thirdW, 0);
    ctx.bezierCurveTo(
      thirdW + tab,
      -e.top * tab,
      2 * thirdW - tab,
      -e.top * tab,
      2 * thirdW,
      0
    );
    ctx.lineTo(w, 0);
  }

  // RIGHT: (w,0) -> (w,h)
  if (e.right === 0) {
    ctx.lineTo(w, h);
  } else {
    ctx.lineTo(w, thirdH);
    ctx.bezierCurveTo(
      w + e.right * tab,
      thirdH + tab,
      w + e.right * tab,
      2 * thirdH - tab,
      w,
      2 * thirdH
    );
    ctx.lineTo(w, h);
  }

  // BOTTOM: (w,h) -> (0,h)
  if (e.bottom === 0) {
    ctx.lineTo(0, h);
  } else {
    ctx.lineTo(2 * thirdW, h);
    ctx.bezierCurveTo(
      2 * thirdW - tab,
      h + e.bottom * tab,
      thirdW + tab,
      h + e.bottom * tab,
      thirdW,
      h
    );
    ctx.lineTo(0, h);
  }

  // LEFT: (0,h) -> (0,0)
  if (e.left === 0) {
    ctx.closePath();
  } else {
    ctx.lineTo(0, 2 * thirdH);
    ctx.bezierCurveTo(
      -e.left * tab,
      2 * thirdH - tab,
      -e.left * tab,
      thirdH + tab,
      0,
      thirdH
    );
    ctx.closePath();
  }
}

function computeGrid(totalPieces) {
  const total = Number.isFinite(totalPieces) ? totalPieces : 16;
  const max = Math.floor(Math.sqrt(total));
  let best = { rows: 4, cols: 4, diff: Infinity };

  for (let r = 1; r <= max; r++) {
    if (total % r === 0) {
      const c = total / r;
      const diff = Math.abs(c - r);
      if (diff < best.diff) {
        best = { rows: r, cols: c, diff };
      }
    }
  }

  if (best.diff === Infinity) {
    const rows = Math.max(2, Math.floor(Math.sqrt(total)));
    const cols = Math.max(2, Math.ceil(total / rows));
    return { rows, cols };
  }

  return { rows: best.rows, cols: best.cols };
}

/* =========================
   Piece Component
========================= */

function JigsawPiece({
  imgObj,
  piece,
  onDragEnd,
  onDragStart,
  onHoverStart,
  onHoverEnd,
  isActive,
}) {
  const { x, y, w, h, crop, locked, edges } = piece;

  return (
    <Group
      x={x}
      y={y}
      scaleX={isActive ? 1.04 : 1}
      scaleY={isActive ? 1.04 : 1}
      draggable={!locked}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      onTap={onHoverStart}
      listening={!locked}
      clipFunc={(ctx) => drawJigsawPath(ctx, w, h, edges)}
    >
      <KonvaImage
        image={imgObj}
        x={0}
        y={0}
        width={w}
        height={h}
        crop={crop}
        perfectDrawEnabled={false}
        shadowColor={isActive ? "rgba(178, 34, 34, 0.5)" : "rgba(0,0,0,0.15)"}
        shadowBlur={isActive ? 16 : 6}
        shadowOffset={{ x: 0, y: 2 }}
        shadowOpacity={1}
      />

      <Shape
        perfectDrawEnabled={false}
        sceneFunc={(ctx, shape) => {
          const showOutline = isActive && !locked;
          drawJigsawPath(ctx, w, h, edges);
          ctx.lineJoin = "round";
          ctx.lineCap = "round";
          ctx.strokeStyle = showOutline ? "#B22222" : "rgba(0,0,0,0)";
          ctx.lineWidth = showOutline ? 2 : 0;
          ctx.stroke();
          ctx.fillStrokeShape(shape);
        }}
      />
    </Group>
  );
}

/* =========================
   Main
========================= */

export default function PuzzleGame({ puzzleConfig, showUploader = true, onComplete }) {
  // Stage
  const STAGE_W = 900;
  const STAGE_H = 600;

  // Board (sol)
  const BOARD_X = 40;
  const BOARD_Y = 40;
  const BOARD_SIZE = 420;

  // Tray (sağ)
  const TRAY_X = 500;
  const TRAY_Y = 40;
  const TRAY_W = STAGE_W - TRAY_X - 40;
  const TRAY_H = STAGE_H - 80;

  const [grid, setGrid] = useState(() => computeGrid(puzzleConfig?.puzzlePieces || 16));
  const gridCols = grid.cols;
  const gridRows = grid.rows;

  const [imgObj, setImgObj] = useState(null);
  const [pieces, setPieces] = useState([]);
  const [completed, setCompleted] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [stageScale, setStageScale] = useState(1);
  const [completionSent, setCompletionSent] = useState(false);

  const snapThreshold = 22; // dişli olanda bir az artırmaq yaxşı olur

  const stageRef = useRef(null);
  const stageWrapRef = useRef(null);

  // board içində şəkli fit etmək üçün hesab
  const boardFit = useMemo(() => {
    if (!imgObj) return null;

    const fitScale = Math.min(BOARD_SIZE / imgObj.width, BOARD_SIZE / imgObj.height);
    const fitW = imgObj.width * fitScale;
    const fitH = imgObj.height * fitScale;

    const innerX = BOARD_X + (BOARD_SIZE - fitW) / 2;
    const innerY = BOARD_Y + (BOARD_SIZE - fitH) / 2;

    const pw = fitW / gridCols;
    const ph = fitH / gridRows;

    return { fitScale, fitW, fitH, innerX, innerY, pw, ph };
  }, [imgObj, gridCols, gridRows]);

  function initPuzzle(image) {
    if (!image) return;
    setCompleted(false);
    setCompletionSent(false);
    setImgObj(image);

    const fitScale = Math.min(BOARD_SIZE / image.width, BOARD_SIZE / image.height);
    const fitW = image.width * fitScale;
    const fitH = image.height * fitScale;

    const innerX = BOARD_X + (BOARD_SIZE - fitW) / 2;
    const innerY = BOARD_Y + (BOARD_SIZE - fitH) / 2;

    const pw = fitW / gridCols;
    const ph = fitH / gridRows;

    const edgeMap = generateEdges(gridRows, gridCols);

    const newPieces = [];
    let id = 0;

    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        const correctX = innerX + c * pw;
        const correctY = innerY + r * ph;

        const cropX = c * (pw / fitScale);
        const cropY = r * (ph / fitScale);
        const cropW = pw / fitScale;
        const cropH = ph / fitScale;

        newPieces.push({
          id: id++,
          r,
          c,
          w: pw,
          h: ph,
          crop: { x: cropX, y: cropY, width: cropW, height: cropH },
          correctPos: { x: correctX, y: correctY },
          x: 0,
          y: 0,
          locked: false,
          edges: edgeMap[r][c],
        });
      }
    }

    const scattered = shuffle(newPieces).map((p) => {
      const margin = 12;
      const x = TRAY_X + margin + Math.random() * (TRAY_W - p.w - margin * 2);
      const y = TRAY_Y + margin + Math.random() * (TRAY_H - p.h - margin * 2);
      return { ...p, x, y, locked: false };
    });

    setPieces(scattered);
  }

  async function onFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const image = await loadHtmlImage(url);
    initPuzzle(image);
  }

  function onDragEnd(pieceId, e) {
    const node = e.target; // Group node
    const x = node.x();
    const y = node.y();

    setPieces((prev) => {
      const next = prev.map((p) => {
        if (p.id !== pieceId) return p;
        if (p.locked) return p;

        const dx = x - p.correctPos.x;
        const dy = y - p.correctPos.y;
        const closeEnough = Math.hypot(dx, dy) < snapThreshold;

        if (closeEnough) {
          return {
            ...p,
            x: p.correctPos.x,
            y: p.correctPos.y,
            locked: true,
          };
        }

        return { ...p, x, y };
      });

      const allLocked = next.length > 0 && next.every((p) => p.locked);
      setCompleted(allLocked);

      return next;
    });
  }

  useEffect(() => {
    if (!puzzleConfig) return;
    const nextGrid = computeGrid(puzzleConfig.puzzlePieces || 16);
    setGrid(nextGrid);
  }, [puzzleConfig]);

  useEffect(() => {
    if (!puzzleConfig?.imageUrl) return;
    loadHtmlImage(puzzleConfig.imageUrl).then(initPuzzle).catch(() => {});
  }, [puzzleConfig?.imageUrl, gridCols, gridRows]);

  useEffect(() => {
    if (!completed || completionSent || !puzzleConfig?.id) return;
    setCompletionSent(true);
    onComplete?.(puzzleConfig.id);
  }, [completed, completionSent, onComplete, puzzleConfig?.id]);

  useEffect(() => {
    const el = stageWrapRef.current;
    if (!el) return undefined;

    const updateScale = () => {
      const maxWidth = el.clientWidth || STAGE_W;
      const nextScale = Math.min(1, maxWidth / STAGE_W);
      setStageScale(nextScale);
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Board grid lines (optional) — istəsən sonradan söndürərik
  const gridLines = [];
  if (boardFit) {
    const { innerX, innerY, fitW, fitH, pw, ph } = boardFit;

    for (let c = 1; c < gridCols; c++) {
      const x = innerX + c * pw;
      gridLines.push(
        <Line
          key={`v-${c}`}
          points={[x, innerY, x, innerY + fitH]}
          stroke="#e0e0e0"
          strokeWidth={1}
        />
      );
    }
    for (let r = 1; r < gridRows; r++) {
      const y = innerY + r * ph;
      gridLines.push(
        <Line
          key={`h-${r}`}
          points={[innerX, y, innerX + fitW, y]}
          stroke="#e0e0e0"
          strokeWidth={1}
        />
      );
    }
  }

  const totalPieces = pieces.length;
  const lockedPieces = pieces.filter((p) => p.locked).length;
  const progress = totalPieces ? lockedPieces / totalPieces : 0;
  const heartSlots = 10;
  const filledHearts = Math.round(progress * heartSlots);
  const secretMessage =
    (puzzleConfig?.secretMessage || "").trim() || "Təbriklər! Qəlbimi fəth etdin!";
  const subMessage = (puzzleConfig?.name || "").trim()
    ? `${puzzleConfig.name} üçün sevgi ilə hazırlanmış pazl.`
    : "Şəkil yüklə, parçaları sürüşdür və qəlblərin necə uyğunlaşdığını izle.";

  return (
    <div className="valentine-shell">
      <div className="bg-hearts" aria-hidden="true">
        <span className="heart-float h1" />
        <span className="heart-float h2" />
        <span className="heart-float h3" />
        <span className="heart-float h4" />
        <span className="heart-float h5" />
        <span className="heart-float h6" />
      </div>

      <header className="valentine-header">
        <div>
          <p className="eyebrow">14 Fevrala Özəl</p>
          <h1>Sevgi ilə Kilidlənmiş Pazl</h1>
          <p className="subtitle">{subMessage}</p>
        </div>

        {showUploader && (
          <div className="controls">
            <input
              id="upload-photo"
              className="file-input"
              type="file"
              accept="image/*"
              onChange={onFileChange}
            />
            <label className="button button-primary" htmlFor="upload-photo">
              Şəkil Seç
            </label>
            {completed && <div className="status-pill">Tamamlandı 💖</div>}
          </div>
        )}
      </header>

      <section className="valentine-body">
        <div className="progress-panel">
          <div className="progress-labels">
            <span>Sevgi Yolun</span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
          <div className="progress-hearts" role="img" aria-label="Pazl irəliləyişi">
            {Array.from({ length: heartSlots }).map((_, i) => (
              <span
                key={`heart-${i}`}
                className={i < filledHearts ? "heart-slot filled" : "heart-slot"}
              >
                ♥
              </span>
            ))}
          </div>
          <div className="progress-caption">
            {completed ? secretMessage : "Sevgini açmaq üçün parçaları uyğunlaşdır."}
          </div>
        </div>

        <div className="game-card">
          <div className="stage-wrap" ref={stageWrapRef}>
            <div
              className="stage-scale"
              style={{
                transform: `scale(${stageScale})`,
                width: STAGE_W * stageScale,
                height: STAGE_H * stageScale,
              }}
            >
              <Stage width={STAGE_W} height={STAGE_H} ref={stageRef}>
                <Layer>
                  <Rect
                    x={BOARD_X - 12}
                    y={BOARD_Y - 12}
                    width={BOARD_SIZE + 24}
                    height={BOARD_SIZE + 24}
                    fill="#fff2f4"
                    cornerRadius={22}
                    shadowColor="rgba(178, 34, 34, 0.15)"
                    shadowBlur={18}
                    shadowOffset={{ x: 0, y: 6 }}
                    shadowOpacity={1}
                  />

                  <Rect
                    x={TRAY_X - 8}
                    y={TRAY_Y - 8}
                    width={TRAY_W + 16}
                    height={TRAY_H + 16}
                    fill="#fff7e8"
                    cornerRadius={22}
                    shadowColor="rgba(178, 34, 34, 0.12)"
                    shadowBlur={16}
                    shadowOffset={{ x: 0, y: 4 }}
                    shadowOpacity={1}
                  />

                  <Rect
                    x={BOARD_X}
                    y={BOARD_Y}
                    width={BOARD_SIZE}
                    height={BOARD_SIZE}
                    fill="#fff8fb"
                    stroke="#d7a6b2"
                    strokeWidth={2}
                    cornerRadius={18}
                  />

                  <Rect
                    x={TRAY_X}
                    y={TRAY_Y}
                    width={TRAY_W}
                    height={TRAY_H}
                    stroke="#d7a6b2"
                    strokeWidth={2}
                    cornerRadius={18}
                  />

                  {gridLines}

                  {imgObj &&
                    pieces.map((p) => (
                      <JigsawPiece
                        key={p.id}
                        imgObj={imgObj}
                        piece={p}
                        isActive={activeId === p.id && !p.locked}
                        onDragStart={() => setActiveId(p.id)}
                        onDragEnd={(e) => {
                          onDragEnd(p.id, e);
                          setActiveId(null);
                        }}
                        onHoverStart={() => setActiveId(p.id)}
                        onHoverEnd={() => setActiveId(null)}
                      />
                    ))}
                </Layer>
              </Stage>
            </div>
          </div>

          <div className="game-footnote">
            <p>
              Parçaları sağdakı sahədən lövhəyə sürüklə. Uyğunluq tapanda yumşaq
              şəkildə yerinə oturur.
            </p>
          </div>

          {completed && (
            <div className="love-explosion" aria-live="polite">
              <div className="love-message">
                <h2>{secretMessage}</h2>
                <p>Sən olanda hər parça yerini tapır.</p>
              </div>
              <div className="confetti">
                {Array.from({ length: 16 }).map((_, i) => (
                  <span key={`confetti-${i}`} className={`confetti-piece c${i + 1}`} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
