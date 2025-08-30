import { useEffect, useState } from "react";
import axios from "axios";
import TrendingOfferCard from "./TrendingOfferCard";

const TrendingOffers = () => {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      setLoading(true);
      try {
        const res = await axios.get("http://localhost:5000/api/buses/trending");
        setBuses(res.data);
      } catch (err) {
        console.error("Failed to load trending offers:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, []);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-12 px-4 text-center">
        <p className="text-gray-600">Loading offers...</p>
      </div>
    );
  }

  if (buses.length === 0) {
    return null; // Don't show the section if there are no offers
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      {/* --- Redbus-style Section Header --- */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-800">
          Offers for you
        </h2>
        <a
          href="#"
          className="text-sm font-medium text-blue-600 hover:underline"
        >
          View more
        </a>
      </div>

      {/* --- Horizontal Scrolling Container --- */}
      <div className="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4">
        {buses.map((bus) => (
          <TrendingOfferCard bus={bus} key={bus._id} />
        ))}
      </div>
    </div>
  );
};

export default TrendingOffers;
