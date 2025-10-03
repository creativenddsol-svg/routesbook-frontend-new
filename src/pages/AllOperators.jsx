// src/pages/AllOperators.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
// ✅ use shared API client (no localhost hardcode)
import apiClient from "../api";

const AllOperators = () => {
  const [operators, setOperators] = useState([]);

  useEffect(() => {
    const fetchOperators = async () => {
      try {
        const res = await apiClient.get("/operators");
        setOperators(res.data);
      } catch (err) {
        console.error("Failed to load operators", err);
      }
    };
    fetchOperators();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6 text-center">🚍 Bus Operators</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {operators.map((op) => (
          <div
            key={op._id}
            className="border p-4 rounded shadow hover:shadow-md transition"
          >
            <div className="flex items-center gap-4 mb-2">
              {op.logoUrl || op.logo ? (
                <img
                  src={op.logoUrl || op.logo}
                  alt={op.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                  🚌
                </div>
              )}
              <h2 className="text-xl font-semibold">{op.name}</h2>
            </div>
            <p className="text-gray-600 text-sm mb-2">
              {op.operatingCities?.length
                ? op.operatingCities.join(", ")
                : "No city info available"}
            </p>
            <Link
              to={`/operators/${op._id}`}
              className="text-blue-600 text-sm underline"
            >
              View Profile
            </Link>
          </div>
        ))}
        {operators.length === 0 && (
          <div className="col-span-full text-center text-gray-500 py-6">
            No operators found.
          </div>
        )}
      </div>
    </div>
  );
};

export default AllOperators;
