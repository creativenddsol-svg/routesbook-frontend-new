import { Link } from "react-router-dom";

// Icon components for better reusability
const Icon = ({ children }) => <span className="mr-3 text-xl">{children}</span>;

const DashboardCard = ({ to, icon, title, description }) => (
  <Link to={to} className="block group">
    <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md hover:border-blue-500 transition-all duration-300 h-full">
      <h2 className="text-xl font-semibold text-gray-800 flex items-center">
        {icon}
        {title}
      </h2>
      <p className="text-gray-500 text-sm mt-2 ml-9">{description}</p>
    </div>
  </Link>
);

const PlaceholderCard = ({ icon, title, description }) => (
  <div className="p-6 bg-gray-50 border border-gray-200 rounded-lg h-full">
    <h2 className="text-xl font-semibold text-gray-400 flex items-center">
      {icon}
      {title}
    </h2>
    <p className="text-gray-400 text-sm mt-2 ml-9">{description}</p>
  </div>
);

const SectionTitle = ({ children }) => (
  <div className="mt-8 mb-4">
    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
      {children}
    </h2>
    <hr className="mt-2" />
  </div>
);

const AdminDashboard = () => (
  <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">
    <div className="max-w-7xl mx-auto">
      <header className="mb-10">
        <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-lg text-gray-600 mt-1">
          Welcome back, Admin. Manage your application from here.
        </p>
      </header>

      <main>
        {/* --- Core Management Section --- */}
        <SectionTitle>Core Management</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <DashboardCard
            to="/admin/buses"
            icon={<Icon>🚌</Icon>}
            title="Manage Buses"
            description="Add, edit, or delete bus details."
          />
          <DashboardCard
            to="/admin/bookings"
            icon={<Icon>📄</Icon>}
            title="View Bookings"
            description="See all user bookings with details."
          />
          <DashboardCard
            to="/admin/audit-logs"
            icon={<Icon>🕵️</Icon>}
            title="Audit Logs"
            description="Track user actions and system events."
          />
          {/* ✅ New: Arrivals Today (one-click SMS page) */}
          <DashboardCard
            to="/admin/arrivals-today"
            icon={<Icon>📳</Icon>}
            title="Arrivals (Today)"
            description="Send 'Bus Arrived' SMS in one click."
          />
        </div>

        {/* --- Promotions & Content Section --- */}
        <SectionTitle>Promotions & Content</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <DashboardCard
            to="/admin/trending-offers"
            icon={<Icon>🔥</Icon>}
            title="Trending Offers"
            description="Manage and highlight popular discounts."
          />
          <DashboardCard
            to="/admin/special-notices"
            icon={<Icon>✨</Icon>}
            title="Special Notices"
            description="Create and manage promotional banners."
          />
          <DashboardCard
            to="/admin/notices"
            icon={<Icon>📢</Icon>}
            title="Your Notices"
            description="Manage and display important notices."
          />
          {/* ✅ New tile that links to the same page as Special Notices */}
          <DashboardCard
            to="/admin/whats-new"
            icon={<Icon>🆕</Icon>}
            title="What’s New"
            description="Curate cards for the What's New row."
          />
          {/* ✅ Holidays management */}
          <DashboardCard
            to="/admin/holidays"
            icon={<Icon>📆</Icon>}
            title="Holidays"
            description="Manage public holidays shown on Home."
          />
        </div>

        {/* --- Operator Management Section --- */}
        <SectionTitle>Operator Management</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <DashboardCard
            to="/admin/operators"
            icon={<Icon>🚍</Icon>}
            title="Manage Operators"
            description="Add and manage operator profiles."
          />
          <DashboardCard
            to="/admin/register-operator"
            icon={<Icon>➕</Icon>}
            title="Register Operator"
            description="Create a new operator account."
          />
          <DashboardCard
            to="/admin/operator-payments"
            icon={<Icon>💰</Icon>}
            title="Operator Payments"
            description="View and manage operator payouts."
          />
          <DashboardCard
            to="/operators"
            icon={<Icon>🔎</Icon>}
            title="View Operators"
            description="See public operator profiles."
          />
        </div>

        {/* --- System & Views Section --- */}
        <SectionTitle>System & Views</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <DashboardCard
            to="/operator/dashboard"
            icon={<Icon>🗂</Icon>}
            title="Operator Dashboard"
            description="Switch to the operator view."
          />
          <PlaceholderCard
            icon={<Icon>📊</Icon>}
            title="Analytics"
            description="Performance metrics (coming soon)."
          />
        </div>
      </main>
    </div>
  </div>
);

export default AdminDashboard;
