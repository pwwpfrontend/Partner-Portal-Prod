import React from 'react';

const TestAdmin = () => {
  console.log('TestAdmin component rendering');
  
  return (
    <div className="min-h-screen bg-blue-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-blue-800 mb-4">Test Admin Page</h1>
        <p className="text-xl text-blue-600 mb-4">If you can see this, basic rendering is working!</p>
        <div className="space-y-2 text-blue-700">
          <p>✅ Component mounted</p>
          <p>✅ JSX rendering</p>
          <p>✅ Styling applied</p>
          <p>✅ No errors</p>
        </div>
      </div>
    </div>
  );
};

export default TestAdmin;


