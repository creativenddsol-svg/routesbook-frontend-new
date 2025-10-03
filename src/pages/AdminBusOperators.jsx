// src/pages/AdminBusOperators.jsx
import { useState, useEffect, useMemo } from "react";
import { toast } from "react-hot-toast";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSpinner,
  FaToggleOn,
  FaToggleOff,
  FaExternalLinkAlt,
  FaSearch,
  FaRedo,
} from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";
// ✅ shared API client
import apiClient from "../api";

const maskAccount = (n = "") => {
  const s = String(n);
  if (s.length <= 4) return "••••";
  return `••••••••${s.slice(-4)}`;
};

const AdminBusOperators = () => {
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(false);

  // Create/Edit modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentOperator, setCurrentOperator] = useState(null);
  const [saving, setSaving] = useState(false);

  // Filters
  const [q, setQ] = useState("");

  // Create/Edit form
  const emptyForm = {
    name: "",
    logoUrl: "",
    bannerUrl: "",
    description: "",
    website: "",
    contactEmail: "",
    contactPhone: "",
    operatingCities: [],
    yearsInService: "",
    busTypes: [],
    awards: [],
    fleetImages: [],
    // Optional nested details if your API returns/stores them here:
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
  const [formData, setFormData] = useState(emptyForm);

  // Fetch operators
  const fetchOperators = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/operators", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setOperators(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error("Failed to load operators", err);
      toast.error("Failed to load operators");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperators();
  }, []);

  // Open/close modal
  const openModal = (operator = null) => {
    setCurrentOperator(operator);
    if (operator) {
      setFormData({
        ...emptyForm,
        ...operator,
        operatingCities: operator.operatingCities || [],
        busTypes: operator.busTypes || [],
        awards: operator.awards || [],
        fleetImages: operator.fleetImages || [],
        operatorProfile: {
          businessName: operator.operatorProfile?.businessName || "",
          address: operator.operatorProfile?.address || "",
          payoutMethod: {
            bankName: operator.operatorProfile?.payoutMethod?.bankName || "",
            accountHolder:
              operator.operatorProfile?.payoutMethod?.accountHolder || "",
            accountNumber:
              operator.operatorProfile?.payoutMethod?.accountNumber || "",
            payoutFrequency:
              operator.operatorProfile?.payoutMethod?.payoutFrequency ||
              "monthly",
          },
        },
        active: operator.active ?? true,
      });
    } else {
      setFormData(emptyForm);
    }
    setIsModalOpen(true);
  };
  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentOperator(null);
  };

  // Handle form input (including comma lists and nested profile/payout)
  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // list fields
    if (["operatingCities", "busTypes", "awards", "fleetImages"].includes(name)) {
      setFormData((prev) => ({ ...prev, [name]: value.split(",").map((v) => v.trim()).filter(Boolean) }));
      return;
    }

    // nested: operatorProfile.*
    if (name.startsWith("operatorProfile.")) {
      const key = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        operatorProfile: { ...prev.operatorProfile, [key]: value },
      }));
      return;
    }

    // nested: operatorProfile.payoutMethod.*
    if (name.startsWith("payoutMethod.")) {
      const key = name.split(".")[1];
      setFormData((prev) => ({
        ...prev,
        operatorProfile: {
          ...prev.operatorProfile,
          payoutMethod: {
            ...prev.operatorProfile.payoutMethod,
            [key]: value,
          },
        },
      }));
      return;
    }

    // primitives
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Create/Update
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.logoUrl) {
      toast.error("Name and Logo URL are required");
      return;
    }
    setSaving(true);
    try {
      if (currentOperator) {
        await apiClient.put(`/operators/${currentOperator._id}`, formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        toast.success("Operator updated");
      } else {
        await apiClient.post("/operators", formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        toast.success("Operator created");
      }
      await fetchOperators();
      closeModal();
    } catch (err) {
      console.error("Save failed", err);
      toast.error(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this operator?")) return;
    try {
      await apiClient.delete(`/operators/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      toast.success("Operator deleted");
      fetchOperators();
    } catch (err) {
      console.error("Delete failed", err);
      toast.error("Failed to delete");
    }
  };

  // Optional: force password reset action (safer than showing passwords)
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

  // Filtered rows
  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return operators;
    return operators.filter((op) => {
      const hay = [
        op.name,
        op.contactEmail,
        op.contactPhone,
        op.website,
        op.operatorProfile?.businessName,
        op.operatorProfile?.address,
        ...(op.operatingCities || []),
        ...(op.busTypes || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(qq);
    });
  }, [operators, q]);

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
        <h1 className="text-2xl font-bold">Manage Bus Operators</h1>
        <div className="flex gap-2">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, email, city, business…"
              className="pl-9 pr-3 py-2 border rounded w-72"
            />
          </div>
          <button
            onClick={() => openModal()}
            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <FaPlus /> Create
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-auto">
        <table className="min-w-[1200px] w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="px-4 py-3 text-left">Operator</th>
              <th className="px-4 py-3 text-left">Account</th>
              <th className="px-4 py-3 text-left">Business</th>
              <th className="px-4 py-3 text-left">Payout (Bank)</th>
              <th className="px-4 py-3 text-left">Coverage</th>
              <th className="px-4 py-3 text-center">Active</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                  No operators found.
                </td>
              </tr>
            ) : (
              filtered.map((op) => {
                const prof = op.operatorProfile || {};
                const payout = prof.payoutMethod || {};
                return (
                  <tr key={op._id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={op.logoUrl}
                          alt={op.name}
                          className="w-10 h-10 object-contain rounded bg-gray-100"
                        />
                        <div>
                          <div className="font-semibold">{op.name || "—"}</div>
                          {op.website && (
                            <a
                              href={op.website}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-blue-600 inline-flex items-center gap-1"
                            >
                              {op.website} <FaExternalLinkAlt />
                            </a>
                          )}
                          {op.description && (
                            <div className="text-xs text-gray-500 line-clamp-2 max-w-[360px]">
                              {op.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div>
                          <span className="text-gray-500">Email: </span>
                          <span className="font-medium">{op.contactEmail || "—"}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Phone: </span>
                          <span className="font-medium">{op.contactPhone || "—"}</span>
                        </div>
                        {op.createdAt && (
                          <div className="text-xs text-gray-500">
                            Joined {new Date(op.createdAt).toLocaleDateString()}
                          </div>
                        )}
                        {/* Safer than showing passwords */}
                        <button
                          onClick={() => sendResetLink(op._id)}
                          className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1"
                          title="Send password reset link"
                        >
                          <FaRedo /> Send reset link
                        </button>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div>
                          <span className="text-gray-500">Business: </span>
                          <span className="font-medium">{prof.businessName || "—"}</span>
                        </div>
                        <div className="text-xs text-gray-600">
                          {prof.address || "—"}
                        </div>
                        <div className="text-xs text-gray-500">
                          Years in service: {op.yearsInService || "—"}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div>
                          <span className="text-gray-500">Bank: </span>
                          <span className="font-medium">{payout.bankName || "—"}</span>
                        </div>
                        <div className="text-xs">
                          <span className="text-gray-500">Holder: </span>
                          {payout.accountHolder || "—"}
                        </div>
                        <div className="text-xs">
                          <span className="text-gray-500">Account: </span>
                          {payout.accountNumber ? maskAccount(payout.accountNumber) : "—"}
                        </div>
                        <div className="text-xs">
                          <span className="text-gray-500">Frequency: </span>
                          {payout.payoutFrequency || "monthly"}
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="text-xs">
                        <span className="text-gray-500">Cities: </span>
                        {(op.operatingCities || []).join(", ") || "—"}
                      </div>
                      <div className="text-xs">
                        <span className="text-gray-500">Bus types: </span>
                        {(op.busTypes || []).join(", ") || "—"}
                      </div>
                      {op.awards?.length ? (
                        <div className="text-xs">
                          <span className="text-gray-500">Awards: </span>
                          {op.awards.join(", ")}
                        </div>
                      ) : null}
                    </td>

                    <td className="px-4 py-3 text-center">
                      {op.active ? (
                        <span className="text-green-600 inline-flex items-center gap-1">
                          <FaToggleOn /> Active
                        </span>
                      ) : (
                        <span className="text-gray-400 inline-flex items-center gap-1">
                          <FaToggleOff /> Inactive
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openModal(op)}
                          className="p-2 text-blue-600 border rounded hover:bg-blue-50 transition"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(op._id)}
                          className="p-2 text-red-600 border rounded hover:bg-red-50 transition"
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal for create/edit */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex justify-center items-center p-4"
          >
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl overflow-y-auto max-h-[90vh]">
              <h2 className="text-xl font-bold mb-4">
                {currentOperator ? "Edit Operator" : "Create Operator"}
              </h2>
              <form onSubmit={handleSave} className="space-y-4">
                {/* Basic */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    name="name"
                    placeholder="Name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full border px-3 py-2 rounded"
                    required
                  />
                  <input
                    type="text"
                    name="logoUrl"
                    placeholder="Logo URL"
                    value={formData.logoUrl}
                    onChange={handleInputChange}
                    className="w-full border px-3 py-2 rounded"
                    required
                  />
                  <input
                    type="text"
                    name="bannerUrl"
                    placeholder="Banner URL"
                    value={formData.bannerUrl}
                    onChange={handleInputChange}
                    className="w-full border px-3 py-2 rounded"
                  />
                  <input
                    type="text"
                    name="website"
                    placeholder="Website URL"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="w-full border px-3 py-2 rounded"
                  />
                </div>
                <textarea
                  name="description"
                  placeholder="Description / Story"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full border px-3 py-2 rounded"
                />

                {/* Contact */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="email"
                    name="contactEmail"
                    placeholder="Contact Email"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    className="w-full border px-3 py-2 rounded"
                  />
                  <input
                    type="text"
                    name="contactPhone"
                    placeholder="Contact Phone"
                    value={formData.contactPhone}
                    onChange={handleInputChange}
                    className="w-full border px-3 py-2 rounded"
                  />
                </div>

                {/* Business / Payout */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    name="operatorProfile.businessName"
                    placeholder="Business Name"
                    value={formData.operatorProfile.businessName}
                    onChange={handleInputChange}
                    className="w-full border px-3 py-2 rounded"
                  />
                  <input
                    type="text"
                    name="operatorProfile.address"
                    placeholder="Address"
                    value={formData.operatorProfile.address}
                    onChange={handleInputChange}
                    className="w-full border px-3 py-2 rounded"
                  />
                  <input
                    type="text"
                    name="payoutMethod.bankName"
                    placeholder="Bank Name"
                    value={formData.operatorProfile.payoutMethod.bankName}
                    onChange={handleInputChange}
                    className="w-full border px-3 py-2 rounded"
                  />
                  <input
                    type="text"
                    name="payoutMethod.accountHolder"
                    placeholder="Account Holder"
                    value={formData.operatorProfile.payoutMethod.accountHolder}
                    onChange={handleInputChange}
                    className="w-full border px-3 py-2 rounded"
                  />
                  <input
                    type="text"
                    name="payoutMethod.accountNumber"
                    placeholder="Account Number"
                    value={formData.operatorProfile.payoutMethod.accountNumber}
                    onChange={handleInputChange}
                    className="w-full border px-3 py-2 rounded"
                  />
                  <select
                    name="payoutMethod.payoutFrequency"
                    value={formData.operatorProfile.payoutMethod.payoutFrequency}
                    onChange={handleInputChange}
                    className="w-full border px-3 py-2 rounded"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                {/* Other lists */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    name="operatingCities"
                    placeholder="Operating Cities (comma separated)"
                    value={(formData.operatingCities || []).join(", ")}
                    onChange={handleInputChange}
                    className="w-full border px-3 py-2 rounded"
                  />
                  <input
                    type="text"
                    name="busTypes"
                    placeholder="Bus Types (comma separated)"
                    value={(formData.busTypes || []).join(", ")}
                    onChange={handleInputChange}
                    className="w-full border px-3 py-2 rounded"
                  />
                  <input
                    type="text"
                    name="awards"
                    placeholder="Awards (comma separated)"
                    value={(formData.awards || []).join(", ")}
                    onChange={handleInputChange}
                    className="w-full border px-3 py-2 rounded"
                  />
                  <input
                    type="text"
                    name="fleetImages"
                    placeholder="Fleet Images (comma separated URLs)"
                    value={(formData.fleetImages || []).join(", ")}
                    onChange={handleInputChange}
                    className="w-full border px-3 py-2 rounded"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
                  >
                    {saving && <FaSpinner className="animate-spin" />}
                    {saving ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminBusOperators;
