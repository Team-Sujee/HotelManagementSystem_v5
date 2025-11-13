import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import LoginPage from './pages/LoginPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import RoomsPage from './pages/RoomsPage'
import HousekeepingPage from './pages/HousekeepingPage'
import GuestsPage from './pages/GuestsPage'
import ReservationsPage from './pages/ReservationsPage'
import PricingPage from './pages/PricingPage'
import TaxRatesPage from './pages/TaxRatesPage'
import CurrencyRatesPage from './pages/CurrencyRatesPage'
import ChannelsPage from './pages/ChannelsPage'
import InvoicesPage from './pages/InvoicesPage'
import ServicesPage from './pages/ServicesPage'
import MealsPage from './pages/MealsPage'
import PoliciesPage from './pages/PoliciesPage'
import EventsPage from './pages/EventsPage'
import DashboardLayout from './components/templates/DashboardLayout'
import { UserRole } from './types'

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles: UserRole[]
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, role } = useAuthStore()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (role && !allowedRoles.includes(role)) {
    // Redirect to a "not authorized" page or dashboard
    return <Navigate to="/admin-dashboard" replace /> // Example: redirect to admin dashboard if not authorized for specific route
  }

  return <>{children}</>
}

function App() {
  const { user } = useAuthStore()

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={user ? <Navigate to="/admin-dashboard" replace /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute allowedRoles={[UserRole.Admin, UserRole.Receptionist]}>
              <DashboardLayout>
                <AdminDashboardPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/rooms"
          element={
            <ProtectedRoute allowedRoles={[UserRole.Admin, UserRole.Receptionist]}>
              <DashboardLayout>
                <RoomsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/housekeeping"
          element={
            <ProtectedRoute allowedRoles={[UserRole.Admin, UserRole.Housekeeping]}>
              <DashboardLayout>
                <HousekeepingPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/guests"
          element={
            <ProtectedRoute allowedRoles={[UserRole.Admin, UserRole.Receptionist]}>
              <DashboardLayout>
                <GuestsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reservations"
          element={
            <ProtectedRoute allowedRoles={[UserRole.Admin, UserRole.Receptionist]}>
              <DashboardLayout>
                <ReservationsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/events"
          element={
            <ProtectedRoute allowedRoles={[UserRole.Admin, UserRole.Receptionist]}>
              <DashboardLayout>
                <EventsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/pricing"
          element={
            <ProtectedRoute allowedRoles={[UserRole.Admin]}>
              <DashboardLayout>
                <PricingPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/taxes"
          element={
            <ProtectedRoute allowedRoles={[UserRole.Admin]}>
              <DashboardLayout>
                <TaxRatesPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/currencies"
          element={
            <ProtectedRoute allowedRoles={[UserRole.Admin]}>
              <DashboardLayout>
                <CurrencyRatesPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/channels"
          element={
            <ProtectedRoute allowedRoles={[UserRole.Admin]}>
              <DashboardLayout>
                <ChannelsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/invoicing"
          element={
            <ProtectedRoute allowedRoles={[UserRole.Admin, UserRole.Receptionist]}>
              <DashboardLayout>
                <InvoicesPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/services"
          element={
            <ProtectedRoute allowedRoles={[UserRole.Admin, UserRole.Receptionist]}>
              <DashboardLayout>
                <ServicesPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/meals"
          element={
            <ProtectedRoute allowedRoles={[UserRole.Admin, UserRole.Receptionist]}>
              <DashboardLayout>
                <MealsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/policies"
          element={
            <ProtectedRoute allowedRoles={[UserRole.Admin]}>
              <DashboardLayout>
                <PoliciesPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        {/* Add more routes for other modules here */}
        <Route path="*" element={<Navigate to={user ? "/admin-dashboard" : "/login"} replace />} />
      </Routes>
    </Router>
  )
}

export default App
