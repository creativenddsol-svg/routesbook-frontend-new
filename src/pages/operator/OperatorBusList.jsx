import React, { useEffect, useState } from "react";

import { useNavigate } from "react-router-dom";
import axios from "../../utils/axiosInstance"; // ✅ use custom axios

const OperatorBusList = () => {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBuses = async () => {
      try {
        const res = await axios.get("/operator/buses");
        setBuses(res.data);
      } catch (err) {
        console.error("Failed to fetch buses:", err);
        setError(err.response?.data?.message || "Unable to load buses.");
      } finally {
        setLoading(false);
      }
    };

    fetchBuses();
  }, []);

  if (loading) {
    return <div className="p-4 text-gray-600">Loading buses...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-600">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Your Buses</h2>

      {buses.length === 0 ? (
        <p className="text-gray-500">You have no buses added yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {buses.map((bus) => (
            <div
              key={bus._id}
              className="border p-4 rounded shadow cursor-pointer hover:bg-gray-50"
              onClick={() => navigate(`/operator/bus/${bus._id}`)}
            >
              <h3 className="text-lg font-semibold">{bus.name}</h3>
              <p>
                {bus.from} ➝ {bus.to}
              </p>
              <p>Bus Type: {bus.busType}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OperatorBusList;
