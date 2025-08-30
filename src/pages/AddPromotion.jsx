import React, { useState, useEffect } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import { FaSave, FaTags } from "react-icons/fa";

const PALETTE = {
  primaryRed: "#D84E55",
  accentBlue: "#3A86FF",
  textDark: "#1A1A1A",
  textLight: "#4B5563",
  bgLight: "#F7F8FC",
  borderLight: "#E9ECEF",
  white: "#FFFFFF",
};

const AddPromotion = () => {
  const [buses, setBuses] = useState([]);
  const [selectedBus, setSelectedBus] = useState("");
  const [offer, setOffer] = useState({
    isActive: false,
    message: "",
    discountPercent: "",
    expiry: "",
    imageUrl: "",
  });
  const [loading, setLoading] = useState(false);

  // Fetch all buses for the dropdown
  useEffect(() => {
    const fetchBuses = async () => {
      try {
        const { data } = await axios.get("http://localhost:5000/api/buses");
        setBuses(data);
      } catch (error) {
        toast.error("Failed to fetch buses.");
        console.error(error);
      }
    };
    fetchBuses();
  }, []);

  // When a bus is selected, fetch its current offer details
  useEffect(() => {
    if (!selectedBus) {
      // Clear form if no bus is selected
      setOffer({
        isActive: false,
        message: "",
        discountPercent: "",
        expiry: "",
        imageUrl: "",
      });
      return;
    }
    const busData = buses.find((b) => b._id === selectedBus);
    if (busData && busData.trendingOffer) {
      const { isActive, message, discountPercent, expiry, imageUrl } =
        busData.trendingOffer;
      setOffer({
        isActive: isActive || false,
        message: message || "",
        discountPercent: discountPercent || "",
        // Format date for the input field (YYYY-MM-DD)
        expiry: expiry ? new Date(expiry).toISOString().split("T")[0] : "",
        imageUrl: imageUrl || "",
      });
    }
  }, [selectedBus, buses]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setOffer((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBus) {
      toast.error("Please select a bus first.");
      return;
    }
    setLoading(true);
    const toastId = toast.loading("Saving special offer...");

    try {
      // The PUT request requires admin privileges.
      // The `{ withCredentials: true }` option sends the auth cookie to the server.
      const { data } = await axios.put(
        `http://localhost:5000/api/buses/${selectedBus}/trending-offer`,
        { trendingOffer: offer },
        { withCredentials: true } // ✅ FIX: This ensures you are authenticated.
      );
      toast.success("Special offer updated successfully!", { id: toastId });
    } catch (error) {
      const errorMessage =
        error.response?.data?.message || "Failed to update offer.";
      toast.error(errorMessage, { id: toastId });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster position="top-right" />
      <div
        style={{ backgroundColor: PALETTE.bgLight, minHeight: "100vh" }}
        className="p-4 sm:p-6 lg:p-8"
      >
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <FaTags
                className="text-3xl"
                style={{ color: PALETTE.primaryRed }}
              />
              <h1
                className="text-2xl font-bold"
                style={{ color: PALETTE.textDark }}
              >
                Add/Edit Special Offer
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label
                  htmlFor="bus-select"
                  className="block text-sm font-bold mb-2"
                  style={{ color: PALETTE.textLight }}
                >
                  Select Bus
                </label>
                <select
                  id="bus-select"
                  value={selectedBus}
                  onChange={(e) => setSelectedBus(e.target.value)}
                  className="w-full border-2 rounded-lg px-3 py-2 text-sm transition-all focus:border-blue-500 focus:ring-0"
                  style={{
                    borderColor: PALETTE.borderLight,
                    color: PALETTE.textDark,
                  }}
                >
                  <option value="">-- Choose a Bus --</option>
                  {buses.map((bus) => (
                    <option key={bus._id} value={bus._id}>
                      {bus.name} ({bus.from} to {bus.to})
                    </option>
                  ))}
                </select>
              </div>

              {selectedBus && (
                <>
                  <div
                    className="flex items-center gap-4 p-4 rounded-lg"
                    style={{ backgroundColor: PALETTE.bgLight }}
                  >
                    <input
                      type="checkbox"
                      id="isActive"
                      name="isActive"
                      checked={offer.isActive}
                      onChange={handleInputChange}
                      className="h-5 w-5 rounded text-red-500 focus:ring-red-400"
                      style={{ accentColor: PALETTE.primaryRed }}
                    />
                    <label
                      htmlFor="isActive"
                      className="font-bold"
                      style={{ color: PALETTE.textDark }}
                    >
                      Make this offer active
                    </label>
                  </div>

                  <div>
                    <label
                      htmlFor="message"
                      className="block text-sm font-bold mb-2"
                      style={{ color: PALETTE.textLight }}
                    >
                      Message (e.g., "Monsoon Sale")
                    </label>
                    <input
                      type="text"
                      name="message"
                      id="message"
                      value={offer.message}
                      onChange={handleInputChange}
                      className="w-full border-2 rounded-lg px-3 py-2 text-sm transition-all focus:border-blue-500 focus:ring-0"
                      style={{
                        borderColor: PALETTE.borderLight,
                        color: PALETTE.textDark,
                      }}
                      placeholder="Title of the offer"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label
                        htmlFor="discountPercent"
                        className="block text-sm font-bold mb-2"
                        style={{ color: PALETTE.textLight }}
                      >
                        Discount (%)
                      </label>
                      <input
                        type="number"
                        name="discountPercent"
                        id="discountPercent"
                        value={offer.discountPercent}
                        onChange={handleInputChange}
                        className="w-full border-2 rounded-lg px-3 py-2 text-sm transition-all focus:border-blue-500 focus:ring-0"
                        style={{
                          borderColor: PALETTE.borderLight,
                          color: PALETTE.textDark,
                        }}
                        placeholder="e.g., 15"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="expiry"
                        className="block text-sm font-bold mb-2"
                        style={{ color: PALETTE.textLight }}
                      >
                        Expiry Date
                      </label>
                      <input
                        type="date"
                        name="expiry"
                        id="expiry"
                        value={offer.expiry}
                        onChange={handleInputChange}
                        min={new Date().toISOString().split("T")[0]} // Today
                        className="w-full border-2 rounded-lg px-3 py-2 text-sm transition-all focus:border-blue-500 focus:ring-0"
                        style={{
                          borderColor: PALETTE.borderLight,
                          color: PALETTE.textDark,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="imageUrl"
                      className="block text-sm font-bold mb-2"
                      style={{ color: PALETTE.textLight }}
                    >
                      Image URL (Optional, for Primo-style cards)
                    </label>
                    <input
                      type="text"
                      name="imageUrl"
                      id="imageUrl"
                      value={offer.imageUrl}
                      onChange={handleInputChange}
                      className="w-full border-2 rounded-lg px-3 py-2 text-sm transition-all focus:border-blue-500 focus:ring-0"
                      style={{
                        borderColor: PALETTE.borderLight,
                        color: PALETTE.textDark,
                      }}
                      placeholder="https://example.com/image.png"
                    />
                  </div>

                  <div
                    className="pt-4 border-t"
                    style={{ borderColor: PALETTE.borderLight }}
                  >
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 text-white font-bold tracking-wider px-8 py-3 rounded-xl shadow-lg transition-all duration-300 disabled:opacity-60"
                      style={{
                        backgroundColor: loading
                          ? PALETTE.textLight
                          : PALETTE.primaryRed,
                      }}
                    >
                      <FaSave /> {loading ? "Saving..." : "Save Special Offer"}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddPromotion;
