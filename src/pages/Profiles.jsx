// src/pages/Profile.jsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import apiClient from "../api";

/* ---- Shared UI (same as Login.jsx) ---- */
import TopBar from "../components/ui/TopBar";
import SectionCard from "../components/ui/SectionCard";
import { RowInput } from "../components/ui/FormAtoms";

/* ---- Page palette (same as Login.jsx) ---- */
const PALETTE = {
  primary: "var(--rb-primary, #D84E55)",
  bg: "var(--rb-bg, #F5F6F8)",
  subtle: "var(--rb-subtle, #6B7280)",
};

export default function Profile() {
  /* ─────────────────────────────
     State
  ───────────────────────────── */
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const token = localStorage.getItem("token") || null; // optional; cookie auth also works

  /* ─────────────────────────────
     Fetch profile (401 → login)
  ───────────────────────────── */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await apiClient.get("/profile", {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });

        if (!alive) return;
        const u = res.data || {};
        setUser(u);
        setForm({
          name: u.fullName || "",
          email: u.email || "",
          nic: u.nic || "",
          phone: u.phone || "",
          profilePicture: u.profilePicture || "",
        });
      } catch (err) {
        const status = err?.response?.status;
        if (status === 401) {
          toast.error("Session expired. Please login again.");
          navigate("/login");
          return;
        }
        toast.error("Failed to load profile. Please try again.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [token, navigate]);

  /* ─────────────────────────────
     Handlers
  ───────────────────────────── */
  const onChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onPasswordChange = (e) =>
    setPasswordForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const updateProfile = async (e) => {
    e?.preventDefault?.();
    try {
      await apiClient.put("/profile", form, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Failed to update profile");
    }
  };

  const changePassword = async (e) => {
    e?.preventDefault?.();
    try {
      await apiClient.put("/profile/change-password", passwordForm, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      toast.success("Password changed successfully");
      setPasswordForm({ currentPassword: "", newPassword: "" });
    } catch (err) {
      toast.error(
        err?.response?.data?.message || "Failed to change password"
      );
    }
  };

  /* ─────────────────────────────
     Avatar upload
  ───────────────────────────── */
  const triggerFile = () => fileInputRef.current?.click();

  const onFile = async (e) => {
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
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err?.response?.data?.message || "Image upload failed");
    }
  };

  /* ─────────────────────────────
     UI (mirrors Login.jsx layout)
  ───────────────────────────── */
  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: PALETTE.bg }}>
        <TopBar />
        <div className="max-w-5xl mx-auto px-4 py-8">
          <SectionCard title="Loading profile…">
            <p className="text-sm" style={{ color: PALETTE.subtle }}>
              Please wait a moment.
            </p>
          </SectionCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: PALETTE.bg }}>
      <Toaster position="top-right" />
      <TopBar />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left: Profile details (like Login left column) */}
          <SectionCard title="My Profile">
            {/* Avatar */}
            <div className="flex items-center gap-4 mb-4">
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
              <div>
                <button
                  type="button"
                  onClick={triggerFile}
                  className="px-3 py-2 rounded-lg text-sm font-semibold text-white"
                  style={{ background: PALETTE.primary }}
                >
                  Change picture
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={onFile}
                  className="hidden"
                />
                <p className="text-xs mt-2" style={{ color: PALETTE.subtle }}>
                  JPG/PNG, up to ~2MB recommended.
                </p>
              </div>
            </div>

            {/* Form fields styled like Login (RowInput) */}
            <form onSubmit={updateProfile} className="space-y-4">
              <RowInput
                id="name"
                name="name"
                label="Full Name"
                type="text"
                value={form.name}
                onChange={onChange}
                placeholder="Your full name"
                required
              />

              <RowInput
                id="email"
                name="email"
                label="Email"
                type="email"
                value={form.email}
                onChange={onChange}
                placeholder="you@email.com"
                autoComplete="email"
                required
              />

              <RowInput
                id="nic"
                name="nic"
                label="NIC (optional)"
                type="text"
                value={form.nic}
                onChange={onChange}
                placeholder="NIC number"
              />

              <RowInput
                id="phone"
                name="phone"
                label="Phone (optional)"
                type="tel"
                value={form.phone}
                onChange={onChange}
                placeholder="07xxxxxxxx"
              />

              <button
                type="submit"
                className="w-full px-6 py-3 rounded-xl text-white font-semibold shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: PALETTE.primary }}
              >
                Save Changes
              </button>
            </form>
          </SectionCard>

          {/* Right: Security (like Login right column helper card) */}
          <SectionCard title="Security">
            <form onSubmit={changePassword} className="space-y-4">
              <RowInput
                id="currentPassword"
                name="currentPassword"
                label="Current Password"
                type="password"
                value={passwordForm.currentPassword}
                onChange={onPasswordChange}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />

              <RowInput
                id="newPassword"
                name="newPassword"
                label="New Password"
                type="password"
                value={passwordForm.newPassword}
                onChange={onPasswordChange}
                placeholder="••••••••"
                autoComplete="new-password"
                required
              />

              <button
                type="submit"
                className="w-full px-6 py-3 rounded-xl text-white font-semibold shadow-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
                style={{ background: PALETTE.primary }}
              >
                Change Password
              </button>
            </form>

            <div className="mt-6 text-sm" style={{ color: PALETTE.subtle }}>
              <p className="mb-1">
                • Keep your email up to date—booking confirmations are sent
                there.
              </p>
              <p>• Use a strong password you don’t use elsewhere.</p>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
