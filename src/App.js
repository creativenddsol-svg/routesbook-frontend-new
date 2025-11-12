// src/App.jsx
import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import { AuthProvider } from "./context/AuthContext";

/* ───── Lazy-loaded Pages (keeps bundle small) ──── */
const Home = lazy(() => import("./pages/Home")); // resolves to /pages/Home/index.jsx

/* ───── Public Pages ──── */
const Signup = lazy(() => import("./pages/Signup"));
const Login = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const SearchResults = lazy(() => import("./pages/SearchResults"));
const DownloadTicket = lazy(() => import("./pages/DownloadTicket"));
const Payment = lazy(() => import("./pages/Payment"));
const BookingPage = lazy(() => import("./pages/BookingPage"));
const ConfirmBooking = lazy(() => import("./pages/ConfirmBooking"));
const MyBookings = lazy(() => import("./pages/MyBookings"));
const Profile = lazy(() => import("./pages/Profiles"));
const AllOperators = lazy(() => import("./pages/AllOperators"));
const WhatsNew = lazy(() => import("./pages/WhatsNew"));
const PaymentFailed = lazy(() => import("./pages/PaymentFailed"));

/* ───── Admin Pages ──── */
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminBusList = lazy(() => import("./pages/AdminBusList"));
const AddBus = lazy(() => import("./pages/AddBus"));
const EditBus = lazy(() => import("./pages/EditBus"));
const AdminBookings = lazy(() => import("./pages/AdminBookings"));
const AdminBusAvailability = lazy(() => import("./pages/AdminBusAvailability"));
const AdminAuditLogs = lazy(() => import("./pages/AdminAuditLogs"));
const AdminSpecialNotices = lazy(() => import("./pages/AdminSpecialNotices"));
const AdminRegisterOperator = lazy(() => import("./pages/AdminRegisterOperator"));
const AdminOperatorList = lazy(() => import("./pages/AdminOperatorList"));
const AdminOperatorPayments = lazy(() => import("./pages/OperatorPaymentsAdmin.jsx")); // path kept as-is
const AdminNotices = lazy(() => import("./pages/AdminNotices"));
const AdminWhatsNew = lazy(() => import("./pages/AdminWhatsNew"));
const AdminHolidays = lazy(() => import("./pages/AdminHolidays"));
const AdminArrivalsToday = lazy(() => import("./pages/AdminArrivalsToday"));

/* ───── Operator Pages ──── */
const OperatorDashboard = lazy(() => import("./pages/OperatorDashboard"));
const OperatorProfile = lazy(() => import("./pages/OperatorProfile"));
const OperatorBusList = lazy(() => import("./pages/operator/OperatorBusList"));
const OperatorBusSeatView = lazy(() => import("./pages/operator/OperatorBusSeatView"));

/* ───── Route Guards ──── */
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

/* ───── UI ──── */
import MobileBottomNav from "./components/MobileBottomNav";

/* ───── Small loader ──── */
const Fallback = () => (
  <div className="w-full py-20 text-center text-gray-500">Loading…</div>
);

// ───── App Component ─────
const App = () => (
  <AuthProvider>
    <Router>
      <Layout>
        <Suspense fallback={<Fallback />}>
          <Routes>
            {/* ───── PUBLIC ROUTES ───── */}
            <Route path="/" element={<Home />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} />
            <Route path="/search-results" element={<SearchResults />} />
            <Route path="/download-ticket" element={<DownloadTicket />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/payment-failed" element={<PaymentFailed />} />
            <Route path="/operators" element={<AllOperators />} />
            <Route path="/operators/:id" element={<OperatorProfile />} />
            <Route path="/whats-new" element={<WhatsNew />} />

            {/* ───── USER PROTECTED ROUTES ───── */}
            <Route
              path="/my-bookings"
              element={
                <ProtectedRoute>
                  <MyBookings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/book/:busId"
              element={
                <ProtectedRoute>
                  <BookingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/confirm-booking"
              element={
                <ProtectedRoute>
                  <ConfirmBooking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* ───── ADMIN ROUTES ───── */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/buses"
              element={
                <AdminRoute>
                  <AdminBusList />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/add-bus"
              element={
                <AdminRoute>
                  <AddBus />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/edit-bus/:busId"
              element={
                <AdminRoute>
                  <EditBus />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/bookings"
              element={
                <AdminRoute>
                  <AdminBookings />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/availability"
              element={
                <AdminRoute>
                  <AdminBusAvailability />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/audit-logs"
              element={
                <AdminRoute>
                  <AdminAuditLogs />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/special-notices"
              element={
                <AdminRoute>
                  <AdminSpecialNotices />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/operators"
              element={
                <AdminRoute>
                  <AdminOperatorList />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/register-operator"
              element={
                <AdminRoute>
                  <AdminRegisterOperator />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/operator-payments"
              element={
                <AdminRoute>
                  <AdminOperatorPayments />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/notices"
              element={
                <AdminRoute>
                  <AdminNotices />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/whats-new"
              element={
                <AdminRoute>
                  <AdminWhatsNew />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/holidays"
              element={
                <AdminRoute>
                  <AdminHolidays />
                </AdminRoute>
              }
            />
            <Route
              path="/admin/arrivals-today"
              element={
                <AdminRoute>
                  <AdminArrivalsToday />
                </AdminRoute>
              }
            />

            {/* ───── OPERATOR ROUTES ──── */}
            <Route
              path="/operator/dashboard"
              element={
                <ProtectedRoute>
                  <OperatorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/operator/profile"
              element={
                <ProtectedRoute>
                  <OperatorProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/operator/buses"
              element={
                <ProtectedRoute>
                  <OperatorBusList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/operator/bus/:busId"
              element={
                <ProtectedRoute>
                  <OperatorBusSeatView />
                </ProtectedRoute>
              }
            />

            {/* Optional: simple 404 */}
            <Route path="*" element={<Fallback />} />
          </Routes>
        </Suspense>

        <MobileBottomNav />
      </Layout>
    </Router>
  </AuthProvider>
);

export default App;
