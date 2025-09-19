// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import { AuthProvider } from "./context/AuthContext";

/* ───── Public Pages ──── */
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import SearchResults from "./pages/SearchResults";
import DownloadTicket from "./pages/DownloadTicket";
import Payment from "./pages/Payment";
import BookingPage from "./pages/BookingPage";
import ConfirmBooking from "./pages/ConfirmBooking";
import MyBookings from "./pages/MyBookings";
import Profile from "./pages/Profiles";
import AllOperators from "./pages/AllOperators";

/* ───── Admin Pages ──── */
import AdminDashboard from "./pages/AdminDashboard";
import AdminBusList from "./pages/AdminBusList";
import AddBus from "./pages/AddBus";
import EditBus from "./pages/EditBus";
import AdminBookings from "./pages/AdminBookings";
import AdminBusAvailability from "./pages/AdminBusAvailability";
import AdminAuditLogs from "./pages/AdminAuditLogs";
import AdminSpecialNotices from "./pages/AdminSpecialNotices";
import AdminRegisterOperator from "./pages/AdminRegisterOperator";
import AdminOperatorList from "./pages/AdminOperatorList";
import AdminOperatorPayments from "./pages/AdminOperatorPayments"; // ✅ NEW IMPORT
import AdminNotices from "./pages/AdminNotices"; // ✅ ADDED

/* ───── Operator Pages ──── */
import OperatorDashboard from "./pages/OperatorDashboard";
import OperatorProfile from "./pages/OperatorProfile";
import OperatorBusList from "./pages/operator/OperatorBusList";
import OperatorBusSeatView from "./pages/operator/OperatorBusSeatView";

/* ───── Route Guards ──── */
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

/* ───── UI ──── */
import MobileBottomNav from "./components/MobileBottomNav";

// ───── App Component ─────
const App = () => (
  <AuthProvider>
    <Router>
      <Layout>
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
          <Route path="/operators" element={<AllOperators />} />
          <Route path="/operators/:id" element={<OperatorProfile />} />

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
        </Routes>

        <MobileBottomNav />
      </Layout>
    </Router>
  </AuthProvider>
);

export default App;
