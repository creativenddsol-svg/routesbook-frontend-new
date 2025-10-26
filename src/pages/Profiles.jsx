// src/pages/Profile.jsx
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../api"; // ✅ shared client (baseURL + withCredentials)

const Profile = () => {
  /* ─────────────────────────────
     Local component state
  ───────────────────────────── */
  const [user, setUser] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    nic: "",
    phone: "",
    profilePicture: "",
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });
  const [message, setMessage] = useState("");
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  /* ─────────────────────────────
     Auth token (optional; cookie works too)
  ───────────────────────────── */
  const token = localStorage.getItem("token") || null;

  /* ─────────────────────────────
     Fetch profile on mount
  ───────────────────────────── */
  useEffect(() => {
    let alive = true;

    const fetchProfile = async () => {
      try {
        // ✅ Do not hardcode localhost; use apiClient baseURL
        const res = await apiClient.get("/profile", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          // apiClient should already have withCredentials: true
        });

        if (!alive) return;

        setUser(res.data);
        setForm({
          name: res.data.fullName || "",
          email: res.data.email || "",
          nic: res.data.nic || "",
          phone: res.data.phone || "",
          profilePicture: res.data.profilePicture || "",
        });
      } catch (err) {
        if (!alive) return;

        const status = err?.response?.status;
        console.error("❌ Failed to load profile", err);

        // ✅ Only redirect on 401 (unauthorized)
        if (status === 401) {
          setMessage("⚠️ Session expired. Please login again.");
          navigate("/login");
          return;
        }

        // Other errors (network, 5xx, CORS) → show message, don't force-redirect
        setMessage("⚠️ Failed to load profile. Please try again.");
      }
    };

    fetchProfile();
    return () => {
      alive = false;
    };
  }, [token, navigate]);

  /* ─────────────────────────────
     Handlers
  ───────────────────────────── */
  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handlePasswordChange = (e) =>
    setPasswordForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleProfileUpdate = async () => {
    try {
      await apiClient.put("/profile", form, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setMessage("✅ Profile updated successfully");
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to update profile");
    }
  };

  const handlePasswordUpdate = async () => {
    try {
      await apiClient.put("/profile/change-password", passwordForm, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      setMessage("✅ Password changed successfully");
      setPasswordForm({ currentPassword: "", newPassword: "" });
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to change password");
    }
  };

  /* ─────────────────────────────
     Image upload logic
  ───────────────────────────── */
  const triggerFileSelect = () => fileInputRef.current?.click();

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append("image", file);

    try {
      const res = await apiClient.post("/upload/profile-picture", data, {
        headers: {
          "Content-Type": "multipart/form-data",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      setForm((prev) => ({ ...prev, profilePicture: res.data.imageUrl }));
      setMessage("✅ Image uploaded");
    } catch (err) {
      console.error(err);
      setMessage("❌ Image upload failed");
    }
  };

  /* ─────────────────────────────
     UI
  ───────────────────────────── */
  if (!user) {
    return (
      <p className="text-center text-gray-600 mt-10">
        Loading profile...
      </p>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">👤 My Profile</h2>
      {message && <div className="mb-4 text-blue-600">{message}</div>}

      {/* Profile form */}
      <div className="space-y-3 mb-6">
        {/* Avatar + hidden file input */}
        <div
          className="flex items-center gap-4 cursor-pointer"
          onClick={triggerFileSelect}
          title="Click to change picture"
        >
          <img
            src={form.profilePicture}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                form.name || "User"
              )}&background=0D8ABC&color=fff`;
            }}
            alt="avatar"
            className="w-16 h-16 rounded-full object-cover border"
          />
          <span className="text-sm text-gray-500 underline">
            Change profile picture
          </span>
        </div>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
        />

        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Full Name"
          className="w-full border px-3 py-2 rounded"
        />
        <input
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="Email"
          className="w-full border px-3 py-2 rounded"
        />
        <input
          name="nic"
          value={form.nic}
          onChange={handleChange}
          placeholder="NIC (optional)"
          className="w-full border px-3 py-2 rounded"
        />
        <input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          placeholder="Phone (optional)"
          className="w-full border px-3 py-2 rounded"
        />

        <button
          onClick={handleProfileUpdate}
          className="bg-blue-600 text-white px-4 py-2 rounded w-full"
        >
          Update Profile
        </button>
      </div>

      {/* Change-password form */}
      <div className="border-t pt-4 mt-6">
        <h3 className="text-lg font-semibold mb-2">🔒 Change Password</h3>
        <input
          type="password"
          name="currentPassword"
          value={passwordForm.currentPassword}
          onChange={handlePasswordChange}
          placeholder="Current Password"
          className="w-full border px-3 py-2 rounded mb-2"
        />
        <input
          type="password"
          name="newPassword"
          value={passwordForm.newPassword}
          onChange={handlePasswordChange}
          placeholder="New Password"
          className="w-full border px-3 py-2 rounded mb-2"
        />
        <button
          onClick={handlePasswordUpdate}
          className="bg-green-600 text-white px-4 py-2 rounded w-full"
        >
          Change Password
        </button>
      </div>
    </div>
  );
};

export default Profile;
