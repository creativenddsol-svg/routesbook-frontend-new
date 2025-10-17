// src/pages/operator/OperatorBusList.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
// ✅ use the shared API client (baseURL=/api, withCredentials=true)
import apiClient from "../../api";

const OperatorBusList = () => {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    let ignore = false;

    const fetchBuses = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await apiClient.get("/operator/buses");
        if (!ignore) setBuses(Array.isArray(res.data) ? res.data : res.data?.buses || []);
      } catch (err) {
        if (err?.response?.status === 401) {
          // Not authenticated → send to login and come back here after
          navigate("/login?redirect=" + encodeURIComponent(location.pathname), {
            replace: true,
            state: { from: location },
          });
          return;
        }
        console.error("Failed to fetch buses:", err);
        if (!ignore) {
          setError(err?.response?.data?.message || err?.message || "Unable to load buses.");
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchBuses();
    return () => {
      ignore = true;
    };
  }, [navigate, location]);

  if (loading) {
    return <div className="p-4 text-gray-600">Loading buses...</div>;
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-red-600 font-semibold mb-2">Error: {error}</div>
        <button
          onClick={() => {
            setError("");
            setLoading(true);
            // re-run by toggling effect via state reset:
            (async () => {
              try {
                const res = await apiClient.get("/operator/buses");
                setBuses(Array.isArray(res.data) ? res.data : res.data?.buses || []);
              } catch (err2) {
                setError(err2?.response?.data?.message || err2?.message || "Unable to load buses.");
              } finally {
                setLoading(false);
              }
            })();
          }}
          className="px-4 py-2 rounded bg-gray-900 text-white"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Your Buses</h2>
        <button
          onClick={async () => {
            setLoading(true);
            try {
              const res = await apiClient.get("/operator/buses");
              setBuses(Array.isArray(res.data) ? res.data : res.data?.buses || []);
            } catch (err) {
              setError(err?.response?.data?.message || err?.message || "Unable to refresh.");
            } finally {
              setLoading(false);
            }
          }}
          className="px-3 py-2 rounded border text-sm hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

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
              <h3 className="text-lg font-semibold">{bus.name || "Untitled Bus"}</h3>
              <p className="text-sm text-gray-600">
                {(bus.from || "—")} ➝ {(bus.to || "—")}
              </p>
              <p className="text-sm text-gray-600">Bus Type: {bus.busType || "—"}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OperatorBusList;
