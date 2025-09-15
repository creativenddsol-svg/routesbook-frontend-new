import React, { useState, useEffect } from "react";
import apiClient from "../api";
import { toast } from "react-hot-toast";
import { subDays, format } from "date-fns";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

// --- Reusable KPI Card Component (No changes) ---
const KpiCard = ({ title, value, formatAsCurrency = false }) => (
  <div className="bg-white rounded-lg shadow p-5">
    <h2 className="text-sm font-medium text-gray-500 mb-1">{title}</h2>
    <p className="text-3xl font-bold text-gray-900">
      {formatAsCurrency ? `Rs. ${value.toLocaleString()}` : value}
    </p>
  </div>
);

// --- Main Combined Component ---
const OperatorDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // This state now handles date ranges
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 6),
    to: new Date(),
  });

  // Effect to fetch all necessary data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await apiClient.get("/operator/dashboard", {
          // It sends startDate and endDate as required by the backend
          params: {
            startDate: format(dateRange.from, "yyyy-MM-dd"),
            endDate: format(dateRange.to, "yyyy-MM-dd"),
          },
        });
        setData(res.data);
      } catch (error) {
        toast.error(
          error.response?.data?.message || "Failed to load dashboard."
        );
        setData(null); // Set data to null on error to show "No data" message
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [dateRange]); // Refetches when the date range changes

  // Pre-defined date ranges for the buttons
  const dateRanges = {
    Today: { from: new Date(), to: new Date() },
    "Last 7 Days": { from: subDays(new Date(), 6), to: new Date() },
    "Last 30 Days": { from: subDays(new Date(), 29), to: new Date() },
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8 bg-gray-50 min-h-screen">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-3xl font-bold text-gray-900">Operator Portal</h1>
        {/* Date range buttons are always visible */}
        <div className="mt-4 sm:mt-0 flex items-center space-x-2 bg-white p-1 rounded-lg shadow-sm">
          {Object.keys(dateRanges).map((rangeName) => (
            <button
              key={rangeName}
              onClick={() => setDateRange(dateRanges[rangeName])}
              className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
                format(dateRange.from, "yyyy-MM-dd") ===
                  format(dateRanges[rangeName].from, "yyyy-MM-dd") &&
                format(dateRange.to, "yyyy-MM-dd") ===
                  format(dateRanges[rangeName].to, "yyyy-MM-dd")
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {rangeName}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {/* Dashboard Tab is always active on this page */}
          <button className="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm border-blue-500 text-blue-600">
            Dashboard
          </button>
          {/* Profile Tab now navigates to the new profile page */}
          <button
            onClick={() => navigate("/operator/profile")}
            className="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
          >
            My Profile
          </button>
        </nav>
      </div>

      {/* Content Area */}
      <div>
        {loading ? (
          <p className="p-6 text-center">Loading...</p>
        ) : !data ? (
          <p className="p-6 text-center">No data available.</p>
        ) : (
          // Dashboard content is now always displayed
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div
                className="bg-white rounded-lg shadow p-5 cursor-pointer hover:shadow-lg hover:scale-105 transition-transform duration-200"
                onClick={() => navigate("/operator/buses")}
              >
                <h2 className="text-sm font-medium text-gray-500 mb-1">
                  Total Buses
                </h2>
                <p className="text-3xl font-bold text-gray-900">
                  {data.totalBuses}
                </p>
              </div>
              <KpiCard
                title="Total Revenue"
                value={data.currentStats.totalRevenue}
                formatAsCurrency
              />
              <KpiCard
                title="Total Bookings"
                value={data.currentStats.totalBookings}
              />
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Quick Actions
              </h3>
              <button
                onClick={() => navigate("/operator/buses")}
                className="flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition-colors"
              >
                View & Manage My Buses <ArrowRight size={18} />
              </button>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Revenue Overview
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.currentStats.dailyBreakdown}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(dateStr) =>
                      format(new Date(dateStr), "MMM d")
                    }
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => [
                      `Rs. ${value.toLocaleString()}`,
                      "Revenue",
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="#3B82F6" name="Daily Revenue" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OperatorDashboard;
