import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ allowedRoles }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">Loading EduPortal...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  if (!profile) {
    return (
      <Navigate to="/unauthorized" replace />
    );
  }

  if (profile.status !== "active") {
    return (
      <Navigate to="/unauthorized" replace />
    );
  }

  if (allowedRoles && !allowedRoles.includes(profile.role)) {
    return (
      <Navigate to="/unauthorized" replace />
    );
  }

  return <Outlet />;
}

export default ProtectedRoute;