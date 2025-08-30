import { useEffect, useState } from "react";
import axios from "axios";

const AdminBusAvailability = () => {
  const [buses, setBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState(null);
  const [unavailableDates, setUnavailableDates] = useState([]);

  useEffect(() => {
    const fetchBuses = async () => {
      const res = await axios.get("http://localhost:5000/api/buses");
      setBuses(res.data);
    };
    fetchBuses();
  }, []);

  const handleAddDate = (e) => {
    const date = e.target.value;
    if (date && !unavailableDates.includes(date)) {
      setUnavailableDates([...unavailableDates, date]);
    }
  };

  const handleRemoveDate = (dateToRemove) => {
    setUnavailableDates(unavailableDates.filter((d) => d !== dateToRemove));
  };

  const handleSubmit = async () => {
    try {
      await axios.put(
        `http://localhost:5000/api/admin/buses/${selectedBus._id}`,
        { unavailableDates },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      alert("Unavailable dates updated!");
    } catch (err) {
      alert("Update failed");
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-4">🛑 Manage Bus Availability</h2>

      <select
        className="w-full border px-3 py-2 rounded mb-4"
        onChange={(e) => {
          const bus = buses.find((b) => b._id === e.target.value);
          setSelectedBus(bus);
          setUnavailableDates(bus?.unavailableDates || []);
        }}
      >
        <option value="">Select Bus</option>
        {buses.map((bus) => (
          <option key={bus._id} value={bus._id}>
            {bus.name} ({bus.from} → {bus.to})
          </option>
        ))}
      </select>

      {selectedBus && (
        <>
          <input
            type="date"
            className="border px-3 py-2 rounded mb-2 w-full"
            onChange={handleAddDate}
          />
          <ul className="mb-4">
            {unavailableDates.map((d) => (
              <li key={d} className="flex justify-between items-center">
                <span>{d}</span>
                <button
                  className="text-red-600 text-sm"
                  onClick={() => handleRemoveDate(d)}
                >
                  ❌ Remove
                </button>
              </li>
            ))}
          </ul>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded"
            onClick={handleSubmit}
          >
            Save Availability
          </button>
        </>
      )}
    </div>
  );
};

export default AdminBusAvailability;
