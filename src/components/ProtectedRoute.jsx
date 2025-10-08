import React from "react";
import { Navigate } from "react-router-dom";
import { isAuthenticated, getUserRole } from "../utils/auth";

function ProtectedRoute({ children, roles }) {
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  const role = getUserRole();
  if (roles && !roles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
