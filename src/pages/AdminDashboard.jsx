import React from "react";
import { logout } from "../utils/auth";

function AdminDashboard() {
  return (
    <div className="admin-dashboard">
      <header>
        <h2>Admin Dashboard</h2>
        <button onClick={logout}>Logout</button>
      </header>
      <p>Welcome, Manage users, roles, and system settings here.</p>
    </div>
  );
}

export default AdminDashboard;
