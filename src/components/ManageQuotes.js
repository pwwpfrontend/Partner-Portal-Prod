import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { FileText, Search, Eye, Package, User, RefreshCw, AlertTriangle } from 'lucide-react';
import { getToken } from '../services/auth';

const ManageQuotes = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [showQuoteDetails, setShowQuoteDetails] = useState(false);
  const [quotes, setQuotes] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Token refresh function
  const refreshAccessToken = async () => {
    try {
      const storedRefreshToken = localStorage.getItem('refreshToken');
      if (!storedRefreshToken) {
        throw new Error('No refresh token available');
      }

      console.log('Attempting to refresh token...');
      
      // const response = await fetch('http://optimus-india-njs-01.netbird.cloud:3006/auth/refresh', {
      const response = await fetch('https://njs-01.optimuslab.space/partners/auth/refresh', {

        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token: storedRefreshToken }),
        credentials: 'omit',
        mode: 'cors'
      });

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.accessToken) {
        localStorage.setItem('token', data.accessToken);
        console.log('Token refreshed successfully');
        return data.accessToken;
      } else {
        throw new Error('No access token in refresh response');
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      throw error;
    }
  };

  // Enhanced fetch with token refresh
  const fetchWithAuth = async (url, options = {}) => {
    let token = getToken();
    
    if (!token) {
      throw new Error('No access token available');
    }

    const fetchOptions = {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        ...options.headers
      },
      credentials: 'omit',
      mode: 'cors'
    };

    try {
      let response = await fetch(url, fetchOptions);
      
      if (response.status === 401) {
        console.log('Access token expired (401), attempting refresh...');
        
        try {
          const newToken = await refreshAccessToken();
          fetchOptions.headers['Authorization'] = `Bearer ${newToken}`;
          response = await fetch(url, fetchOptions);
          
          if (!response.ok) {
            throw new Error(`Request failed after token refresh: ${response.status}`);
          }
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          throw new Error('Authentication failed. Please login again.');
        }
      }
      
      if (response.status === 403) {
        const errorText = await response.text().catch(() => 'Unable to read error response');
        console.error('403 Forbidden response:', errorText);
        
        try {
          const newToken = await refreshAccessToken();
          fetchOptions.headers['Authorization'] = `Bearer ${newToken}`;
          const retryResponse = await fetch(url, fetchOptions);
          
          if (retryResponse.ok) {
            console.log('403 resolved after token refresh');
            return retryResponse;
          } else {
            throw new Error(`Still forbidden after refresh: ${retryResponse.status}`);
          }
        } catch (refreshError) {
          console.error('Token refresh failed on 403:', refreshError);
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          throw new Error(`Access denied (403). Your session may have expired or you may not have permission. Please login again.`);
        }
      }

      return response;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please check your internet connection and try again.');
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your internet connection and try again.');
      }
      throw error;
    }
  };

  // Fetch all quotes from backend
  const fetchQuotes = async () => {
    try {
      console.log('Fetching quotes from backend...');
      // const response = await fetchWithAuth('http://optimus-india-njs-01.netbird.cloud:3006/quotes');
      const response = await fetchWithAuth('https://njs-01.optimuslab.space/partners/quotes');

      
      if (!response.ok) {
        throw new Error(`Failed to fetch quotes: ${response.status}`);
      }
      
      const quotesData = await response.json();
      console.log('Quotes fetched successfully:', quotesData);
      
      const quotesArray = Array.isArray(quotesData) ? quotesData : (quotesData.quotes || []);
      setQuotes(quotesArray);
      return quotesArray;
    } catch (error) {
      console.error('Error fetching quotes:', error);
      throw error;
    }
  };

  // Fetch all users from backend
  const fetchUsers = async () => {
    try {
      console.log('Fetching users from backend...');
      // const response = await fetchWithAuth('http://optimus-india-njs-01.netbird.cloud:3006/admin/users');
      const response = await fetchWithAuth('https://njs-01.optimuslab.space/partners/admin/users');

      
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`);
      }
      
      const usersData = await response.json();
      console.log('Users fetched successfully:', usersData);
      
      const usersArray = Array.isArray(usersData) ? usersData : (usersData.users || []);
      setUsers(usersArray);
      return usersArray;
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
      return [];
    }
  };

  // Fetch all products from backend
  const fetchProducts = async () => {
    try {
      console.log('Fetching products from backend...');
      // const response = await fetchWithAuth('http://optimus-india-njs-01.netbird.cloud:3006/products');
      const response = await fetchWithAuth('https://njs-01.optimuslab.space/partners/products');

      
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.status}`);
      }
      
      const productsData = await response.json();
      console.log('Products fetched successfully:', productsData);
      
      const productsArray = Array.isArray(productsData) ? productsData : (productsData.products || []);
      setProducts(productsArray);
      return productsArray;
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
      return [];
    }
  };

  // Load all data on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        await Promise.all([
          fetchQuotes(),
          fetchUsers(),
          fetchProducts()
        ]);
      } catch (error) {
        console.error('Error loading data:', error);
        setError(error.message || 'Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Get user details by ID
  const getUserById = (userId) => {
    if (!userId) return null;
    
    const foundUser = users.find(user => 
      user.id === userId || 
      user._id === userId ||
      user.email === userId
    );
    
    return foundUser || null;
  };

  // Get product details by ID
  const getProductById = (productId) => {
    if (!productId) return null;
    
    const foundProduct = products.find(product => 
      product.id === productId || 
      product._id === productId ||
      product.productId === productId
    );
    
    return foundProduct || null;
  };

  // Enhance quotes with user and product data
  const enhancedQuotes = quotes.map(quote => {
    const user = getUserById(quote.userId || quote.userEmail);
    
    const enhancedItems = (quote.items || []).map(item => {
      const product = getProductById(item.productId);
      return {
        ...item,
        productDetails: product
      };
    });

    return {
      ...quote,
      user: user,
      customerInfo: quote.customerInfo || user || {
        name: quote.userName || 'Unknown User',
        email: quote.userEmail || 'unknown@email.com',
        role: quote.userRole || quote.userLevel || 'user',
        company: 'Unknown Company'
      },
      items: enhancedItems
    };
  });

  // Filter quotes based on search
  const filteredQuotes = enhancedQuotes.filter(quote => {
    const customerInfo = quote.customerInfo || {};
    const searchFields = [
      customerInfo.name,
      customerInfo.company,
      customerInfo.email,
      quote.userName,
      quote.userEmail,
      quote.id,
      quote._id
    ].filter(Boolean).join(' ').toLowerCase();
    
    const matchesSearch = searchTerm === '' || searchFields.includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const handleViewDetails = (quote) => {
    setSelectedQuote(quote);
    setShowQuoteDetails(true);
  };

  // Refresh data
  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    
    try {
      await Promise.all([
        fetchQuotes(),
        fetchUsers(),
        fetchProducts()
      ]);
    } catch (error) {
      console.error('Error refreshing data:', error);
      setError(error.message || 'Failed to refresh data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100">
        <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
        <Header toggleSidebar={toggleSidebar} />
        <main className="pt-16">
          <div className="p-6">
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#405952]"></div>
              <span className="ml-3 text-gray-600">Loading quotes...</span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      <Header toggleSidebar={toggleSidebar} />

      {/* Main content */}
      <main className="pt-16">
        <div className="p-6">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Manage Quotes</h1>
                <p className="text-gray-600">Review and manage customer quote requests</p>
              </div>
              <div className="flex items-center gap-6">
                {/* Total Quotes beside Refresh button */}
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#405952]">{quotes.length}</div>
                  <div className="text-sm text-gray-500">Total Quotes</div>
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="bg-[#405952] text-white px-4 py-2 rounded-lg hover:bg-[#2d3f38] transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
                <button 
                  onClick={() => setError(null)}
                  className="ml-auto text-red-400 hover:text-red-600"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Search Section */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by customer name, company, email, or quote ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#405952] focus:border-transparent"
              />
            </div>
          </div>

          {/* Quotes List */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {filteredQuotes.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-2">
                  {quotes.length === 0 ? 'No quotes found' : 'No quotes match your search criteria'}
                </p>
                {quotes.length === 0 && (
                  <p className="text-sm text-gray-500">Quotes will appear here when customers submit requests</p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Quote Details
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredQuotes.map((quote) => {
                      const quoteId = quote.id || quote._id;
                      const customerInfo = quote.customerInfo || {};
                      const itemsCount = quote.items ? quote.items.length : (quote.itemsCount || quote.totalItems || 0);
                      const totalAmount = quote.totalAmount || quote.total || 0;

                      return (
                        <tr key={quoteId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <User className="w-5 h-5 text-[#405952] mr-3 flex-shrink-0" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {customerInfo.name || quote.userName || 'Unknown User'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {customerInfo.company || 'Unknown Company'}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {customerInfo.email || quote.userEmail || 'No email'}
                                </div>
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 mt-1">
                                  {customerInfo.role || quote.userRole || quote.userLevel || 'user'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <FileText className="w-5 h-5 text-[#405952] mr-3" />
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {quoteId ? quoteId.slice(0, 8) : 'N/A'}
                                </div>
                                <div className="text-sm text-gray-500">{itemsCount} items</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              ${totalAmount.toFixed(2)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(quote.createdAt || quote.submittedAt || quote.created)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleViewDetails(quote)}
                              className="text-[#405952] hover:text-[#2d3f38] flex items-center transition-colors"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quote Details Modal */}
          {showQuoteDetails && selectedQuote && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Quote Details - {(selectedQuote.id || selectedQuote._id || 'N/A').slice(0, 8)}
                    </h2>
                    <button
                      onClick={() => setShowQuoteDetails(false)}
                      className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                      ×
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    {/* Customer Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h3>
                      <div className="space-y-2">
                        <p><span className="font-medium">Name:</span> {selectedQuote.customerInfo?.name || selectedQuote.userName || 'Unknown User'}</p>
                        <p><span className="font-medium">Company:</span> {selectedQuote.customerInfo?.company || 'Unknown Company'}</p>
                        <p><span className="font-medium">Email:</span> {selectedQuote.customerInfo?.email || selectedQuote.userEmail || 'No email'}</p>
                        <p><span className="font-medium">User Level:</span> {selectedQuote.customerInfo?.role || selectedQuote.userRole || selectedQuote.userLevel || 'user'}</p>
                      </div>
                    </div>

                    {/* Quote Information */}
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quote Information</h3>
                      <div className="space-y-2">
                        <p><span className="font-medium">Total:</span> ${(selectedQuote.totalAmount || selectedQuote.total || 0).toFixed(2)}</p>
                        <p><span className="font-medium">Items:</span> {selectedQuote.items ? selectedQuote.items.length : (selectedQuote.itemsCount || 0)}</p>
                        <p><span className="font-medium">Created:</span> {formatDate(selectedQuote.createdAt || selectedQuote.submittedAt || selectedQuote.created)}</p>
                        <p><span className="font-medium">Updated:</span> {formatDate(selectedQuote.updatedAt || selectedQuote.lastUpdated)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Products */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Products</h3>
                    <div className="space-y-3">
                      {selectedQuote.items && selectedQuote.items.length > 0 ? (
                        selectedQuote.items.map((item, index) => (
                          <div key={item.productId || index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  {item.picture && (
                                    <img 
                                      src={item.picture} 
                                      alt={item.name}
                                      className="w-12 h-12 object-contain rounded bg-gray-50"
                                    />
                                  )}
                                  <div>
                                    <h4 className="font-medium text-gray-900">{item.name || 'Unknown Product'}</h4>
                                    <p className="text-sm text-gray-500">
                                      SKU: {item.sku || item.productId || 'N/A'}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      Brand: {item.brand || 'N/A'} | Category: {item.category || 'N/A'}
                                    </p>
                                  </div>
                                </div>
                                {item.description && (
                                  <p className="text-sm text-gray-600 mt-2">{item.description}</p>
                                )}
                              </div>
                              <div className="text-right ml-4">
                                <p className="font-medium text-gray-900">
                                  ${(item.netPrice || item.price || 0).toFixed(2)} × {item.quantity || 1}
                                </p>
                                <p className="text-lg font-bold text-[#405952]">
                                  ${(item.totalPrice || ((item.netPrice || item.price || 0) * (item.quantity || 1))).toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          No products found in this quote
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ManageQuotes;