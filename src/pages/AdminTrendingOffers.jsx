import { useEffect, useState } from "react";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

const AdminTrendingOffers = () => {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBuses = async () => {
      setLoading(true);
      try {
        const res = await axios.get("http://localhost:5000/api/buses");
        const busesWithFiles = res.data.map((bus) => ({
          ...bus,
          imageFile: null,
          previewUrl: null,
        }));
        setBuses(busesWithFiles);
      } catch (err) {
        toast.error("Failed to load buses");
      } finally {
        setLoading(false);
      }
    };
    fetchBuses();
  }, []);

  const handleToggleOffer = (index) => {
    const updated = [...buses];
    const offer = updated[index].trendingOffer || {};
    updated[index].trendingOffer = {
      ...offer,
      isActive: !offer.isActive,
    };
    setBuses(updated);
  };

  const handleFileChange = (index, file) => {
    if (!file) return;
    const updated = [...buses];
    updated[index].imageFile = file;
    if (updated[index].previewUrl) {
      URL.revokeObjectURL(updated[index].previewUrl);
    }
    updated[index].previewUrl = URL.createObjectURL(file);
    setBuses(updated);
  };

  const handleSave = async (index) => {
    const token = localStorage.getItem("token");
    const bus = buses[index];
    let finalImageUrl = bus.trendingOffer?.imageUrl || "";

    if (bus.imageFile) {
      const formData = new FormData();
      formData.append("image", bus.imageFile);

      try {
        const uploadRes = await axios.post(
          "http://localhost:5000/api/upload",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        finalImageUrl = uploadRes.data.imageUrl;
      } catch (err) {
        toast.error("Image upload failed");
        return;
      }
    }

    try {
      await axios.put(
        `http://localhost:5000/api/buses/${bus._id}/trending-offer`,
        {
          trendingOffer: {
            isActive: bus.trendingOffer?.isActive || false,
            imageUrl: finalImageUrl,
          },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const updated = [...buses];
      updated[index].imageFile = null;
      updated[index].previewUrl = null;
      updated[index].trendingOffer.imageUrl = finalImageUrl;
      setBuses(updated);

      toast.success("Offer updated!");
    } catch (err) {
      toast.error("Failed to update offer");
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-600">Loading buses…</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold mb-6">Trending Offer Management</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {buses.map((bus, index) => {
          const previewUrl =
            bus.previewUrl || bus.trendingOffer?.imageUrl || "";

          return (
            <div
              key={bus._id}
              className="border rounded-lg p-4 shadow bg-white"
            >
              <h2 className="text-lg font-semibold mb-2">
                {bus.name} ({bus.from} → {bus.to})
              </h2>

              <label className="flex items-center gap-2 mb-3">
                <input
                  type="checkbox"
                  checked={bus.trendingOffer?.isActive || false}
                  onChange={() => handleToggleOffer(index)}
                />
                <span className="text-sm text-gray-700">
                  Enable Trending Offer
                </span>
              </label>

              {bus.trendingOffer?.isActive && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Upload Offer Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleFileChange(index, e.target.files[0])
                      }
                      className="w-full border rounded px-3 py-1 text-sm"
                    />
                  </div>

                  {previewUrl && (
                    <div className="mt-2 aspect-[3/4] overflow-hidden rounded-md shadow">
                      <img
                        src={previewUrl}
                        alt="Offer preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={() => handleSave(index)}
                className="mt-4 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminTrendingOffers;
