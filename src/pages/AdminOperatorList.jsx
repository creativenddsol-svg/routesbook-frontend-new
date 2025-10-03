// src/pages/AdminOperatorList.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import apiClient from "../api";

const maskAccount = (n = "") => {
  const s = String(n || "");
  if (!s) return "—";
  if (s.length <= 4) return "••••";
  return `••••••••${s.slice(-4)}`;
};

export default function AdminOperatorList() {
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  // modal state
  const [editing, setEditing] = useState(null); // operator object or null
  const [saving, setSaving] = useState(false);
  const emptyForm = {
    fullName: "",
    email: "",
    mobile: "",
    nic: "",
    operatorProfile: {
      businessName: "",
      address: "",
      payoutMethod: {
        bankName: "",
        accountHolder: "",
        accountNumber: "",
        payoutFrequency: "monthly",
      },
    },
    active: true,
  };
  const [form, setForm] = useState(emptyForm);

  // ---------- load ----------
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await apiClient.get("/admin/operators", {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setOperators(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Failed to load operators", err);
        toast.error("Failed to load operators");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ---------- actions ----------
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this operator?")) return;
    try {
      await apiClient.delete(`/admin/operators/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setOperators((prev) => prev.filter((op) => op._id !== id));
      toast.success("Operator deleted");
    } catch (err) {
      console.error("Delete failed", err);
      toast.error("Delete failed");
    }
  };

  const sendResetLink = async (id) => {
    try {
      await apiClient.post(
        `/admin/operators/${id}/send-reset-link`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );
      toast.success("Password reset link sent");
    } catch (e) {
      console.error(e);
      toast.error("Failed to send reset link");
    }
  };

  const openEdit = (op) => {
    setEditing(op);
    setForm({
      fullName: op.fullName || "",
      email: op.email || "",
      mobile: op.mobile || "",
      nic: op.nic || "",
      operatorProfile: {
        businessName: op.operatorProfile?.businessName || "",
        address: op.operatorProfile?.address || "",
        payoutMethod: {
          bankName: op.operatorProfile?.payoutMethod?.bankName || "",
          accountHolder: op.operatorProfile?.payoutMethod?.accountHolder || "",
          accountNumber: op.operatorProfile?.payoutMethod?.accountNumber || "",
          payoutFrequency:
            op.operatorProfile?.payoutMethod?.payoutFrequency || "monthly",
        },
      },
      active: op.active ?? true,
    });
  };

  const closeEdit = () => {
    setEditing(null);
    setForm(emptyForm);
    setSaving(false);
  };

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.startsWith("operatorProfile.")) {
      const [, key] = name.split(".");
      setForm((prev) => ({
        ...prev,
        operatorProfile: { ...prev.operatorProfile, [key]: value },
      }));
      return;
    }

    if (name.startsWith("payoutMethod.")) {
      const [, key] = name.split(".");
      setForm((prev) => ({
        ...prev,
        operatorProfile: {
          ...prev.operatorProfile,
          payoutMethod: { ...prev.operatorProfile.payoutMethod, [key]: value },
        },
      }));
      return;
    }

    if (type === "checkbox") {
      setForm((prev) => ({ ...prev, [name]: checked }));
      return;
    }

    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ---- helper: try multiple endpoints until one works
  const tryUpdateEndpoints = async (id, payloads) => {
    const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };

    // Candidate endpoints & verbs (in order)
    const routes = [
      { method: "put", path: `/admin/operators/${id}` },
      { method: "patch", path: `/admin/operators/${id}` },
      { method: "put", path: `/admin/operators/update/${id}` },
      { method: "patch", path: `/admin/operators/update/${id}` },
      { method: "put", path: `/admin/operator/${id}` },
      { method: "patch", path: `/admin/operator/${id}` },
      { method: "put", path: `/operators/${id}` },
      { method: "patch", path: `/operators/${id}` },
    ];

    let lastErr = null;

    for (const route of routes) {
      for (const body of payloads) {
        try {
          const res = await apiClient[route.method](route.path, body, { headers });
          return res;
        } catch (e) {
          // 404 / 405 / 400 => try next combo
          lastErr = e;
          continue;
        }
      }
    }
    throw lastErr || new Error("No matching update endpoint");
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!editing?._id) return;
    setSaving(true);
    try {
      // Preferred nested payload
      const nestedPayload = { ...form };

      // Fallback flat payload (for older servers)
      const flatPayload = {
        fullName: form.fullName,
        email: form.email,
        mobile: form.mobile,
        nic: form.nic,
        active: form.active,
        businessName: form.operatorProfile?.businessName,
        address: form.operatorProfile?.address,
        bankName: form.operatorProfile?.payoutMethod?.bankName,
        accountHolder: form.operatorProfile?.payoutMethod?.accountHolder,
        accountNumber: form.operatorProfile?.payoutMethod?.accountNumber,
        payoutFrequency: form.operatorProfile?.payoutMethod?.payoutFrequency,
        operatorProfile: { ...form.operatorProfile }, // include both just in case
      };

      // Try nested first, then flat
      await tryUpdateEndpoints(editing._id, [nestedPayload, flatPayload]);

      // update table without refetch
      setOperators((prev) =>
        prev.map((op) => (op._id === editing._id ? { ...op, ...nestedPayload } : op))
      );

      toast.success("Operator updated");
      closeEdit();
    } catch (err) {
      console.error("Update failed", err);
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Update failed (no compatible endpoint)";
      toast.error(msg);
      setSaving(false);
    }
  };

  // ---------- filter ----------
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return operators;
    return operators.filter((op) => {
      const hay = [
        op.fullName,
        op.email,
        op.mobile,
        op.nic,
        op.operatorProfile?.businessName,
        op.operatorProfile?.address,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [operators, query]);

  // ---------- render ----------
  if (loading) return <p className="p-6">Loading operators…</p>;

  return (
    <div className="max-w-[1200px] mx-auto p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold">All Operators</h1>
        <input
          className="border px-3 py-2 rounded w-full sm:w-80"
          placeholder="Search name, email, mobile, business, address…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="overflow-auto border rounded shadow-sm">
        <table className="min-w-[1100px] w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Mobile</th>
              <th className="px-4 py-2 text-left">NIC</th>
              <th className="px-4 py-2 text-left">Business</th>
              <th className="px-4 py-2 text-left">Address</th>
              <th className="px-4 py-2 text-left">Bank</th>
              <th className="px-4 py-2 text-left">Holder</th>
              <th className="px-4 py-2 text-left">Account</th>
              <th className="px-4 py-2 text-left">Frequency</th>
              <th className="px-4 py-2 text-left">Created</th>
              <th className="px-4 py-2 text-center">Status</th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((op) => {
              const prof = op.operatorProfile || {};
              const pay = prof.payoutMethod || {};
              return (
                <tr key={op._id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2">{op.fullName || "—"}</td>
                  <td className="px-4 py-2">{op.email || "—"}</td>
                  <td className="px-4 py-2">{op.mobile || "—"}</td>
                  <td className="px-4 py-2">{op.nic || "—"}</td>
                  <td className="px-4 py-2">{prof.businessName || "—"}</td>
                  <td className="px-4 py-2">{prof.address || "—"}</td>
                  <td className="px-4 py-2">{pay.bankName || "—"}</td>
                  <td className="px-4 py-2">{pay.accountHolder || "—"}</td>
                  <td className="px-4 py-2">{maskAccount(pay.accountNumber)}</td>
                  <td className="px-4 py-2">{pay.payoutFrequency || "—"}</td>
                  <td className="px-4 py-2">
                    {op.createdAt ? new Date(op.createdAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-2 text-center">
                    {op.active ? (
                      <span className="text-green-700 font-medium">Active</span>
                    ) : (
                      <span className="text-gray-500">Inactive</span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-center gap-3">
                      <Link
                        to={`/operators/${op._id}`}
                        className="text-blue-600 hover:underline"
                        title="View public profile"
                      >
                        View
                      </Link>
                      <button
                        onClick={() => openEdit(op)}
                        className="text-gray-800 hover:underline"
                        title="Edit operator"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => sendResetLink(op._id)}
                        className="text-indigo-600 hover:underline"
                        title="Send password reset link"
                      >
                        Reset&nbsp;Password
                      </button>
                      <button
                        onClick={() => handleDelete(op._id)}
                        className="text-red-600 hover:underline"
                        title="Delete operator"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={13} className="text-center py-6 text-gray-500">
                  No operators match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ---------- Edit Modal ---------- */}
      {editing && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">Edit Operator</h2>
              <button
                onClick={closeEdit}
                className="text-gray-500 hover:text-black"
                title="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-5">
              {/* Account */}
              <div>
                <div className="font-semibold mb-2">Account</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    name="fullName"
                    value={form.fullName}
                    onChange={onChange}
                    placeholder="Full Name"
                    className="border rounded px-3 py-2"
                    required
                  />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={onChange}
                    placeholder="Email"
                    className="border rounded px-3 py-2"
                    required
                  />
                  <input
                    name="mobile"
                    value={form.mobile}
                    onChange={onChange}
                    placeholder="Mobile"
                    className="border rounded px-3 py-2"
                  />
                  <input
                    name="nic"
                    value={form.nic}
                    onChange={onChange}
                    placeholder="NIC"
                    className="border rounded px-3 py-2"
                  />
                  <label className="flex items-center gap-2 text-sm mt-1">
                    <input
                      type="checkbox"
                      name="active"
                      checked={!!form.active}
                      onChange={onChange}
                    />
                    Active
                  </label>
                </div>
              </div>

              {/* Business */}
              <div>
                <div className="font-semibold mb-2">Business</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    name="operatorProfile.businessName"
                    value={form.operatorProfile.businessName}
                    onChange={onChange}
                    placeholder="Business Name"
                    className="border rounded px-3 py-2"
                  />
                  <input
                    name="operatorProfile.address"
                    value={form.operatorProfile.address}
                    onChange={onChange}
                    placeholder="Address"
                    className="border rounded px-3 py-2"
                  />
                </div>
              </div>

              {/* Payout / Bank */}
              <div>
                <div className="font-semibold mb-2">Payout / Bank</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    name="payoutMethod.bankName"
                    value={form.operatorProfile.payoutMethod.bankName}
                    onChange={onChange}
                    placeholder="Bank Name"
                    className="border rounded px-3 py-2"
                  />
                  <input
                    name="payoutMethod.accountHolder"
                    value={form.operatorProfile.payoutMethod.accountHolder}
                    onChange={onChange}
                    placeholder="Account Holder"
                    className="border rounded px-3 py-2"
                  />
                  <input
                    name="payoutMethod.accountNumber"
                    value={form.operatorProfile.payoutMethod.accountNumber}
                    onChange={onChange}
                    placeholder="Account Number"
                    className="border rounded px-3 py-2"
                  />
                  <select
                    name="payoutMethod.payoutFrequency"
                    value={form.operatorProfile.payoutMethod.payoutFrequency}
                    onChange={onChange}
                    className="border rounded px-3 py-2"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeEdit}
                  className="px-4 py-2 rounded border"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
