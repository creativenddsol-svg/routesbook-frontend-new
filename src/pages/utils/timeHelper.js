// src/utils/timeHelper.js
export const getScheduledTime = (bus, date) => {
  if (!bus || !date) {
    return {
      departureTime: bus?.departureTime || "",
      arrivalTime: bus?.arrivalTime || "",
      isRotating: false,
    };
  }

  const { rotationSchedule } = bus;
  if (!rotationSchedule || !rotationSchedule.isRotating) {
    return {
      departureTime: bus.departureTime,
      arrivalTime: bus.arrivalTime,
      isRotating: false,
    };
  }

  const { startDate, rotationLength, intervals } = rotationSchedule;
  const bookingDate = new Date(date);
  const rotationStartDate = new Date(startDate);

  if (
    !startDate ||
    isNaN(bookingDate) ||
    isNaN(rotationStartDate) ||
    !rotationLength
  ) {
    return {
      departureTime: bus.departureTime,
      arrivalTime: bus.arrivalTime,
      isRotating: false,
    };
  }

  // Calculate the difference in days
  const timeDiff = bookingDate.getTime() - rotationStartDate.getTime();
  const dayDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

  if (dayDiff < 0) {
    return {
      departureTime: bus.departureTime,
      arrivalTime: bus.arrivalTime,
      isRotating: false,
    };
  }

  const dayOffset = dayDiff % rotationLength;
  const daySchedule = intervals.find((i) => i.dayOffset === dayOffset);

  if (daySchedule && daySchedule.turns && daySchedule.turns.length > 0) {
    // For simplicity, this example returns the first turn of the day.
    // You can expand this to handle multiple turns if needed.
    return { ...daySchedule.turns[0], isRotating: true };
  }

  // Fallback to default times if no specific schedule for that day
  return {
    departureTime: bus.departureTime,
    arrivalTime: bus.arrivalTime,
    isRotating: false,
  };
};
