import { useState } from "react";
import axios from "../utils/axiosInstance";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const initialState = {
  fullName: "",
  email: "",
  password: "",
  mobile: "",
  nic: "",
  businessName: "",
};

export default function AdminRegisterOperator() {
  const [form, setForm] = useState(initialState);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.post("/admin/operators/register", {
        ...form,
        operatorProfile: { businessName: form.businessName },
      });
      toast.success("Operator registered successfully");
      setForm(initialState);
      navigate("/admin/operators"); // optional redirect to operators list
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Register New Operator</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {[
          { name: "fullName", label: "Full Name" },
          { name: "email", label: "Email", type: "email" },
          { name: "password", label: "Password", type: "password" },
          { name: "mobile", label: "Mobile" },
          { name: "nic", label: "NIC" },
          { name: "businessName", label: "Business Name" },
        ].map(({ name, label, type = "text" }) => (
          <div key={name}>
            <label className="block font-medium text-gray-700 mb-1">
              {label}
            </label>
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
