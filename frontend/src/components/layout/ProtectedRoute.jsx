import { Navigate, Outlet } from "react-router-dom";
import Loader from "../common/Loader";
import useAuth from "../../hooks/useAuth";

const ProtectedRoute = ({ allowedRoles, children }) => {
  const { isLoading, isAuthenticated, user } = useAuth();

  if (isLoading) {
    return <Loader label="Loading your workspace..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles?.length && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children || <Outlet />;
};

export default ProtectedRoute;
