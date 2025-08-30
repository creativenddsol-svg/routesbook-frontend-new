// src/pages/AdminWhatsNew.jsx
import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FaPlus, FaEdit, FaTrash, FaUpload, FaTimes } from "react-icons/fa";

const API = "http://localhost:5000/api/whats-new";

const AdminWhatsNew = () => {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    imageUrl: "",
    tag: "",
    link: "",
    isActive: true,
    sortOrder: 0,
    expiresAt: "",
  });

  // local file + upload state
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const token = localStorage.getItem("token");

  const load = async () => {
    try {
      const res = await axios.get(API, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      setItems(res.data);
    } catch {
      toast.error("Failed to load items");
    }
  };

  useEffect(() => {
    load();
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startEdit = (doc = null) => {
    setEditing(doc);
    setForm({
      title: doc?.title || "",
      subtitle: doc?.subtitle || "",
      imageUrl: doc?.imageUrl || "",
      tag: doc?.tag || "",
      link: doc?.link || "",
      isActive: doc?.isActive ?? true,
      sortOrder: doc?.sortOrder ?? 0,
      expiresAt: doc?.expiresAt ? doc.expiresAt.slice(0, 16) : "",
    });
    setImageFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl("");
  };

  const handleFile = (file) => {
    if (!file) return;
    setImageFile(file);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const uploadIfNeeded = async () => {
    if (!imageFile) return null;
    const formData = new FormData();
    formData.append("image", imageFile);
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
    return uploadRes.data.imageUrl;
  };

  const save = async (e) => {
    e.preventDefault();
    if (!form.title) return toast.error("Title is required");
    if (!form.imageUrl && !imageFile)
      return toast.error("Provide an image URL or upload a file");

    try {
      setSaving(true);
      let finalImageUrl = form.imageUrl;
      if (imageFile) {
        toast.loading("Uploading image...", { id: "up" });
        finalImageUrl = await uploadIfNeeded();
        toast.success("Image uploaded", { id: "up" });
      }
      const payload = { ...form, imageUrl: finalImageUrl };

      if (editing) {
        await axios.put(`${API}/${editing._id}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        toast.success("Updated");
      } else {
        await axios.post(API, payload, {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        });
        toast.success("Created");
      }

      setEditing(null);
      setForm({
        title: "",
        subtitle: "",
        imageUrl: "",
        tag: "",
        link: "",
        isActive: true,
        sortOrder: 0,
        expiresAt: "",
      });
      setImageFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl("");
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this item?")) return;
    try {
      setDeletingId(id);
      await axios.delete(`${API}/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });
      toast.success("Deleted");
      setItems((prev) => prev.filter((x) => x._id !== id));
    } catch {
      toast.error("Delete failed");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Manage “What’s new”</h1>
        <button
          onClick={() => startEdit(null)}
          className="bg-blue-600 text-white px-4 py-2 rounded inline-flex items-center gap-2"
        >
          <FaPlus /> New
        </button>
      </div>

      {/* grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((it) => (
          <div key={it._id} className="bg-white shadow rounded p-3">
            <div className="rounded overflow-hidden">
              <div className="aspect-[360/170] w-full rounded bg-gray-100">
                <img
                  src={it.imageUrl}
                  alt={it.title}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
            <div className="mt-2">
              <div className="font-semibold">{it.title}</div>
              {it.subtitle ? (
                <div className="text-xs text-gray-500">{it.subtitle}</div>
              ) : null}
              {it.tag ? (
                <div className="text-xs text-gray-500 mt-1">{it.tag}</div>
              ) : null}
            </div>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => startEdit(it)}
                className="flex-1 p-2 text-blue-600 border rounded hover:bg-blue-50"
                title="Edit"
              >
                <FaEdit />
              </button>
              <button
                onClick={() => remove(it._id)}
                disabled={deletingId === it._id}
                className="flex-1 p-2 text-red-600 border rounded hover:bg-red-50 disabled:opacity-60"
                title="Delete"
              >
                {deletingId === it._id ? "..." : <FaTrash />}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* editor */}
      <form onSubmit={save} className="mt-8 grid gap-3 max-w-xl">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">
            {editing ? "Edit item" : "Create item"}
          </h2>
          {editing && (
            <button
              type="button"
              onClick={() => startEdit(null)}
              className="text-gray-600 hover:text-black inline-flex items-center gap-2"
            >
              <FaTimes /> Cancel
            </button>
          )}
        </div>

        <input
          className="border rounded px-3 py-2"
          placeholder="Title*"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <input
          className="border rounded px-3 py-2"
          placeholder="Subtitle"
          value={form.subtitle}
          onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
        />

        {/* Either paste a URL… */}
        <input
          className="border rounded px-3 py-2"
          placeholder="Image URL (or upload below)"
          value={form.imageUrl}
          onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
        />

        {/* …or upload a file */}
        <div className="border rounded p-3">
          <label className="block text-sm font-medium mb-2">
            Upload image (optional)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFile(e.target.files?.[0] || null)}
              className="block"
            />
            {imageFile && (
              <span className="text-xs text-gray-600 inline-flex items-center gap-2">
                <FaUpload /> {imageFile.name}
              </span>
            )}
          </div>

          {/* Live preview with same aspect ratio */}
          {previewUrl && (
            <div className="mt-3 rounded overflow-hidden">
              <div className="aspect-[360/170] w-full rounded bg-gray-100">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          )}
        </div>

        <input
          className="border rounded px-3 py-2"
          placeholder="Tag (e.g. New)"
          value={form.tag}
          onChange={(e) => setForm({ ...form, tag: e.target.value })}
        />
        <input
          className="border rounded px-3 py-2"
          placeholder="Link (optional)"
          value={form.link}
          onChange={(e) => setForm({ ...form, link: e.target.value })}
        />

        <div className="flex gap-3 items-center">
          <label className="text-sm">
            Sort:
            <input
              type="number"
              className="border rounded px-2 py-1 ml-2 w-24"
              value={form.sortOrder}
              onChange={(e) =>
                setForm({ ...form, sortOrder: Number(e.target.value) })
              }
            />
          </label>
          <label className="text-sm flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Active
          </label>
        </div>

        <label className="text-sm">
          Expires At:
          <input
            type="datetime-local"
            className="border rounded px-2 py-1 ml-2"
            value={form.expiresAt}
            onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
          />
        </label>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60"
          >
            {saving ? "Saving..." : editing ? "Update" : "Create"}
          </button>
          <button
            type="button"
            onClick={() => {
              setForm({
                title: "",
                subtitle: "",
                imageUrl: "",
                tag: "",
                link: "",
                isActive: true,
                sortOrder: 0,
                expiresAt: "",
              });
              setImageFile(null);
              if (previewUrl) URL.revokeObjectURL(previewUrl);
              setPreviewUrl("");
            }}
            className="px-4 py-2 rounded border"
          >
            Reset
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminWhatsNew;
