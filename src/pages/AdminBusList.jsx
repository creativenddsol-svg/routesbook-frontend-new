import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { useAuth } from "../AuthContext";
import { Link } from "react-router-dom";

// --- Helper & Icon Components ---
const Icon = ({ path, className = "w-5 h-5" }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d={path}
    />
  </svg>
);

const Badge = ({ children, color = "gray" }) => {
  const colors = {
    gray: "bg-gray-100 text-gray-700",
    red: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`px-2 py-1 text-xs font-medium rounded-full ${colors[color]}`}
    >
      {children}
    </span>
  );
};

// --- UI Components ---
const LoadingSpinner = () => (
  <div className="flex justify-center items-center py-20">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

const EmptyState = ({ onClearFilters }) => (
  <div className="text-center py-20 bg-white rounded-lg shadow-sm">
    <div className="text-6xl mb-4">🔍</div>
    <h3 className="text-xl font-semibold text-gray-800">
      No Buses Match Your Filters
    </h3>
    <p className="text-gray-500 mt-2 mb-6">
      Try adjusting your search or clearing the filters.
    </p>
    <button
      onClick={onClearFilters}
      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors"
    >
      Clear Filters
    </button>
  </div>
);

// --- Bus List Components (Card and Table Row) ---
const BusCard = ({ bus, onDelete }) => (
  <div className="bg-white rounded-xl shadow border border-gray-200 p-5 hover:shadow-lg transition-shadow duration-300">
    <div className="flex justify-between items-start mb-4">
      <div>
        <h3 className="text-lg font-bold text-gray-900">{bus.name}</h3>
        <p className="text-sm text-gray-600">{bus.busNumber}</p>
      </div>
      <div className="flex gap-2">
        <Link
          to={`/admin/edit-bus/${bus._id}`}
          className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-colors"
        >
          <Icon path="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </Link>
        <button
          onClick={() => onDelete(bus._id)}
          className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-full transition-colors"
        >
          <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </button>
      </div>
    </div>
    <div className="space-y-3">
      <div className="flex items-center text-gray-700">
        <Icon
          path="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z"
          className="w-5 h-5 mr-3 text-gray-400"
        />
        <span className="font-medium">{bus.from}</span>
        <span className="mx-2">→</span>
        <span className="font-medium">{bus.to}</span>
      </div>
      <div className="flex items-center text-gray-700">
        <Icon
          path="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4m-4 5h4m-4 4h4m-4-8h4m-8 4h.01M4 21h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2z"
          className="w-5 h-5 mr-3 text-gray-400"
        />
        <span>Departure: {bus.departureTime}</span>
      </div>
      {bus.unavailableDates?.length > 0 && (
        <div className="pt-2">
          <h4 className="text-xs font-semibold text-red-800 mb-1">
            Unavailable Dates
          </h4>
          <div className="flex flex-wrap gap-1">
            {bus.unavailableDates.map((date) => (
              <Badge key={date} color="red">
                {date}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  </div>
);

const BusTableRow = ({ bus, onDelete }) => (
  <tr className="hover:bg-gray-50 transition-colors duration-150">
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="text-sm font-semibold text-gray-900">{bus.name}</div>
      <div className="text-xs text-gray-500">{bus.busNumber}</div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
      {bus.from} → {bus.to}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
      {bus.departureTime}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
      {bus.arrivalTime}
    </td>
    <td className="px-6 py-4">
      {bus.unavailableDates?.length > 0 ? (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {bus.unavailableDates.map((date) => (
            <Badge key={date} color="red">
              {date}
            </Badge>
          ))}
        </div>
      ) : (
        <Badge>None</Badge>
      )}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-right">
      <div className="flex items-center justify-end gap-2">
        <Link to={`/admin/edit-bus/${bus._id}`}>
          <button
            className="bg-gray-100 hover:bg-blue-500 hover:text-white text-gray-700 p-2 rounded-lg transition-colors"
            title="Edit Bus"
          >
            <Icon path="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </button>
        </Link>
        <button
          onClick={() => onDelete(bus._id)}
          className="bg-gray-100 hover:bg-red-500 hover:text-white text-gray-700 p-2 rounded-lg transition-colors"
          title="Delete Bus"
        >
          <Icon path="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </button>
      </div>
    </td>
  </tr>
);

const AdminBusList = () => {
  const [buses, setBuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    searchTerm: "",
    route: "",
    date: "",
    sortBy: "name",
  });

  useEffect(() => {
    const fetchBuses = async () => {
      try {
        setLoading(true);
        const res = await axios.get("http://localhost:5000/api/buses");
        setBuses(res.data);
      } catch (err) {
        console.error("Failed to fetch buses", err);
        // You might want to set an error state here
      } finally {
        setLoading(false);
      }
    };
    fetchBuses();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({ searchTerm: "", route: "", date: "", sortBy: "name" });
  };

  const filteredBuses = useMemo(() => {
    let filtered = [...buses];
    const { searchTerm, route, date, sortBy } = filters;

    if (searchTerm) {
      const lowerCaseSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (bus) =>
          bus.name.toLowerCase().includes(lowerCaseSearch) ||
          bus.from.toLowerCase().includes(lowerCaseSearch) ||
          bus.to.toLowerCase().includes(lowerCaseSearch) ||
          bus.busNumber?.toLowerCase().includes(lowerCaseSearch)
      );
    }

    if (route) {
      filtered = filtered.filter((bus) => `${bus.from} → ${bus.to}` === route);
    }

    if (date) {
      filtered = filtered.filter(
        (bus) => bus.date === date || bus.unavailableDates?.includes(date)
      );
    }

    filtered.sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "route")
        return `${a.from} → ${a.to}`.localeCompare(`${b.from} → ${b.to}`);
      if (sortBy === "date") return new Date(a.date) - new Date(b.date);
      return 0;
    });

    return filtered;
  }, [buses, filters]);

  const uniqueRoutes = useMemo(
    () => [...new Set(buses.map((bus) => `${bus.from} → ${bus.to}`))],
    [buses]
  );

  const handleDelete = async (id) => {
    if (
      !window.confirm("Are you sure you want to permanently delete this bus?")
    )
      return;

    try {
      await axios.delete(`http://localhost:5000/api/admin/buses/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setBuses((prev) => prev.filter((b) => b._id !== id));
      alert("Bus deleted successfully!");
    } catch (err) {
      alert("Failed to delete bus. Please try again.");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Bus Management</h1>
            <p className="mt-1 text-gray-600">
              A complete overview of your bus fleet.
            </p>
          </div>
          <Link to="/admin/add-bus">
            <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 inline-flex items-center gap-2 w-full sm:w-auto">
              <Icon path="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              Add New Bus
            </button>
          </Link>
        </header>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <input
                type="text"
                name="searchTerm"
                placeholder="Search by name, route, number..."
                value={filters.searchTerm}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
            </div>
            <select
              name="route"
              value={filters.route}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            >
              <option value="">All Routes</option>
              {uniqueRoutes.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <input
              type="date"
              name="date"
              value={filters.date}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
            <select
              name="sortBy"
              value={filters.sortBy}
              onChange={handleFilterChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            >
              <option value="name">Sort by Name</option>
              <option value="route">Sort by Route</option>
              <option value="date">Sort by Date</option>
            </select>
          </div>
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Showing{" "}
              <span className="font-semibold text-gray-800">
                {filteredBuses.length}
              </span>{" "}
              of {buses.length} buses.
            </div>
            {(filters.searchTerm || filters.route || filters.date) && (
              <button
                onClick={clearFilters}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            {filteredBuses.length === 0 ? (
              <EmptyState onClearFilters={clearFilters} />
            ) : (
              <>
                {/* Mobile/Tablet Card View */}
                <div className="block lg:hidden space-y-4">
                  {filteredBuses.map((bus) => (
                    <BusCard key={bus._id} bus={bus} onDelete={handleDelete} />
                  ))}
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Bus Details
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Route
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Departure
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Arrival
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Unavailable Dates
                        </th>
                        <th className="relative px-6 py-3">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredBuses.map((bus) => (
                        <BusTableRow
                          key={bus._id}
                          bus={bus}
                          onDelete={handleDelete}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminBusList;
