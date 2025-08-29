import React, { useState, useEffect } from 'react';
import { getToken, getRole, getEmail, getRefreshToken } from '../services/auth';

const AuthDebug = () => {
  const [authState, setAuthState] = useState({});

  useEffect(() => {
    const token = getToken();
    const role = getRole();
    const email = getEmail();
    const refreshToken = getRefreshToken();

    setAuthState({
      token: token ? `${token.substring(0, 20)}...` : 'Not set',
      role: role || 'Not set',
      email: email || 'Not set',
      refreshToken: refreshToken ? `${refreshToken.substring(0, 20)}...` : 'Not set'
    });
  }, []);

  const refreshAuthState = () => {
    const token = getToken();
    const role = getRole();
    const email = getEmail();
    const refreshToken = getRefreshToken();

    setAuthState({
      token: token ? `${token.substring(0, 20)}...` : 'Not set',
      role: role || 'Not set',
      email: email || 'Not set',
      refreshToken: refreshToken ? `${refreshToken.substring(0, 20)}...` : 'Not set'
    });
  };

  const clearAuth = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('email');
    localStorage.removeItem('refreshToken');
    refreshAuthState();
  };

  const testLogin = async () => {
    try {
      const response = await fetch('http://optimus-india-njs-01.netbird.cloud:3006/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: 'admin@example.com', 
          password: 'adminpass' 
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Test login successful:', data);
        
        // Set the auth data manually
        if (data.token) localStorage.setItem('token', data.token);
        if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken);
        if (data.role) localStorage.setItem('role', data.role);
        if (data.email) localStorage.setItem('email', data.email);
        
        refreshAuthState();
        alert('Test login successful! Check the auth state below.');
      } else {
        const errorText = await response.text();
        alert(`Test login failed: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      alert(`Test login error: ${error.message}`);
      console.error('Test login error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Authentication Debug</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Current Auth State</h2>
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
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Actions</h2>
              <div className="space-y-4">
                <button
                  onClick={refreshAuthState}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Refresh Auth State
                </button>
                
                <button
                  onClick={testLogin}
                  className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                >
                  Test Login (admin@example.com)
                </button>
                
                <button
                  onClick={clearAuth}
                  className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                >
                  Clear Auth Data
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Navigation</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <a href="/admin/products" className="text-blue-600 hover:text-blue-800">Admin Products</a>
              <a href="/admin/simple" className="text-blue-600 hover:text-blue-800">Simple Admin</a>
              <a href="/dashboard" className="text-blue-600 hover:text-blue-800">Dashboard</a>
              <a href="/auth-test" className="text-blue-600 hover:text-blue-800">Auth Test</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthDebug;


