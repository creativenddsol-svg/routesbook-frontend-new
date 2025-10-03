// src/pages/AdminRegisterOperator.jsx
import { useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
// ✅ shared API client
import apiClient from "../api";

const initialState = {
  // Auth / account
  fullName: "",
  email: "",
  password: "",
  mobile: "",
  nic: "",

  // Business profile
  businessName: "",
  contactNumber: "",
  address: "",
  website: "",
  logo: "",

  // Payout (bank) details
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

  // Support nested updates like "payoutMethod.accountNumber"
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiClient.post(
        "/admin/operators/register",
        {
          // Account-level fields
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          mobile: form.mobile,
          nic: form.nic,

          // Profile saved under operatorProfile (to match the operator profile shape)
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
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        }
      );

      toast.success("Operator registered successfully");
      setForm(initialState);
      navigate("/admin/operators");
    } catch (err) {
      console.error("Registration failed", err);
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-6">Register New Operator</h2>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Account Details */}
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
                  required
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

        {/* Business Profile */}
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

        {/* Payout / Bank Details */}
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
              <label className="font-medium text-gray-700 mb-1">
                Payout Frequency
              </label>
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
