import { useState, useEffect } from "react";

const AdminBusForm = ({ onSubmit, initialData = {}, buttonLabel }) => {
  const [form, setForm] = useState({
    name: "",
    from: "",
    to: "",
    departureTime: "",
    arrivalTime: "",
    price: "",
    availableFrom: "",
    availableTo: "",
    seatLayout: "",
  });

  useEffect(() => {
    if (initialData._id) {
      setForm({
        ...initialData,
        seatLayout: initialData.seatLayout.join(", "),
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      seatLayout: form.seatLayout.split(",").map((s) => s.trim()),
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 border p-4 rounded">
      <input
        name="name"
        value={form.name}
        onChange={handleChange}
        className="w-full border p-2"
        placeholder="Bus Name"
        required
      />
      <input
        name="from"
        value={form.from}
        onChange={handleChange}
        className="w-full border p-2"
        placeholder="From"
        required
      />
      <input
        name="to"
        value={form.to}
        onChange={handleChange}
        className="w-full border p-2"
        placeholder="To"
        required
      />
      <input
        name="departureTime"
        value={form.departureTime}
        onChange={handleChange}
        className="w-full border p-2"
        placeholder="Departure Time (e.g. 08:00)"
        required
      />
      <input
        name="arrivalTime"
        value={form.arrivalTime}
        onChange={handleChange}
        className="w-full border p-2"
        placeholder="Arrival Time"
        required
      />
      <input
        name="price"
        type="number"
        value={form.price}
        onChange={handleChange}
        className="w-full border p-2"
        placeholder="Price"
        required
      />
      <input
        name="availableFrom"
        type="date"
        value={form.availableFrom}
        onChange={handleChange}
        className="w-full border p-2"
        placeholder="Available From"
        required
      />
      <input
        name="availableTo"
        type="date"
        value={form.availableTo}
        onChange={handleChange}
        className="w-full border p-2"
        placeholder="Available To"
        required
      />
      <input
        name="seatLayout"
        value={form.seatLayout}
        onChange={handleChange}
        className="w-full border p-2"
        placeholder="Seat Layout (e.g. 1A, 1B, 1C)"
        required
      />
      <button
        type="submit"
        className="bg-blue-600 text-white py-2 px-4 rounded"
      >
        {buttonLabel}
      </button>
    </form>
  );
};

export default AdminBusForm;
