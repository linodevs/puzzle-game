import { useMemo, useState } from "react";
import PuzzleGame from "./PuzzleGame";

function generateId() {
  const token = Math.floor(10000 + Math.random() * 90000);
  return `love-${token}`;
}

function generateThemeData(theme) {
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 800;
  const ctx = canvas.getContext("2d");

  const gradients = {
    blush: ["#fff0f4", "#ffb6c1"],
    sunset: ["#ffe2b9", "#ff8fab"],
    rose: ["#ffe5ec", "#b22222"],
  };
  const [c1, c2] = gradients[theme] || gradients.blush;
  const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, c1);
  gradient.addColorStop(1, c2);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255,255,255,0.35)";
  for (let i = 0; i < 18; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = 30 + Math.random() * 50;
    drawHeart(ctx, x, y, size);
  }

  return canvas.toDataURL("image/png");
}

function drawHeart(ctx, x, y, size) {
  const topCurveHeight = size * 0.3;
  ctx.beginPath();
  ctx.moveTo(x, y + topCurveHeight);
  ctx.bezierCurveTo(
    x,
    y,
    x - size / 2,
    y,
    x - size / 2,
    y + topCurveHeight
  );
  ctx.bezierCurveTo(
    x - size / 2,
    y + (size + topCurveHeight) / 2,
    x,
    y + (size + topCurveHeight) / 2,
    x,
    y + size
  );
  ctx.bezierCurveTo(
    x,
    y + (size + topCurveHeight) / 2,
    x + size / 2,
    y + (size + topCurveHeight) / 2,
    x + size / 2,
    y + topCurveHeight
  );
  ctx.bezierCurveTo(
    x + size / 2,
    y,
    x,
    y,
    x,
    y + topCurveHeight
  );
  ctx.closePath();
  ctx.fill();
}

export default function CreatePage() {
  const [form, setForm] = useState({
    name: "",
    secretMessage: "",
    puzzlePieces: "12",
    theme: "blush",
    imageFile: null,
    imagePreview: "",
  });
  const [giftId, setGiftId] = useState("");
  const [toast, setToast] = useState("");

  const themePreview = useMemo(() => generateThemeData(form.theme), [form.theme]);
  const previewUrl = form.imagePreview || themePreview;

  const giftUrl = useMemo(() => {
    if (!giftId) return "";
    return `${window.location.origin}/game/${giftId}`;
  }, [giftId]);

  const handleFile = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () =>
      setForm((prev) => ({ ...prev, imageFile: file, imagePreview: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleGenerate = () => {
    const id = generateId();
    const imageUrl = previewUrl;

    const record = {
      id,
      name: form.name.trim(),
      secretMessage: form.secretMessage.trim(),
      puzzlePieces: Number(form.puzzlePieces) || 12,
      imageUrl,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(`puzzleGift:${id}`, JSON.stringify(record));
    setGiftId(id);
    setToast("Hədiyyə linki yaradıldı!");
    setTimeout(() => setToast(""), 2400);
  };

  const copyLink = async () => {
    if (!giftUrl) return;
    try {
      await navigator.clipboard.writeText(giftUrl);
      setToast("Link kopyalandı!");
    } catch {
      setToast("Kopyalama alınmadı. Linki əl ilə seçin.");
    }
    setTimeout(() => setToast(""), 2400);
  };

  return (
    <div className="page-shell">
      <div className="card-panel dashboard">
        <div className="dashboard-head">
          <div>
            <p className="eyebrow">Yaradıcı Studiyası</p>
            <h2>Valentin Pazlını Yarat</h2>
            <p className="muted">
              Şəkil yüklə və ya tema seç, sonra özəl hədiyyə linkini yarat.
            </p>
          </div>
          <button className="button button-primary" onClick={handleGenerate} type="button">
            Hədiyyə Linkini Yarat
          </button>
        </div>

        <div className="grid-two">
          <div className="field">
            <label>Alıcının Adı</label>
            <input
              className="text-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="məs. Aylin"
            />
          </div>
          <div className="field">
            <label>Pazl Parçaları</label>
            <select
              className="text-input"
              value={form.puzzlePieces}
              onChange={(e) => setForm({ ...form, puzzlePieces: e.target.value })}
            >
              <option value="12">12</option>
              <option value="24">24</option>
              <option value="48">48</option>
            </select>
          </div>
          <div className="field">
            <label>Gizli Təbrik Mesajınız</label>
            <textarea
              className="text-input"
              rows="3"
              value={form.secretMessage}
              onChange={(e) => setForm({ ...form, secretMessage: e.target.value })}
              placeholder="Mesajınızı bura yazın..."
            />
          </div>
          <div className="field">
            <label>Tema (ixtiyari)</label>
            <select
              className="text-input"
              value={form.theme}
              onChange={(e) => setForm({ ...form, theme: e.target.value })}
            >
              <option value="blush">Zərif Çəhrayı Parıltı</option>
              <option value="sunset">Günbatımı Qızılgülü</option>
              <option value="rose">Al Qızılgül</option>
            </select>
          </div>
        </div>

        <div className="grid-two">
          <div className="field">
            <label>Şəkil Yüklə</label>
            <input
              className="text-input"
              type="file"
              accept="image/*"
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </div>
          <div className="preview-box">
            {previewUrl ? (
              <img src={previewUrl} alt="Ön baxış" />
            ) : (
              <span>Hələ şəkil yüklənməyib.</span>
            )}
          </div>
        </div>

        {giftUrl && (
          <div className="link-box">
            <div>
              <p className="muted">Bu hədiyyə linkini paylaş</p>
              <div className="link-url">{giftUrl}</div>
            </div>
            <button className="button button-primary" onClick={copyLink} type="button">
              Linki Kopyala
            </button>
          </div>
        )}
      </div>

      <div className="card-panel">
        <h3>Ön Baxış</h3>
        <PuzzleGame
          puzzleConfig={{
            id: "preview",
            name: form.name,
            imageUrl: previewUrl,
            puzzlePieces: Number(form.puzzlePieces) || 12,
            secretMessage: form.secretMessage,
          }}
          showUploader={false}
        />
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
