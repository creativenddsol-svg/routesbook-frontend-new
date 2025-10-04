// src/pages/AdminRegisterOperator.jsx
import { useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import apiClient from "../api";

/** Remove keys that are "", null, undefined, or empty objects/arrays (recursively) */
function deepClean(obj) {
  if (Array.isArray(obj)) {
    const arr = obj.map(deepClean).filter((v) => !(v == null || v === "" || (typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0)));
    return arr;
  }
  if (obj && typeof obj === "object") {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      const cleaned = deepClean(v);
      const isEmptyObj = cleaned && typeof cleaned === "object" && !Array.isArray(cleaned) && Object.keys(cleaned).length === 0;
      if (cleaned !== "" && cleaned != null && !isEmptyObj) out[k] = cleaned;
    }
    return out;
  }
  return obj;
}

const initialState = {
  // Account
  fullName: "",
  email: "",
  password: "",
  mobile: "",
  nic: "",
  // Business
  businessName: "",
  contactNumber: "",
  address: "",
  website: "",
  logo: "",
  // Payout
  payoutMethod: {
    bankName: "",
    accountHolder: "",
    accountNumber: "",
    payoutFrequency: "monthly", // daily | weekly | monthly
  },
};

export default function AdminRegisterOperator() {
  const [form, setForm] = useState(initialState);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  // nested form support e.g. "payoutMethod.accountNumber"
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("payoutMethod.")) {
      const key = name.split(".")[1];
      setForm((prev) => ({
        ...prev,
        payoutMethod: { ...prev.payoutMethod, [key]: value },
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const validate = () => {
    if (!form.fullName.trim()) return "Full name is required";
    if (!form.email.trim()) return "Email is required";
    if (!form.password || form.password.length < 6)
      return "Password must be at least 6 characters";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (v) {
      toast.error(v);
      return;
    }

    setSaving(true);
    const headers = { Authorization: `Bearer ${localStorage.getItem("token")}` };

    // Construct payload shaped like operator + operatorProfile
    const payload = deepClean({
      fullName: form.fullName,
      email: form.email,
      password: form.password,
      mobile: form.mobile,
      nic: form.nic,
      operatorProfile: {
        businessName: form.businessName,
        contactNumber: form.contactNumber,
        address: form.address,
        website: form.website,
        logo: form.logo,
        payoutMethod: {
          bankName: form.payoutMethod.bankName,
          accountHolder: form.payoutMethod.accountHolder,
          accountNumber: form.payoutMethod.accountNumber,
          payoutFrequency: form.payoutMethod.payoutFrequency || "monthly",
        },
      },
    });

    // Primary endpoint then fallback if not found/not allowed
    const endpoints = [
      { url: "/admin/operators/register", method: "post" },
      { url: "/admin/operators", method: "post" }, // common alt
    ];

    let lastErr = null;
    for (const ep of endpoints) {
      try {
        console.debug("[AdminRegisterOperator] Attempting:", ep.url, payload);
        await apiClient[ep.method](ep.url, payload, { headers });
        toast.success("Operator registered successfully");
        setForm(initialState);
        navigate("/admin/operators");
        setSaving(false);
        return;
      } catch (err) {
        lastErr = err;
        const status = err?.response?.status;
        const msg =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Request failed";
        console.error(`[AdminRegisterOperator] ${ep.method.toUpperCase()} ${ep.url} failed`, {
          status,
          msg,
          data: err?.response?.data,
        });
        // If 404/405, try the next endpoint; for 401/403/500 we still try next, then show final error
        continue;
      }
    }

    // If we got here, both attempts failed
    const finalMsg =
      lastErr?.response?.data?.message ||
      lastErr?.response?.data?.error ||
      lastErr?.message ||
      "Registration failed";
    toast.error(`Registration failed: ${finalMsg}`);
    setSaving(false);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-6">Register New Operator</h2>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Account */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Account</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: "fullName", label: "Full Name" },
              { name: "email", label: "Email", type: "email" },
              { name: "password", label: "Password", type: "password" },
              { name: "mobile", label: "Mobile" },
              { name: "nic", label: "NIC" },
            ].map(({ name, label, type = "text" }) => (
              <div key={name} className="flex flex-col">
                <label className="font-medium text-gray-700 mb-1">{label}</label>
                <input
                  required={name === "fullName" || name === "email" || name === "password"}
                  type={type}
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
            ))}
          </div>
        </section>

        {/* Business */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Business Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: "businessName", label: "Business Name" },
              { name: "contactNumber", label: "Contact Number" },
              { name: "website", label: "Website (URL)", type: "url" },
              { name: "logo", label: "Logo (URL)", type: "url" },
            ].map(({ name, label, type = "text" }) => (
              <div key={name} className="flex flex-col">
                <label className="font-medium text-gray-700 mb-1">{label}</label>
                <input
                  type={type}
                  name={name}
                  value={form[name]}
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
            ))}
            <div className="md:col-span-2 flex flex-col">
              <label className="font-medium text-gray-700 mb-1">Address</label>
              <input
                type="text"
                name="address"
                value={form.address}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
              />
            </div>
          </div>
        </section>

        {/* Payout */}
        <section className="space-y-4">
          <h3 className="text-lg font-semibold">Payout (Bank) Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: "payoutMethod.bankName", label: "Bank Name" },
              { name: "payoutMethod.accountHolder", label: "Account Holder" },
              { name: "payoutMethod.accountNumber", label: "Account Number" },
            ].map(({ name, label }) => (
              <div key={name} className="flex flex-col">
                <label className="font-medium text-gray-700 mb-1">{label}</label>
                <input
                  type="text"
                  name={name}
                  value={
                    name === "payoutMethod.bankName"
                      ? form.payoutMethod.bankName
                      : name === "payoutMethod.accountHolder"
                      ? form.payoutMethod.accountHolder
                      : form.payoutMethod.accountNumber
                  }
                  onChange={handleChange}
                  className="w-full border px-3 py-2 rounded"
                />
              </div>
            ))}

            <div className="flex flex-col">
              <label className="font-medium text-gray-700 mb-1">Payout Frequency</label>
              <select
                name="payoutMethod.payoutFrequency"
                value={form.payoutMethod.payoutFrequency}
                onChange={handleChange}
                className="w-full border px-3 py-2 rounded"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
          </div>
        </section>

        <button
          type="submit"
          disabled={saving}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Registering..." : "Register Operator"}
        </button>
      </form>
    </div>
  );
}
