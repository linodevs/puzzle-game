import { useEffect, useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:4000";

function authHeader(user, pass) {
  const token = btoa(`${user}:${pass}`);
  return { Authorization: `Basic ${token}` };
}

export default function AdminDashboard() {
  const [credentials, setCredentials] = useState({ user: "", pass: "" });
  const [form, setForm] = useState({
    name: "",
    secret_message: "",
    puzzle_pieces: "12",
    photo: null,
  });
  const [customers, setCustomers] = useState([]);
  const [status, setStatus] = useState({ loading: false, error: "", success: "" });

  const isAuthed = useMemo(
    () => credentials.user.trim() && credentials.pass.trim(),
    [credentials]
  );

  const loadCustomers = async () => {
    if (!isAuthed) return;
    setStatus((prev) => ({ ...prev, loading: true, error: "" }));
    try {
      const res = await fetch(`${API_BASE}/api/admin/customers`, {
        headers: {
          ...authHeader(credentials.user, credentials.pass),
        },
      });
      if (!res.ok) throw new Error("Müştəriləri yükləmək alınmadı");
      const data = await res.json();
      setCustomers(data);
      setStatus((prev) => ({ ...prev, loading: false }));
    } catch (err) {
      setStatus((prev) => ({
        ...prev,
        loading: false,
        error: err.message || "Müştəriləri yükləmək alınmadı",
      }));
    }
  };

  useEffect(() => {
    if (isAuthed) loadCustomers();
  }, [isAuthed]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthed) {
      setStatus((prev) => ({ ...prev, error: "Əvvəlcə admin məlumatlarını daxil et." }));
      return;
    }

    if (!form.name || !form.photo) {
      setStatus((prev) => ({ ...prev, error: "Ad və şəkil mütləqdir." }));
      return;
    }

    const payload = new FormData();
    payload.append("name", form.name);
    payload.append("secret_message", form.secret_message);
    payload.append("puzzle_pieces", form.puzzle_pieces);
    payload.append("photo", form.photo);

    setStatus({ loading: true, error: "", success: "" });
    try {
      const res = await fetch(`${API_BASE}/api/admin/customers`, {
        method: "POST",
        headers: {
          ...authHeader(credentials.user, credentials.pass),
        },
        body: payload,
      });
      if (!res.ok) throw new Error("Müştəri yaratmaq alınmadı");
      const data = await res.json();
      setStatus({ loading: false, error: "", success: "Müştəri yaradıldı." });
      setForm({ name: "", secret_message: "", puzzle_pieces: "12", photo: null });
      setCustomers((prev) => [data, ...prev]);
    } catch (err) {
      setStatus({ loading: false, error: err.message || "Yadda saxlamaq alınmadı", success: "" });
    }
  };

  return (
    <div className="page-shell">
      <div className="card-panel">
        <h2>Admin Paneli</h2>
        <p>Müştəri pazllarını yarat və Valentin sürprizlərini idarə et.</p>

        <div className="grid-two">
          <div className="field">
            <label>Admin İstifadəçi Adı</label>
            <input
              className="text-input"
              value={credentials.user}
              onChange={(e) => setCredentials({ ...credentials, user: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Admin Şifrəsi</label>
            <input
              className="text-input"
              type="password"
              value={credentials.pass}
              onChange={(e) => setCredentials({ ...credentials, pass: e.target.value })}
            />
          </div>
        </div>
        <button className="button button-primary" type="button" onClick={loadCustomers}>
          Müştəriləri Yüklə
        </button>
      </div>

      <div className="card-panel">
        <h3>Pazl Yarat</h3>
        <form className="form-stack" onSubmit={handleSubmit}>
          <div className="field">
            <label>Müştəri Adı</label>
            <input
              className="text-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Gizli Təbrik Mesajınız</label>
            <textarea
              className="text-input"
              rows="3"
              value={form.secret_message}
              onChange={(e) => setForm({ ...form, secret_message: e.target.value })}
              placeholder="Mesajınızı bura yazın..."
            />
          </div>
          <div className="field">
            <label>Pazl Parçaları</label>
            <select
              className="text-input"
              value={form.puzzle_pieces}
              onChange={(e) => setForm({ ...form, puzzle_pieces: e.target.value })}
            >
              <option value="12">12</option>
              <option value="24">24</option>
              <option value="48">48</option>
            </select>
          </div>
          <div className="field">
            <label>Şəkil Yüklə</label>
            <input
              className="text-input"
              type="file"
              accept="image/*"
              onChange={(e) => setForm({ ...form, photo: e.target.files?.[0] || null })}
            />
          </div>
          <button className="button button-primary" type="submit" disabled={status.loading}>
            {status.loading ? "Yadda saxlanılır..." : "Pazl Yarat"}
          </button>
          {status.error && <div className="error-text">{status.error}</div>}
          {status.success && <div className="success-text">{status.success}</div>}
        </form>
      </div>

      <div className="card-panel">
        <h3>Müştərilər</h3>
        <div className="table">
          <div className="table-row table-head">
            <span>Ad</span>
            <span>Parçalar</span>
            <span>Vəziyyət</span>
            <span>Kod</span>
          </div>
          {customers.map((customer) => (
            <div className="table-row" key={customer._id}>
              <span>{customer.name}</span>
              <span>{customer.puzzle_pieces}</span>
              <span>{customer.is_completed ? "Tamamlandı" : "Gözləyir"}</span>
              <span>{customer.slug}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
