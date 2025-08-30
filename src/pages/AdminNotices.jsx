// src/pages/AdminNotices.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";

/**
 * Kept your existing flow (upload -> save notice) but
 * - polished UI
 * - added optional meta fields (label/title/subtitle/link)
 *   If your backend ignores unknown fields, this “just works”.
 *   If not, you can send only imageUrl by leaving others blank.
 */
const AdminNotices = () => {
  const token = localStorage.getItem("token"); // stored JWT

  const [image, setImage] = useState(null);
  const [label, setLabel] = useState("");
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [link, setLink] = useState("");

  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchNotices = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/notices", {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setNotices(res.data);
    } catch (error) {
      console.error("Failed to fetch notices", error);
    }
  };

  useEffect(() => {
    if (token) fetchNotices();
  }, [token]);

  const handleUpload = async () => {
    if (!image) return alert("Please select an image.");
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("image", image);

      // 1) Upload image
      const uploadRes = await axios.post(
        "http://localhost:5000/api/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        }
      );

      const imageUrl = uploadRes.data.imageUrl;

      // 2) Save notice (+ optional metadata)
      const body = { imageUrl };
      if (label) body.label = label;
      if (title) body.title = title;
      if (subtitle) body.subtitle = subtitle;
      if (link) body.link = link;

      await axios.post("http://localhost:5000/api/notices", body, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      setImage(null);
      setLabel("");
      setTitle("");
      setSubtitle("");
      setLink("");
      fetchNotices();
      alert("Notice saved!");
    } catch (error) {
      console.error("Upload failed", error);
      alert(error?.response?.data?.message || "Failed to upload image");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("Delete this notice? This cannot be undone.");
    if (!ok) return;

    try {
      setDeletingId(id);
      await axios.delete(`http://localhost:5000/api/notices/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setNotices((prev) => prev.filter((n) => n._id !== id));
    } catch (error) {
      console.error("Delete failed", error);
      alert(error.response?.data?.message || "Failed to delete notice");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Manage Notice Images</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {/* Left: form */}
        <div className="rounded-2xl border bg-white shadow-sm p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setImage(e.target.files?.[0] || null)}
              className="border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Label (e.g., New, Offer)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border p-2 rounded"
            />
            <input
              type="text"
              placeholder="Subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="border p-2 rounded"
            />
            <input
              type="url"
              placeholder="Link (optional)"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="border p-2 rounded md:col-span-2"
            />
          </div>

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={handleUpload}
              disabled={loading || !image}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-60"
            >
              {loading ? "Uploading..." : "Save Notice"}
            </button>
            <p className="text-sm text-gray-500">
              Tip: Keep images 4:3 or 16:9, and below ~1 MB for faster load.
            </p>
          </div>
        </div>

        {/* Right: live preview */}
        <div className="rounded-2xl border bg-white shadow-sm p-4">
          <p className="text-sm font-semibold text-gray-700 mb-3">
            Live preview
          </p>
          <div className="flex gap-3">
            <div className="w-[320px] sm:w-[360px]">
              <div className="relative w-[320px] sm:w-[360px] h-[150px] sm:h-[170px] rounded-2xl overflow-hidden bg-gray-100">
                {image ? (
                  <img
                    src={URL.createObjectURL(image)}
                    alt="preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full grid place-items-center text-gray-400 text-sm">
                    No image selected
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/20 to-transparent" />
                {label && (
                  <div className="absolute left-2 top-2">
                    <span className="px-2.5 py-1 text-[11px] font-semibold rounded-full bg-white/80 text-gray-900 ring-1 ring-black/10">
                      {label}
                    </span>
                  </div>
                )}
                {(title || subtitle) && (
                  <div className="absolute left-3 bottom-3 right-24 text-white">
                    {title && (
                      <div className="text-[15px] font-bold line-clamp-2">
                        {title}
                      </div>
                    )}
                    {subtitle && (
                      <div className="text-[12px] opacity-90 line-clamp-1">
                        {subtitle}
                      </div>
                    )}
                  </div>
                )}
                {link && (
                  <div className="absolute right-2 bottom-2">
                    <div className="px-3 py-1.5 text-[12px] font-semibold rounded-full bg-white/85 text-gray-900 ring-1 ring-black/10">
                      Know more ›
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Existing list */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {notices.map((n) => (
          <div
            key={n._id}
            className="rounded-2xl border bg-white shadow-sm overflow-hidden"
          >
            <img
              src={n.imageUrl}
              alt="Notice"
              className="w-full h-40 object-cover"
            />
            <div className="p-2 flex justify-end">
              <button
                onClick={() => handleDelete(n._id)}
                disabled={deletingId === n._id}
                className="text-sm px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deletingId === n._id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminNotices;
