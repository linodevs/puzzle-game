const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const Datastore = require("nedb");

require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 4000;

const uploadDir = path.join(__dirname, "..", "uploads");
const dataDir = path.join(__dirname, "data");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Datastore({
  filename: path.join(dataDir, "customers.db"),
  autoload: true,
});

db.ensureIndex({ fieldName: "slug", unique: true });

app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(uploadDir));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").toLowerCase();
    const safeBase = (file.originalname || "upload")
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9-_]/g, "")
      .toLowerCase()
      .slice(0, 40);
    const token = crypto.randomBytes(6).toString("hex");
    cb(null, `${Date.now()}-${safeBase}-${token}${ext || ".jpg"}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 6 * 1024 * 1024 },
});

function slugify(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

function generateSlug(name) {
  const base = slugify(name) || "customer";
  const suffix = crypto.randomBytes(2).toString("hex");
  return `${base}-${suffix}`;
}

function requireAdmin(req, res, next) {
  const auth = req.headers.authorization || "";
  if (!auth.startsWith("Basic ")) {
    res.set("WWW-Authenticate", 'Basic realm="Admin"');
    return res.status(401).json({ error: "Authentication required" });
  }

  const creds = Buffer.from(auth.replace("Basic ", ""), "base64")
    .toString("utf8")
    .split(":");
  const user = creds[0] || "";
  const pass = creds[1] || "";

  if (!process.env.ADMIN_USER || !process.env.ADMIN_PASS) {
    return res.status(500).json({ error: "Admin credentials not configured" });
  }

  if (user !== process.env.ADMIN_USER || pass !== process.env.ADMIN_PASS) {
    return res.status(403).json({ error: "Invalid credentials" });
  }

  return next();
}

app.post(
  "/api/admin/customers",
  requireAdmin,
  upload.single("photo"),
  (req, res) => {
    const { name, secret_message, puzzle_pieces } = req.body;
    const pieces = Number.parseInt(puzzle_pieces, 10) || 12;

    if (!name || !req.file) {
      return res.status(400).json({ error: "Name and photo are required" });
    }

    const slug = generateSlug(name);
    const record = {
      name,
      photo_url: `/uploads/${req.file.filename}`,
      secret_message: secret_message || "",
      puzzle_pieces: pieces,
      slug,
      is_completed: false,
      created_at: new Date().toISOString(),
    };

    db.insert(record, (err, doc) => {
      if (err) {
        return res.status(500).json({ error: "Failed to save customer" });
      }
      return res.json(doc);
    });
  }
);

app.get("/api/admin/customers", requireAdmin, (_req, res) => {
  db.find({})
    .sort({ created_at: -1 })
    .exec((err, docs) => {
      if (err) {
        return res.status(500).json({ error: "Failed to fetch customers" });
      }
      return res.json(docs);
    });
});

app.get("/api/puzzle/:slug", (req, res) => {
  db.findOne({ slug: req.params.slug }, (err, doc) => {
    if (err) {
      return res.status(500).json({ error: "Failed to fetch puzzle" });
    }
    if (!doc) {
      return res.status(404).json({ error: "Puzzle not found" });
    }
    return res.json(doc);
  });
});

app.post("/api/puzzle/complete/:id", (req, res) => {
  db.update(
    { _id: req.params.id },
    { $set: { is_completed: true, completed_at: new Date().toISOString() } },
    { returnUpdatedDocs: true },
    (err, _num, doc) => {
      if (err) {
        return res.status(500).json({ error: "Failed to update puzzle" });
      }
      if (!doc) {
        return res.status(404).json({ error: "Puzzle not found" });
      }
      return res.json(doc);
    }
  );
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend running on http://localhost:${PORT}`);
});
