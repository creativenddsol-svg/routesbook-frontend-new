// src/pages/AdminOperatorList.jsx
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";
import apiClient from "../api";

const FREQS = ["Daily", "Weekly", "Monthly", "On Demand"];

/* ---------- fallback readers for multiple shapes ---------- */
const readMobile = (op) => op?.mobile || op?.operatorProfile?.contactNumber || "—";
const readBusiness = (op) => op?.operatorProfile?.businessName || "—";
const readAddress = (op) => op?.operatorProfile?.address || "—";

const readBankName = (op) =>
  op?.operatorProfile?.bankName ||
  op?.operatorProfile?.payoutMethod?.bankName ||
  "—";

const readBankBranch = (op) =>
  op?.operatorProfile?.bankBranch ||
  op?.operatorProfile?.payoutMethod?.bankBranch ||
  "—";

const readAccountNo = (op) =>
  op?.operatorProfile?.bankAccountNumber ||
  op?.operatorProfile?.payoutMethod?.accountNumber ||
  "—";

const readPayoutFreq = (op) =>
  op?.operatorProfile?.payoutFrequency ||
  op?.operatorProfile?.payoutMethod?.payoutFrequency ||
  "—";

/* ---------- normalize a profile payload from various endpoints ---------- */
function extractProfile(data) {
  // common shapes
  const raw =
    data?.operatorProfile ||
    data?.profile ||
    (data?.data && (data.data.operatorProfile || data.data.profile)) ||
    // sometimes the whole object itself is the profile
    (data?.businessName || data?.payoutMethod || data?.bankName ? data : null);

  if (!raw) return null;

  const pm = raw.payoutMethod || {};
  return {
    businessName: raw.businessName || "",
    address: raw.address || "",
    contactNumber: raw.contactNumber || "",

    // flat fields
    bankName: raw.bankName || pm.bankName || "",
    bankBranch: raw.bankBranch || pm.bankBranch || "",
    bankAccountNumber: raw.bankAccountNumber || pm.accountNumber || "",
    payoutFrequency: raw.payoutFrequency || pm.payoutFrequency || "Monthly",

    // keep nested too
    payoutMethod: {
      bankName: pm.bankName || raw.bankName || "",
      bankBranch: pm.bankBranch || raw.bankBranch || "",
      accountNumber: pm.accountNumber || raw.bankAccountNumber || "",
      payoutFrequency: pm.payoutFrequency || raw.payoutFrequency || "Monthly",
    },
  };
}

/* try a few profile endpoints and return the first that works */
async function tryFetchProfile(id, authHeader) {
  const tries = [
    { method: "get", url: `/admin/operators/${id}` },
    { method: "get", url: `/admin/operators/${id}/profile` },
    { method: "get", url: `/operators/${id}` },
    { method: "get", url: `/operators/${id}/profile` },
    { method: "get", url: `/admin/users/${id}` },
  ];
  for (const t of tries) {
    try {
      const res = await apiClient[t.method](t.url, authHeader());
      const prof = extractProfile(res.data);
      if (prof) return prof;
    } catch (_) {
      // ignore and try the next one
    }
  }
  return null;
}

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
      payoutMethod: {
        bankName: "",
        bankBranch: "",
        accountNumber: "",
        payoutFrequency: "Monthly",
      },
      contactNumber: "",
    },
  });

  const authHeader = () => ({
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  });

  /* load operators + enrich with profiles */
  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get("/admin/operators", authHeader());
        const base = Array.isArray(res.data) ? res.data : [];

        // Enrich each row with a best-effort profile fetch (runs in parallel)
        const enriched = await Promise.all(
          base.map(async (op) => {
            if (op.operatorProfile && (op.operatorProfile.businessName || op.operatorProfile.payoutMethod)) {
              return op; // already has details
            }
            const prof = await tryFetchProfile(op._id, authHeader);
            return prof ? { ...op, operatorProfile: { ...(op.operatorProfile || {}), ...prof } } : op;
          })
        );

        setOperators(enriched);
      } catch (err) {
        console.error("Failed to load operators", err);
        toast.error("Failed to load operators");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* include fallback fields in search text */
  const filtered = operators.filter((op) => {
    const haystack = [
      op?.fullName,
      op?.email,
      readMobile(op),
      readBusiness(op),
      readAddress(op),
      readBankName(op),
      readBankBranch(op),
      readAccountNo(op),
      readPayoutFreq(op),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  const openEdit = (op) => {
    const p = op?.operatorProfile || {};
    const pm = p?.payoutMethod || {};
    setSelected(op);
    setForm({
      fullName: op.fullName || "",
      email: op.email || "",
      mobile: op.mobile || p.contactNumber || "",
      active: !!op.active,
      operatorProfile: {
        businessName: p.businessName || "",
        address: p.address || "",
        contactNumber: p.contactNumber || op.mobile || "",
        bankName: p.bankName || pm.bankName || "",
        bankBranch: p.bankBranch || pm.bankBranch || "",
        bankAccountNumber: p.bankAccountNumber || pm.accountNumber || "",
        payoutFrequency: p.payoutFrequency || pm.payoutFrequency || "Monthly",
        payoutMethod: {
          bankName: pm.bankName || p.bankName || "",
          bankBranch: pm.bankBranch || p.bankBranch || "",
          accountNumber: pm.accountNumber || p.bankAccountNumber || "",
          payoutFrequency: pm.payoutFrequency || p.payoutFrequency || "Monthly",
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

    if (name.startsWith("operatorProfile.")) {
      const key = name.split(".")[1];
      setForm((f) => ({
        ...f,
        operatorProfile: { ...f.operatorProfile, [key]: value },
      }));
      return;
    }

    if (type === "checkbox") {
      setForm((f) => ({ ...f, [name]: checked }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
  };

  /* resilient update */
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
    throw new Error(
      `No admin update endpoint responded (tried ${tries.length}). ${errors.slice(0, 4).join(" | ")}`
    );
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selected) return;
    setSaving(true);
    try {
      const p = form.operatorProfile;
      const payload = {
        fullName: form.fullName,
        email: form.email,
        mobile: form.mobile,
        active: form.active,
        operatorProfile: {
          businessName: p.businessName,
          address: p.address,
          contactNumber: p.contactNumber || form.mobile,
          bankName: p.bankName || p.payoutMethod?.bankName || "",
          bankBranch: p.bankBranch || p.payoutMethod?.bankBranch || "",
          bankAccountNumber: p.bankAccountNumber || p.payoutMethod?.accountNumber || "",
          payoutFrequency: p.payoutFrequency || p.payoutMethod?.payoutFrequency || "Monthly",
          payoutMethod: {
            bankName: p.payoutMethod?.bankName || p.bankName || "",
            bankBranch: p.payoutMethod?.bankBranch || p.bankBranch || "",
            accountNumber: p.payoutMethod?.accountNumber || p.bankAccountNumber || "",
            payoutFrequency: p.payoutMethod?.payoutFrequency || p.payoutFrequency || "Monthly",
          },
        },
      };

      await tryUpdate(selected._id, payload);

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

    for (const c of candidates) {
      try {
        await apiClient[c.method](c.url, c.body, authHeader());
        toast.success("Password updated");
        return;
      } catch (_) {}
    }
    toast.error("No reset-password endpoint found. Ask backend to enable one.");
  };

  if (loading) return <p className="p-6">Loading operators…</p>;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">All Operators</h1>

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
                <td className="px-3 py-2">{readMobile(op)}</td>
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
                <td className="px-3 py-2">{readBusiness(op)}</td>
                <td className="px-3 py-2">{readAddress(op)}</td>
                <td className="px-3 py-2">{readBankName(op)}</td>
                <td className="px-3 py-2">{readBankBranch(op)}</td>
                <td className="px-3 py-2">{readAccountNo(op)}</td>
                <td className="px-3 py-2">{readPayoutFreq(op)}</td>
                <td className="px-3 py-2">
                  {op.createdAt ? new Date(op.createdAt).toLocaleDateString() : "—"}
                </td>
                <td className="px-3 py-2 text-center space-x-3">
                  <button className="text-blue-600 hover:underline" onClick={() => openEdit(op)}>
                    Edit
                  </button>
                  <button className="text-amber-600 hover:underline" onClick={() => resetPassword(op)}>
                    Reset Password
                  </button>
                  <Link to={`/operators/${op._id}`} className="text-slate-600 hover:underline">
                    View
                  </Link>
                  <button className="text-red-600 hover:underline" onClick={() => handleDelete(op._id)}>
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

      {/* Edit modal */}
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

                {/* Mirrors so both shapes stay aligned */}
                <div>
                  <label className="text-xs text-gray-500 block mb-1">
                    Mirror: payoutMethod.bankName
                  </label>
                  <input
                    name="operatorProfile.payoutMethod.bankName"
                    value={form.operatorProfile.payoutMethod.bankName}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">
                    Mirror: payoutMethod.accountNumber
                  </label>
                  <input
                    name="operatorProfile.payoutMethod.accountNumber"
                    value={form.operatorProfile.payoutMethod.accountNumber}
                    onChange={handleChange}
                    className="w-full border rounded px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">
                    Mirror: payoutMethod.payoutFrequency
                  </label>
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
                <button type="button" onClick={closeEdit} className="px-4 py-2 rounded border">
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
