// src/components/PromotionCarousel.jsx
import React, { useEffect, useState } from "react";
import axios from "axios"; // We'll use this later for backend integration
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination, Navigation } from "swiper/modules";

// Import Swiper styles
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/navigation";

// Placeholder for PALETTE if needed for styling, or import from SearchResults.jsx if accessible
// For this component, PALETTE might not be directly needed unless you add text overlays
// const PALETTE = {
//   primaryRed: "#D84E55",
//   accentBlue: "#3A86FF",
//   // ... other colors
// };

// Initial static data (will be replaced by API call)
const staticPromotions = [
  {
    _id: "1",
    imageUrl:
      "https://via.placeholder.com/800x300/3A86FF/FFFFFF?text=Special+Offer+1",
    title: "Special Offer 1", // For alt text
  },
  {
    _id: "2",
    imageUrl:
      "https://via.placeholder.com/800x300/D84E55/FFFFFF?text=Exciting+Deals+Here",
    title: "Exciting Deals Here",
  },
  {
    _id: "3",
    imageUrl:
      "https://via.placeholder.com/800x300/28a745/FFFFFF?text=Travel+More+Save+More",
    title: "Travel More Save More",
  },
];

const PromotionCarousel = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Replace with actual API call to fetch promotions
    // For now, using static data after a short delay
    const fetchPromos = async () => {
      try {
        // Example API call (uncomment and adjust when backend is ready)
        // const response = await axios.get('http://localhost:5000/api/promotions');
        // setPromotions(response.data);
        setTimeout(() => {
          // Simulate API call
          setPromotions(staticPromotions);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error("Error fetching promotions:", error);
        setPromotions(staticPromotions); // Fallback to static on error
        setLoading(false);
      }
    };

    fetchPromos();
  }, []);

  if (loading) {
    return (
      <div
        className="mb-8 p-4 bg-gray-200 rounded-lg animate-pulse"
        style={{ height: "200px" }}
      >
        <p className="text-center text-gray-500">Loading Promotions...</p>
      </div>
    );
  }

  if (!promotions || promotions.length === 0) {
    return null; // Don't render if no promotions
  }

  return (
    <div className="mb-8 shadow-lg rounded-lg overflow-hidden">
      <Swiper
        spaceBetween={0} // No space if images are full width of the slide
        centeredSlides={true}
        autoplay={{
          delay: 3500,
          disableOnInteraction: false,
        }}
        pagination={{
          clickable: true,
        }}
        navigation={true} // Set to false if you don't want nav arrows
        modules={[Autoplay, Pagination, Navigation]}
        className="mySwiper"
        loop={true}
      >
        {promotions.map((promo) => (
          <SwiperSlide key={promo._id}>
            <img
              src={promo.imageUrl}
              alt={promo.title || "Promotion"}
              className="w-full h-auto md:h-72 object-cover" // Adjust height as needed
            />
            {/* If you want a title overlay (optional)
            <div className="absolute bottom-0 left-0 bg-black bg-opacity-50 text-white p-2 w-full text-center">
              {promo.title}
            </div>
            */}
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default PromotionCarousel;
