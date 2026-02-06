import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Navbar from './components/layout/Navbar';
import PublicNavbar from './components/layout/PublicNavbar';

// Public pages
import Home from './pages/Home';

// Auth pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Unauthorized from './pages/Unauthorized';

// Admin pages
import PlatformDashboard from './pages/admin/PlatformDashboard';
import RoleManagement from './pages/admin/RoleManagement';
import SystemSettings from './pages/admin/SystemSettings';
import AuditLogs from './pages/admin/AuditLogs';
import UserManagement from './pages/admin/UserManagement';

// Organization pages
import OrganizationSetup from './pages/organization/OrganizationSetup';
import OrganizationDashboard from './pages/organization/OrganizationDashboard';
import ServiceManagement from './pages/organization/ServiceManagement';
import EmployeeManagement from './pages/organization/EmployeeManagement';
import OrganizationAnalytics from './pages/organization/OrganizationAnalytics';
import QueueMonitor from './pages/organization/QueueMonitor';
import NoShowManagement from './pages/organization/NoShowManagement';

// Customer pages
import OrganizationSearch from './pages/customer/OrganizationSearch';
import BookAppointment from './pages/customer/BookAppointment';
import MyAppointments from './pages/customer/MyAppointments';

// Operator pages
import QueueControl from './pages/operator/QueueControl';
import QRScanner from './pages/operator/QRScanner';

function AppContent() {
  const { currentUser } = useAuth();

  return (
    <div className="app">
      {currentUser ? <Navbar /> : <PublicNavbar />}

      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Platform Admin routes */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['PLATFORM_ADMIN']}>
              <PlatformDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/roles"
          element={
            <ProtectedRoute allowedRoles={['PLATFORM_ADMIN']}>
              <RoleManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute allowedRoles={['PLATFORM_ADMIN']}>
              <SystemSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/audit-logs"
          element={
            <ProtectedRoute allowedRoles={['PLATFORM_ADMIN']}>
              <AuditLogs />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute allowedRoles={['PLATFORM_ADMIN']}>
              <UserManagement />
            </ProtectedRoute>
          }
        />

        {/* Organization Admin routes */}
        <Route
          path="/organization/setup"
          element={
            <ProtectedRoute allowedRoles={['ORG_ADMIN']}>
              <OrganizationSetup />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organization/dashboard"
          element={
            <ProtectedRoute allowedRoles={['ORG_ADMIN']}>
              <OrganizationDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organization/services"
          element={
            <ProtectedRoute allowedRoles={['ORG_ADMIN']}>
              <ServiceManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organization/employees"
          element={
            <ProtectedRoute allowedRoles={['ORG_ADMIN']}>
              <EmployeeManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organization/analytics"
          element={
            <ProtectedRoute allowedRoles={['ORG_ADMIN']}>
              <OrganizationAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organization/queue-monitor"
          element={
            <ProtectedRoute allowedRoles={['ORG_ADMIN']}>
              <QueueMonitor />
            </ProtectedRoute>
          }
        />
        <Route
          path="/organization/no-show"
          element={
            <ProtectedRoute allowedRoles={['ORG_ADMIN']}>
              <NoShowManagement />
            </ProtectedRoute>
          }
        />

        {/* Employee/Operator routes */}
        <Route
          path="/operator/queue"
          element={
            <ProtectedRoute allowedRoles={['EMPLOYEE']}>
              <QueueControl />
            </ProtectedRoute>
          }
        />
        <Route
          path="/operator/scanner"
          element={
            <ProtectedRoute allowedRoles={['EMPLOYEE']}>
              <QRScanner />
            </ProtectedRoute>
          }
        />

        {/* Customer routes */}
        <Route
          path="/customer/search"
          element={
            <ProtectedRoute allowedRoles={['CUSTOMER']}>
              <OrganizationSearch />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/book/:organizationId"
          element={
            <ProtectedRoute allowedRoles={['CUSTOMER']}>
              <BookAppointment />
            </ProtectedRoute>
          }
        />
        <Route
          path="/customer/appointments"
          element={
            <ProtectedRoute allowedRoles={['CUSTOMER']}>
              <MyAppointments />
            </ProtectedRoute>
          }
        />

        {/* Default redirect - catch all unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Toast notifications */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#1e293b',
            color: '#fff',
            padding: '16px',
            borderRadius: '8px',
            fontSize: '15px',
            maxWidth: '500px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4ade80',
              secondary: '#fff',
            },
          },
          error: {
            duration: 6000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
            style: {
              background: '#1e293b',
              color: '#fff',
              border: '2px solid #ef4444',
            },
          },
        }}
      />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
