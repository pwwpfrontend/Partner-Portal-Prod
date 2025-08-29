import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const DebugPage = () => {
  const [authState, setAuthState] = useState({});
  const [localStorageState, setLocalStorageState] = useState({});

  useEffect(() => {
    // Check authentication state
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    const email = localStorage.getItem('email');
    const refreshToken = localStorage.getItem('refreshToken');

    setAuthState({
      token: token ? `${token.substring(0, 20)}...` : 'Not set',
      role: role || 'Not set',
      email: email || 'Not set',
      refreshToken: refreshToken ? `${refreshToken.substring(0, 20)}...` : 'Not set'
    });

    // Check localStorage state
    setLocalStorageState({
      available: typeof localStorage !== 'undefined',
      test: 'Testing...'
    });

    // Test localStorage
    try {
      localStorage.setItem('debug_test', 'working');
      const testValue = localStorage.getItem('debug_test');
      localStorage.removeItem('debug_test');
      setLocalStorageState(prev => ({ ...prev, test: testValue === 'working' ? 'Working' : 'Failed' }));
    } catch (error) {
      setLocalStorageState(prev => ({ ...prev, test: `Error: ${error.message}` }));
    }
  }, []);

  const clearAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    localStorage.removeItem('refreshToken');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Debug Information</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Authentication State</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Token:</span>
                  <span className="font-mono text-sm">{authState.token}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Role:</span>
                  <span className="font-mono text-sm">{authState.role}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Email:</span>
                  <span className="font-mono text-sm">{authState.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Refresh Token:</span>
                  <span className="font-mono text-sm">{authState.refreshToken}</span>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">System State</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">localStorage:</span>
                  <span className="font-mono text-sm">{localStorageState.available ? 'Available' : 'Not Available'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">localStorage Test:</span>
                  <span className="font-mono text-sm">{localStorageState.test}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Current Path:</span>
                  <span className="font-mono text-sm">{window.location.pathname}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">User Agent:</span>
                  <span className="font-mono text-xs">{navigator.userAgent.substring(0, 50)}...</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Actions</h2>
            <div className="flex space-x-4">
              <button
                onClick={clearAuth}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Clear Authentication
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Reload Page
              </button>
              <Link
                to="/test"
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Test Route
              </Link>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Navigation</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link to="/" className="text-blue-600 hover:text-blue-800">Home</Link>
              <Link to="/login" className="text-blue-600 hover:text-blue-800">Login</Link>
              <Link to="/dashboard" className="text-blue-600 hover:text-blue-800">Dashboard</Link>
              <Link to="/admin/products" className="text-blue-600 hover:text-blue-800">Admin Products</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugPage;

