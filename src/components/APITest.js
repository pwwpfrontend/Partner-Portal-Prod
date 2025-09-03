import React, { useState } from 'react';

const APITest = () => {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testLoginEndpoint = async () => {
    setLoading(true);
    setResult('Testing login endpoint...');
    
    try {
      // const response = await fetch('http://optimus-india-njs-01.netbird.cloud:3006/login', {
      const response = await fetch('https://njs-01.optimuslab.space/partners/auth/login', {

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
        setResult(`✅ Login endpoint working! Response: ${JSON.stringify(data, null, 2)}`);
      } else {
        const errorText = await response.text();
        setResult(`❌ Login endpoint failed! Status: ${response.status}, Response: ${errorText}`);
      }
    } catch (error) {
      setResult(`❌ Login endpoint error: ${error.message}`);
      console.error('API test error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testProductsEndpoint = async () => {
    setLoading(true);
    setResult('Testing products endpoint...');
    
    try {
      // const response = await fetch('http://optimus-india-njs-01.netbird.cloud:3006/webhook/all_products');
      const response = await fetch('https://njs-01.optimuslab.space/partners/products');

      
      if (response.ok) {
        const data = await response.json();
        setResult(`✅ Products endpoint working! Found ${data.length} products`);
      } else {
        const errorText = await response.text();
        setResult(`❌ Products endpoint failed! Status: ${response.status}, Response: ${errorText}`);
      }
    } catch (error) {
      setResult(`❌ Products endpoint error: ${error.message}`);
      console.error('Products API test error:', error);
    } finally {
      setLoading(false);
    }
  };

  const testHTTPS = async () => {
    setLoading(true);
    setResult('Testing HTTPS endpoint...');
    
    try {
      // const response = await fetch('https://njs-01.optimuslab.space/webhook/all_products');
      const response = await fetch('https://njs-01.optimuslab.space/partners/products');

      
      if (response.ok) {
        const data = await response.json();
        setResult(`✅ HTTPS endpoint working! Found ${data.length} products`);
      } else {
        const errorText = await response.text();
        setResult(`❌ HTTPS endpoint failed! Status: ${response.status}, Response: ${errorText}`);
      }
    } catch (error) {
      setResult(`❌ HTTPS endpoint error: ${error.message}`);
      console.error('HTTPS API test error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">API Endpoint Test</h1>
          
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <button
                onClick={testLoginEndpoint}
                disabled={loading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Testing...' : 'Test Login Endpoint'}
              </button>
              
              <button
                onClick={testProductsEndpoint}
                disabled={loading}
                className="bg-black-600 text-white px-4 py-2 rounded-md hover:bg-black-700 disabled:opacity-50"
              >
                {loading ? 'Testing...' : 'Test Products Endpoint'}
              </button>
              
              <button
                onClick={testHTTPS}
                disabled={loading}
                className="bg-black-600 text-white px-4 py-2 rounded-md hover:bg-black-700 disabled:opacity-50"
              >
                {loading ? 'Testing...' : 'Test HTTPS Endpoint'}
              </button>
            </div>
            
            {result && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <h3 className="font-medium text-gray-900 mb-2">Result:</h3>
                <pre className="text-sm text-gray-700 whitespace-pre-wrap">{result}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default APITest;

