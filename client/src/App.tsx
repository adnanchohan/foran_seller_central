import { Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminPage } from './pages/AdminPage';
import { ApprovalPage } from './pages/ApprovalPage';
import { DashboardPage } from './pages/DashboardPage';
import { JourneyRedirect } from './pages/JourneyRedirect';
import { PaymentPage } from './pages/PaymentPage';
import { PlansPage } from './pages/PlansPage';
import { SignInPage } from './pages/SignInPage';
import { StoreProfilePage } from './pages/StoreProfilePage';

export function App() {
  return (
    <Routes>
      <Route path="/signin" element={<SignInPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <JourneyRedirect />
          </ProtectedRoute>
        }
      />
      <Route
        path="/onboarding/store"
        element={
          <ProtectedRoute>
            <StoreProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/onboarding/approval"
        element={
          <ProtectedRoute>
            <ApprovalPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/onboarding/plans"
        element={
          <ProtectedRoute>
            <PlansPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/onboarding/payment"
        element={
          <ProtectedRoute>
            <PaymentPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute adminOnly>
            <AdminPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
