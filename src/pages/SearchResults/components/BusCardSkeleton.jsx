import React from "react";

export default function BusCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl p-6 animate-pulse border border-gray-300">
      <div className="flex justify-between items-start">
        <div className="flex-1 pr-4">
          <div className="h-6 w-3/5 rounded bg-gray-200 mb-4"></div>
          <div className="h-4 w-4/5 rounded bg-gray-200"></div>
        </div>
        <div className="h-10 w-24 rounded-lg bg-gray-200"></div>
      </div>
      <div className="border-t border-dashed my-5 border-gray-200"></div>
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <div className="h-8 w-24 rounded-full bg-gray-200"></div>
          <div className="h-8 w-24 rounded-full bg-gray-200"></div>
        </div>
        <div className="h-12 w-32 rounded-lg bg-gray-200"></div>
      </div>
    </div>
  );
}
