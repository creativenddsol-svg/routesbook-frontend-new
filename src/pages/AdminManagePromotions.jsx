// src/pages/AdminManagePromotions.jsx
import React, { useState, useEffect, useCallback } from "react";
// Option 1: Use your globally configured axios instance
// import axiosInstance from '../../api/axiosInstance'; // Adjust path as needed
// Option 2: Use plain axios and ensure tokens are handled if not using interceptors
import axios from "axios";
import { FaPlus, FaEdit, FaTrashAlt } from "react-icons/fa";

// Ensure this URL is correct and your backend is running.
// If using axiosInstance with a baseURL, this can be relative: e.g., '/promotions/admin'
const API_URL_PROMOTIONS_ADMIN = "http://localhost:5000/api/promotions/admin";

// Placeholder for your actual API functions using an authenticated axios instance
// These should ideally come from a dedicated api service file.
const apiClient = {
  get: async (url) => {
    // Replace with your actual authenticated axios call
    // Example: return axiosInstance.get(url);
    const token = localStorage.getItem("userInfo")
      ? JSON.parse(localStorage.getItem("userInfo")).token
      : null; // Example: get token
    return axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
  },
  post: async (url, data) => {
    const token = localStorage.getItem("userInfo")
      ? JSON.parse(localStorage.getItem("userInfo")).token
      : null;
    return axios.post(url, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  put: async (url, data) => {
    const token = localStorage.getItem("userInfo")
      ? JSON.parse(localStorage.getItem("userInfo")).token
      : null;
    return axios.put(url, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  delete: async (url) => {
    const token = localStorage.getItem("userInfo")
      ? JSON.parse(localStorage.getItem("userInfo")).token
      : null;
    return axios.delete(url, { headers: { Authorization: `Bearer ${token}` } });
  },
};

const fetchPromotionsAdminAPI = async () =>
  apiClient.get(API_URL_PROMOTIONS_ADMIN);
const addPromotionAdminAPI = async (data) =>
  apiClient.post(API_URL_PROMOTIONS_ADMIN, data);
const updatePromotionAdminAPI = async (id, data) =>
  apiClient.put(`${API_URL_PROMOTIONS_ADMIN}/${id}`, data);
const deletePromotionAdminAPI = async (id) =>
  apiClient.delete(`${API_URL_PROMOTIONS_ADMIN}/${id}`);

const PromotionForm = ({ initialData, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: "",
    imageUrl: "",
    link: "",
    isActive: true,
    displayOrder: 0,
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || "",
        imageUrl: initialData.imageUrl || "",
        link: initialData.link || "",
        isActive:
          initialData.isActive === undefined ? true : initialData.isActive,
        displayOrder: initialData.displayOrder || 0,
        startDate: initialData.startDate
          ? initialData.startDate.split("T")[0]
          : "",
        endDate: initialData.endDate ? initialData.endDate.split("T")[0] : "",
      });
    } else {
      setFormData({
        title: "",
        imageUrl: "",
        link: "",
        isActive: true,
        displayOrder: 0,
        startDate: "",
        endDate: "",
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
          ? parseInt(value, 10) || 0
          : value,
    }));
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form
      onSubmit={handleSubmitForm}
      className="space-y-6 bg-gray-50 p-6 rounded-lg shadow"
    >
      <h3 className="text-xl font-semibold text-gray-700">
        {initialData ? "Edit Promotion" : "Add New Promotion"}
      </h3>
      <div>
        <label
          htmlFor="title"
          className="block text-sm font-medium text-gray-600 mb-1"
        >
          Title*
        </label>
        <input
          type="text"
          name="title"
          id="title"
          value={formData.title}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
        />
      </div>
      <div>
        <label
          htmlFor="imageUrl"
          className="block text-sm font-medium text-gray-600 mb-1"
        >
          Image URL*
        </label>
        <input
          type="url"
          name="imageUrl"
          id="imageUrl"
          value={formData.imageUrl}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          placeholder="https://example.com/image.jpg"
        />
      </div>
      <div>
        <label
          htmlFor="link"
          className="block text-sm font-medium text-gray-600 mb-1"
        >
          Link URL (optional)
        </label>
        <input
          type="url"
          name="link"
          id="link"
          value={formData.link}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="displayOrder"
            className="block text-sm font-medium text-gray-600 mb-1"
          >
            Display Order
          </label>
          <input
            type="number"
            name="displayOrder"
            id="displayOrder"
            value={formData.displayOrder}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          />
        </div>
        <div className="flex items-center pt-6">
          <input
            type="checkbox"
            name="isActive"
            id="isActive"
            checked={formData.isActive}
            onChange={handleChange}
            className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2"
          />
          <label htmlFor="isActive" className="text-sm text-gray-700">
            Active
          </label>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="startDate"
            className="block text-sm font-medium text-gray-600 mb-1"
          >
            Start Date
          </label>
          <input
            type="date"
            name="startDate"
            id="startDate"
            value={formData.startDate}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          />
        </div>
        <div>
          <label
            htmlFor="endDate"
            className="block text-sm font-medium text-gray-600 mb-1"
          >
            End Date
          </label>
          <input
            type="date"
            name="endDate"
            id="endDate"
            value={formData.endDate}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
          />
        </div>
      </div>
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-md"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-md"
        >
          {initialData ? "Save Changes" : "Add Promotion"}
        </button>
      </div>
    </form>
  );
};

const AdminManagePromotions = () => {
  const [promotions, setPromotions] = useState([]);
  const [isLoading, setIsLoading] = useState(true); // Set true initially
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);

  const loadPromotions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetchPromotionsAdminAPI();
      setPromotions(response.data);
    } catch (err) {
      console.error("Error details:", err);
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Error response data:", err.response.data);
        console.error("Error response status:", err.response.status);
        setError(
          `Server Error ${err.response.status}: ${
            err.response.data.message || "Failed to load promotions."
          }`
        );
      } else if (err.request) {
        // The request was made but no response was received
        console.error("Error request:", err.request);
        setError(
          "No response from server. Please check your backend and network."
        );
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Error message:", err.message);
        setError(`Error: ${err.message}`);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPromotions();
  }, [loadPromotions]);

  const handleAdd = () => {
    setEditingPromotion(null);
    setShowForm(true);
  };

  const handleEdit = (promo) => {
    setEditingPromotion(promo);
    setShowForm(true);
  };

  const handleDelete = async (promoId) => {
    if (window.confirm("Are you sure you want to delete this promotion?")) {
      try {
        await deletePromotionAdminAPI(promoId);
        loadPromotions(); // Refresh list
      } catch (err) {
        alert(err.response?.data?.message || "Failed to delete promotion.");
      }
    }
  };

  const handleFormSubmit = async (formData) => {
    const dataToSubmit = { ...formData };
    if (!dataToSubmit.startDate) delete dataToSubmit.startDate; // Send null or undefined if empty
    if (!dataToSubmit.endDate) delete dataToSubmit.endDate;

    try {
      if (editingPromotion) {
        await updatePromotionAdminAPI(editingPromotion._id, dataToSubmit);
      } else {
        await addPromotionAdminAPI(dataToSubmit);
      }
      setShowForm(false);
      setEditingPromotion(null);
      loadPromotions(); // Refresh list
    } catch (err) {
      alert(err.response?.data?.message || "Failed to save promotion.");
    }
  };

  let content;
  if (isLoading) {
    content = (
      <p className="text-center text-gray-500 py-10">Loading promotions...</p>
    );
  } else if (error) {
    content = (
      <p className="text-center text-red-600 bg-red-100 p-4 rounded-md py-10">
        {error}
      </p>
    );
  } else if (showForm) {
    content = (
      <PromotionForm
        initialData={editingPromotion}
        onSubmit={handleFormSubmit}
        onCancel={() => {
          setShowForm(false);
          setEditingPromotion(null);
        }}
      />
    );
  } else if (promotions.length === 0) {
    content = (
      <p className="text-center text-gray-500 py-10">
        No general promotions found. Click "Add Promotion" to create one.
      </p>
    );
  } else {
    content = (
      <div className="overflow-x-auto shadow-md rounded-lg mt-6">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-200 text-gray-600">
            <tr>
              <th className="py-3 px-4 text-left">Image</th>
              <th className="py-3 px-4 text-left">Title</th>
              <th className="py-3 px-4 text-left">Status</th>
              <th className="py-3 px-4 text-left">Display Order</th>
              <th className="py-3 px-4 text-left">Dates (Start-End)</th>
              <th className="py-3 px-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-700">
            {promotions.map((promo) => (
              <tr key={promo._id} className="border-b hover:bg-gray-50">
                <td className="py-2 px-4">
                  <img
                    src={promo.imageUrl}
                    alt={promo.title}
                    className="h-12 w-24 object-contain rounded"
                  />
                </td>
                <td className="py-2 px-4">{promo.title}</td>
                <td className="py-2 px-4">
                  <span
                    className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      promo.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {promo.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="py-2 px-4">{promo.displayOrder}</td>
                <td className="py-2 px-4 text-xs">
                  {promo.startDate
                    ? new Date(promo.startDate).toLocaleDateString()
                    : "N/A"}{" "}
                  -{" "}
                  {promo.endDate
                    ? new Date(promo.endDate).toLocaleDateString()
                    : "N/A"}
                </td>
                <td className="py-2 px-4 text-center">
                  <button
                    onClick={() => handleEdit(promo)}
                    className="text-blue-500 hover:text-blue-700 mr-2 p-1"
                    aria-label="Edit"
                  >
                    <FaEdit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(promo._id)}
                    className="text-red-500 hover:text-red-700 p-1"
                    aria-label="Delete"
                  >
                    <FaTrashAlt size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-100 min-h-screen">
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-lg shadow-xl">
        <div className="flex justify-between items-center mb-6 border-b pb-4">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-700">
            🖼️ Manage General Promotions
          </h1>
          {!showForm && (
            <button
              onClick={handleAdd}
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md flex items-center transition duration-150"
            >
              <FaPlus className="mr-2" /> Add Promotion
            </button>
          )}
        </div>
        {content}
      </div>
    </div>
  );
};

export default AdminManagePromotions;
