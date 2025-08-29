import React from 'react';
import { getToken, getRole, getEmail } from '../services/auth';

const SimpleAdmin = () => {
  const token = getToken();
  const role = getRole();
  const email = getEmail();

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Simple Admin Page</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Authentication State</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Token:</span>
                  <span className="font-mono text-sm">{token ? 'Present' : 'Missing'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Role:</span>
                  <span className="font-mono text-sm">{role || 'None'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Email:</span>
                  <span className="font-mono text-sm">{email || 'None'}</span>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">System Info</h2>
              <div className="space-y-2">
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

          <div className="mt-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Actions</h2>
            <div className="flex space-x-4">
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                Reload Page
              </button>
              <button
                onClick={() => window.location.href = '/dashboard'}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleAdmin;

