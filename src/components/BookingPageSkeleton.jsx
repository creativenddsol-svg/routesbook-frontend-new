import React from "react";

const BookingPageSkeleton = () => {
  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 animate-pulse">
      <div className="h-8 bg-gray-200 rounded-md w-1/2 mb-6"></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column Skeleton */}
        <div className="lg:col-span-2 space-y-6">
          <div className="h-10 bg-gray-200 rounded-md w-3/4"></div>
          <div className="h-12 bg-gray-200 rounded-md w-1/2"></div>
          <div className="p-4 bg-gray-100 rounded-lg border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
            </div>
            <div className="space-y-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex justify-center gap-2">
                  <div className="w-10 h-10 bg-gray-300 rounded-md"></div>
                  <div className="w-10 h-10 bg-gray-300 rounded-md"></div>
                  <div className="w-10 h-10"></div>
                  <div className="w-10 h-10 bg-gray-300 rounded-md"></div>
                  <div className="w-10 h-10 bg-gray-300 rounded-md"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column Skeleton */}
        <div className="lg:col-span-1">
          <div className="p-6 bg-white rounded-lg shadow-md space-y-4">
            <div className="h-8 bg-gray-300 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <hr />
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-10 bg-gray-300 rounded w-full"></div>
            <div className="h-12 bg-gray-400 rounded-md w-full mt-4"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPageSkeleton;
