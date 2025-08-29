import React from 'react';

const TestComponent = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-green-600 mb-4">Test Component Working!</h1>
        <p className="text-gray-600 mb-4">If you can see this, basic routing is working</p>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Component Status</h2>
          <ul className="text-left space-y-2">
            <li>✅ React rendering</li>
            <li>✅ Tailwind CSS</li>
            <li>✅ Component mounting</li>
            <li>✅ Basic styling</li>
            <li>✅ localStorage: Working</li>
            <li>✅ Current path: {window.location.pathname}</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TestComponent;
