import React, { useMemo, useRef, useState } from "react";
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

/* =========================
   Piece Component
========================= */

function JigsawPiece({ imgObj, piece, onDragEnd }) {
  const { x, y, w, h, crop, locked, edges } = piece;

  return (
    <Group
      x={x}
      y={y}
      draggable={!locked}
      onDragEnd={onDragEnd}
      listening={!locked}
      clipFunc={(ctx) => drawJigsawPath(ctx, w, h, edges)}
    >
      <KonvaImage image={imgObj} x={0} y={0} width={w} height={h} crop={crop} />

      <Shape
        sceneFunc={(ctx, shape) => {
          drawJigsawPath(ctx, w, h, edges);
          ctx.strokeStyle = "#bdbdbd";
          ctx.lineWidth = 1;
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

export default function PuzzleGame() {
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

  // Puzzle grid
  const gridCols = 4;
  const gridRows = 4;

  const [imgObj, setImgObj] = useState(null);
  const [pieces, setPieces] = useState([]);
  const [completed, setCompleted] = useState(false);

  const snapThreshold = 22; // dişli olanda bir az artırmaq yaxşı olur

  const stageRef = useRef(null);

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
  }, [imgObj]);

  async function onFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setCompleted(false);

    const url = URL.createObjectURL(file);
    const image = await loadHtmlImage(url);
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

    // Tray-də random səp
    const scattered = shuffle(newPieces).map((p) => {
      const margin = 12;
      const x = TRAY_X + margin + Math.random() * (TRAY_W - p.w - margin * 2);
      const y = TRAY_Y + margin + Math.random() * (TRAY_H - p.h - margin * 2);
      return { ...p, x, y, locked: false };
    });

    setPieces(scattered);
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

  return (
    <div style={{ padding: 16, fontFamily: "system-ui" }}>
      <h2 style={{ marginBottom: 8 }}>Jigsaw Puzzle (React + Konva)</h2>

      <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
        <input type="file" accept="image/*" onChange={onFileChange} />
        {completed && <div style={{ fontWeight: 700 }}>✅ Completed!</div>}
      </div>

      <div style={{ marginTop: 12, border: "1px solid #ddd", width: STAGE_W }}>
        <Stage width={STAGE_W} height={STAGE_H} ref={stageRef}>
          <Layer>
            {/* Board outline */}
            <Rect
              x={BOARD_X}
              y={BOARD_Y}
              width={BOARD_SIZE}
              height={BOARD_SIZE}
              stroke="#bdbdbd"
              strokeWidth={2}
              cornerRadius={10}
            />

            {/* Tray outline */}
            <Rect
              x={TRAY_X}
              y={TRAY_Y}
              width={TRAY_W}
              height={TRAY_H}
              stroke="#bdbdbd"
              strokeWidth={2}
              cornerRadius={10}
            />

            {/* grid xətləri (optional) */}
            {gridLines}

            {/* Pieces */}
            {imgObj &&
              pieces.map((p) => (
                <JigsawPiece
                  key={p.id}
                  imgObj={imgObj}
                  piece={p}
                  onDragEnd={(e) => onDragEnd(p.id, e)}
                />
              ))}
          </Layer>
        </Stage>
      </div>

      <div style={{ marginTop: 10, color: "#444" }}>
        <div>
          <b>Qeyd:</b> Bu “dişli” forma clipFunc ilə verilir. Daha real görünüş üçün
          növbəti addımda “shadow”, “hover”, və board-un da “puzzle outline” formasını
          edə bilərik.
        </div>
      </div>
    </div>
  );
}
