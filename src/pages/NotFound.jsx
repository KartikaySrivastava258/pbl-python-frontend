import React from "react";
import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="notfound">
      <h1>404</h1>
      <p>Page not found</p>
      <Link to="/">Go Home</Link>
    </div>
  );
}

export default NotFound;
