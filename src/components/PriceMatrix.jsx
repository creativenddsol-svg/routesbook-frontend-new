import React from "react";

/**
 * A component that renders a pricing matrix for setting fares based on boarding and dropping points.
 * @param {object} props - The component props.
 * @param {Array<object>} props.boardingPoints - Array of boarding point objects.
 * @param {Array<object>} props.droppingPoints - Array of dropping point objects.
 * @param {Array<object>} props.fares - The current array of fare objects [{ boardingPoint, droppingPoint, price }].
 * @param {function} props.setFares - The state setter function from the parent component to update the fares array.
 */
const PriceMatrix = ({ boardingPoints, droppingPoints, fares, setFares }) => {
  const handlePriceChange = (
    boardingPointName,
    droppingPointName,
    priceStr
  ) => {
    const price = parseInt(priceStr, 10);
    let updatedFares = [...fares];

    const fareIndex = updatedFares.findIndex(
      (f) =>
        f.boardingPoint === boardingPointName &&
        f.droppingPoint === droppingPointName
    );

    if (fareIndex > -1) {
      if (price > 0) {
        updatedFares[fareIndex].price = price;
      } else {
        updatedFares.splice(fareIndex, 1);
      }
    } else if (price > 0) {
      updatedFares.push({
        boardingPoint: boardingPointName,
        droppingPoint: droppingPointName,
        price: price,
      });
    }
    setFares(updatedFares);
  };

  const findPrice = (boardingPointName, droppingPointName) => {
    const fare = fares.find(
      (f) =>
        f.boardingPoint === boardingPointName &&
        f.droppingPoint === droppingPointName
    );
    return fare ? fare.price : "";
  };

  if (!boardingPoints?.length || !droppingPoints?.length) {
    return (
      <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-md">
        Please add at least one boarding and one dropping point to set specific
        fares.
      </div>
    );
  }

  return (
    <fieldset className="border p-4 rounded-md">
      <legend className="text-lg font-semibold text-gray-600 px-2">
        Price Matrix (Optional)
      </legend>
      <p className="text-sm text-gray-500 mb-4 px-2">
        Leave cells blank to use the "Default Ticket Price". Only enter prices
        here to override the default for specific routes.
      </p>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-50">
              <th className="border p-2 text-left text-sm font-medium text-gray-600">
                From ↓ / To →
              </th>
              {/* --- MODIFIED: Create a column header for each DROPPING point --- */}
              {droppingPoints.map((dp) => (
                <th
                  key={dp.point}
                  className="border p-2 text-sm font-medium text-gray-600"
                >
                  {dp.point}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* --- MODIFIED: Create a row for each BOARDING point --- */}
            {boardingPoints.map((bp) => (
              <tr key={bp.point} className="hover:bg-gray-50">
                <td className="border p-2 font-bold text-sm text-gray-700">
                  {bp.point}
                </td>
                {/* --- MODIFIED: In each row, create a cell for each DROPPING point --- */}
                {droppingPoints.map((dp) => (
                  <td key={dp.point} className="border p-1">
                    <input
                      type="number"
                      min="0"
                      placeholder="-"
                      // The order of arguments here is correct (boarding, dropping)
                      value={findPrice(bp.point, dp.point)}
                      onChange={(e) =>
                        handlePriceChange(bp.point, dp.point, e.target.value)
                      }
                      className="w-full p-2 text-center rounded-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </fieldset>
  );
};

export default PriceMatrix;
