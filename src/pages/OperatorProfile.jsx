import React, { useState, useEffect, useCallback } from "react";
import apiClient from "../api";
import { toast } from "react-hot-toast";
import {
  Loader2,
  Save,
  Edit,
  X,
  Building2,
  Phone,
  MapPin,
  Globe,
  Image as ImageIcon,
  Landmark,
  CircleUserRound,
  Hash,
  CalendarDays,
  Info,
} from "lucide-react";

// --- Reusable, Styled Components for a Professional UI ---

// A styled container for grouping fields
const Section = ({ title, children }) => (
  <div className="p-6 border border-gray-200 rounded-xl">
    <h2 className="text-xl font-semibold mb-6 text-gray-800">{title}</h2>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
      {children}
    </div>
  </div>
);

// A reusable, styled input field for the edit form
const InputField = ({ id, label, icon, ...props }) => (
  <div>
    <label
      htmlFor={id}
      className="block text-sm font-medium text-gray-600 mb-1"
    >
      {label}
    </label>
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
        {icon}
      </div>
      <input
        id={id}
        {...props}
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
      />
    </div>
  </div>
);

// A reusable field for displaying data in view mode
const DisplayField = ({ label, value, isLink = false, children }) => (
  <div>
    <p className="text-sm font-medium text-gray-500 capitalize">{label}</p>
    <div className="text-gray-900 mt-1 font-medium">
      {children ? (
        children
      ) : isLink ? (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline break-all"
        >
          {value || "-"}
        </a>
      ) : (
        value || "-"
      )}
    </div>
  </div>
);

// --- Main Profile Component ---
const OperatorProfile = () => {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get("/operator-profile/me");
      if (data && data.operatorProfile) {
        setProfile(data.operatorProfile);
        setFormData(data.operatorProfile);
      } else {
        setFormData({}); // Set empty object for new profile
        setIsEditMode(true); // Start in edit mode for new users
      }
    } catch (err) {
      toast.error("Failed to load profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const [outerKey, innerKey] = name.split(".");

    if (innerKey) {
      setFormData((prev) => ({
        ...prev,
        [outerKey]: { ...prev[outerKey], [innerKey]: value },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { data } = await apiClient.put("/operator-profile/me", {
        operatorProfile: formData,
      });
      setProfile(data.operatorProfile);
      setFormData(data.operatorProfile);
      setIsEditMode(false);
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error("Failed to update profile.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- Render Logic ---

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="animate-spin text-blue-600 w-12 h-12" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="bg-white rounded-2xl shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 border-b border-gray-200">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              My Operator Profile
            </h1>
            <p className="mt-1 text-gray-500">
              View and manage your business and payout details.
            </p>
          </div>
          {!isEditMode && profile && (
            <button
              onClick={() => setIsEditMode(true)}
              className="flex items-center gap-2 mt-4 sm:mt-0 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition duration-150"
            >
              <Edit size={16} /> Edit Profile
            </button>
          )}
        </div>

        <div className="p-6">
          {isEditMode ? (
            // --- EDIT MODE FORM ---
            <form onSubmit={handleSubmit} className="space-y-8">
              <Section title="Business Details">
                <InputField
                  label="Business Name"
                  id="businessName"
                  name="businessName"
                  value={formData?.businessName || ""}
                  onChange={handleChange}
                  icon={<Building2 size={16} className="text-gray-400" />}
                />
                <InputField
                  label="Contact Number"
                  id="contactNumber"
                  name="contactNumber"
                  value={formData?.contactNumber || ""}
                  onChange={handleChange}
                  icon={<Phone size={16} className="text-gray-400" />}
                />
                <InputField
                  label="Address"
                  id="address"
                  name="address"
                  value={formData?.address || ""}
                  onChange={handleChange}
                  className="md:col-span-2"
                  icon={<MapPin size={16} className="text-gray-400" />}
                />
                <InputField
                  label="Website URL"
                  id="website"
                  name="website"
                  type="url"
                  placeholder="https://example.com"
                  value={formData?.website || ""}
                  onChange={handleChange}
                  icon={<Globe size={16} className="text-gray-400" />}
                />
                <InputField
                  label="Logo URL"
                  id="logo"
                  name="logo"
                  type="url"
                  placeholder="https://.../logo.png"
                  value={formData?.logo || ""}
                  onChange={handleChange}
                  icon={<ImageIcon size={16} className="text-gray-400" />}
                />
              </Section>

              <Section title="Payout Method">
                <InputField
                  label="Bank Name"
                  id="bankName"
                  name="payoutMethod.bankName"
                  value={formData?.payoutMethod?.bankName || ""}
                  onChange={handleChange}
                  icon={<Landmark size={16} className="text-gray-400" />}
                />
                <InputField
                  label="Account Holder Name"
                  id="accountHolder"
                  name="payoutMethod.accountHolder"
                  value={formData?.payoutMethod?.accountHolder || ""}
                  onChange={handleChange}
                  icon={<CircleUserRound size={16} className="text-gray-400" />}
                />
                <InputField
                  label="Account Number"
                  id="accountNumber"
                  name="payoutMethod.accountNumber"
                  value={formData?.payoutMethod?.accountNumber || ""}
                  onChange={handleChange}
                  icon={<Hash size={16} className="text-gray-400" />}
                />
                <div>
                  <label
                    htmlFor="payoutFrequency"
                    className="block text-sm font-medium text-gray-600 mb-1"
                  >
                    Payout Frequency
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                      <CalendarDays size={16} className="text-gray-400" />
                    </div>
                    <select
                      id="payoutFrequency"
                      name="payoutMethod.payoutFrequency"
                      value={
                        formData?.payoutMethod?.payoutFrequency || "monthly"
                      }
                      onChange={handleChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>
              </Section>

              <div className="flex justify-end items-center gap-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditMode(false);
                    setFormData(profile);
                  }}
                  className="flex items-center gap-2 px-6 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition"
                >
                  <X size={18} /> Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <Save size={18} />
                  )}
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          ) : profile ? (
            // --- VIEW MODE ---
            <div className="space-y-8">
              <Section title="Business Details">
                <DisplayField
                  label="Business Name"
                  value={profile.businessName}
                />
                <DisplayField
                  label="Contact Number"
                  value={profile.contactNumber}
                />
                <DisplayField
                  label="Address"
                  value={profile.address}
                  className="md:col-span-2"
                />
                <DisplayField label="Website" value={profile.website} isLink />
                <DisplayField label="Logo">
                  {profile.logo ? (
                    <img
                      src={profile.logo}
                      alt="Business Logo"
                      className="mt-2 w-36 h-auto object-contain border rounded-md p-2 bg-gray-50"
                    />
                  ) : (
                    "-"
                  )}
                </DisplayField>
              </Section>

              <Section title="Payout Method">
                <DisplayField
                  label="Bank Name"
                  value={profile.payoutMethod?.bankName}
                />
                <DisplayField
                  label="Account Holder"
                  value={profile.payoutMethod?.accountHolder}
                />
                <DisplayField
                  label="Account Number"
                  value={profile.payoutMethod?.accountNumber}
                />
                <DisplayField
                  label="Payout Frequency"
                  value={profile.payoutMethod?.payoutFrequency}
                />
              </Section>
            </div>
          ) : (
            // --- EMPTY STATE ---
            <div className="text-center py-20">
              <Info size={48} className="mx-auto text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold text-gray-800">
                No Profile Found
              </h3>
              <p className="mt-1 text-gray-500">
                Please set up your operator profile to continue.
              </p>
              <button
                onClick={() => setIsEditMode(true)}
                className="mt-6 flex items-center gap-2 mx-auto px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition"
              >
                <Edit size={16} /> Create Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OperatorProfile;
