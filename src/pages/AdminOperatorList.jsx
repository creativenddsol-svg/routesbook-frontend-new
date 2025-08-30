/* src/pages/AdminOperatorList.jsx */
import { useEffect, useState } from "react";
import axios from "../utils/axiosInstance";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";

export default function AdminOperatorList() {
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  /* fetch operators once */
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get("/admin/operators");
        setOperators(res.data);
      } catch {
        toast.error("Failed to load operators");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* delete handler */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this operator?")) return;
    try {
      await axios.delete(`/admin/operators/${id}`);
      setOperators((prev) => prev.filter((op) => op._id !== id));
      toast.success("Operator deleted");
    } catch {
      toast.error("Delete failed");
    }
  };

  /* filtered list */
  const filtered = operators.filter((op) =>
    `${op.fullName} ${op.email}`.toLowerCase().includes(query.toLowerCase())
  );

  if (loading) return <p className="p-6">Loading operators…</p>;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">All Operators</h1>

      {/* Search */}
      <input
        className="border px-3 py-2 rounded mb-4 w-full sm:w-72"
        placeholder="Search by name or email"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full border rounded shadow-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Email</th>
              <th className="px-4 py-2 text-left">Mobile</th>
              <th className="px-4 py-2 text-left">Business</th>
              <th className="px-4 py-2 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((op) => (
              <tr key={op._id} className="border-t hover:bg-gray-50">
                <td className="px-4 py-2">{op.fullName}</td>
                <td className="px-4 py-2">{op.email}</td>
                <td className="px-4 py-2">{op.mobile || "-"}</td>
                <td className="px-4 py-2">
                  {op.operatorProfile?.businessName || "-"}
                </td>
                <td className="px-4 py-2 text-center space-x-2">
                  <Link
                    to={`/operators/${op._id}`}
                    className="text-blue-600 text-sm hover:underline"
                  >
                    View
                  </Link>
                  <button
                    onClick={() => handleDelete(op._id)}
                    className="text-red-600 text-sm hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center py-6 text-gray-500">
                  No operators match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
