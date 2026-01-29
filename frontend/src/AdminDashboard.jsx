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
      if (!res.ok) throw new Error("Failed to fetch customers");
      const data = await res.json();
      setCustomers(data);
      setStatus((prev) => ({ ...prev, loading: false }));
    } catch (err) {
      setStatus((prev) => ({
        ...prev,
        loading: false,
        error: err.message || "Failed to load customers",
      }));
    }
  };

  useEffect(() => {
    if (isAuthed) loadCustomers();
  }, [isAuthed]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthed) {
      setStatus((prev) => ({ ...prev, error: "Enter admin credentials first." }));
      return;
    }

    if (!form.name || !form.photo) {
      setStatus((prev) => ({ ...prev, error: "Name and photo are required." }));
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
      if (!res.ok) throw new Error("Failed to create customer");
      const data = await res.json();
      setStatus({ loading: false, error: "", success: "Customer created." });
      setForm({ name: "", secret_message: "", puzzle_pieces: "12", photo: null });
      setCustomers((prev) => [data, ...prev]);
    } catch (err) {
      setStatus({ loading: false, error: err.message || "Save failed", success: "" });
    }
  };

  return (
    <div className="page-shell">
      <div className="card-panel">
        <h2>Admin Dashboard</h2>
        <p>Create customer puzzles and manage Valentine surprises.</p>

        <div className="grid-two">
          <div className="field">
            <label>Admin Username</label>
            <input
              className="text-input"
              value={credentials.user}
              onChange={(e) => setCredentials({ ...credentials, user: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Admin Password</label>
            <input
              className="text-input"
              type="password"
              value={credentials.pass}
              onChange={(e) => setCredentials({ ...credentials, pass: e.target.value })}
            />
          </div>
        </div>
        <button className="button button-primary" type="button" onClick={loadCustomers}>
          Load Customers
        </button>
      </div>

      <div className="card-panel">
        <h3>Create Puzzle</h3>
        <form className="form-stack" onSubmit={handleSubmit}>
          <div className="field">
            <label>Customer Name</label>
            <input
              className="text-input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Secret Message</label>
            <textarea
              className="text-input"
              rows="3"
              value={form.secret_message}
              onChange={(e) => setForm({ ...form, secret_message: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Puzzle Pieces</label>
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
            <label>Photo Upload</label>
            <input
              className="text-input"
              type="file"
              accept="image/*"
              onChange={(e) => setForm({ ...form, photo: e.target.files?.[0] || null })}
            />
          </div>
          <button className="button button-primary" type="submit" disabled={status.loading}>
            {status.loading ? "Saving..." : "Create Puzzle"}
          </button>
          {status.error && <div className="error-text">{status.error}</div>}
          {status.success && <div className="success-text">{status.success}</div>}
        </form>
      </div>

      <div className="card-panel">
        <h3>Customers</h3>
        <div className="table">
          <div className="table-row table-head">
            <span>Name</span>
            <span>Pieces</span>
            <span>Status</span>
            <span>Slug</span>
          </div>
          {customers.map((customer) => (
            <div className="table-row" key={customer._id}>
              <span>{customer.name}</span>
              <span>{customer.puzzle_pieces}</span>
              <span>{customer.is_completed ? "Completed" : "Pending"}</span>
              <span>{customer.slug}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
