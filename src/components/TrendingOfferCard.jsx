import { useNavigate } from "react-router-dom";

const TrendingOfferCard = ({ bus }) => {
  const navigate = useNavigate();

  const imageUrl = bus.trendingOffer?.imageUrl || "/images/card-bg-default.jpg";

  const handleCardClick = () => {
    const queryDate = bus.date
      ? new Date(bus.date).toISOString().split("T")[0]
      : "";
    navigate(`/book/${bus._id}?date=${queryDate}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="shrink-0 w-60 aspect-[3/4] rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer"
    >
      <img
        src={imageUrl}
        alt="Trending Offer"
        className="w-full h-full object-cover"
      />
    </div>
  );
};

export default TrendingOfferCard;
