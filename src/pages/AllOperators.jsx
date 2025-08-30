import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const AllOperators = () => {
  const [operators, setOperators] = useState([]);

  useEffect(() => {
    const fetchOperators = async () => {
      try {
        const res = await axios.get("/api/operators");
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
              {op.logo && (
                <img
                  src={op.logo}
                  alt={op.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              )}
              <h2 className="text-xl font-semibold">{op.name}</h2>
            </div>
            <p className="text-gray-600 text-sm mb-2">
              {op.operatingCities?.join(", ")}
            </p>
            <Link
              to={`/operators/${op._id}`}
              className="text-blue-600 text-sm underline"
            >
              View Profile
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AllOperators;
