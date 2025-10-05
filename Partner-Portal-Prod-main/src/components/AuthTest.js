import React, { useState } from 'react';
import { login, getToken, getRole, getEmail, clearAuthData } from '../services/auth';

const AuthTest = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleTestLogin = async () => {
    setLoading(true);
    setResult('');
    
    try {
      const response = await login(email, password);
      setResult(`Login successful! Role: ${response.role}, Token: ${response.token ? 'Present' : 'Missing'}`);
    } catch (error) {
      let errorMessage = error.message;
      if (error.response) {
        errorMessage = `HTTP ${error.response.status}: ${error.response.data?.message || error.response.statusText}`;
      } else if (error.request) {
        errorMessage = `Network error: ${error.message}`;
      }
      setResult(`Login failed: ${errorMessage}`);
      console.error('Login error details:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkAuthState = () => {
    const token = getToken();
    const role = getRole();
    const email = getEmail();
    
    setResult(`Current auth state:
Token: ${token ? 'Present' : 'Missing'}
Role: ${role || 'None'}
Email: ${email || 'None'}`);
  };

  const handleClearAuth = () => {
    clearAuthData();
    setResult('Authentication data cleared');
  };

  const testDirectAPI = async () => {
    setLoading(true);
    setResult('Testing direct API call...');
    
    try {
      // const response = await fetch('http://optimus-india-njs-01.netbird.cloud:3006/login', {
      const response = await fetch('https://njs-01.optimuslab.space/partners/auth/login', {

        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });
      
      if (response.ok) {
        const data = await response.json();
        setResult(`Direct API test successful! Response: ${JSON.stringify(data, null, 2)}`);
      } else {
        const errorText = await response.text();
        setResult(`Direct API test failed! Status: ${response.status}, Response: ${errorText}`);
      }
    } catch (error) {
      setResult(`Direct API test error: ${error.message}`);
      console.error('Direct API test error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Authentication Test</h1>
          
          <div className="mb-6 p-4 bg-blue-50 rounded-md">
            <h3 className="font-medium text-blue-900 mb-2">Test Credentials:</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <div><strong>Admin:</strong> admin@example.com / adminpass</div>
              <div><strong>Level 1:</strong> level1@example.com / level1pass</div>
              <div><strong>Level 2:</strong> level2@example.com / level2pass</div>
              <div><strong>Level 3:</strong> level3@example.com / level3pass</div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#405952]"
                placeholder="Enter email"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#405952]"
                placeholder="Enter password"
              />
            </div>
            
            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleTestLogin}
                disabled={loading || !email || !password}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Testing...' : 'Test Login'}
              </button>
              
              <button
                onClick={checkAuthState}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
              >
                Check Auth State
              </button>
              
              <button
                onClick={handleClearAuth}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Clear Auth
              </button>
              
              <button
                onClick={testDirectAPI}
                disabled={loading || !email || !password}
                className="bg-black-600 text-white px-4 py-2 rounded-md hover:bg-black-700 transition-colors"
              >
                Test Direct API
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

export default AuthTest;
