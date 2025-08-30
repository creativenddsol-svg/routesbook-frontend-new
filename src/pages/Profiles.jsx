import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

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
     Auth token
  ───────────────────────────── */
  const token = localStorage.getItem("token");

  /* ─────────────────────────────
     Fetch profile on mount
  ───────────────────────────── */
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(res.data);
        setForm({
          name: res.data.fullName || "",
          email: res.data.email || "",
          nic: res.data.nic || "",
          phone: res.data.phone || "",
          profilePicture: res.data.profilePicture || "",
        });
      } catch (err) {
        console.error("❌ Failed to load profile", err);
        setMessage("⚠️ Failed to load profile. Please login again.");
        navigate("/login");
      }
    };

    fetchProfile();
  }, [token, navigate]);

  /* ─────────────────────────────
     Handlers
  ───────────────────────────── */
  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handlePasswordChange = (e) =>
    setPasswordForm({ ...passwordForm, [e.target.name]: e.target.value });

  const handleProfileUpdate = async () => {
    try {
      await axios.put("http://localhost:5000/api/profile", form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("✅ Profile updated successfully");
    } catch (err) {
      console.error(err);
      setMessage("❌ Failed to update profile");
    }
  };

  const handlePasswordUpdate = async () => {
    try {
      await axios.put(
        "http://localhost:5000/api/profile/change-password",
        passwordForm,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
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
    const file = e.target.files[0];
    if (!file) return;

    const data = new FormData();
    data.append("image", file);

    try {
      const res = await axios.post(
        "http://localhost:5000/api/upload/profile-picture",
        data,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );
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
      <p className="text-center text-gray-600 mt-10">Loading profile...</p>
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
              e.target.onerror = null;
              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
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
