// src/pages/AdminOperatorList.jsx
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";
import apiClient from "../api";

const FREQS = ["Daily", "Weekly", "Monthly", "On Demand"];

/* --------- helpers to read fields from multiple shapes safely --------- */
const r = (x, d = "—") => (x === 0 ? "0" : x ? x : d);
const getProfile = (op) =>
  op?.operatorProfile ||
  op?.profile ||
  (op?.data && (op.data.operatorProfile || op.data.profile)) ||
  {};
const getPayout = (op) => getProfile(op)?.payoutMethod || {};

const readMobile = (op) => r(op?.mobile || getProfile(op)?.contactNumber);
const readBusiness = (op) => r(getProfile(op)?.businessName);
const readAddress = (op) => r(getProfile(op)?.address);
const readBank = (op) => r(getProfile(op)?.bankName || getPayout(op)?.bankName);
const readBranch = (op) =>
  r(getProfile(op)?.bankBranch || getPayout(op)?.bankBranch);
const readAccount = (op) =>
  r(getProfile(op)?.bankAccountNumber || getPayout(op)?.accountNumber);
const readFreq = (op) =>
  r(getProfile(op)?.payoutFrequency || getPayout(op)?.payoutFrequency);

/* --------- component --------- */
export default function AdminOperatorList() {
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  // edit modal
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

  /* --- load once: try rich list first, then fallback --- */
  useEffect(() => {
    (async () => {
      try {
        let list = [];
        // 1) preferred: backend returns operator + profile inline
        try {
          const res = await apiClient.get(
            "/admin/operators?include=profile",
            authHeader()
          );
          list = Array.isArray(res.data) ? res.data : [];
        } catch {
          // 2) fallback: plain list
          const res = await apiClient.get("/admin/operators", authHeader());
          list = Array.isArray(res.data) ? res.data : [];
        }
        setOperators(list);
      } catch (err) {
        console.error("Failed to load operators", err);
        toast.error("Failed to load operators");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* --- search across wide details --- */
  const filtered = operators.filter((op) => {
    const hay =
      (
        [
          op?.fullName,
          op?.email,
          readMobile(op),
          readBusiness(op),
          readAddress(op),
          readBank(op),
          readBranch(op),
          readAccount(op),
          readFreq(op),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase() || ""
      ).includes(query.toLowerCase());
    return hay;
  });

  /* --- edit modal handlers --- */
  const openEdit = (op) => {
    const p = getProfile(op);
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

  const onField = (e) => {
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
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  /* --- resilient update: try a few likely endpoints, no spam --- */
  const tryUpdate = async (id, payload) => {
    const attempts = [
      { method: "patch", url: `/admin/operators/${id}` },
      { method: "put", url: `/admin/operators/${id}` },
      { method: "patch", url: `/admin/operators/update/${id}` },
      { method: "patch", url: `/admin/users/${id}` },
      { method: "put", url: `/admin/users/${id}` },
      { method: "patch", url: `/admin/operators/${id}/profile` },
      { method: "put", url: `/admin/operators/${id}/profile` },
    ];
    for (const a of attempts) {
      try {
        return await apiClient[a.method](a.url, payload, authHeader());
      } catch {
        /* try next */
      }
    }
    throw new Error("No admin update endpoint responded (PUT/PATCH).");
  };

  const onSave = async (e) => {
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
          bankAccountNumber:
            p.bankAccountNumber || p.payoutMethod?.accountNumber || "",
          payoutFrequency:
            p.payoutFrequency || p.payoutMethod?.payoutFrequency || "Monthly",
          payoutMethod: {
            bankName: p.payoutMethod?.bankName || p.bankName || "",
            bankBranch: p.payoutMethod?.bankBranch || p.bankBranch || "",
            accountNumber:
              p.payoutMethod?.accountNumber || p.bankAccountNumber || "",
            payoutFrequency:
              p.payoutMethod?.payoutFrequency || p.payoutFrequency || "Monthly",
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

  const onDelete = async (id) => {
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

  const onResetPassword = async (op) => {
    const newPass = window.prompt(
      `Enter a new password for ${op.fullName || op.email}:`,
      Math.random().toString(36).slice(-10)
    );
    if (!newPass) return;

    const attempts = [
      {
        method: "post",
        url: `/admin/operators/${op._id}/reset-password`,
        body: { password: newPass },
      },
      {
        method: "post",
        url: `/admin/users/${op._id}/reset-password`,
        body: { password: newPass },
      },
      { method: "patch", url: `/admin/operators/${op._id}`, body: { password: newPass } },
      { method: "put", url: `/admin/operators/${op._id}`, body: { password: newPass } },
      { method: "patch", url: `/admin/users/${op._id}`, body: { password: newPass } },
      { method: "put", url: `/admin/users/${op._id}`, body: { password: newPass } },
    ];
    for (const a of attempts) {
      try {
        await apiClient[a.method](a.url, a.body, authHeader());
        toast.success("Password updated");
        return;
      } catch {
        /* try next */
      }
    }
    toast.error("No reset-password endpoint found.");
  };

  if (loading) return <p className="p-6">Loading operators…</p>;

  return (
    <div className="max-w-[1400px] mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">All Operators</h1>

      {/* Search + Create */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <input
          className="border px-4 py-3 rounded w-full sm:w-[520px] text-base"
          placeholder="Search by name, email, mobile, business, address, bank, account…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <Link
          to="/admin/register-operator"
          className="ml-auto bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded text-base"
        >
          Register New
        </Link>
      </div>

      {/* Wide, non-compact table */}
      <div className="overflow-x-auto border rounded-xl bg-white shadow-sm">
        <table className="min-w-[1200px] w-full text-[15px] leading-6">
          <thead className="bg-gray-100">
            <tr className="[&>th]:px-4 [&>th]:py-3 [&>th]:text-left [&>th]:font-semibold">
              <th className="min-w-[200px]">Name</th>
              <th className="min-w-[260px]">Email</th>
              <th className="min-w-[150px]">Mobile</th>
              <th className="min-w-[120px]">Active</th>
              <th className="min-w-[220px]">Business</th>
              <th className="min-w-[320px]">Address</th>
              <th className="min-w-[200px]">Bank</th>
              <th className="min-w-[180px]">Branch</th>
              <th className="min-w-[220px]">Account No</th>
              <th className="min-w-[160px]">Payout</th>
              <th className="min-w-[160px]">Created</th>
              <th className="min-w-[220px] text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="[&>tr>*]:px-4 [&>tr>*]:py-3">
            {filtered.map((op) => (
              <tr key={op._id} className="border-t hover:bg-gray-50">
                <td>{op.fullName}</td>
                <td className="truncate">{op.email}</td>
                <td>{readMobile(op)}</td>
                <td>
                  <span
                    className={
                      op.active
                        ? "inline-block px-2.5 py-1 rounded text-xs bg-green-100 text-green-700"
                        : "inline-block px-2.5 py-1 rounded text-xs bg-gray-100 text-gray-600"
                    }
                  >
                    {op.active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>{readBusiness(op)}</td>
                <td className="truncate">{readAddress(op)}</td>
                <td>{readBank(op)}</td>
                <td>{readBranch(op)}</td>
                <td className="font-medium">{readAccount(op)}</td>
                <td>{readFreq(op)}</td>
                <td>
                  {op.createdAt
                    ? new Date(op.createdAt).toLocaleDateString()
                    : "—"}
                </td>
                <td className="text-center">
                  <div className="flex items-center justify-center gap-4">
                    <button
                      className="text-blue-600 hover:underline"
                      onClick={() => openEdit(op)}
                    >
                      Edit
                    </button>
                    <button
                      className="text-amber-600 hover:underline"
                      onClick={() => onResetPassword(op)}
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
                      onClick={() => onDelete(op._id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={12} className="text-center py-8 text-gray-500">
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
          <div className="bg-white rounded-xl w-full max-w-4xl p-6">
            <h3 className="text-xl font-semibold mb-4">Edit Operator</h3>

            <form onSubmit={onSave} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-600">Full Name</label>
                  <input
                    name="fullName"
                    value={form.fullName}
                    onChange={onField}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Email</label>
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={onField}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Mobile</label>
                  <input
                    name="mobile"
                    value={form.mobile}
                    onChange={onField}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div className="flex items-center gap-2 mt-7">
                  <input
                    id="active"
                    type="checkbox"
                    name="active"
                    checked={form.active}
                    onChange={onField}
                    className="h-4 w-4"
                  />
                  <label htmlFor="active" className="text-sm">
                    Active
                  </label>
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm text-gray-600">Business</label>
                  <input
                    name="operatorProfile.businessName"
                    value={form.operatorProfile.businessName}
                    onChange={onField}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-sm text-gray-600">Address</label>
                  <input
                    name="operatorProfile.address"
                    value={form.operatorProfile.address}
                    onChange={onField}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="text-sm text-gray-600">Bank</label>
                  <input
                    name="operatorProfile.bankName"
                    value={form.operatorProfile.bankName}
                    onChange={onField}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Branch</label>
                  <input
                    name="operatorProfile.bankBranch"
                    value={form.operatorProfile.bankBranch}
                    onChange={onField}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Account No</label>
                  <input
                    name="operatorProfile.bankAccountNumber"
                    value={form.operatorProfile.bankAccountNumber}
                    onChange={onField}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600">
                    Payout Frequency
                  </label>
                  <select
                    name="operatorProfile.payoutFrequency"
                    value={form.operatorProfile.payoutFrequency}
                    onChange={onField}
                    className="w-full border rounded px-3 py-2"
                  >
                    {FREQS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
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
                  className="px-5 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
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
