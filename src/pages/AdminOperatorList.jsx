// src/pages/AdminOperatorList.jsx
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";
import apiClient from "../api";

const FREQS = ["Daily", "Weekly", "Monthly", "On Demand"];

/* ---------- safe access helpers (handle multiple shapes) ---------- */
const getMobile = (op) => op?.mobile || op?.operatorProfile?.contactNumber || "—";
const getBusiness = (op) => op?.operatorProfile?.businessName || "—";
const getAddress = (op) => op?.operatorProfile?.address || "—";

// Payout / bank details may be flat or inside operatorProfile.payoutMethod
const getBankName = (op) =>
  op?.operatorProfile?.bankName ||
  op?.operatorProfile?.payoutMethod?.bankName ||
  "—";

const getBankBranch = (op) =>
  op?.operatorProfile?.bankBranch ||
  op?.operatorProfile?.payoutMethod?.bankBranch || // if your backend uses this
  "—";

const getAccountNo = (op) =>
  op?.operatorProfile?.bankAccountNumber ||
  op?.operatorProfile?.payoutMethod?.accountNumber ||
  "—";

const getPayoutFreq = (op) =>
  op?.operatorProfile?.payoutFrequency ||
  op?.operatorProfile?.payoutMethod?.payoutFrequency ||
  "—";

export default function AdminOperatorList() {
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  // modal state
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    mobile: "",
    active: true,
    operatorProfile: {
      businessName: "",
      address: "",
      bankName: "",
      bankBranch: "",
      bankAccountNumber: "",
      payoutFrequency: "Monthly",
      // keep a mirror of payoutMethod for compatibility
      payoutMethod: {
        bankName: "",
        bankBranch: "",
        accountNumber: "",
        payoutFrequency: "Monthly",
      },
      contactNumber: "",
    },
  });

  /* load operators */
  useEffect(() => {
    (async () => {
      try {
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

  /* helpers */
  const authHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  /* include fallback fields in search text */
  const filtered = operators.filter((op) => {
    const haystack = [
      op?.fullName,
      op?.email,
      getMobile(op),
      getBusiness(op),
      getAddress(op),
      getBankName(op),
      getBankBranch(op),
      getAccountNo(op),
      getPayoutFreq(op),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  const openEdit = (op) => {
    const profile = op?.operatorProfile || {};
    const pm = profile?.payoutMethod || {};

    setSelected(op);
    setForm({
      fullName: op.fullName || "",
      email: op.email || "",
      // prefer top-level mobile, fallback to profile contactNumber
      mobile: op.mobile || profile.contactNumber || "",
      active: !!op.active,
      operatorProfile: {
        businessName: profile.businessName || "",
        address: profile.address || "",
        // flat fields
        bankName: profile.bankName || pm.bankName || "",
        bankBranch: profile.bankBranch || pm.bankBranch || "",
        bankAccountNumber: profile.bankAccountNumber || pm.accountNumber || "",
        payoutFrequency: profile.payoutFrequency || pm.payoutFrequency || "Monthly",
        // also keep contactNumber
        contactNumber: profile.contactNumber || op.mobile || "",
        // mirror payoutMethod for compatibility
        payoutMethod: {
          bankName: pm.bankName || profile.bankName || "",
          bankBranch: pm.bankBranch || profile.bankBranch || "",
          accountNumber: pm.accountNumber || profile.bankAccountNumber || "",
          payoutFrequency: pm.payoutFrequency || profile.payoutFrequency || "Monthly",
        },
      },
    });
    setOpen(true);
  };

  const closeEdit = () => {
    setOpen(false);
    setSelected(null);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // operatorProfile.payoutMethod.*
    if (name.startsWith("operatorProfile.payoutMethod.")) {
      const key = name.split(".")[2];
      setForm((f) => ({
        ...f,
        operatorProfile: {
          ...f.operatorProfile,
          payoutMethod: { ...f.operatorProfile.payoutMethod, [key]: value },
        },
      }));
      return;
    }

    // operatorProfile.*
    if (name.startsWith("operatorProfile.")) {
      const key = name.split(".")[1];
      setForm((f) => ({
        ...f,
        operatorProfile: { ...f.operatorProfile, [key]: value },
      }));
      return;
    }

    // top-level fields
    if (type === "checkbox") {
      setForm((f) => ({ ...f, [name]: checked }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  /* resilient update: try multiple endpoints until one works */
  const tryUpdate = async (id, payload) => {
    const tries = [
      { method: "patch", url: `/admin/operators/${id}` },
      { method: "put",   url: `/admin/operators/${id}` },
      { method: "patch", url: `/admin/operators/update/${id}` },
      { method: "put",   url: `/admin/operators/update/${id}` },

      { method: "patch", url: `/admin/users/${id}` },
      { method: "put",   url: `/admin/users/${id}` },

      { method: "patch", url: `/admin/operators/${id}/profile` },
      { method: "put",   url: `/admin/operators/${id}/profile` },
    ];

    const errors = [];
    for (const t of tries) {
      try {
        const res = await apiClient[t.method](t.url, payload, authHeader());
        return res;
      } catch (err) {
        errors.push(`${t.method.toUpperCase()} ${t.url}: ${err?.response?.status || "ERR"}`);
      }
    }
    const msg =
      `No admin update endpoint responded (tried ${tries.length}).\n` +
      errors.slice(0, 5).join(" | ") + (errors.length > 5 ? " ..." : "");
    throw new Error(msg);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      // Write to BOTH shapes (flat fields + payoutMethod) so all code paths keep working.
      const p = form.operatorProfile;
      const payload = {
        fullName: form.fullName,
        email: form.email,
        mobile: form.mobile, // keep top-level too
        active: form.active,
        operatorProfile: {
          businessName: p.businessName,
          address: p.address,
          contactNumber: p.contactNumber || form.mobile,

          // flat
          bankName: p.bankName || p.payoutMethod?.bankName || "",
          bankBranch: p.bankBranch || p.payoutMethod?.bankBranch || "",
          bankAccountNumber:
            p.bankAccountNumber || p.payoutMethod?.accountNumber || "",

          payoutFrequency: p.payoutFrequency || p.payoutMethod?.payoutFrequency || "Monthly",

          // nested
          payoutMethod: {
            bankName: p.payoutMethod?.bankName || p.bankName || "",
            bankBranch: p.payoutMethod?.bankBranch || p.bankBranch || "",
            accountNumber:
              p.payoutMethod?.accountNumber || p.bankAccountNumber || "",
            payoutFrequency: p.payoutMethod?.payoutFrequency || p.payoutFrequency || "Monthly",
          },
        },
      };

      await tryUpdate(selected._id, payload);

      // update locally for instant UI feedback
      setOperators((prev) =>
        prev.map((op) => (op._id === selected._id ? { ...op, ...payload } : op))
      );

      toast.success("Operator updated");
      closeEdit();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Update failed");
    } finally {
      setSaving(false);
    }
  };

  /* delete */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this operator?")) return;
    try {
      await apiClient.delete(`/admin/operators/${id}`, authHeader());
      setOperators((prev) => prev.filter((op) => op._id !== id));
      toast.success("Operator deleted");
    } catch (err) {
      console.error("Delete failed", err);
      toast.error("Delete failed");
    }
  };

  /* reset password: try several shapes */
  const resetPassword = async (op) => {
    const newPass = window.prompt(
      `Enter a new password for ${op.fullName || op.email}:`,
      Math.random().toString(36).slice(-10)
    );
    if (!newPass) return;

    const candidates = [
      { method: "post", url: `/admin/operators/${op._id}/reset-password`, body: { password: newPass } },
      { method: "post", url: `/admin/users/${op._id}/reset-password`,     body: { password: newPass } },
      { method: "patch", url: `/admin/operators/${op._id}`, body: { password: newPass } },
      { method: "put",   url: `/admin/operators/${op._id}`, body: { password: newPass } },
      { method: "patch", url: `/admin/users/${op._id}`,     body: { password: newPass } },
      { method: "put",   url: `/admin/users/${op._id}`,     body: { password: newPass } },
    ];

    const errors = [];
    for (const c of candidates) {
      try {
        await apiClient[c.method](c.url, c.body, authHeader());
        toast.success("Password updated");
        return;
      } catch (err) {
        errors.push(`${c.method.toUpperCase()} ${c.url}: ${err?.response?.status || "ERR"}`);
      }
    }
    toast.error("No reset-password endpoint found. Ask backend to enable one.");
    console.warn("Reset password attempts:", errors);
  };

  if (loading) return <p className="p-6">Loading operators…</p>;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">All Operators</h1>

      {/* Search */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <input
          className="border px-3 py-2 rounded w-full sm:w-80"
          placeholder="Search by name, email, mobile, business, addr"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Link
          to="/admin/register-operator"
          className="ml-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          Register New
        </Link>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border rounded shadow-sm text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Email</th>
              <th className="px-3 py-2 text-left">Mobile</th>
              <th className="px-3 py-2 text-left">Active</th>
              <th className="px-3 py-2 text-left">Business</th>
              <th className="px-3 py-2 text-left">Address</th>
              <th className="px-3 py-2 text-left">Bank</th>
              <th className="px-3 py-2 text-left">Branch</th>
              <th className="px-3 py-2 text-left">Account No</th>
              <th className="px-3 py-2 text-left">Payout</th>
              <th className="px-3 py-2 text-left">Created</th>
              <th className="px-3 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((op) => (
              <tr key={op._id} className="border-t hover:bg-gray-50">
                <td className="px-3 py-2">{op.fullName}</td>
                <td className="px-3 py-2">{op.email}</td>
                <td className="px-3 py-2">{getMobile(op)}</td>
                <td className="px-3 py-2">
                  <span
                    className={
                      op.active
                        ? "inline-block px-2 py-0.5 rounded text-xs bg-green-100 text-green-700"
                        : "inline-block px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600"
                    }
                  >
                    {op.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-3 py-2">{getBusiness(op)}</td>
                <td className="px-3 py-2">{getAddress(op)}</td>
                <td className="px-3 py-2">{getBankName(op)}</td>
                <td className="px-3 py-2">{getBankBranch(op)}</td>
                <td className="px-3 py-2">{getAccountNo(op)}</td>
                <td className="px-3 py-2">{getPayoutFreq(op)}</td>
                <td className="px-3 py-2">
                  {op.createdAt
                    ? new Date(op.createdAt).toLocaleDateString()
                    : "—"}
                </td>
                <td className="px-3 py-2 text-center space-x-3">
                  <button
                    className="text-blue-600 hover:underline"
                    onClick={() => openEdit(op)}
                  >
                    Edit
                  </button>
                  <button
                    className="text-amber-600 hover:underline"
                    onClick={() => resetPassword(op)}
                  >
                    Reset Password
                  </button>
                  <Link
                    to={`/operators/${op._id}`}
                    className="text-slate-600 hover:underline"
                  >
                    View
                  </Link>
                  <button
                    className="text-red-600 hover:underline"
                    onClick={() => handleDelete(op._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="12" className="text-center py-6 text-gray-500">
                  No operators match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {open && selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-3xl p-5">
            <h3 className="text-lg font-semibold mb-4">Edit Operator</h3>

            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-600">Full Name</label>
                  <input
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Email</label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Mobile</label>
                  <input
                    name="mobile"
                    value={form.mobile}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div className="flex items-center gap-2 mt-6">
                  <input
                    id="active"
                    type="checkbox"
                    name="active"
                    checked={form.active}
                    onChange={handleChange}
                    className="h-4 w-4"
                  />
                  <label htmlFor="active" className="text-sm">Active</label>
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm text-gray-600">Business</label>
                  <input
                    name="operatorProfile.businessName"
                    value={form.operatorProfile.businessName}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm text-gray-600">Address</label>
                  <input
                    name="operatorProfile.address"
                    value={form.operatorProfile.address}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-600">Bank</label>
                  <input
                    name="operatorProfile.bankName"
                    value={form.operatorProfile.bankName}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Branch</label>
                  <input
                    name="operatorProfile.bankBranch"
                    value={form.operatorProfile.bankBranch}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Account No</label>
                  <input
                    name="operatorProfile.bankAccountNumber"
                    value={form.operatorProfile.bankAccountNumber}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                {/* Also expose nested payoutMethod to keep both shapes aligned */}
                <div>
                  <label className="text-sm text-gray-600">Payout Frequency</label>
                  <select
                    name="operatorProfile.payoutFrequency"
                    value={form.operatorProfile.payoutFrequency}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2"
                  >
                    {FREQS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Mirror: payoutMethod.bankName</label>
                  <input
                    name="operatorProfile.payoutMethod.bankName"
                    value={form.operatorProfile.payoutMethod.bankName}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Mirror: payoutMethod.accountNumber</label>
                  <input
                    name="operatorProfile.payoutMethod.accountNumber"
                    value={form.operatorProfile.payoutMethod.accountNumber}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Mirror: payoutMethod.payoutFrequency</label>
                  <select
                    name="operatorProfile.payoutMethod.payoutFrequency"
                    value={form.operatorProfile.payoutMethod.payoutFrequency}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2 text-sm"
                  >
                    {FREQS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
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
