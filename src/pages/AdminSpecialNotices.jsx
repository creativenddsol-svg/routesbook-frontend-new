// src/pages/AdminSpecialNotices.jsx
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import apiClient from "../api"; // ✅ use shared API client (baseURL includes /api)
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSpinner,
  FaToggleOn,
  FaToggleOff,
  FaUpload,
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa";
import { AnimatePresence, motion } from "framer-motion";

/* ---------- Endpoints (no /api prefix; apiClient has it) ---------- */
const API_URL = "/special-notices";
const UPLOAD_URL = "/upload";

/* ---------- Build absolute URL for images ---------- */
const API_ORIGIN = (function () {
  try {
    const base = (apiClient && apiClient.defaults && apiClient.defaults.baseURL) || "";
    const u = new URL(base);
    const pathname = u && u.pathname ? u.pathname : "";
    const path = pathname.replace(/\/api\/?$/, "");
    return u.origin + path;
  } catch (e) {
    return "";
  }
})();
function absolutize(u) {
  if (!u) return u;
  if (/^https?:\/\//i.test(u)) return u;
  if (!API_ORIGIN) return u;
  if (u.charAt(0) === "/") return API_ORIGIN + u;
  return API_ORIGIN + "/" + u;
}

const RECOMMENDED_SIZE = "Recommended: 800×300px (16:9 ratio), JPG/PNG ≤ 500KB";

const AdminSpecialNotices = () => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentNotice, setCurrentNotice] = useState(null);
  const [formData, setFormData] = useState({
    title: "",
    imageUrl: "",
    link: "#",
    isActive: true,
    sortOrder: 0,
    label: "",
  });
  const [localImage, setLocalImage] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const authHeaders = {
    Authorization: "Bearer " + (localStorage.getItem("token") || ""),
  };

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(API_URL, { headers: authHeaders });
      setNotices(res.data || []);
    } catch (err) {
      toast.error("Failed to load notices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openModal = (notice = null) => {
    setCurrentNotice(notice);
    setFormData({
      title: notice?.title || "",
      imageUrl: notice?.imageUrl || "",
      link: notice?.link || "#",
      isActive: typeof notice?.isActive === "boolean" ? notice.isActive : true,
      sortOrder: notice?.sortOrder || 0,
      label: notice?.label || "",
    });
    setLocalImage(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentNotice(null);
    setLocalImage(null);
  };

  const handleUploadImage = async (file) => {
    if (!file) return;
    try {
      setUploading(true);
      const fd = new FormData();
      fd.append("image", file);
      const up = await apiClient.post(UPLOAD_URL, fd, {
        headers: { ...authHeaders, "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      const url = up?.data?.imageUrl || "";
      if (url) {
        setFormData((p) => ({ ...p, imageUrl: url }));
        toast.success("Image uploaded");
      } else {
        toast.error("Upload succeeded but no imageUrl returned");
      }
    } catch (e) {
      const msg = e?.response?.data?.message || "Upload failed";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.imageUrl) {
      toast.error("Title and Image are required.");
      return;
    }
    setSaving(true);
    try {
      if (currentNotice) {
        await apiClient.put(API_URL + "/" + currentNotice._id, formData, {
          headers: authHeaders,
        });
        toast.success("Notice updated");
      } else {
        await apiClient.post(API_URL, formData, { headers: authHeaders });
        toast.success("Notice created");
      }
      fetchNotices();
      closeModal();
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to save";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await apiClient.delete(API_URL + "/" + id, { headers: authHeaders });
      toast.success("Notice deleted");
      fetchNotices();
    } catch (err) {
      const msg = err?.response?.data?.message || "Failed to delete";
      toast.error(msg);
    }
  };

  const toggleActive = async (n) => {
    try {
      await apiClient.put(API_URL + "/" + n._id, { isActive: !n.isActive }, { headers: authHeaders });
      fetchNotices();
    } catch {
      toast.error("Failed to toggle");
    }
  };

  const bumpOrder = async (n, delta) => {
    try {
      const nextOrder = (n?.sortOrder || 0) + delta;
      await apiClient.put(API_URL + "/" + n._id, { sortOrder: nextOrder }, { headers: authHeaders });
      fetchNotices();
    } catch {
      toast.error("Failed to update order");
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Manage Special Notices</h1>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow hover:bg-blue-700"
        >
          <FaPlus /> Create
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-600">Loading...</div>
      ) : notices.length === 0 ? (
        <div className="text-center text-gray-500">No notices found.</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {notices.map((n) => {
            const imgSrc = absolutize(n?.imageUrl);
            const title = n?.title || "Untitled";
            const link = n?.link || "—";
            const active = !!n?.isActive;
            const sortOrder = n?.sortOrder || 0;
            const key = n?._id || String(sortOrder) + title;

            return (
              <div key={key} className="bg-white rounded-2xl ring-1 ring-black/5 shadow-sm p-3 flex flex-col">
                <div className="relative w-full aspect-[16/9] rounded-xl overflow-hidden bg-gray-100">
                  <img src={imgSrc} alt={title} className="w-full h-full object-cover" />
                  {n?.label && (
                    <div className="absolute left-2 top-2">
                      <span className="px-2 py-1 text-[11px] font-semibold rounded-full bg-white/85 text-gray-900 ring-1 ring-black/10">
                        {n.label}
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-2">
                  <h2 className="font-bold text-gray-800 line-clamp-1">{title}</h2>
                  <p className="text-xs text-gray-500 break-all">{link}</p>

                  <div className="mt-2 flex items-center justify-between">
                    <button
                      onClick={() => toggleActive(n)}
                      className={`flex items-center gap-2 text-sm ${active ? "text-green-600" : "text-gray-400"}`}
                      title="Toggle active"
                    >
                      {active ? <FaToggleOn /> : <FaToggleOff />}
                      {active ? "Active" : "Inactive"}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => bumpOrder(n, -1)}
                        className="p-1 rounded border hover:bg-gray-50"
                        title="Move up"
                      >
                        <FaArrowUp />
                      </button>
                      <span className="px-2 text-sm text-gray-600">{sortOrder}</span>
                      <button
                        onClick={() => bumpOrder(n, +1)}
                        className="p-1 rounded border hover:bg-gray-50"
                        title="Move down"
                      >
                        <FaArrowDown />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => openModal(n)}
                    className="flex-1 p-2 text-blue-600 border rounded hover:bg-blue-50 transition"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(n._id)}
                    className="flex-1 p-2 text-red-600 border rounded hover:bg-red-50 transition"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {isModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 grid place-items-center p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-xl">
              <h2 className="text-xl font-bold mb-4">{currentNotice ? "Edit Special Notice" : "Create Special Notice"}</h2>

              <form onSubmit={handleSave} className="space-y-4">
                {/* Title & Label */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full border px-3 py-2 rounded"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Label (optional)"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    className="w-full border px-3 py-2 rounded"
                  />
                </div>

                {/* Image Upload + Preview */}
                <div>
                  <p className="text-xs text-gray-500 mb-2">{RECOMMENDED_SIZE}</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-start">
                    <div className="md:col-span-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Image URL"
                          value={formData.imageUrl}
                          onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                          className="flex-1 border px-3 py-2 rounded"
                          required={!localImage}
                        />
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <label className="inline-flex items-center gap-2 px-3 py-2 rounded border cursor-pointer hover:bg-gray-50">
                          <FaUpload />
                          <span>Choose image</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              setLocalImage(f || null);
                              if (f) handleUploadImage(f);
                            }}
                          />
                        </label>
                        {uploading && (
                          <span className="text-sm text-gray-500 flex items-center gap-2">
                            <FaSpinner className="animate-spin" /> Uploading…
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Live preview */}
                    <div className="rounded-xl overflow-hidden ring-1 ring-black/10 bg-gray-100 w-full aspect-[16/9]">
                      {localImage ? (
                        <img src={URL.createObjectURL(localImage)} alt="preview" className="w-full h-full object-cover" />
                      ) : formData.imageUrl ? (
                        <img src={absolutize(formData.imageUrl)} alt="preview" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full grid place-items-center text-gray-400 text-sm">No image</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Link, Sort, Active */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input
                    type="url"
                    placeholder="Link (optional)"
                    value={formData.link}
                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                    className="border px-3 py-2 rounded md:col-span-2"
                  />
                  <input
                    type="number"
                    placeholder="Sort Order"
                    value={formData.sortOrder}
                    onChange={(e) => setFormData({ ...formData, sortOrder: Number(e.target.value) })}
                    className="border px-3 py-2 rounded"
                  />
                </div>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  Active
                </label>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2">
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

export default AdminSpecialNotices;
