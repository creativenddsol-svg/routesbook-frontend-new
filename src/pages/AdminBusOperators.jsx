import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import axios from "axios";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSpinner,
  FaToggleOn,
  FaToggleOff,
} from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";

const API_URL = "http://localhost:5000/api/operators"; // Update if needed

const AdminBusOperators = () => {
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentOperator, setCurrentOperator] = useState(null);
  const [formData, setFormData] = useState({
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
  });
  const [saving, setSaving] = useState(false);

  // ✅ Fetch operators
  const fetchOperators = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_URL);
      setOperators(res.data);
    } catch {
      toast.error("Failed to load operators");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperators();
  }, []);

  // ✅ Open modal (create or edit)
  const openModal = (operator = null) => {
    setCurrentOperator(operator);
    if (operator) {
      setFormData({
        ...operator,
        operatingCities: operator.operatingCities || [],
        busTypes: operator.busTypes || [],
        awards: operator.awards || [],
        fleetImages: operator.fleetImages || [],
      });
    } else {
      setFormData({
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
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentOperator(null);
  };

  // ✅ Handle form input (array fields too!)
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (
      ["operatingCities", "busTypes", "awards", "fleetImages"].includes(name)
    ) {
      setFormData({
        ...formData,
        [name]: value.split(",").map((v) => v.trim()),
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // ✅ Save (create or update)
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.logoUrl) {
      toast.error("Name and Logo URL are required");
      return;
    }
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      if (currentOperator) {
        await axios.put(`${API_URL}/${currentOperator._id}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Operator updated");
      } else {
        await axios.post(API_URL, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        toast.success("Operator created");
      }
      fetchOperators();
      closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // ✅ Delete operator
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_URL}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Operator deleted");
      fetchOperators();
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Manage Bus Operators</h1>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <FaPlus /> Create
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-600">Loading...</div>
      ) : operators.length === 0 ? (
        <div className="text-center text-gray-500">No operators found.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {operators.map((op) => (
            <div
              key={op._id}
              className="bg-white rounded shadow p-3 flex flex-col justify-between"
            >
              <img
                src={op.logoUrl}
                alt={op.name}
                className="w-full h-24 object-contain"
              />
              <h2 className="mt-2 font-bold">{op.name}</h2>
              <p className="text-sm text-gray-500">
                {op.description?.slice(0, 60)}...
              </p>
              <div className="flex items-center gap-2 text-sm mt-1">
                {op.active ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <FaToggleOn /> Active
                  </span>
                ) : (
                  <span className="text-gray-400 flex items-center gap-1">
                    <FaToggleOff /> Inactive
                  </span>
                )}
              </div>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => openModal(op)}
                  className="flex-1 p-2 text-blue-600 border rounded hover:bg-blue-50 transition"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => handleDelete(op._id)}
                  className="flex-1 p-2 text-red-600 border rounded hover:bg-red-50 transition"
                >
                  <FaTrash />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ✅ Modal for create/edit */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"
          >
            <div className="bg-white rounded-lg p-6 w-full max-w-md overflow-y-auto max-h-[90vh]">
              <h2 className="text-xl font-bold mb-4">
                {currentOperator ? "Edit Operator" : "Create Operator"}
              </h2>
              <form onSubmit={handleSave} className="space-y-3">
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
                <textarea
                  name="description"
                  placeholder="Description / Story"
                  value={formData.description}
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
                <input
                  type="text"
                  name="operatingCities"
                  placeholder="Operating Cities (comma separated)"
                  value={formData.operatingCities.join(", ")}
                  onChange={handleInputChange}
                  className="w-full border px-3 py-2 rounded"
                />
                <input
                  type="number"
                  name="yearsInService"
                  placeholder="Years in Service"
                  value={formData.yearsInService}
                  onChange={handleInputChange}
                  className="w-full border px-3 py-2 rounded"
                />
                <input
                  type="text"
                  name="busTypes"
                  placeholder="Bus Types (comma separated)"
                  value={formData.busTypes.join(", ")}
                  onChange={handleInputChange}
                  className="w-full border px-3 py-2 rounded"
                />
                <input
                  type="text"
                  name="awards"
                  placeholder="Awards (comma separated)"
                  value={formData.awards.join(", ")}
                  onChange={handleInputChange}
                  className="w-full border px-3 py-2 rounded"
                />
                <input
                  type="text"
                  name="fleetImages"
                  placeholder="Fleet Images (comma separated URLs)"
                  value={formData.fleetImages.join(", ")}
                  onChange={handleInputChange}
                  className="w-full border px-3 py-2 rounded"
                />
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
