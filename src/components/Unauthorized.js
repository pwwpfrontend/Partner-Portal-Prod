import React from "react";
import { Link } from "react-router-dom";

const Unauthorized = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-6">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">403</h1>
        <p className="text-gray-700 mb-6">You do not have permission to access this page.</p>
        <Link to="/" className="text-white bg-[#405952] px-4 py-2 rounded-md">
          Go Home
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;


