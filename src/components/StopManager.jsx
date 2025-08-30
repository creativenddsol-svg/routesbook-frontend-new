// components/StopManager.jsx
const StopManager = ({ stops, setStops }) => {
  const handleStopChange = (index, field, value) => {
    const updatedStops = [...stops];
    updatedStops[index][field] = value;
    setStops(updatedStops);
  };

  const addStop = () => {
    setStops([...stops, { time: "", point: "" }]);
  };

  const removeStop = (index) => {
    if (stops.length <= 2) return; // Minimum 2 stops
    const updatedStops = stops.filter((_, i) => i !== index);
    setStops(updatedStops);
  };

  return (
    <div className="space-y-4">
      {stops.map((stop, index) => (
        <div key={index} className="flex gap-2 items-center">
          <input
            type="text"
            placeholder="Stop name"
            className="border px-2 py-1 rounded w-1/2"
            value={stop.point}
            onChange={(e) => handleStopChange(index, "point", e.target.value)}
            required
          />
          <input
            type="time"
            className="border px-2 py-1 rounded w-1/3"
            value={stop.time}
            onChange={(e) => handleStopChange(index, "time", e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => removeStop(index)}
            className="text-red-500"
            disabled={stops.length <= 2}
          >
            ✕
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addStop}
        className="bg-green-500 text-white px-3 py-1 rounded shadow-sm"
      >
        + Add Stop
      </button>
    </div>
  );
};

export default StopManager;
